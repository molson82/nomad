# Circle of Fifths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/circle/` placeholder with a digital Decoder Circle of Fifths: a yellow Decoder card with a turnable mini wheel, the seven diatonic chords in Decoder order with degree numbers, and a progression tray with common presets.

**Architecture:** A pure-TypeScript theory engine (`lib/theory/`) spells keys, scales and chords. Pure wheel/gesture math (`lib/circle/wheel-math.ts`) plus one hook (`useWheelRotation`) drive an SVG wheel rotated by a spring. Presentational components in `components/circle/` render it. The key goes through the skeleton's `useToolKey("circle")`, so linking works unchanged. The progression is a second persisted store that shares a small `createPersistedStore` helper extracted from the key store.

**Tech Stack:** Next 15 (static export), React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (jsdom), Playwright (iPhone WebKit + desktop Chromium). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-13-circle-of-fifths-design.md`
**Visual reference:** canvas https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm, page "Circle of Fifths". The artboards "Chosen · Phone", "Phone · progression active", "Desktop · 1280" and "Tablet portrait · 834" are the source for spacing and sizes.

## Global Constraints

- No new dependencies. No audio. No tap-a-wedge-to-jump and no note-picker on this page.
- Decoder order: major row left→right **IV · I · V**, minor row left→right **iii · vi · ii**, vii° on the dashed divider.
- The first degree circle of every chord (major, minor, vii°) is filled ink; the rest are outlined.
- Circle order from C clockwise: C G D A E B F♯ D♭ A♭ E♭ B♭ F. The 6 o'clock wedge shows F♯ with a small G♭ beneath.
- Swipe left = one step clockwise (G → D). Swipe right = counter-clockwise (G → C). Thresholds: tap < 8px, swipe |dx| > 48px and |dx| > 1.5·|dy|.
- A turn commits (one `setRoot`) only after the spring settles. With `prefers-reduced-motion: reduce` there's no spring, flick projection or overshoot.
- Progression storage key `nomad:circle:progression:v1`, shape `{ degrees: number[] /* 1–7, ≤ 8 */, presetId: string | null }`. Max 8 chords.
- Presets: `pop` "Pop" [1,5,6,4] · `ii-v-i` "Jazz turnaround" [2,5,1] · `i-iv-v` "Three-chord" [1,4,5] · `vi-iv-i-v` "Sensitive" [6,4,1,5] · `fifties` "50s" [1,6,4,5].
- Wheel accessibility: `role="slider"`, name `Key`, `aria-valuetext` like `G major, 1 sharp` / `C major, no sharps or flats` / `B♭ major, 2 flats`. ←/→ step it.
- Chord buttons are named `Add <Root> <major|minor|diminished>, <roman>, to progression`. Tray chips are named `Remove <Root> <quality>, step <n>`.
- Breakpoints: phone < 768 (`md`), tablet 768–1279, desktop ≥ 1280 (`xl`). Wheel 176 / 270 / 208 px.
- The Decoder card stays yellow in dark mode; everything outside it follows the theme.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A fast spin crosses ±180° between two pointer events:** the wheel must keep turning the same way, not jump back. Pinned by the `angleDelta` wraparound test in Task 3.
2. **Rapid swipes during a running animation:** each swipe advances from the pending target, so three quick swipes move exactly three keys. Pinned by the hook's "steps accumulate from the pending target" test in Task 6.
3. **Corrupt or future-shaped stored progressions** (degree 0 or 8, string degrees, 9 items, a preset id that no longer exists): load as an empty tray. Pinned by `parseProgression` cases in Task 4.
4. **Keyboard or assistive-tech activation of a chord** (a click with no pointerdown before it) must still add the chord, despite the swipe click-suppression. Pinned by the DecoderCard "plain click adds" test in Task 7.
5. **A tap on the wheel that doesn't move it:** it must recommit the same key without drifting. Pinned by the `nearestTarget` "no velocity keeps the snapped angle" test in Task 3.

## Plan notes (decided while planning)

- `CircleKey` gains `index` (its position 0–11) and `enharmonic` (G♭ for F♯, else `null`). The spec's field list didn't include them, but the wheel needs both.
- `createPersistedStore` is extracted from `lib/key-state/store.ts`, whose exports and existing tests stay unchanged, so the progression store doesn't duplicate it.
- Pointer gestures are not unit-tested (jsdom has no `PointerEvent`); e2e covers them. The math they use is unit-tested.
- The Circle page's `h1` is `sr-only` on phones (the header already shows the title) and visible from `md` up, matching the canvas. Playwright treats an `sr-only` element as visible, so the existing navigation specs still find it.
- `tests/e2e/key-link.spec.ts` currently drives the Circle placeholder's note picker, which goes away. Task 8 moves those flows to Chords and Scales.

---

## File Map

```
lib/theory/spelling.ts          Letter, SpelledNote, mod, pitchClassOf, spellAs, formatNote
lib/theory/circle.ts            CircleKey, CIRCLE, majorScale, keySignature, circleKeyFor, rootNoteFor, describeKey
lib/theory/chords.ts            Chord, diatonicChords, chordName, chordLongName, romanFor, progressionLabel,
                                DECODER_LAYOUT, COMMON_PROGRESSIONS
lib/storage/persisted-store.ts  createPersistedStore<T>
lib/key-state/store.ts          (modified) built on createPersistedStore, same exports
lib/circle/progression.ts       Progression, parseProgression, withChord, withoutStep, withPreset, stepBadges, progressionStore
lib/circle/use-progression.ts   useProgression()
lib/circle/wheel-math.ts        angleToKeyIndex, targetForIndex, nearestTarget, springStep, isSettled,
                                classifyGesture, pointerAngle, angleDelta
lib/circle/use-reduced-motion.ts usePrefersReducedMotion()
lib/circle/use-wheel-rotation.ts useWheelRotation()
app/theme.css, tailwind.config.ts (modified) decoder color tokens
components/circle/chord-circle.tsx     DegreeDots, StepBadge, ChordButton, DimChordButton
components/circle/progression-tray.tsx ProgressionTray
components/circle/common-progressions.tsx CommonProgressions
components/circle/mini-wheel.tsx       MiniWheel
components/circle/decoder-card.tsx     DecoderCard
components/circle/circle-of-fifths.tsx CircleOfFifths
app/circle/page.tsx (modified)
tests/unit/theory-spelling.test.ts, theory-circle.test.ts, theory-chords.test.ts, progression.test.ts,
  wheel-math.test.ts, use-wheel-rotation.test.tsx, chord-circle.test.tsx, progression-tray.test.tsx,
  common-progressions.test.tsx, mini-wheel.test.tsx, decoder-card.test.tsx
tests/e2e/circle.spec.ts (new), tests/e2e/key-link.spec.ts (modified)
CLAUDE.md (modified)
```

---

### Task 1: Spelled notes and the circle of keys

**Files:**
- Create: `lib/theory/spelling.ts`, `lib/theory/circle.ts`
- Test: `tests/unit/theory-spelling.test.ts`, `tests/unit/theory-circle.test.ts`

**Interfaces:**
- Consumes: `NOTES`, `Note` from `@/lib/theory/notes` (skeleton; `NOTES[i]` is pitch class `i`).
- Produces:
  - `spelling.ts`: `type Letter`, `type SpelledNote = { letter: Letter; accidental: number }`, `LETTERS`, `mod(n, m)`, `pitchClassOf(note): number`, `spellAs(letter, pitchClass): SpelledNote`, `formatNote(note): string` (♯/♭ glyphs)
  - `circle.ts`: `type CircleKey = { index; tonic; pitchClass; sharpsOrFlats; relativeMinor; enharmonic: SpelledNote | null }`, `CIRCLE: CircleKey[]` (12, index 0 = C), `majorScale(key): SpelledNote[]`, `keySignature(key): SpelledNote[]`, `circleKeyFor(note: Note): CircleKey`, `rootNoteFor(key): Note`, `describeKey(key): string`

- [ ] **Step 1: Write the failing tests**

`tests/unit/theory-spelling.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatNote, mod, pitchClassOf, spellAs } from "@/lib/theory/spelling";

describe("spelling", () => {
  it("mod is always non-negative", () => {
    expect(mod(-1, 12)).toBe(11);
    expect(mod(-0, 12)).toBe(0);
    expect(mod(25, 12)).toBe(1);
  });

  it("finds pitch classes, including across C", () => {
    expect(pitchClassOf({ letter: "C", accidental: 0 })).toBe(0);
    expect(pitchClassOf({ letter: "B", accidental: 1 })).toBe(0);
    expect(pitchClassOf({ letter: "C", accidental: -1 })).toBe(11);
    expect(pitchClassOf({ letter: "E", accidental: 1 })).toBe(5);
  });

  it("spells a pitch class on a given letter with the smallest accidental", () => {
    expect(spellAs("F", 6)).toEqual({ letter: "F", accidental: 1 });
    expect(spellAs("G", 6)).toEqual({ letter: "G", accidental: -1 });
    expect(spellAs("E", 5)).toEqual({ letter: "E", accidental: 1 });
    expect(spellAs("C", 11)).toEqual({ letter: "C", accidental: -1 });
  });

  it("formats with real sharp and flat glyphs", () => {
    expect(formatNote({ letter: "F", accidental: 1 })).toBe("F♯");
    expect(formatNote({ letter: "B", accidental: -1 })).toBe("B♭");
    expect(formatNote({ letter: "C", accidental: 0 })).toBe("C");
    expect(formatNote({ letter: "F", accidental: 2 })).toBe("F♯♯");
  });
});
```

`tests/unit/theory-circle.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { CIRCLE, circleKeyFor, describeKey, keySignature, majorScale, rootNoteFor } from "@/lib/theory/circle";
import { NOTES } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

const SCALES: Record<string, string> = {
  C: "C D E F G A B",
  G: "G A B C D E F♯",
  D: "D E F♯ G A B C♯",
  A: "A B C♯ D E F♯ G♯",
  E: "E F♯ G♯ A B C♯ D♯",
  B: "B C♯ D♯ E F♯ G♯ A♯",
  "F♯": "F♯ G♯ A♯ B C♯ D♯ E♯",
  "D♭": "D♭ E♭ F G♭ A♭ B♭ C",
  "A♭": "A♭ B♭ C D♭ E♭ F G",
  "E♭": "E♭ F G A♭ B♭ C D",
  "B♭": "B♭ C D E♭ F G A",
  F: "F G A B♭ C D E",
};

describe("CIRCLE", () => {
  it("runs C G D A E B F♯ D♭ A♭ E♭ B♭ F clockwise", () => {
    expect(CIRCLE.map((k) => formatNote(k.tonic)).join(" ")).toBe("C G D A E B F♯ D♭ A♭ E♭ B♭ F");
    expect(CIRCLE.map((k) => k.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("counts sharps clockwise and flats counter-clockwise", () => {
    expect(CIRCLE.map((k) => k.sharpsOrFlats)).toEqual([0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]);
  });

  it("names relative minors", () => {
    expect(CIRCLE.map((k) => formatNote(k.relativeMinor)).join(" ")).toBe("A E B F♯ C♯ G♯ D♯ B♭ F C G D");
  });

  it("marks G♭ as the enharmonic of F♯ only", () => {
    expect(CIRCLE.filter((k) => k.enharmonic).map((k) => formatNote(k.enharmonic!))).toEqual(["G♭"]);
    expect(CIRCLE[6].enharmonic && formatNote(CIRCLE[6].enharmonic)).toBe("G♭");
  });
});

describe("majorScale", () => {
  it.each(Object.entries(SCALES))("%s major", (tonic, expected) => {
    const key = CIRCLE.find((k) => formatNote(k.tonic) === tonic)!;
    expect(majorScale(key).map(formatNote).join(" ")).toBe(expected);
  });

  it("uses every letter exactly once and as many accidentals as the signature", () => {
    for (const key of CIRCLE) {
      const scale = majorScale(key);
      expect(new Set(scale.map((n) => n.letter)).size).toBe(7);
      expect(scale.filter((n) => n.accidental !== 0)).toHaveLength(Math.abs(key.sharpsOrFlats));
    }
  });
});

describe("keySignature", () => {
  const sig = (tonic: string) =>
    keySignature(CIRCLE.find((k) => formatNote(k.tonic) === tonic)!).map(formatNote).join(" ");

  it("lists sharps in F C G D A E B order", () => {
    expect(sig("C")).toBe("");
    expect(sig("G")).toBe("F♯");
    expect(sig("D")).toBe("F♯ C♯");
    expect(sig("F♯")).toBe("F♯ C♯ G♯ D♯ A♯ E♯");
  });

  it("lists flats in B E A D G C F order", () => {
    expect(sig("F")).toBe("B♭");
    expect(sig("D♭")).toBe("B♭ E♭ A♭ D♭ G♭");
  });
});

describe("shared root note mapping", () => {
  it("round-trips every pitch class", () => {
    for (const note of NOTES) expect(rootNoteFor(circleKeyFor(note))).toBe(note);
  });

  it("maps C# to D♭ major and F# to F♯ major", () => {
    expect(formatNote(circleKeyFor("C#").tonic)).toBe("D♭");
    expect(formatNote(circleKeyFor("F#").tonic)).toBe("F♯");
    expect(circleKeyFor("G").index).toBe(1);
  });
});

describe("describeKey", () => {
  it("reads naturally for screen readers", () => {
    expect(describeKey(CIRCLE[0])).toBe("C major, no sharps or flats");
    expect(describeKey(CIRCLE[1])).toBe("G major, 1 sharp");
    expect(describeKey(CIRCLE[2])).toBe("D major, 2 sharps");
    expect(describeKey(CIRCLE[11])).toBe("F major, 1 flat");
    expect(describeKey(CIRCLE[10])).toBe("B♭ major, 2 flats");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/theory-spelling.test.ts tests/unit/theory-circle.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/theory/spelling"` / `"@/lib/theory/circle"`.

- [ ] **Step 3: Implement**

`lib/theory/spelling.ts`:
```ts
export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

// accidental: +1 sharp, -1 flat, ±2 double. Spelled notes keep the letter a
// key needs (E♯ in F♯ major), which plain pitch classes can't.
export type SpelledNote = { letter: Letter; accidental: number };

export const LETTERS: readonly Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

const NATURAL_PITCH: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function pitchClassOf(note: SpelledNote): number {
  return mod(NATURAL_PITCH[note.letter] + note.accidental, 12);
}

export function spellAs(letter: Letter, pitchClass: number): SpelledNote {
  let accidental = mod(pitchClass - NATURAL_PITCH[letter], 12);
  if (accidental > 6) accidental -= 12;
  return { letter, accidental };
}

export function formatNote(note: SpelledNote): string {
  const glyphs = note.accidental > 0 ? "♯".repeat(note.accidental) : "♭".repeat(-note.accidental);
  return note.letter + glyphs;
}
```

`lib/theory/circle.ts`:
```ts
import { NOTES, type Note } from "@/lib/theory/notes";
import { LETTERS, formatNote, pitchClassOf, spellAs, type Letter, type SpelledNote } from "./spelling";

export type CircleKey = {
  index: number; // position clockwise from C at 12 o'clock
  tonic: SpelledNote;
  pitchClass: number;
  sharpsOrFlats: number; // +n sharps, -n flats
  relativeMinor: SpelledNote;
  enharmonic: SpelledNote | null; // shown small under the tonic (G♭ under F♯)
};

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

// Walk the letters from the tonic so every scale uses each letter once.
function majorScaleOf(tonic: SpelledNote): SpelledNote[] {
  const start = LETTERS.indexOf(tonic.letter);
  const root = pitchClassOf(tonic);
  return MAJOR_STEPS.map((step, i) => spellAs(LETTERS[(start + i) % 7], (root + step) % 12));
}

// [letter, accidental, sharpsOrFlats] clockwise from C; 6 o'clock is F♯ (G♭ shown beneath).
const TONICS: [Letter, number, number][] = [
  ["C", 0, 0], ["G", 0, 1], ["D", 0, 2], ["A", 0, 3], ["E", 0, 4], ["B", 0, 5],
  ["F", 1, 6], ["D", -1, -5], ["A", -1, -4], ["E", -1, -3], ["B", -1, -2], ["F", 0, -1],
];

export const CIRCLE: CircleKey[] = TONICS.map(([letter, accidental, sharpsOrFlats], index) => {
  const tonic: SpelledNote = { letter, accidental };
  return {
    index,
    tonic,
    pitchClass: pitchClassOf(tonic),
    sharpsOrFlats,
    relativeMinor: majorScaleOf(tonic)[5],
    enharmonic: index === 6 ? { letter: "G", accidental: -1 } : null,
  };
});

export function majorScale(key: CircleKey): SpelledNote[] {
  return majorScaleOf(key.tonic);
}

const SHARP_ORDER: Letter[] = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER: Letter[] = ["B", "E", "A", "D", "G", "C", "F"];

export function keySignature(key: CircleKey): SpelledNote[] {
  const n = key.sharpsOrFlats;
  return n >= 0
    ? SHARP_ORDER.slice(0, n).map((letter) => ({ letter, accidental: 1 }))
    : FLAT_ORDER.slice(0, -n).map((letter) => ({ letter, accidental: -1 }));
}

// The skeleton's shared root is a pitch-class name (NOTES[i] is pitch class i).
export function circleKeyFor(note: Note): CircleKey {
  const pitchClass = NOTES.indexOf(note);
  return CIRCLE.find((key) => key.pitchClass === pitchClass)!;
}

export function rootNoteFor(key: CircleKey): Note {
  return NOTES[key.pitchClass];
}

export function describeKey(key: CircleKey): string {
  const n = Math.abs(key.sharpsOrFlats);
  const kind = key.sharpsOrFlats > 0 ? "sharp" : "flat";
  const accidentals = n === 0 ? "no sharps or flats" : `${n} ${kind}${n > 1 ? "s" : ""}`;
  return `${formatNote(key.tonic)} major, ${accidentals}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory/spelling.ts lib/theory/circle.ts tests/unit/theory-spelling.test.ts tests/unit/theory-circle.test.ts
git commit -m "Theory: spelled notes, the circle of major keys, signatures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Diatonic chords, Decoder layout and common progressions

**Files:**
- Create: `lib/theory/chords.ts`
- Test: `tests/unit/theory-chords.test.ts`

**Interfaces:**
- Consumes: `CircleKey`, `majorScale`, `CIRCLE` (Task 1); `mod`, `formatNote`, `SpelledNote` (Task 1).
- Produces:
  - `type ChordQuality = "maj" | "min" | "dim"`
  - `type Chord = { degree: number; roman: string; quality: ChordQuality; root: SpelledNote; notes: [SpelledNote, SpelledNote, SpelledNote]; degrees: [number, number, number] }`
  - `diatonicChords(key): Chord[]` (index `d - 1` is degree `d`), `chordName(chord)` ("Am", "F♯°"), `chordLongName(chord)` ("A minor"), `romanFor(degree)`, `progressionLabel(degrees)` ("I–V–vi–IV")
  - `DECODER_LAYOUT = { major: [4, 1, 5], minor: [3, 6, 2], dim: 7 }`
  - `type ProgressionPreset = { id: string; name: string; degrees: readonly number[] }`, `COMMON_PROGRESSIONS: readonly ProgressionPreset[]`

- [ ] **Step 1: Write the failing test**

`tests/unit/theory-chords.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { CIRCLE } from "@/lib/theory/circle";
import {
  COMMON_PROGRESSIONS,
  DECODER_LAYOUT,
  chordLongName,
  chordName,
  diatonicChords,
  progressionLabel,
  romanFor,
} from "@/lib/theory/chords";
import { formatNote } from "@/lib/theory/spelling";

const byTonic = (t: string) => CIRCLE.find((k) => formatNote(k.tonic) === t)!;
const names = (t: string) => diatonicChords(byTonic(t)).map(chordName).join(" ");

describe("diatonicChords", () => {
  it("names the seven chords of G, F and D♭", () => {
    expect(names("G")).toBe("G Am Bm C D Em F♯°");
    expect(names("F")).toBe("F Gm Am B♭ C Dm E°");
    expect(names("D♭")).toBe("D♭ E♭m Fm G♭ A♭ B♭m C°");
  });

  it("builds each triad from degrees d, d+2, d+4 wrapped into 1–7", () => {
    const chords = diatonicChords(byTonic("G"));
    expect(chords.map((c) => c.degrees)).toEqual([
      [1, 3, 5], [2, 4, 6], [3, 5, 7], [4, 6, 1], [5, 7, 2], [6, 1, 3], [7, 2, 4],
    ]);
    expect(chords[4].notes.map(formatNote).join(" ")).toBe("D F♯ A");
    expect(chords[6].notes.map(formatNote).join(" ")).toBe("F♯ A C");
  });

  it("labels romans and qualities in major-key order", () => {
    const chords = diatonicChords(CIRCLE[0]);
    expect(chords.map((c) => c.roman)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
    expect(chords.map((c) => c.quality)).toEqual(["maj", "min", "min", "maj", "maj", "min", "dim"]);
  });

  it("gives long names for accessible labels", () => {
    const chords = diatonicChords(byTonic("G"));
    expect(chordLongName(chords[0])).toBe("G major");
    expect(chordLongName(chords[1])).toBe("A minor");
    expect(chordLongName(chords[6])).toBe("F♯ diminished");
  });
});

describe("Decoder layout and progressions", () => {
  it("matches the physical wheel: major 4·1·5, minor 3·6·2, dim 7", () => {
    expect(DECODER_LAYOUT).toEqual({ major: [4, 1, 5], minor: [3, 6, 2], dim: 7 });
  });

  it("labels progressions by numeral", () => {
    expect(romanFor(6)).toBe("vi");
    expect(progressionLabel([1, 5, 6, 4])).toBe("I–V–vi–IV");
  });

  it("ships the five agreed presets", () => {
    expect(COMMON_PROGRESSIONS.map((p) => [p.id, p.name, progressionLabel(p.degrees)])).toEqual([
      ["pop", "Pop", "I–V–vi–IV"],
      ["ii-v-i", "Jazz turnaround", "ii–V–I"],
      ["i-iv-v", "Three-chord", "I–IV–V"],
      ["vi-iv-i-v", "Sensitive", "vi–IV–I–V"],
      ["fifties", "50s", "I–vi–IV–V"],
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/theory-chords.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/theory/chords"`.

- [ ] **Step 3: Implement**

`lib/theory/chords.ts`:
```ts
import { majorScale, type CircleKey } from "./circle";
import { formatNote, mod, type SpelledNote } from "./spelling";

export type ChordQuality = "maj" | "min" | "dim";

export type Chord = {
  degree: number; // 1–7
  roman: string;
  quality: ChordQuality;
  root: SpelledNote;
  notes: [SpelledNote, SpelledNote, SpelledNote];
  degrees: [number, number, number]; // the Decoder's "quick chord" numbers
};

const QUALITIES: ChordQuality[] = ["maj", "min", "min", "maj", "maj", "min", "dim"];
const ROMANS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const SUFFIX: Record<ChordQuality, string> = { maj: "", min: "m", dim: "°" };
const QUALITY_NAME: Record<ChordQuality, string> = { maj: "major", min: "minor", dim: "diminished" };

const wrapDegree = (degree: number) => mod(degree - 1, 7) + 1;

export function diatonicChords(key: CircleKey): Chord[] {
  const scale = majorScale(key);
  return QUALITIES.map((quality, i) => {
    const degree = i + 1;
    const degrees: [number, number, number] = [degree, wrapDegree(degree + 2), wrapDegree(degree + 4)];
    return {
      degree,
      roman: ROMANS[i],
      quality,
      root: scale[i],
      notes: [scale[degrees[0] - 1], scale[degrees[1] - 1], scale[degrees[2] - 1]],
      degrees,
    };
  });
}

export function chordName(chord: Chord): string {
  return formatNote(chord.root) + SUFFIX[chord.quality];
}

export function chordLongName(chord: Chord): string {
  return `${formatNote(chord.root)} ${QUALITY_NAME[chord.quality]}`;
}

export function romanFor(degree: number): string {
  return ROMANS[degree - 1];
}

export function progressionLabel(degrees: readonly number[]): string {
  return degrees.map(romanFor).join("–");
}

// The physical Decoder's arrangement, left to right.
export const DECODER_LAYOUT = { major: [4, 1, 5], minor: [3, 6, 2], dim: 7 } as const;

export type ProgressionPreset = { id: string; name: string; degrees: readonly number[] };

export const COMMON_PROGRESSIONS: readonly ProgressionPreset[] = [
  { id: "pop", name: "Pop", degrees: [1, 5, 6, 4] },
  { id: "ii-v-i", name: "Jazz turnaround", degrees: [2, 5, 1] },
  { id: "i-iv-v", name: "Three-chord", degrees: [1, 4, 5] },
  { id: "vi-iv-i-v", name: "Sensitive", degrees: [6, 4, 1, 5] },
  { id: "fifties", name: "50s", degrees: [1, 6, 4, 5] },
];
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory/chords.ts tests/unit/theory-chords.test.ts
git commit -m "Theory: diatonic chords, Decoder layout, common progressions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Wheel and gesture math

**Files:**
- Create: `lib/circle/wheel-math.ts`
- Test: `tests/unit/wheel-math.test.ts`

**Interfaces:**
- Consumes: `mod` (Task 1).
- Produces: `STEP = 30`, `angleToKeyIndex(theta): number`, `targetForIndex(theta, index): number`, `nearestTarget(theta, velocityDegPerSec): number`, `springStep({x, v}, target, dtSec): {x, v}`, `isSettled({x, v}, target): boolean`, `classifyGesture(dx, dy): "tap" | "swipe-left" | "swipe-right" | "none"`, `pointerAngle(cx, cy, x, y): number` (degrees), `angleDelta(from, to): number` (in (−180, 180]).

- [ ] **Step 1: Write the failing test**

`tests/unit/wheel-math.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  angleDelta,
  angleToKeyIndex,
  classifyGesture,
  isSettled,
  nearestTarget,
  pointerAngle,
  springStep,
  targetForIndex,
} from "@/lib/circle/wheel-math";

describe("angleToKeyIndex", () => {
  it("reads the key at 12 o'clock from the wheel angle", () => {
    expect(angleToKeyIndex(0)).toBe(0); // C
    expect(angleToKeyIndex(-30)).toBe(1); // G
    expect(angleToKeyIndex(30)).toBe(11); // F
    expect(angleToKeyIndex(-14)).toBe(0);
    expect(angleToKeyIndex(-16)).toBe(1);
    expect(angleToKeyIndex(-390)).toBe(1); // wrapped once
    expect(angleToKeyIndex(720)).toBe(0);
  });
});

describe("targetForIndex", () => {
  it("goes the short way round", () => {
    expect(targetForIndex(-150, 7)).toBe(-210); // B → D♭ is two steps, never via F♯ the long way
    expect(targetForIndex(-330, 0)).toBe(-360); // F → C is one step
    expect(targetForIndex(0, 11)).toBe(30); // C → F is one step back
    expect(angleToKeyIndex(targetForIndex(-1000, 4))).toBe(4);
  });
});

describe("nearestTarget", () => {
  it("snaps to the nearest step with no velocity (a tap keeps the key)", () => {
    expect(nearestTarget(-30, 0)).toBe(-30);
    expect(nearestTarget(-44, 0)).toBe(-30);
    expect(nearestTarget(-46, 0)).toBe(-60);
  });

  it("carries a flick a little further", () => {
    expect(nearestTarget(-30, -400)).toBe(-90); // -30 + -60 → two extra steps
    expect(nearestTarget(-30, 60)).toBe(-30); // a +9° projection still rounds back
  });
});

describe("springStep", () => {
  function run(target: number, seconds: number) {
    let s = { x: 0, v: 0 };
    let max = 0;
    for (let t = 0; t < seconds; t += 1 / 60) {
      s = springStep(s, target, 1 / 60);
      max = Math.max(max, s.x);
    }
    return { s, max };
  }

  it("settles on the target within 400ms", () => {
    const { s } = run(30, 0.4);
    expect(Math.abs(s.x - 30)).toBeLessThan(0.5);
  });

  it("overshoots a little, never a whole step", () => {
    const { max } = run(30, 1);
    expect(max).toBeGreaterThan(30);
    expect(max).toBeLessThan(60);
  });

  it("knows when it has settled", () => {
    expect(isSettled({ x: 30.01, v: 0.1 }, 30)).toBe(true);
    expect(isSettled({ x: 30.01, v: 5 }, 30)).toBe(false);
    expect(isSettled({ x: 31, v: 0 }, 30)).toBe(false);
  });
});

describe("classifyGesture", () => {
  it("treats tiny movement as a tap", () => {
    expect(classifyGesture(0, 0)).toBe("tap");
    expect(classifyGesture(5, 5)).toBe("tap");
  });

  it("needs a clearly horizontal 48px move to swipe", () => {
    expect(classifyGesture(-60, 10)).toBe("swipe-left");
    expect(classifyGesture(60, -10)).toBe("swipe-right");
    expect(classifyGesture(48, 0)).toBe("none");
    expect(classifyGesture(60, 50)).toBe("none"); // too diagonal
    expect(classifyGesture(0, 120)).toBe("none"); // vertical scroll
  });
});

describe("pointer angles", () => {
  it("measures clockwise degrees from 3 o'clock", () => {
    expect(pointerAngle(0, 0, 10, 0)).toBe(0);
    expect(pointerAngle(0, 0, 0, 10)).toBe(90);
    expect(pointerAngle(0, 0, 0, -10)).toBe(-90);
  });

  it("takes the short signed difference across ±180°", () => {
    expect(angleDelta(170, -170)).toBe(20);
    expect(angleDelta(-170, 170)).toBe(-20);
    expect(angleDelta(10, 40)).toBe(30);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/wheel-math.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/circle/wheel-math"`.

- [ ] **Step 3: Implement**

`lib/circle/wheel-math.ts`:
```ts
import { mod } from "@/lib/theory/spelling";

// The wheel is one angle θ in degrees. Turning it by -30° brings the next key
// clockwise (G after C) to 12 o'clock.
export const STEP = 30;
const FLICK_SECONDS = 0.15;
// ζ ≈ 0.7: settles in ~300ms with a ~5% overshoot, like a detent.
const STIFFNESS = 320;
const DAMPING = 25;
const TAP_SLOP = 8;
const SWIPE_MIN = 48;
const SWIPE_RATIO = 1.5;

export function angleToKeyIndex(theta: number): number {
  return mod(Math.round(-theta / STEP), 12);
}

// The angle showing `index` that is closest to where the wheel is now.
export function targetForIndex(theta: number, index: number): number {
  const base = -STEP * index;
  return base + 360 * Math.round((theta - base) / 360);
}

export function nearestTarget(theta: number, velocityDegPerSec: number): number {
  return STEP * Math.round((theta + velocityDegPerSec * FLICK_SECONDS) / STEP);
}

export function springStep(
  state: { x: number; v: number },
  target: number,
  dtSec: number,
): { x: number; v: number } {
  const accel = -STIFFNESS * (state.x - target) - DAMPING * state.v;
  const v = state.v + accel * dtSec;
  return { x: state.x + v * dtSec, v };
}

export function isSettled(state: { x: number; v: number }, target: number): boolean {
  return Math.abs(state.x - target) < 0.05 && Math.abs(state.v) < 0.5;
}

export function classifyGesture(dx: number, dy: number): "tap" | "swipe-left" | "swipe-right" | "none" {
  if (Math.hypot(dx, dy) < TAP_SLOP) return "tap";
  if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > SWIPE_RATIO * Math.abs(dy)) {
    return dx < 0 ? "swipe-left" : "swipe-right";
  }
  return "none";
}

export function pointerAngle(cx: number, cy: number, x: number, y: number): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

export function angleDelta(from: number, to: number): number {
  return mod(to - from + 180, 360) - 180;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean. (`angleDelta(-170, 170)` is `mod(520, 360) - 180 = -20`.)

- [ ] **Step 5: Commit**

```bash
git add lib/circle/wheel-math.ts tests/unit/wheel-math.test.ts
git commit -m "Circle: wheel angle, snap, spring and gesture math

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Shared persisted store and the progression store

**Files:**
- Create: `lib/storage/persisted-store.ts`, `lib/circle/progression.ts`, `lib/circle/use-progression.ts`
- Modify: `lib/key-state/store.ts` (the module-level store section only; parse and transition functions unchanged)
- Test: `tests/unit/progression.test.ts` (new); `tests/unit/key-state.test.ts` (existing, unchanged, must stay green)

**Interfaces:**
- Consumes: `COMMON_PROGRESSIONS` (Task 2).
- Produces:
  - `createPersistedStore<T>(key, parse: (raw: string | null) => T, fallback: T): { get(): T; getServer(): T; set(next: T): void; subscribe(listener): () => void }`
  - `type Progression = { degrees: number[]; presetId: string | null }`, `PROGRESSION_KEY`, `EMPTY_PROGRESSION`, `MAX_CHORDS = 8`, `parseProgression(raw)`, `withChord(p, degree)`, `withoutStep(p, index)`, `withPreset(id)`, `stepBadges(degrees): Map<number, number[]>`, `progressionStore`
  - `useProgression(): [Progression, { add(degree); remove(index); clear(); pick(id) }]`

- [ ] **Step 1: Write the failing test**

`tests/unit/progression.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_PROGRESSION,
  MAX_CHORDS,
  PROGRESSION_KEY,
  parseProgression,
  stepBadges,
  withChord,
  withPreset,
  withoutStep,
} from "@/lib/circle/progression";

const pop = { degrees: [1, 5, 6, 4], presetId: "pop" };

describe("progression transitions", () => {
  it("adds a chord and drops the preset highlight", () => {
    expect(withChord(pop, 2)).toEqual({ degrees: [1, 5, 6, 4, 2], presetId: null });
  });

  it("stops at 8 chords", () => {
    const full = { degrees: [1, 2, 3, 4, 5, 6, 7, 1], presetId: null };
    expect(full.degrees).toHaveLength(MAX_CHORDS);
    expect(withChord(full, 2)).toBe(full);
  });

  it("removes one step and drops the preset highlight", () => {
    expect(withoutStep(pop, 1)).toEqual({ degrees: [1, 6, 4], presetId: null });
  });

  it("replaces the tray with a preset", () => {
    expect(withPreset("ii-v-i")).toEqual({ degrees: [2, 5, 1], presetId: "ii-v-i" });
    expect(withPreset("nope")).toEqual(EMPTY_PROGRESSION);
  });

  it("numbers chords by step, merging repeats into one badge", () => {
    const badges = stepBadges([1, 4, 1, 5]);
    expect(badges.get(1)).toEqual([1, 3]);
    expect(badges.get(4)).toEqual([2]);
    expect(badges.get(5)).toEqual([4]);
    expect(badges.get(6)).toBeUndefined();
  });
});

describe("parseProgression", () => {
  it("round-trips a valid progression", () => {
    expect(parseProgression(JSON.stringify(pop))).toEqual(pop);
    expect(parseProgression(JSON.stringify({ degrees: [7, 7], presetId: null }))).toEqual({
      degrees: [7, 7],
      presetId: null,
    });
  });

  it.each([
    ["missing", null],
    ["not json", "{oops"],
    ["degree 0", JSON.stringify({ degrees: [0], presetId: null })],
    ["degree 8", JSON.stringify({ degrees: [8], presetId: null })],
    ["string degree", JSON.stringify({ degrees: ["1"], presetId: null })],
    ["fractional degree", JSON.stringify({ degrees: [1.5], presetId: null })],
    ["9 chords", JSON.stringify({ degrees: [1, 1, 1, 1, 1, 1, 1, 1, 1], presetId: null })],
    ["unknown preset", JSON.stringify({ degrees: [1, 5, 6, 4], presetId: "retired" })],
    ["missing presetId", JSON.stringify({ degrees: [1] })],
    ["an array", "[]"],
  ])("falls back to an empty tray for %s", (_label, raw) => {
    expect(parseProgression(raw)).toEqual(EMPTY_PROGRESSION);
  });
});

describe("progressionStore", () => {
  async function load() {
    vi.resetModules();
    return import("@/lib/circle/progression");
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("persists and notifies", async () => {
    const { progressionStore } = await load();
    const listener = vi.fn();
    progressionStore.subscribe(listener);
    progressionStore.set(pop);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(PROGRESSION_KEY)!)).toEqual(pop);
  });

  it("works in memory when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { progressionStore } = await load();
    expect(progressionStore.get()).toEqual(EMPTY_PROGRESSION);
    progressionStore.set(pop);
    expect(progressionStore.get()).toEqual(pop);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/progression.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/circle/progression"`.

- [ ] **Step 3: Implement the shared store and move the key store onto it**

`lib/storage/persisted-store.ts`:
```ts
// A tiny localStorage-backed store read through useSyncExternalStore. Loaded
// lazily so the server render (no localStorage) never touches it; storage
// failures (Safari private mode) keep it working in memory.
export interface PersistedStore<T> {
  get(): T;
  getServer(): T;
  set(next: T): void;
  subscribe(listener: () => void): () => void;
}

export function createPersistedStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  fallback: T,
): PersistedStore<T> {
  let state: T | undefined;
  const listeners = new Set<() => void>();

  function load(): T {
    try {
      return parse(localStorage.getItem(key));
    } catch {
      return fallback;
    }
  }

  return {
    get: () => (state ??= load()),
    getServer: () => fallback,
    set(next) {
      state = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage blocked: the change still applies for this session.
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        state = parse(event.newValue);
        listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
```

In `lib/key-state/store.ts`, replace everything from the comment `// Module-level store read through useSyncExternalStore.` to the end of the file with:
```ts
const store = createPersistedStore(STORAGE_KEY, parseKeyState, DEFAULT_STATE);

export const getKeyState = store.get;
export const getServerKeyState = store.getServer;
export const updateKeyState = store.set;
export const subscribeKeyState = store.subscribe;
```
and add `import { createPersistedStore } from "@/lib/storage/persisted-store";` to its imports.

`lib/circle/progression.ts`:
```ts
import { createPersistedStore } from "@/lib/storage/persisted-store";
import { COMMON_PROGRESSIONS } from "@/lib/theory/chords";

// Degrees, never chord names: turning the wheel transposes for free.
export type Progression = { degrees: number[]; presetId: string | null };

export const PROGRESSION_KEY = "nomad:circle:progression:v1";
export const EMPTY_PROGRESSION: Progression = { degrees: [], presetId: null };
export const MAX_CHORDS = 8;

const isDegree = (value: unknown) => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 7;
const isPresetId = (value: unknown) => COMMON_PROGRESSIONS.some((preset) => preset.id === value);

export function parseProgression(raw: string | null): Progression {
  if (!raw) return EMPTY_PROGRESSION;
  try {
    const value = JSON.parse(raw);
    if (
      Array.isArray(value?.degrees) &&
      value.degrees.length <= MAX_CHORDS &&
      value.degrees.every(isDegree) &&
      (value.presetId === null || isPresetId(value.presetId))
    ) {
      return { degrees: [...value.degrees], presetId: value.presetId };
    }
  } catch {
    // Corrupt JSON: fall through to an empty tray.
  }
  return EMPTY_PROGRESSION;
}

export function withChord(progression: Progression, degree: number): Progression {
  if (progression.degrees.length >= MAX_CHORDS) return progression;
  return { degrees: [...progression.degrees, degree], presetId: null };
}

export function withoutStep(progression: Progression, index: number): Progression {
  return { degrees: progression.degrees.filter((_, i) => i !== index), presetId: null };
}

export function withPreset(id: string): Progression {
  const preset = COMMON_PROGRESSIONS.find((p) => p.id === id);
  return preset ? { degrees: [...preset.degrees], presetId: preset.id } : EMPTY_PROGRESSION;
}

// degree → its 1-based steps; a chord used twice gets both ("1·3").
export function stepBadges(degrees: readonly number[]): Map<number, number[]> {
  const badges = new Map<number, number[]>();
  degrees.forEach((degree, i) => badges.set(degree, [...(badges.get(degree) ?? []), i + 1]));
  return badges;
}

export const progressionStore = createPersistedStore(PROGRESSION_KEY, parseProgression, EMPTY_PROGRESSION);
```

`lib/circle/use-progression.ts`:
```ts
"use client";

import { useMemo, useSyncExternalStore } from "react";
import { EMPTY_PROGRESSION, progressionStore, withChord, withPreset, withoutStep, type Progression } from "./progression";

export function useProgression() {
  const progression: Progression = useSyncExternalStore(
    progressionStore.subscribe,
    progressionStore.get,
    progressionStore.getServer,
  );
  const actions = useMemo(
    () => ({
      add: (degree: number) => progressionStore.set(withChord(progressionStore.get(), degree)),
      remove: (index: number) => progressionStore.set(withoutStep(progressionStore.get(), index)),
      clear: () => progressionStore.set(EMPTY_PROGRESSION),
      pick: (id: string) => progressionStore.set(withPreset(id)),
    }),
    [],
  );
  return [progression, actions] as const;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS. The existing `key-state.test.ts` passes unchanged, which shows the extraction didn't change key-store behaviour.

- [ ] **Step 5: Commit**

```bash
git add lib/storage lib/key-state/store.ts lib/circle/progression.ts lib/circle/use-progression.ts tests/unit/progression.test.ts
git commit -m "Progression store on a shared persisted-store helper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Decoder tokens and the chord, tray and preset components

**Files:**
- Modify: `app/theme.css` (append), `tailwind.config.ts` (colors)
- Create: `components/circle/chord-circle.tsx`, `components/circle/progression-tray.tsx`, `components/circle/common-progressions.tsx`
- Test: `tests/unit/chord-circle.test.tsx`, `tests/unit/progression-tray.test.tsx`, `tests/unit/common-progressions.test.tsx`

**Interfaces:**
- Consumes: `Chord`, `chordName`, `chordLongName`, `COMMON_PROGRESSIONS`, `progressionLabel` (Task 2); `formatNote` (Task 1).
- Produces:
  - Tailwind colors `decoder` (`#FFD21F`), `decoder-soft`, `decoder-pale`, `decoder-ink-soft`, `decoder-muted`, usable as `bg-decoder`, `fill-decoder-soft`, and so on.
  - `DegreeDots({ degrees, small? })`, `StepBadge({ steps })`
  - `ChordButton({ chord, size: "key" | "major" | "relative" | "minor", label, labelPosition: "top" | "bottom", steps, onAdd(degree) })`
  - `DimChordButton({ chord, steps, onAdd(degree) })`
  - `ProgressionTray({ keyChords: Chord[], degrees: number[], onRemove(index), onClear() })`
  - `CommonProgressions({ activeId: string | null, onPick(id) })`

- [ ] **Step 1: Write the failing tests**

`tests/unit/chord-circle.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChordButton, DimChordButton } from "@/components/circle/chord-circle";
import { CIRCLE } from "@/lib/theory/circle";
import { diatonicChords } from "@/lib/theory/chords";

const g = diatonicChords(CIRCLE[1]);

describe("ChordButton", () => {
  it("is named for adding the chord and adds its degree", () => {
    const onAdd = vi.fn();
    render(<ChordButton chord={g[3]} size="major" label="IV" labelPosition="top" steps={[]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add C major, IV, to progression" }));
    expect(onAdd).toHaveBeenCalledWith(4);
  });

  it("shows notes and degree numbers with the first one filled", () => {
    const { container } = render(
      <ChordButton chord={g[4]} size="major" label="V" labelPosition="top" steps={[]} onAdd={() => {}} />,
    );
    expect(screen.getByText("D F♯ A")).toBeInTheDocument();
    const dots = container.querySelectorAll("[data-degree]");
    expect([...dots].map((d) => d.textContent)).toEqual(["5", "7", "2"]);
    expect([...dots].map((d) => d.getAttribute("data-filled"))).toEqual(["true", "false", "false"]);
  });

  it("badges every step the chord is used in", () => {
    render(<ChordButton chord={g[0]} size="key" label="I · KEY" labelPosition="top" steps={[1, 3]} onAdd={() => {}} />);
    expect(screen.getByTestId("step-badge")).toHaveTextContent("1·3");
  });

  it("has no badge when unused", () => {
    render(<ChordButton chord={g[5]} size="relative" label="vi" labelPosition="bottom" steps={[]} onAdd={() => {}} />);
    expect(screen.queryByTestId("step-badge")).toBeNull();
  });
});

describe("DimChordButton", () => {
  it("adds vii° and fills its first degree too", () => {
    const onAdd = vi.fn();
    const { container } = render(<DimChordButton chord={g[6]} steps={[]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add F♯ diminished, vii°, to progression" }));
    expect(onAdd).toHaveBeenCalledWith(7);
    expect(container.querySelector('[data-degree][data-filled="true"]')).toHaveTextContent("7");
  });
});
```

`tests/unit/progression-tray.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProgressionTray } from "@/components/circle/progression-tray";
import { CIRCLE } from "@/lib/theory/circle";
import { diatonicChords } from "@/lib/theory/chords";

const g = diatonicChords(CIRCLE[1]);

describe("ProgressionTray", () => {
  it("lists chords by numeral and name in the current key", () => {
    render(<ProgressionTray keyChords={g} degrees={[1, 5, 6, 4]} onRemove={() => {}} onClear={() => {}} />);
    const chips = within(screen.getByRole("list", { name: "Progression chords" })).getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "Remove G major, step 1",
      "Remove D major, step 2",
      "Remove E minor, step 3",
      "Remove C major, step 4",
    ]);
    expect(chips[2]).toHaveTextContent("viEm");
  });

  it("removes a tapped chip and clears", () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    render(<ProgressionTray keyChords={g} degrees={[2, 5, 1]} onRemove={onRemove} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove D major, step 2" }));
    expect(onRemove).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalled();
  });

  it("explains how to start when empty", () => {
    render(<ProgressionTray keyChords={g} degrees={[]} onRemove={() => {}} onClear={() => {}} />);
    expect(screen.queryByRole("list", { name: "Progression chords" })).toBeNull();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(screen.getByText("No chords yet — tap a chord or pick a progression.")).toBeInTheDocument();
  });
});
```

`tests/unit/common-progressions.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CommonProgressions } from "@/components/circle/common-progressions";

describe("CommonProgressions", () => {
  it("marks only the active preset as pressed", () => {
    render(<CommonProgressions activeId="pop" onPick={() => {}} />);
    expect(screen.getByRole("button", { name: /I–V–vi–IV/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /ii–V–I/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("picks a preset by id", () => {
    const onPick = vi.fn();
    render(<CommonProgressions activeId={null} onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: /Jazz turnaround/ }));
    expect(onPick).toHaveBeenCalledWith("ii-v-i");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/chord-circle.test.tsx tests/unit/progression-tray.test.tsx tests/unit/common-progressions.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/circle/..."`.

- [ ] **Step 3: Add the Decoder tokens**

Append to `app/theme.css`:
```css
/* Circle of Fifths: the Decoder's own colors. The card is a physical object,
   so these stay the same in dark mode. */
:root {
  --decoder-yellow: #ffd21f;
  --decoder-yellow-soft: #ffe680;
  --decoder-yellow-pale: #ffeda3;
  --decoder-ink-soft: #3b3c3e;
  --decoder-muted: #7a6a1a;
}
```

In `tailwind.config.ts`, inside `theme.extend.colors`, add after `accent`:
```ts
        decoder: {
          DEFAULT: "var(--decoder-yellow)",
          soft: "var(--decoder-yellow-soft)",
          pale: "var(--decoder-yellow-pale)",
          "ink-soft": "var(--decoder-ink-soft)",
          muted: "var(--decoder-muted)",
        },
```

- [ ] **Step 4: Implement the components**

`components/circle/chord-circle.tsx`:
```tsx
import { chordLongName, chordName, type Chord } from "@/lib/theory/chords";
import { formatNote } from "@/lib/theory/spelling";

const LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] md:text-[13px] xl:text-xs";

// Phone / tablet (md) / desktop (xl), from the canvas artboards.
const CIRCLE_SIZES = {
  key: "h-[84px] w-[84px] text-[44px] md:h-[108px] md:w-[108px] md:text-[56px] xl:h-[92px] xl:w-[92px] xl:text-[48px]",
  major: "h-16 w-16 text-[30px] md:h-[84px] md:w-[84px] md:text-[38px] xl:h-[72px] xl:w-[72px] xl:text-[34px]",
  relative: "h-[72px] w-[72px] text-[32px] md:h-[94px] md:w-[94px] md:text-[40px] xl:h-20 xl:w-20 xl:text-[36px]",
  minor: "h-[60px] w-[60px] text-[26px] md:h-[78px] md:w-[78px] md:text-[32px] xl:h-[66px] xl:w-[66px] xl:text-[28px]",
} as const;

export function DegreeDots({ degrees, small = false }: { degrees: readonly number[]; small?: boolean }) {
  return (
    <span aria-hidden className="flex gap-[3px]">
      {degrees.map((degree, i) => (
        <span
          key={i}
          data-degree
          data-filled={i === 0}
          className={`grid place-items-center rounded-full border-[1.5px] border-ink font-bold ${
            small ? "h-[18px] w-[18px] text-[10px]" : "h-5 w-5 text-[11px] md:h-6 md:w-6 md:text-[13px] xl:h-[22px] xl:w-[22px] xl:text-xs"
          } ${i === 0 ? "bg-ink text-decoder" : "text-ink"}`}
        >
          {degree}
        </span>
      ))}
    </span>
  );
}

export function StepBadge({ steps }: { steps: readonly number[] }) {
  if (steps.length === 0) return null;
  return (
    <span
      data-testid="step-badge"
      aria-hidden
      className="absolute -right-2 -top-1.5 grid h-[26px] min-w-[26px] place-items-center rounded-full border-2 border-ink bg-surface px-1 font-display text-sm font-bold text-ink md:h-[30px] md:min-w-[30px] md:text-base"
    >
      {steps.join("·")}
    </span>
  );
}

interface ChordButtonProps {
  chord: Chord;
  size: keyof typeof CIRCLE_SIZES;
  label: string;
  labelPosition: "top" | "bottom";
  steps: readonly number[];
  onAdd: (degree: number) => void;
}

export function ChordButton({ chord, size, label, labelPosition, steps, onAdd }: ChordButtonProps) {
  const label_ = <span className={LABEL}>{label}</span>;
  return (
    <button
      type="button"
      onClick={() => onAdd(chord.degree)}
      aria-label={`Add ${chordLongName(chord)}, ${chord.roman}, to progression`}
      className="flex min-w-0 flex-col items-center gap-[5px] py-1 text-ink"
    >
      {labelPosition === "top" && label_}
      <span
        className={`relative grid place-items-center rounded-full bg-ink font-display font-semibold ${CIRCLE_SIZES[size]} ${
          chord.quality === "maj" ? "text-decoder" : "text-white"
        }`}
      >
        {chordName(chord)}
        <StepBadge steps={steps} />
      </span>
      <DegreeDots degrees={chord.degrees} />
      <span className="text-[13px] font-semibold md:text-[15px] xl:text-sm">{chord.notes.map(formatNote).join(" ")}</span>
      {labelPosition === "bottom" && label_}
    </button>
  );
}

export function DimChordButton({ chord, steps, onAdd }: Omit<ChordButtonProps, "size" | "label" | "labelPosition">) {
  return (
    <button
      type="button"
      onClick={() => onAdd(chord.degree)}
      aria-label={`Add ${chordLongName(chord)}, ${chord.roman}, to progression`}
      className="flex min-h-[66px] items-center gap-2 bg-decoder px-1.5 text-ink"
    >
      <span className="relative grid h-[54px] w-[54px] place-items-center rounded-full border-2 border-ink font-display text-xl font-semibold md:h-[62px] md:w-[62px] md:text-[23px] xl:h-14 xl:w-14 xl:text-[21px]">
        {chordName(chord)}
        <StepBadge steps={steps} />
      </span>
      <span className="flex flex-col items-start gap-[3px]">
        <span className={LABEL}>vii° dim.</span>
        <DegreeDots degrees={chord.degrees} small />
      </span>
    </button>
  );
}
```

`components/circle/progression-tray.tsx`:
```tsx
import { chordLongName, chordName, type Chord } from "@/lib/theory/chords";

interface ProgressionTrayProps {
  keyChords: Chord[]; // diatonicChords(current key); index d-1 is degree d
  degrees: number[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function ProgressionTray({ keyChords, degrees, onRemove, onClear }: ProgressionTrayProps) {
  return (
    <section
      aria-labelledby="progression-heading"
      className="flex flex-col gap-3 rounded-[22px] border border-border bg-surface p-3.5 md:p-[18px]"
    >
      <div className="flex items-center justify-between">
        <h2 id="progression-heading" className="font-display text-lg font-semibold uppercase tracking-[0.06em] md:text-xl">
          Progression
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={degrees.length === 0}
          className="min-h-11 px-1 text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      {degrees.length > 0 ? (
        <ol aria-label="Progression chords" className="grid grid-cols-4 gap-2">
          {degrees.map((degree, i) => {
            const chord = keyChords[degree - 1];
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${chordLongName(chord)}, step ${i + 1}`}
                  className="flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-[14px] bg-ink text-white xl:min-h-[76px]"
                >
                  <span className="text-xs font-bold text-decoder">{chord.roman}</span>
                  <span className="font-display text-2xl font-semibold leading-none xl:text-[28px]">{chordName(chord)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-text-secondary">No chords yet — tap a chord or pick a progression.</p>
      )}
      <p className="text-[13px] text-text-secondary">Tap chords on the card to add · tap a chip to remove</p>
    </section>
  );
}
```

`components/circle/common-progressions.tsx`:
```tsx
import { COMMON_PROGRESSIONS, progressionLabel } from "@/lib/theory/chords";

interface CommonProgressionsProps {
  activeId: string | null;
  onPick: (id: string) => void;
}

export function CommonProgressions({ activeId, onPick }: CommonProgressionsProps) {
  return (
    <section aria-labelledby="common-heading" className="flex flex-col gap-2.5">
      <h2 id="common-heading" className="font-display text-lg font-semibold uppercase tracking-[0.06em] md:text-xl">
        Common progressions
      </h2>
      <div className="flex flex-wrap gap-2">
        {COMMON_PROGRESSIONS.map((preset) => {
          const active = preset.id === activeId;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(preset.id)}
              className={`flex min-h-11 flex-col items-start justify-center rounded-full border-[1.5px] px-3.5 ${
                active ? "border-ink bg-decoder text-ink" : "border-text-primary text-text-primary"
              }`}
            >
              <span className="text-sm font-bold">{progressionLabel(preset.degrees)}</span>
              <span className={`text-[11px] font-medium ${active ? "text-ink" : "text-text-secondary"}`}>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add app/theme.css tailwind.config.ts components/circle/chord-circle.tsx components/circle/progression-tray.tsx components/circle/common-progressions.tsx tests/unit/chord-circle.test.tsx tests/unit/progression-tray.test.tsx tests/unit/common-progressions.test.tsx
git commit -m "Circle: Decoder tokens, chord buttons, progression tray and presets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Reduced-motion hook and useWheelRotation

**Files:**
- Create: `lib/circle/use-reduced-motion.ts`, `lib/circle/use-wheel-rotation.ts`
- Test: `tests/unit/use-wheel-rotation.test.tsx`

**Interfaces:**
- Consumes: everything in `wheel-math.ts` (Task 3); `mod` (Task 1).
- Produces:
  - `usePrefersReducedMotion(): boolean`
  - `useWheelRotation({ committedIndex: number, onCommit(index: number) }): { theta: number; displayIndex: number; step(direction: 1 | -1): void; wheelHandlers: { onPointerDown; onPointerMove; onPointerUp; onPointerCancel; onKeyDown } }`. The handlers are typed for an `SVGSVGElement`. `onPointerDown` calls `stopPropagation()` so the card's swipe detector ignores wheel drags.

- [ ] **Step 1: Write the failing test**

`tests/unit/use-wheel-rotation.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWheelRotation } from "@/lib/circle/use-wheel-rotation";

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe("useWheelRotation", () => {
  describe("with reduced motion", () => {
    beforeEach(() => mockReducedMotion(true));

    it("starts at the committed key", () => {
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 1, onCommit: vi.fn() }));
      expect(result.current.theta).toBe(-30);
      expect(result.current.displayIndex).toBe(1);
    });

    it("steps clockwise and commits at once", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 1, onCommit }));
      act(() => result.current.step(1));
      expect(result.current.theta).toBe(-60);
      expect(onCommit).toHaveBeenLastCalledWith(2);
    });

    it("steps back across C the short way", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => result.current.step(-1));
      expect(result.current.theta).toBe(30);
      expect(onCommit).toHaveBeenLastCalledWith(11);
    });

    it("steps accumulate from the pending target", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => {
        result.current.step(1);
        result.current.step(1);
        result.current.step(1);
      });
      expect(result.current.displayIndex).toBe(3);
      expect(onCommit).toHaveBeenLastCalledWith(3);
    });

    it("turns with the arrow keys", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      const key = (k: string) =>
        ({ key: k, preventDefault: vi.fn() }) as unknown as React.KeyboardEvent<SVGSVGElement>;
      act(() => result.current.wheelHandlers.onKeyDown(key("ArrowRight")));
      expect(onCommit).toHaveBeenLastCalledWith(1);
      act(() => result.current.wheelHandlers.onKeyDown(key("ArrowLeft")));
      expect(onCommit).toHaveBeenLastCalledWith(0);
    });
  });

  describe("with motion", () => {
    beforeEach(() => mockReducedMotion(false));

    it("jumps without spinning to a key that arrives before the first frame (hydration)", () => {
      const { result, rerender } = renderHook(
        ({ index }) => useWheelRotation({ committedIndex: index, onCommit: vi.fn() }),
        { initialProps: { index: 0 } },
      );
      rerender({ index: 7 });
      expect(result.current.displayIndex).toBe(7);
      expect(result.current.theta).toBe(150); // D♭ the short way from C: -210 + 360
    });

    it("does not commit until the spring settles", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => result.current.step(1));
      expect(onCommit).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/use-wheel-rotation.test.tsx`
Expected: FAIL, `Failed to resolve import "@/lib/circle/use-wheel-rotation"`.

- [ ] **Step 3: Implement**

`lib/circle/use-reduced-motion.ts`:
```ts
"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
```

`lib/circle/use-wheel-rotation.ts`:
```ts
"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MutableRefObject, type PointerEvent } from "react";
import { mod } from "@/lib/theory/spelling";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import {
  STEP,
  angleDelta,
  angleToKeyIndex,
  isSettled,
  nearestTarget,
  pointerAngle,
  springStep,
  targetForIndex,
} from "./wheel-math";

// A release this long after the last move carries no flick.
const STALE_VELOCITY_MS = 80;

function cancelFrame(frame: MutableRefObject<number | null>) {
  if (frame.current !== null) cancelAnimationFrame(frame.current);
  frame.current = null;
}

interface Options {
  committedIndex: number;
  onCommit: (index: number) => void;
}

export function useWheelRotation({ committedIndex, onCommit }: Options) {
  const reducedMotion = usePrefersReducedMotion();
  const [theta, setTheta] = useState(() => -STEP * committedIndex);
  const thetaRef = useRef(theta);
  const targetRef = useRef(theta); // where the wheel is going (or rests)
  const velocityRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const dragRef = useRef<{ cx: number; cy: number; angle: number; time: number } | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  });

  const show = useCallback((x: number) => {
    thetaRef.current = x;
    setTheta(x);
  }, []);

  const animateTo = useCallback(
    (target: number, commit: boolean) => {
      targetRef.current = target;
      cancelFrame(frameRef);
      const finish = () => {
        velocityRef.current = 0;
        show(target);
        if (commit) onCommitRef.current(angleToKeyIndex(target));
      };
      if (reducedMotion) {
        finish();
        return;
      }
      let state = { x: thetaRef.current, v: velocityRef.current };
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        state = springStep(state, target, dt);
        if (isSettled(state, target)) {
          frameRef.current = null;
          finish();
          return;
        }
        show(state.x);
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [reducedMotion, show],
  );

  // A key that arrives before the first frame (hydration from storage) is a
  // jump, not a spin; later changes (linked tool, another tab) animate.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      readyRef.current = true;
    });
    return () => {
      cancelAnimationFrame(id);
      cancelFrame(frameRef);
    };
  }, []);

  useEffect(() => {
    if (angleToKeyIndex(targetRef.current) === committedIndex) return;
    const target = targetForIndex(thetaRef.current, committedIndex);
    if (!readyRef.current) {
      targetRef.current = target;
      show(target);
      return;
    }
    animateTo(target, false);
  }, [committedIndex, animateTo, show]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const index = mod(angleToKeyIndex(targetRef.current) + direction, 12);
      animateTo(targetForIndex(targetRef.current, index), true);
    },
    [animateTo],
  );

  const onPointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
    event.stopPropagation(); // the card's swipe detector ignores wheel drags
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    event.currentTarget.setPointerCapture(event.pointerId);
    cancelFrame(frameRef);
    velocityRef.current = 0;
    dragRef.current = { cx, cy, angle: pointerAngle(cx, cy, event.clientX, event.clientY), time: event.timeStamp };
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const angle = pointerAngle(drag.cx, drag.cy, event.clientX, event.clientY);
      const delta = angleDelta(drag.angle, angle);
      const seconds = (event.timeStamp - drag.time) / 1000;
      if (seconds > 0) velocityRef.current = delta / seconds;
      dragRef.current = { ...drag, angle, time: event.timeStamp };
      show(thetaRef.current + delta);
    },
    [show],
  );

  const endDrag = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      // The release velocity both projects the flick and seeds the spring.
      if (reducedMotion || event.timeStamp - drag.time > STALE_VELOCITY_MS) velocityRef.current = 0;
      animateTo(nearestTarget(thetaRef.current, velocityRef.current), true);
    },
    [animateTo, reducedMotion],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<SVGSVGElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    },
    [step],
  );

  return {
    theta,
    displayIndex: angleToKeyIndex(theta),
    step,
    wheelHandlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onKeyDown },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/circle/use-reduced-motion.ts lib/circle/use-wheel-rotation.ts tests/unit/use-wheel-rotation.test.tsx
git commit -m "Circle: wheel rotation hook (drag, flick, spring snap, keyboard)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Mini wheel and Decoder card

**Files:**
- Create: `components/circle/mini-wheel.tsx`, `components/circle/decoder-card.tsx`
- Test: `tests/unit/mini-wheel.test.tsx`, `tests/unit/decoder-card.test.tsx`

**Interfaces:**
- Consumes: `CIRCLE`, `describeKey`, `keySignature` (Task 1); `diatonicChords`, `DECODER_LAYOUT` (Task 2); `classifyGesture` (Task 3); `ChordButton`, `DimChordButton` (Task 5); the `wheelHandlers` shape (Task 6).
- Produces:
  - `MiniWheel({ theta, keyIndex, handlers })`: `role="slider"` named `Key`
  - `type WheelHandlers = ReturnType<typeof useWheelRotation>["wheelHandlers"]`, exported from `mini-wheel.tsx`
  - `DecoderCard({ keyIndex, theta, wheelHandlers, badges: Map<number, number[]>, onAddChord(degree), onSwipe(direction: 1 | -1) })`: a `section` named `Key of <describeKey>`

- [ ] **Step 1: Write the failing tests**

`tests/unit/mini-wheel.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniWheel } from "@/components/circle/mini-wheel";

const noHandlers = {
  onPointerDown: () => {},
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerCancel: () => {},
  onKeyDown: () => {},
};

describe("MiniWheel", () => {
  it("is a slider that announces the key", () => {
    render(<MiniWheel theta={-30} keyIndex={1} handlers={noHandlers} />);
    const wheel = screen.getByRole("slider", { name: "Key" });
    expect(wheel).toHaveAttribute("aria-valuenow", "1");
    expect(wheel).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
    expect(wheel).toHaveAttribute("tabindex", "0");
  });

  it("highlights only IV, I and V and their relative minors", () => {
    const { container } = render(<MiniWheel theta={-30} keyIndex={1} handlers={noHandlers} />);
    const inKey = [...container.querySelectorAll('[data-in-key="true"]')].map((g) => g.getAttribute("data-key"));
    expect(inKey).toEqual(["C", "G", "D"]);
  });

  it("shows G♭ beneath F♯", () => {
    render(<MiniWheel theta={0} keyIndex={0} handlers={noHandlers} />);
    expect(screen.getByText("G♭")).toBeInTheDocument();
  });
});
```

`tests/unit/decoder-card.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DecoderCard } from "@/components/circle/decoder-card";

const noHandlers = {
  onPointerDown: () => {},
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerCancel: () => {},
  onKeyDown: () => {},
};

function renderG(onAddChord = vi.fn()) {
  render(
    <DecoderCard
      keyIndex={1}
      theta={-30}
      wheelHandlers={noHandlers}
      badges={new Map([[1, [1]], [5, [2]]])}
      onAddChord={onAddChord}
      onSwipe={() => {}}
    />,
  );
  return screen.getByRole("region", { name: "Key of G major, 1 sharp" });
}

describe("DecoderCard", () => {
  it("lays chords out in Decoder order: IV I V, vii°, iii vi ii", () => {
    const card = renderG();
    const names = within(card)
      .getAllByRole("button", { name: /^Add / })
      .map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual([
      "Add C major, IV, to progression",
      "Add G major, I, to progression",
      "Add D major, V, to progression",
      "Add F♯ diminished, vii°, to progression",
      "Add B minor, iii, to progression",
      "Add E minor, vi, to progression",
      "Add A minor, ii, to progression",
    ]);
  });

  it("shows key facts: key, signature, relative minor", () => {
    const card = renderG();
    expect(within(card).getByText("G major")).toBeInTheDocument();
    expect(within(card).getByText("♯ F")).toBeInTheDocument();
    expect(within(card).getByText("E minor")).toBeInTheDocument();
  });

  it("badges chords that are in the progression", () => {
    const card = renderG();
    expect(within(within(card).getByRole("button", { name: /Add G major/ })).getByTestId("step-badge")).toHaveTextContent("1");
    expect(within(within(card).getByRole("button", { name: /Add D major/ })).getByTestId("step-badge")).toHaveTextContent("2");
  });

  it("a plain click (keyboard, assistive tech) still adds a chord", () => {
    const onAddChord = vi.fn();
    const card = renderG(onAddChord);
    fireEvent.click(within(card).getByRole("button", { name: /Add E minor/ }));
    expect(onAddChord).toHaveBeenCalledWith(6);
  });

  it("writes 'none' for C major's empty signature", () => {
    render(
      <DecoderCard keyIndex={0} theta={0} wheelHandlers={noHandlers} badges={new Map()} onAddChord={() => {}} onSwipe={() => {}} />,
    );
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/mini-wheel.test.tsx tests/unit/decoder-card.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/circle/mini-wheel"` / `".../decoder-card"`.

- [ ] **Step 3: Implement**

`components/circle/mini-wheel.tsx`:
```tsx
import type { useWheelRotation } from "@/lib/circle/use-wheel-rotation";
import { CIRCLE, describeKey } from "@/lib/theory/circle";
import { formatNote, mod } from "@/lib/theory/spelling";

export type WheelHandlers = ReturnType<typeof useWheelRotation>["wheelHandlers"];

// One wedge at 12 o'clock (viewBox 360, center 180): outer ring r 170→120, inner 120→75.
const MAJOR_WEDGE = "M136,15.79 A170,170 0 0 1 224,15.79 L211.06,64.09 A120,120 0 0 0 148.94,64.09 Z";
const MINOR_WEDGE = "M148.94,64.09 A120,120 0 0 1 211.06,64.09 L199.41,107.56 A75,75 0 0 0 160.59,107.56 Z";

interface MiniWheelProps {
  theta: number;
  keyIndex: number;
  handlers: WheelHandlers;
}

export function MiniWheel({ theta, keyIndex, handlers }: MiniWheelProps) {
  const key = CIRCLE[keyIndex];
  const tonic = formatNote(key.tonic);
  return (
    <svg
      viewBox="0 0 360 360"
      role="slider"
      tabIndex={0}
      aria-label="Key"
      aria-valuemin={0}
      aria-valuemax={11}
      aria-valuenow={keyIndex}
      aria-valuetext={describeKey(key)}
      className="h-[176px] w-[176px] shrink-0 cursor-grab touch-none select-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ink active:cursor-grabbing md:h-[270px] md:w-[270px] xl:h-[208px] xl:w-[208px]"
      {...handlers}
    >
      <g transform={`rotate(${theta} 180 180)`}>
        {CIRCLE.map((wedge) => {
          const angle = wedge.index * 30;
          const inKey = [11, 0, 1].includes(mod(wedge.index - keyIndex, 12)); // IV, I, V
          const upright = -(angle + theta); // keeps labels level as the wheel turns
          return (
            <g
              key={wedge.index}
              data-key={formatNote(wedge.tonic)}
              data-in-key={inKey}
              transform={`rotate(${angle} 180 180)`}
            >
              <path d={MAJOR_WEDGE} className={inKey ? "fill-ink" : "fill-decoder-soft"} stroke="var(--decoder-yellow)" strokeWidth={4} />
              <path d={MINOR_WEDGE} className={inKey ? "fill-decoder-ink-soft" : "fill-decoder-pale"} stroke="var(--decoder-yellow)" strokeWidth={4} />
              <g transform={`rotate(${upright} 180 37)`}>
                <text
                  x={180}
                  y={wedge.enharmonic ? 42 : 46}
                  textAnchor="middle"
                  fontSize={wedge.enharmonic ? 22 : 26}
                  className={`font-display font-semibold ${inKey ? "fill-decoder" : "fill-decoder-muted"}`}
                >
                  {formatNote(wedge.tonic)}
                </text>
                {wedge.enharmonic && (
                  <text x={180} y={57} textAnchor="middle" fontSize={12} className={`font-display font-medium ${inKey ? "fill-decoder" : "fill-decoder-muted"}`}>
                    {formatNote(wedge.enharmonic)}
                  </text>
                )}
              </g>
              <text
                x={180}
                y={91}
                textAnchor="middle"
                fontSize={19}
                transform={`rotate(${upright} 180 85)`}
                className={`font-display font-medium ${inKey ? "fill-white" : "fill-decoder-muted"}`}
              >
                {formatNote(wedge.relativeMinor)}m
              </text>
            </g>
          );
        })}
      </g>
      <circle cx={180} cy={180} r={70} className="fill-ink" />
      <text x={180} y={202} textAnchor="middle" fontSize={tonic.length > 1 ? 54 : 66} className="fill-decoder font-display font-bold">
        {tonic}
      </text>
    </svg>
  );
}
```

`components/circle/decoder-card.tsx`:
```tsx
"use client";

import { useRef } from "react";
import { classifyGesture } from "@/lib/circle/wheel-math";
import { CIRCLE, describeKey, keySignature } from "@/lib/theory/circle";
import { DECODER_LAYOUT, diatonicChords } from "@/lib/theory/chords";
import { formatNote } from "@/lib/theory/spelling";
import { ChordButton, DimChordButton } from "./chord-circle";
import { MiniWheel, type WheelHandlers } from "./mini-wheel";

const FACT_LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] md:text-xs";
const ROW_LABEL = "bg-decoder px-1 font-display text-[17px] font-semibold leading-tight tracking-[0.04em] md:text-xl xl:text-lg";
// Clicks this soon after a swipe ends were part of the swipe, not a tap.
const SUPPRESS_CLICK_MS = 60;

interface DecoderCardProps {
  keyIndex: number;
  theta: number;
  wheelHandlers: WheelHandlers;
  badges: Map<number, number[]>;
  onAddChord: (degree: number) => void;
  onSwipe: (direction: 1 | -1) => void;
}

export function DecoderCard({ keyIndex, theta, wheelHandlers, badges, onAddChord, onSwipe }: DecoderCardProps) {
  const key = CIRCLE[keyIndex];
  const chords = diatonicChords(key);
  const signature = keySignature(key);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressUntil = useRef(0);
  const steps = (degree: number) => badges.get(degree) ?? [];
  const sizeFor = (degree: number) => (degree === 1 ? "key" : degree === 6 ? "relative" : degree === 4 || degree === 5 ? "major" : "minor");
  const labelFor = (degree: number) => (degree === 1 ? "I · KEY" : degree === 6 ? "vi · relative" : chords[degree - 1].roman);

  return (
    <section
      aria-label={`Key of ${describeKey(key)}`}
      // pan-y: vertical drags still scroll the page; horizontal ones are ours.
      className="flex touch-pan-y select-none flex-col gap-3.5 rounded-[28px] bg-decoder px-3.5 pb-5 pt-4 text-ink md:gap-[18px] md:rounded-[32px] md:px-7 md:pb-7 md:pt-[26px] xl:w-[620px] xl:shrink-0 xl:px-6 xl:pt-[22px]"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const gesture = classifyGesture(event.clientX - from.x, event.clientY - from.y);
        if (gesture === "tap") return;
        suppressUntil.current = event.timeStamp + SUPPRESS_CLICK_MS;
        if (gesture === "swipe-left") onSwipe(1);
        else if (gesture === "swipe-right") onSwipe(-1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
      onClickCapture={(event) => {
        if (event.timeStamp < suppressUntil.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="flex items-center gap-3 md:gap-8 xl:gap-6">
        <MiniWheel theta={theta} keyIndex={keyIndex} handlers={wheelHandlers} />
        <dl className="flex min-w-0 flex-col gap-2.5 md:gap-4 xl:gap-3.5">
          <div className="flex flex-col gap-px">
            <dt className={FACT_LABEL}>Key</dt>
            <dd className="font-display text-[26px] font-semibold leading-tight md:text-[38px] xl:text-[34px]">
              {formatNote(key.tonic)} major
            </dd>
          </div>
          <div className="flex flex-col items-start gap-1">
            <dt className={FACT_LABEL}>Signature</dt>
            <dd className="rounded-[10px] bg-ink px-3 py-1 font-display text-lg font-semibold tracking-[0.04em] text-decoder md:text-[22px] xl:text-xl">
              {signature.length === 0
                ? "none"
                : `${key.sharpsOrFlats > 0 ? "♯" : "♭"} ${signature.map((note) => note.letter).join(" ")}`}
            </dd>
          </div>
          <div className="flex flex-col gap-px">
            <dt className={FACT_LABEL}>Relative minor</dt>
            <dd className="font-display text-xl font-semibold md:text-[26px] xl:text-2xl">{formatNote(key.relativeMinor)} minor</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-3 items-end gap-1.5 md:gap-2.5">
        {DECODER_LAYOUT.major.map((degree) => (
          <ChordButton
            key={degree}
            chord={chords[degree - 1]}
            size={sizeFor(degree)}
            label={labelFor(degree)}
            labelPosition="top"
            steps={steps(degree)}
            onAdd={onAddChord}
          />
        ))}
      </div>

      <div className="relative min-h-[70px]">
        <div aria-hidden className="absolute inset-x-0 top-1/2 border-t-[1.5px] border-dashed border-ink" />
        <div className="absolute left-1.5 top-0 md:left-3">
          <DimChordButton chord={chords[DECODER_LAYOUT.dim - 1]} steps={steps(DECODER_LAYOUT.dim)} onAdd={onAddChord} />
        </div>
        <div aria-hidden className="absolute right-1.5 top-0 flex h-full flex-col items-end justify-between md:right-3">
          <span className={`${ROW_LABEL} uppercase`}>Major ↑</span>
          <span className={ROW_LABEL}>minor ↓</span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-start gap-1.5 md:gap-2.5">
        {DECODER_LAYOUT.minor.map((degree) => (
          <ChordButton
            key={degree}
            chord={chords[degree - 1]}
            size={sizeFor(degree)}
            label={labelFor(degree)}
            labelPosition="bottom"
            steps={steps(degree)}
            onAdd={onAddChord}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add components/circle/mini-wheel.tsx components/circle/decoder-card.tsx tests/unit/mini-wheel.test.tsx tests/unit/decoder-card.test.tsx
git commit -m "Circle: mini wheel and Decoder card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Wire up the page, e2e, docs

**Files:**
- Create: `components/circle/circle-of-fifths.tsx`, `tests/e2e/circle.spec.ts`
- Modify: `app/circle/page.tsx`, `tests/e2e/key-link.spec.ts`, `CLAUDE.md`

**Interfaces:**
- Consumes: `useToolKey` (skeleton); `CIRCLE`, `circleKeyFor`, `rootNoteFor`, `describeKey` (Task 1); `diatonicChords` (Task 2); `stepBadges` (Task 4); `useProgression` (Task 4); `useWheelRotation` (Task 6); `DecoderCard` (Task 7); `ProgressionTray`, `CommonProgressions` (Task 5).
- Produces: the finished `/circle/` page.

- [ ] **Step 1: Move the key-link e2e off the Circle placeholder**

The Circle page no longer has the note picker, so these flows move to Chords and Scales. Replace the four tests in `tests/e2e/key-link.spec.ts` (keep its helpers `root`, `toggle` and `go` as they are) with:
```ts
test("tools keep their own key until linked", async ({ page }) => {
  await page.goto("/chords/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await root(page, "G").click();
  await go(page, "Scales");
  await expect(root(page, "C")).toHaveAttribute("aria-pressed", "true");
});

test("linking shares the key across tools", async ({ page }) => {
  await page.goto("/chords/");
  await root(page, "G").click();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(3);

  await go(page, "Scales");
  await expect(root(page, "G")).toHaveAttribute("aria-pressed", "true");
  await root(page, "D").click();
  await go(page, "Chords");
  await expect(root(page, "D")).toHaveAttribute("aria-pressed", "true");
});

test("unlinking keeps the shared key, then tools diverge", async ({ page }) => {
  await page.goto("/chords/");
  await toggle(page).click();
  await root(page, "A").click();
  await toggle(page).click();
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(0);

  await go(page, "Scales");
  await expect(root(page, "A")).toHaveAttribute("aria-pressed", "true");
  await root(page, "E").click();
  await go(page, "Chords");
  await expect(root(page, "A")).toHaveAttribute("aria-pressed", "true");
});

test("keys and link state survive a reload", async ({ page }) => {
  await page.goto("/chords/");
  await root(page, "Bb").click();
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(root(page, "Bb")).toHaveAttribute("aria-pressed", "true");
});
```

Run: `pnpm exec playwright test tests/e2e/key-link.spec.ts`
Expected: PASS (it no longer touches `/circle/`).

- [ ] **Step 2: Write the failing Circle e2e**

`tests/e2e/circle.spec.ts`:
```ts
import { expect, test, type Page } from "@playwright/test";

const wheel = (page: Page) => page.getByRole("slider", { name: "Key" });
const card = (page: Page) => page.getByRole("region", { name: /^Key of / });
const trayChips = (page: Page) => page.getByRole("list", { name: "Progression chords" }).getByRole("button");
const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page"); // see CLAUDE.md
};

// A horizontal drag across the lower card (below the wheel).
async function swipe(page: Page, direction: "left" | "right") {
  const box = (await card(page).boundingBox())!;
  const y = box.y + box.height * 0.62;
  const from = direction === "left" ? box.x + box.width * 0.8 : box.x + box.width * 0.2;
  const to = direction === "left" ? from - 140 : from + 140;
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move(to, y, { steps: 6 });
  await page.mouse.up();
}

async function labels(page: Page) {
  return trayChips(page).evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/circle/");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "C major, no sharps or flats");
});

test("G major reads in Decoder order with its signature", async ({ page }) => {
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  const names = await card(page)
    .getByRole("button", { name: /^Add / })
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
  expect(names).toEqual([
    "Add C major, IV, to progression",
    "Add G major, I, to progression",
    "Add D major, V, to progression",
    "Add F♯ diminished, vii°, to progression",
    "Add B minor, iii, to progression",
    "Add E minor, vi, to progression",
    "Add A minor, ii, to progression",
  ]);
  await expect(card(page).getByText("♯ F", { exact: true })).toBeVisible();
});

test("swiping turns one key at a time", async ({ page }) => {
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "D major, 2 sharps");
  await swipe(page, "right");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
});

test("dragging the wheel turns it and commits on release", async ({ page }) => {
  const box = (await wheel(page).boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width * 0.42;
  const at = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)] as const;
  await page.mouse.move(...at(-90));
  await page.mouse.down();
  for (let deg = -80; deg <= -30; deg += 10) await page.mouse.move(...at(deg));
  await page.waitForTimeout(150); // hold still: no flick
  await page.mouse.up();
  // Turning the wheel 60° clockwise brings B♭ (two steps counter-clockwise) to the top.
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "B♭ major, 2 flats");
});

test("arrow keys turn the focused wheel", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard is a desktop path");
  await wheel(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  await page.keyboard.press("ArrowLeft");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "C major, no sharps or flats");
});

test("with the chain linked, the Circle's key reaches Chords", async ({ page }) => {
  await page.getByRole("button", { name: "Link key across tools" }).click();
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  await go(page, "Chords");
  await expect(
    page.getByRole("group", { name: "Root note" }).getByRole("button", { name: "G", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("a preset fills the tray, transposes with the wheel and survives reload", async ({ page }) => {
  const pop = page.getByRole("button", { name: /I–V–vi–IV/ });
  await pop.click();
  await expect(pop).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => labels(page)).toEqual([
    "Remove C major, step 1",
    "Remove G major, step 2",
    "Remove A minor, step 3",
    "Remove F major, step 4",
  ]);

  await swipe(page, "left");
  await expect.poll(() => labels(page)).toEqual([
    "Remove G major, step 1",
    "Remove D major, step 2",
    "Remove E minor, step 3",
    "Remove C major, step 4",
  ]);

  await trayChips(page).first().click();
  await expect(trayChips(page)).toHaveCount(3);
  await expect(pop).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await expect(trayChips(page)).toHaveCount(3);
});

test("tapping a chord adds it; a swipe over a chord does not", async ({ page }) => {
  await card(page).getByRole("button", { name: /Add G major/ }).click();
  await expect(trayChips(page)).toHaveCount(1);

  const chord = (await card(page).getByRole("button", { name: /Add A minor/ }).boundingBox())!;
  await page.mouse.move(chord.x + chord.width / 2, chord.y + chord.height / 2);
  await page.mouse.down();
  await page.mouse.move(chord.x + chord.width / 2 - 120, chord.y + chord.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(trayChips(page)).toHaveCount(1);
});

test("the card lets vertical drags scroll; the wheel keeps them", async ({ page }) => {
  expect(await card(page).evaluate((el) => getComputedStyle(el).touchAction)).toBe("pan-y");
  expect(await wheel(page).evaluate((el) => getComputedStyle(el).touchAction)).toBe("none");
});

test("with reduced motion the key changes without animating", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await swipe(page, "left");
  // The spring takes ~300ms; reduced motion commits straight away.
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp", { timeout: 100 });
});
```

Run: `pnpm exec playwright test tests/e2e/circle.spec.ts`
Expected: FAIL. There is no slider named "Key" on `/circle/` yet.

- [ ] **Step 3: Implement the page**

`components/circle/circle-of-fifths.tsx`:
```tsx
"use client";

import { stepBadges } from "@/lib/circle/progression";
import { useProgression } from "@/lib/circle/use-progression";
import { useWheelRotation } from "@/lib/circle/use-wheel-rotation";
import { useToolKey } from "@/lib/key-state/hooks";
import { CIRCLE, circleKeyFor, describeKey, rootNoteFor } from "@/lib/theory/circle";
import { diatonicChords } from "@/lib/theory/chords";
import { CommonProgressions } from "./common-progressions";
import { DecoderCard } from "./decoder-card";
import { ProgressionTray } from "./progression-tray";

export function CircleOfFifths() {
  const [root, setRoot] = useToolKey("circle");
  const committedIndex = circleKeyFor(root).index;
  const { theta, displayIndex, step, wheelHandlers } = useWheelRotation({
    committedIndex,
    onCommit: (index) => setRoot(rootNoteFor(CIRCLE[index])),
  });
  const [progression, actions] = useProgression();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Circle of Fifths
      </h1>
      <p aria-live="polite" className="sr-only">
        {describeKey(CIRCLE[committedIndex])}
      </p>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
        <DecoderCard
          keyIndex={displayIndex}
          theta={theta}
          wheelHandlers={wheelHandlers}
          badges={stepBadges(progression.degrees)}
          onAddChord={actions.add}
          onSwipe={step}
        />
        <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start xl:flex xl:min-w-0 xl:flex-1 xl:flex-col">
          <ProgressionTray
            keyChords={diatonicChords(CIRCLE[displayIndex])}
            degrees={progression.degrees}
            onRemove={actions.remove}
            onClear={actions.clear}
          />
          <CommonProgressions activeId={progression.presetId} onPick={actions.pick} />
        </div>
      </div>
    </div>
  );
}
```

`app/circle/page.tsx` (replace):
```tsx
import type { Metadata } from "next";
import { CircleOfFifths } from "@/components/circle/circle-of-fifths";

export const metadata: Metadata = { title: "Circle of Fifths" };

export default function CirclePage() {
  return <CircleOfFifths />;
}
```

- [ ] **Step 4: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all PASS in both projects. This includes the existing navigation, offline and layout specs: the Circle `h1` is `sr-only` on phones, which Playwright still counts as visible, and the no-horizontal-scroll check now covers the real Circle page at 320–1440px.

If `page.mouse` drags don't produce pointer events in the `iphone` (WebKit) project, don't weaken the assertions. Add `test.skip(({ browserName }) => browserName === "webkit", "<exact error>")` to only the affected gesture tests, record it as a ledger ruling, and report it, because these gestures then need a check on a real iPhone.

- [ ] **Step 5: Visual check against the canvas**

Take screenshots at 390×844 (iPhone 14, WebKit), 834×1194 and 1280×800 (Chromium), light mode, after picking Pop in G (one swipe left). Compare them by eye with the canvas artboards "Phone · progression active", "Tablet portrait · 834" and "Desktop · 1280": Decoder order, filled first degrees, badges, tray and pills. Fix any layout drift before committing.

- [ ] **Step 6: Document it in CLAUDE.md**

In `CLAUDE.md` under `## Architecture`, add after the Key state bullet:
```markdown
- **Theory (`lib/theory/`):** plain TypeScript, no React — `spelling.ts` (letter-walked spelled notes),
  `circle.ts` (the 12 major keys in fifths order, signatures, mapping to/from the shared pitch-class root),
  `chords.ts` (diatonic chords with Decoder degree triples, `DECODER_LAYOUT`, `COMMON_PROGRESSIONS`).
  Chords and Scales should build on these rather than re-deriving theory.
- **Circle of Fifths (`components/circle/`, `lib/circle/`):** the wheel is one angle θ driven by
  `useWheelRotation` (drag with flick, swipe ±1 step, ←/→; spring snap; commits through `setRoot` only once
  settled; reduced motion jumps). The progression is degrees in `nomad:circle:progression:v1`, so turning
  the wheel transposes it. Both stores use `lib/storage/persisted-store.ts`.
```

- [ ] **Step 7: Commit**

```bash
git add components/circle/circle-of-fifths.tsx app/circle/page.tsx tests/e2e/circle.spec.ts tests/e2e/key-link.spec.ts CLAUDE.md
git commit -m "Circle of Fifths: the Decoder page, e2e, docs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
