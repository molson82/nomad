import { describe, expect, it } from "vitest";
import { chordsToTry, keyDetails, keysFor, nearestTriad, progressionFor } from "@/lib/pathfinder/paths";
import { chordNames, voicingOf } from "@/lib/theory/chord-names";
import { diatonicChords } from "@/lib/theory/chords";
import { circleKeyFor } from "@/lib/theory/circle";
import { TUNING_PRESETS } from "@/lib/theory/tuning";

const AM7 = [5, 7, 5, 5, 5, 5];
const v = voicingOf(AM7)!;
const name = chordNames(v)[0];

describe("keysFor", () => {
  it("lists the keys Am7 fits, most central role first", () => {
    expect(keysFor(v, name).map((k) => [k.key, k.role, k.fit])).toEqual([
      ["C", "vi", "full"],
      ["G", "ii", "full"],
      ["F", "iii", "full"],
    ]);
  });

  it("falls back to the closest keys with the outside note", () => {
    const c7s9 = voicingOf([null, 3, 2, 3, 4, null])!;
    const keys = keysFor(c7s9, chordNames(c7s9)[0]);
    expect(keys.length).toBeLessThanOrEqual(3);
    expect(keys.every((k) => k.fit === "near")).toBe(true);
    expect(keys.find((k) => k.key === "F")).toMatchObject({ outside: ["D♯"], role: "V" });
  });

  it("gives a nameless chord roleless keys", () => {
    const odd = voicingOf([8, 4, null, null, null, 2])!;
    const keys = keysFor(odd, null);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.role === null)).toBe(true);
  });

  it("lists all the keys a power chord fits", () => {
    const a5 = voicingOf([5, 7, null, null, null, null])!;
    expect(keysFor(a5, chordNames(a5)[0]).map((k) => k.role).slice(0, 3)).toEqual(["I", "IV", "V"]);
  });
});

describe("keyDetails", () => {
  it("picks the pentatonic and position under the chord", () => {
    expect(keyDetails("C", AM7).solo).toMatchObject({ title: "A minor pentatonic · Box 1", lowFret: 5, highFret: 8 });
    expect(keyDetails("C", AM7).missing).toEqual([]);
    expect(keyDetails("C", AM7).scale).toMatchObject({ title: "G-shape position", lowFret: 5, highFret: 9 });
    expect(keyDetails("G", AM7).solo).toMatchObject({ title: "E minor pentatonic · Box 3", lowFret: 4, highFret: 8 });
    expect(keyDetails("G", AM7).missing).toEqual(["C"]);
    expect(keyDetails("F", AM7).solo).toMatchObject({ title: "D minor pentatonic · Box 4", lowFret: 5, highFret: 8 });
    expect(keyDetails("F", AM7).missing).toEqual(["E"]);
  });

  it("uses fret windows when the tuning isn't uniform", () => {
    const dadgad = TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets;
    const details = keyDetails("C", AM7, dadgad);
    expect(details.solo.title).toBe("A minor pentatonic");
    expect(details.scale.title).toBe("C major");
  });

  it("finds triads inside the chord", () => {
    expect(keyDetails("C", AM7).triads.map((t) => t.label)).toEqual([
      "Am on strings 3-2-1 · fret 5",
      "C on strings 4-3-2 · fret 5",
    ]);
  });

  it("summarises the scales that contain the chord", () => {
    expect(keyDetails("C", AM7).usedIn).toBe("C major, A minor, both pentatonics, both blues");
    expect(keyDetails("G", AM7).usedIn).toBe("G major, E minor");
  });

  it("omits Used in when no scale holds the chord", () => {
    expect(keyDetails("C", [null, 3, 2, 3, 4, null]).usedIn).toBeNull();
  });
});

describe("chordsToTry", () => {
  it("orders them by role, without vii° or your root", () => {
    expect(chordsToTry("C", 6, 9, AM7).map((c) => `${c.name} ${c.role}`)).toEqual(["F IV", "G V", "C I", "Dm ii", "Em iii"]);
  });

  it("offers everything but vii° for a roleless chord", () => {
    expect(chordsToTry("C", null, null, AM7).map((c) => c.role)).toEqual(["I", "IV", "V", "vi", "ii", "iii"]);
  });

  it("shapes a chord near yours", () => {
    const g = chordsToTry("C", 6, 9, AM7).find((c) => c.name === "G")!;
    expect(g.shape).toMatchObject({ label: "D", lowFret: 5, highFret: 8 });
  });

  it("uses triads when the tuning isn't uniform", () => {
    const dadgad = TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets;
    const g = chordsToTry("C", 6, 9, AM7, dadgad).find((c) => c.name === "G")!;
    expect(g.shape?.tones).toHaveLength(3);
    expect(g.shape?.label).toMatch(/^strings \d-\d-\d$/);
  });

  it("finds no triad when the strings allow none", () => {
    const notes = diatonicChords(circleKeyFor("C"))[0].notes;
    expect(nearestTriad(notes, "major", [0, 0, 0, 0, 0, 0], 5)).toBeNull();
  });
});

describe("progressionFor", () => {
  it("finds one containing the degree, starting on it when one does", () => {
    expect(progressionFor("C", 6)).toEqual({ name: "Sensitive", chords: ["Am", "F", "C", "G"] });
    expect(progressionFor("C", 2)).toEqual({ name: "Jazz turnaround", chords: ["Dm", "G", "C"] });
    expect(progressionFor("F", 3)).toBeNull();
    expect(progressionFor("C", null)).toBeNull();
  });
});
