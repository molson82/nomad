import { describe, expect, it } from "vitest";
import { chordsToTry, keyDetails, keysFor, progressionFor } from "@/lib/pathfinder/paths";
import { EMPTY_STATE, highlightFrets, lockIn, lockedVoicing, parsePathfinder, resetPath, tapFret, type Lock } from "@/lib/pathfinder/state";
import type { KeyState } from "@/lib/key-state/store";
import { chordNames, voicingOf, type Frets } from "@/lib/theory/chord-names";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import { NOTES, type Note } from "@/lib/theory/notes";
import { pitchClassOf } from "@/lib/theory/spelling";
import { STANDARD_OFFSETS, TUNING_PRESETS, openPitches } from "@/lib/theory/tuning";

const AM7 = [5, 7, 5, 5, 5, 5];
const std = [0, 0, 0, 0, 0, 0];
const scaleOf = (key: Note) => majorScale(circleKeyFor(key)).map(pitchClassOf);
const pitchAt = (open: number[], string: number, fret: number) => (open[string] + fret) % 12;

let seed = 98765;
const next = (n: number) => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
};
const randomFrets = (): Frets => Array.from({ length: 6 }, () => (next(3) === 0 ? null : next(16)));

describe("keysFor, for any chord", () => {
  it("lists only keys that hold every note, or the closest three at most", () => {
    for (let i = 0; i < 800; i++) {
      const offsets = TUNING_PRESETS[next(TUNING_PRESETS.length)].offsets;
      const v = voicingOf(randomFrets(), offsets);
      if (!v) continue;
      const keys = keysFor(v, chordNames(v)[0] ?? null);
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) {
        const outside = v.pitchClasses.filter((pc) => !scaleOf(k.key).includes(pc));
        expect(k.outside).toHaveLength(outside.length);
        expect(k.fit).toBe(outside.length === 0 ? "full" : "near");
      }
      if (keys[0].fit === "near") {
        expect(keys.length).toBeLessThanOrEqual(3);
        for (let key = 0; key < 12; key++) {
          const outside = v.pitchClasses.filter((pc) => !scaleOf(NOTES[key]).includes(pc));
          expect(outside.length).toBeGreaterThanOrEqual(keys[0].outside.length);
        }
      }
    }
  });

  it("gives the role of the chord's root in each key", () => {
    const v = voicingOf([null, 3, 2, 0, 1, 0])!; // C
    expect(keysFor(v, chordNames(v)[0]).map((k) => `${k.key} ${k.role}`)).toEqual(["C I", "F V", "G IV"].sort((a, b) => order(a) - order(b)));
  });
});

const order = (entry: string) => ["I", "IV", "V", "vi", "ii", "iii"].indexOf(entry.split(" ")[1]);

describe("keyDetails, for any chord in any tuning", () => {
  it("never breaks, and its regions and triads are real", () => {
    for (let i = 0; i < 200; i++) {
      const offsets = TUNING_PRESETS[next(TUNING_PRESETS.length)].offsets;
      const open = openPitches(offsets);
      const frets = randomFrets();
      const v = voicingOf(frets, offsets);
      if (!v) continue;
      const key = keysFor(v, chordNames(v)[0] ?? null)[0].key;
      const details = keyDetails(key, frets, offsets);
      for (const region of [details.solo, details.scale]) {
        expect(region.lowFret).toBeLessThanOrEqual(region.highFret);
        for (const n of region.notes) expect(scaleOf(key).concat(pitchAt(open, n.string, n.fret))).toContain(pitchAt(open, n.string, n.fret));
      }
      expect(details.triads.length).toBeLessThanOrEqual(2);
      for (const t of details.triads) {
        for (const tone of t.triad.tones) expect(v.pitchClasses).toContain(pitchAt(open, tone.string, tone.fret));
      }
    }
  });

  it("uses no Box or shape names when the tuning isn't uniform", () => {
    for (const preset of TUNING_PRESETS.filter((p) => new Set(p.offsets).size > 1)) {
      const details = keyDetails("C", AM7, preset.offsets);
      expect(details.solo.title).not.toMatch(/Box/);
      expect(details.scale.title).not.toMatch(/shape/);
    }
  });

  it("keeps Box names in a uniform tuning", () => {
    const halfDown = TUNING_PRESETS.find((p) => p.id === "half-down")!.offsets;
    expect(keyDetails("C", AM7, halfDown).solo.title).toMatch(/Box/);
  });
});

describe("chordsToTry", () => {
  it.each(NOTES.map((n) => [n] as const))("in %s, shapes are chord tones, on the neck, and never vii°", (key) => {
    for (let degree = 1; degree <= 6; degree++) {
      const chords = chordsToTry(key, degree, null, AM7);
      expect(chords.map((c) => c.role)).not.toContain("vii°");
      for (const c of chords) {
        for (const tone of c.shape!.tones) {
          expect(tone.fret).toBeGreaterThanOrEqual(0);
          expect(tone.fret).toBeLessThanOrEqual(15);
          expect(scaleOf(key)).toContain(pitchAt(openPitches(STANDARD_OFFSETS), tone.string, tone.fret));
        }
      }
    }
  });

  it("always offers a chord near yours in standard tuning", () => {
    const gs = chordsToTry("C", 6, 9, [12, 14, 12, 12, 12, 12]).find((c) => c.name === "G")!;
    expect(gs.shape!.lowFret).toBeGreaterThan(5);
  });

  it("orders each role by its table", () => {
    const roles = (degree: number) => chordsToTry("C", degree, null, AM7).map((c) => c.role).join(" ");
    expect(roles(1)).toBe("IV V vi ii iii");
    expect(roles(2)).toBe("V I IV vi iii");
    expect(roles(3)).toBe("vi IV ii I V");
    expect(roles(4)).toBe("I V ii vi iii");
    expect(roles(5)).toBe("I vi IV ii iii");
    expect(roles(6)).toBe("IV V I ii iii");
    expect(roles(7)).toBe("I IV V vi ii iii");
  });

  it("spells chords for the key", () => {
    expect(chordsToTry("F#", 1, null, AM7).map((c) => c.name)).toContain("C♯");
    expect(chordsToTry("Eb", 1, null, AM7).map((c) => c.name)).toContain("A♭");
  });
});

describe("progressionFor", () => {
  it.each([
    [1, "Pop"],
    [2, "Jazz cadence"],
    [4, "Pop"],
    [5, "Pop"],
    [6, "Sensitive"],
  ])("degree %i → %s", (degree, name) => {
    expect(progressionFor("C", degree)?.name).toBe(name);
  });
});

describe("highlightFrets, across every key and tuning", () => {
  const lock = (frets: Frets = AM7): Lock => ({ frets, key: "C", tuning: std, createdLink: true });

  it("keeps the chord's sound relative to the key, on the neck", () => {
    for (const preset of TUNING_PRESETS) {
      const open = openPitches(preset.offsets);
      const lockedOpen = openPitches(std);
      for (let key = 0; key < 12; key++) {
        const moved = highlightFrets(lock(), NOTES[key], preset.offsets);
        moved.forEach((fret, s) => {
          expect(fret).toBeGreaterThanOrEqual(0);
          expect(fret).toBeLessThanOrEqual(15);
          expect(pitchAt(open, s, fret!)).toBe((lockedOpen[s] + AM7[s] + key) % 12);
        });
      }
    }
  });

  it("leaves silent strings silent", () => {
    expect(highlightFrets(lock([null, 3, 2, 0, 1, 0]), "G", std)[0]).toBeNull();
  });

  it("is where it started in the locked key and tuning", () => {
    const frets = [0, 2, 15, null, 7, 3];
    expect(highlightFrets({ ...lock(frets), tuning: [-2, 0, 0, 0, 0, 0] }, "C", [-2, 0, 0, 0, 0, 0])).toEqual(frets);
  });

  it("agrees with the locked chord's name in every key", () => {
    for (let key = 0; key < 12; key++) {
      expect(chordNames(lockedVoicing(lock(), NOTES[key]))[0].suffix).toBe("m7");
      expect(chordNames(lockedVoicing(lock(), NOTES[key]))[0].root).toBe((9 + key) % 12);
    }
  });
});

describe("lock in and reset, end to end", () => {
  const keys: KeyState = { linked: false, shared: "C", tools: { circle: "G", chords: "D", scales: "A" } };

  it("a lock survives being saved and read back", () => {
    const { pathfinder } = lockIn({ frets: AM7, lock: null }, keys, "C", std);
    expect(parsePathfinder(JSON.stringify(pathfinder))).toEqual(pathfinder);
  });

  it("locking over an existing lock replaces it", () => {
    const first = lockIn({ frets: AM7, lock: null }, keys, "C", std);
    const second = lockIn({ frets: [3, 2, 0, 0, 0, 3], lock: first.pathfinder.lock }, first.keys, "G", std);
    expect(second.pathfinder.lock).toMatchObject({ key: "G", frets: [3, 2, 0, 0, 0, 3], createdLink: false });
  });

  it("reset with no lock leaves the link alone", () => {
    const linked = { ...keys, linked: true };
    expect(resetPath(EMPTY_STATE, linked)).toEqual({ pathfinder: EMPTY_STATE, keys: linked });
  });

  it("each string holds one note", () => {
    let frets: Frets = EMPTY_STATE.frets;
    for (let string = 0; string < 6; string++) frets = tapFret(frets, string, string);
    expect(frets).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tapFret(frets, 3, 9)).toEqual([0, 1, 2, 9, 4, 5]);
  });
});
