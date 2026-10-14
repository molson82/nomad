# Scale Compass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/scales/` placeholder with the Scale Compass. It has six views (Major/Minor × Scale/Pentatonic/Blues) of the major key's scale on a 0–15 neck, numbered by degree, with five positions per view: CAGED letters for full scales and Box 1–5 for pentatonic and blues.

**Architecture:** Plain-TypeScript theory in `lib/theory/scales.ts` places ten fixed templates (five full-scale positions and five pentatonic boxes) on the Circle's spelled major scale. The Chord Compass's SVG neck, diagram, chips, focus card and root arrows move into shared `components/fretboard/`, and the Chord Compass keeps them through thin adapters with its tests unchanged. The Scale Compass composes the same pieces with a persisted `{ tonality, type, position }` view.

**Tech Stack:** Next 15 (static export), React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (jsdom), Playwright (iPhone WebKit + desktop Chromium). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-14-scale-compass-design.md`
**Visual reference:** canvas https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm, page "Scale Compass". Its chip ranges come from an earlier idea, and the spec's templates are authoritative (E-shape in G is 2–5).

## Global Constraints

- The root is always the **major tonic** (`useToolKey("scales")`). Minor = the **relative** minor (degree ⑥), **re-numbered from its own root**.
- Views and numbering: Major · Scale `1 2 3 4 5 6 7`; Major · Pentatonic `1 2 3 5 6`; Major · Blues `1 2 ♭3 3 5 6`; Minor · Scale `1 2 ♭3 4 5 ♭6 ♭7`; Minor · Pentatonic `1 ♭3 4 5 ♭7`; Minor · Blues `1 ♭3 4 ♭5 5 ♭7`. The blue note is the major 3rd lowered (B♭ in G, C in A).
- Names: `G major`, `G major pentatonic`, `G major blues`, `E minor`, `E minor pentatonic`, `E minor blues`. Relationship line: Major views `Relative minor: E (⑥)`, Minor views `Relative of G major (⑥)`.
- Positions: full scales use CAGED letters with titles like `E-shape position`; pentatonic and blues use `Box 1`–`Box 5` with titles like `Box 2 · E-shape`. Box↔letter is fixed: 1 G, 2 E, 3 D, 4 C, 5 A. Positions are sorted by `lowFret` then `highFret`, and the selection is **stored as the letter**.
- Storage: `nomad:scales:view:v1` = `{ tonality: "major"|"minor", type: "scale"|"pentatonic"|"blues", position: "G"|"E"|"D"|"C"|"A" }`, default `{ major, scale, E }`. Each invalid field falls back on its own.
- Accessible names: chips and focus region `E-shape position, frets 2 to 5` / `Box 2, frets 2 to 5`; arrows `Previous position: G-shape` / `Next position: Box 2` (just `Previous position` / `Next position` when disabled); neck `G major across the neck, E-shape position at frets 2 to 5`; diagram list lines `5th string, fret 6, E♭, ♭5`.
- **The Chord Compass's existing unit and e2e tests must pass without edits** after the fretboard extraction.
- No modes, no three-notes-per-string, no audio, no new dependencies. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Keys whose positions land high** (G-shape of F♯ reaches fret 15; boxes that wrap down 12): every position stays within 0–15 and is complete. Pinned by the all-12-keys tests in Task 1.
2. **Switching Scale ↔ Pentatonic** keeps the same part of the neck even though the chip labels change (E-shape position ↔ Box 2). Pinned by the e2e "pentatonic keeps the same region" test in Task 5.
3. **A blue note between a box's frets but on a string with no other box notes nearby** is still added (blues adds by box fret span, not by string). Pinned by the E-minor and A-minor box-1 blues tests in Tasks 1 and 5.
4. **A stored view with one bad field** (say an old `position: "X"`) keeps the other valid choices. Pinned by the per-field fallback test in Task 3.
5. **Dark mode for the relationship line and blue-ringed ⑥** stays readable. Pinned by the theme-token test on `ScaleHeader` in Task 4 (it must use the `text-relative` token, not a fixed hex).

## Plan notes (decided while planning)

- Shared code lives in `components/fretboard/` and `lib/chords/neck-geometry.ts` keeps its path (its test path stays the same). A generic `nearestByCentre` joins it, and `nearestShape` delegates to it.
- The shared diagram takes options instead of chord concepts: `showMuted` (× on unused strings), `openStyle` (`"hollow"` ○ for chords, `"marker"` for scales) and `showNoteNames`. A marker's `data-role` is `R` for a tonic, otherwise its label, which keeps the Chord Compass tests' `data-role` values (`R`/`3`/`5`).
- A `--color-relative` theme token (light `#2f5bc0`, dark `#8fb0ff`) is added for the relationship line, so it stays readable in dark mode.
- `components/key/key-picker.tsx`, `components/key/tool-placeholder.tsx` and `tests/unit/key-picker.test.tsx` are deleted once Scales stops using them. `tests/e2e/key-link.spec.ts` is rewritten around the root steppers; the Circle's linking test already uses the Chords heading and is unchanged.
- The e2e tests use the default root **C** (fresh browser storage). C major positions: C 0–3 · A 2–6 · G 5–9 · E 7–10 · D 9–13. A-minor boxes: Box 5 2–5 · Box 1 5–8 · Box 2 7–10 · Box 3 9–13 · Box 4 12–15.

---

## File Map

```
lib/theory/scales.ts              Tonality, ScaleType, ScaleView, PositionLetter, POSITION_LETTERS, NoteKind, ScaleNote, Position,
                                  scaleDegrees, scaleNotes, scaleName, neckNotes, positions
lib/chords/neck-geometry.ts (mod) + nearestByCentre
lib/chords/shape-store.ts (mod)   nearestShape delegates to nearestByCentre
components/fretboard/marker-style.ts  MarkerKind, MARKER_STYLE
components/fretboard/neck.tsx         Neck
components/fretboard/fret-diagram.tsx FretDiagram
components/fretboard/position-chips.tsx PositionChips
components/fretboard/focus-card.tsx   FocusCard (generic)
components/fretboard/root-stepper.tsx RootStepper
components/chords/{neck-overview,chord-diagram,shape-chips,focus-card,root-picker}.tsx (mod) → thin adapters
lib/scales/view-store.ts          ScaleViewState, VIEW_KEY, DEFAULT_VIEW, parseView, viewStore
lib/scales/use-scale-view.ts      useScaleView()
lib/scales/position-text.ts       positionText, formulaLine
app/theme.css, tailwind.config.ts (mod)  relative colour token
components/scales/scale-header.tsx, view-toggles.tsx, scale-compass.tsx
app/scales/page.tsx (mod)
DELETE components/key/key-picker.tsx, components/key/tool-placeholder.tsx, tests/unit/key-picker.test.tsx
tests/unit/scales.test.ts, fretboard-neck.test.tsx, fret-diagram.test.tsx, scale-view-store.test.ts,
  position-text.test.ts, scale-header.test.tsx, view-toggles.test.tsx
tests/e2e/scale-compass.spec.ts (new), tests/e2e/key-link.spec.ts (rewrite)
CLAUDE.md (mod)
```

---

### Task 1: Scale theory — views, numbering, positions, boxes

**Files:**
- Create: `lib/theory/scales.ts`
- Test: `tests/unit/scales.test.ts`

**Interfaces:**
- Consumes: `circleKeyFor`, `majorScale` (`lib/theory/circle.ts`); `TUNING`, `MAX_FRET` (`lib/theory/fretboard.ts`); `mod`, `pitchClassOf`, `formatNote`, `SpelledNote` (`lib/theory/spelling.ts`); `Note`, `NOTES` (`lib/theory/notes.ts`).
- Produces:
  - `type Tonality = "major" | "minor"`, `type ScaleType = "scale" | "pentatonic" | "blues"`, `type ScaleView = { tonality; type }`
  - `type PositionLetter = "G" | "E" | "D" | "C" | "A"`, `POSITION_LETTERS` (box order: G E D C A)
  - `type NoteKind = "tonic" | "tone" | "relative" | "blue"`
  - `type ScaleNote = { string: number; fret: number; label: string; note: SpelledNote; kind: NoteKind }`
  - `type Position = { letter: PositionLetter; box: 1|2|3|4|5 | null; notes: ScaleNote[]; lowFret: number; highFret: number }`
  - `scaleDegrees(root, view): string[]`, `scaleNotes(root, view): SpelledNote[]`, `scaleName(root, view): string`, `neckNotes(root, view): ScaleNote[]`, `positions(root, view): Position[]`

- [ ] **Step 1: Write the failing test**

`tests/unit/scales.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { NOTES } from "@/lib/theory/notes";
import { neckNotes, positions, scaleDegrees, scaleName, scaleNotes, type Position, type ScaleView } from "@/lib/theory/scales";
import { formatNote, pitchClassOf } from "@/lib/theory/spelling";

const MAJOR: ScaleView = { tonality: "major", type: "scale" };
const MINOR: ScaleView = { tonality: "minor", type: "scale" };
const MAJ_PENT: ScaleView = { tonality: "major", type: "pentatonic" };
const MIN_PENT: ScaleView = { tonality: "minor", type: "pentatonic" };
const MAJ_BLUES: ScaleView = { tonality: "major", type: "blues" };
const MIN_BLUES: ScaleView = { tonality: "minor", type: "blues" };
const ALL_VIEWS = [MAJOR, MINOR, MAJ_PENT, MIN_PENT, MAJ_BLUES, MIN_BLUES];

const frets = (p: Position) => [0, 1, 2, 3, 4, 5].map((s) => p.notes.filter((n) => n.string === s).map((n) => n.fret));
const order = (ps: Position[], useBox = false) =>
  ps.map((p) => `${useBox ? p.box : p.letter} ${p.lowFret}–${p.highFret}`).join(" · ");
const names = (root: (typeof NOTES)[number], view: ScaleView) => scaleNotes(root, view).map(formatNote).join(" ");

describe("views", () => {
  it("numbers each of the six views", () => {
    expect(scaleDegrees("G", MAJOR)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(scaleDegrees("G", MAJ_PENT)).toEqual(["1", "2", "3", "5", "6"]);
    expect(scaleDegrees("G", MAJ_BLUES)).toEqual(["1", "2", "♭3", "3", "5", "6"]);
    expect(scaleDegrees("G", MINOR)).toEqual(["1", "2", "♭3", "4", "5", "♭6", "♭7"]);
    expect(scaleDegrees("G", MIN_PENT)).toEqual(["1", "♭3", "4", "5", "♭7"]);
    expect(scaleDegrees("G", MIN_BLUES)).toEqual(["1", "♭3", "4", "♭5", "5", "♭7"]);
  });

  it("spells the notes from the view's own tonic", () => {
    expect(names("G", MAJOR)).toBe("G A B C D E F♯");
    expect(names("G", MINOR)).toBe("E F♯ G A B C D");
    expect(names("G", MAJ_BLUES)).toBe("G A B♭ B D E");
    expect(names("G", MIN_BLUES)).toBe("E G A B♭ B D");
    expect(names("A", MAJ_BLUES)).toBe("A B C C♯ E F♯");
  });

  it("names all six views", () => {
    expect(ALL_VIEWS.map((v) => scaleName("G", v))).toEqual([
      "G major", "E minor", "G major pentatonic", "E minor pentatonic", "G major blues", "E minor blues",
    ]);
    expect(scaleName("C#", MAJOR)).toBe("D♭ major");
  });
});

describe("neckNotes", () => {
  it("lists every note of the view on frets 0–15", () => {
    expect(neckNotes("G", MAJOR).filter((n) => n.string === 0).map((n) => n.fret)).toEqual([0, 2, 3, 5, 7, 8, 10, 12, 14, 15]);
  });

  it("marks the tonic, the relative-minor root (major views only) and the blue note", () => {
    const major = neckNotes("G", MAJOR);
    expect(major.find((n) => n.string === 0 && n.fret === 3)!.kind).toBe("tonic");
    expect(major.find((n) => n.string === 0 && n.fret === 0)).toMatchObject({ label: "6", kind: "relative" });
    const minor = neckNotes("G", MINOR);
    expect(minor.find((n) => n.string === 0 && n.fret === 0)).toMatchObject({ label: "1", kind: "tonic" });
    expect(minor.some((n) => n.kind === "relative")).toBe(false);
    expect(neckNotes("G", MIN_BLUES).find((n) => n.string === 1 && n.fret === 1)).toMatchObject({ label: "♭5", kind: "blue" });
  });
});

describe("full-scale positions", () => {
  it("places G major's five CAGED positions", () => {
    const ps = positions("G", MAJOR);
    expect(order(ps)).toBe("G 0–4 · E 2–5 · D 4–8 · C 7–10 · A 9–13");
    const at = (letter: string) => frets(ps.find((p) => p.letter === letter)!);
    expect(at("G")).toEqual([[0, 2, 3], [0, 2, 3], [0, 2, 4], [0, 2], [0, 1, 3], [0, 2, 3]]);
    expect(at("E")).toEqual([[2, 3, 5], [2, 3, 5], [2, 4, 5], [2, 4, 5], [3, 5], [2, 3, 5]]);
    expect(at("D")).toEqual([[5, 7, 8], [5, 7], [4, 5, 7], [4, 5, 7], [5, 7, 8], [5, 7, 8]]);
    expect(at("C")).toEqual([[7, 8, 10], [7, 9, 10], [7, 9, 10], [7, 9], [7, 8, 10], [7, 8, 10]]);
    expect(at("A")).toEqual([[10, 12], [9, 10, 12], [9, 10, 12], [9, 11, 12], [10, 12, 13], [10, 12]]);
  });

  it("uses the same positions, renumbered, for the relative minor", () => {
    const e = positions("G", MINOR).find((p) => p.letter === "E")!;
    expect(e.notes.find((n) => n.string === 0 && n.fret === 2)!.label).toBe("2"); // F♯ in E minor
  });

  it("every key's positions hold all 7 notes, 2–3 per string, within 5 frets and 0–15", () => {
    for (const root of NOTES) {
      const ps = positions(root, MAJOR);
      expect(ps.map((p) => p.letter).sort()).toEqual(["A", "C", "D", "E", "G"]);
      for (const p of ps) {
        expect(new Set(p.notes.map((n) => pitchClassOf(n.note))).size).toBe(7);
        for (const s of frets(p)) {
          expect(s.length).toBeGreaterThanOrEqual(2);
          expect(s.length).toBeLessThanOrEqual(3);
        }
        expect(p.highFret - p.lowFret).toBeLessThanOrEqual(4);
        expect(p.lowFret).toBeGreaterThanOrEqual(0);
        expect(p.highFret).toBeLessThanOrEqual(15);
      }
    }
  });
});

describe("pentatonic boxes", () => {
  it("places E minor's five boxes", () => {
    const ps = positions("G", MIN_PENT);
    expect(order(ps, true)).toBe("1 0–3 · 2 2–5 · 3 4–8 · 4 7–10 · 5 9–12");
    expect(ps.map((p) => p.letter).join("")).toBe("GEDCA");
    const box = (n: number) => frets(ps.find((p) => p.box === n)!);
    expect(box(1)).toEqual([[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]]);
    expect(box(3)).toEqual([[5, 7], [5, 7], [5, 7], [4, 7], [5, 8], [5, 7]]);
    expect(box(5)).toEqual([[10, 12], [10, 12], [9, 12], [9, 12], [10, 12], [10, 12]]);
  });

  it("wraps a box down 12 rather than past fret 15", () => {
    expect(order(positions("C", MIN_PENT), true)).toBe("5 2–5 · 1 5–8 · 2 7–10 · 3 9–13 · 4 12–15");
  });

  it("every key's boxes hold all 5 notes, 2 per string, within 0–15", () => {
    for (const root of NOTES) {
      for (const view of [MAJ_PENT, MIN_PENT]) {
        for (const p of positions(root, view)) {
          expect(new Set(p.notes.map((n) => pitchClassOf(n.note))).size).toBe(5);
          for (const s of frets(p)) expect(s).toHaveLength(2);
          expect(p.lowFret).toBeGreaterThanOrEqual(0);
          expect(p.highFret).toBeLessThanOrEqual(15);
        }
      }
    }
  });

  it("blues adds the blue note wherever it falls inside the box", () => {
    const box1 = positions("G", MIN_BLUES).find((p) => p.box === 1)!;
    expect(box1.notes.filter((n) => n.kind === "blue").map((n) => [n.string, n.fret])).toEqual([[1, 1], [3, 3]]);
    const aBox1 = positions("C", MIN_BLUES).find((p) => p.box === 1)!;
    expect(aBox1.notes.filter((n) => n.kind === "blue").map((n) => [n.string, n.fret, formatNote(n.note)])).toEqual([
      [1, 6, "E♭"],
      [3, 8, "E♭"],
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/scales.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/theory/scales"`.

- [ ] **Step 3: Implement**

`lib/theory/scales.ts`:
```ts
import type { Note } from "@/lib/theory/notes";
import { circleKeyFor, majorScale } from "./circle";
import { MAX_FRET, TUNING } from "./fretboard";
import { formatNote, mod, pitchClassOf, type SpelledNote } from "./spelling";

export type Tonality = "major" | "minor";
export type ScaleType = "scale" | "pentatonic" | "blues";
export type ScaleView = { tonality: Tonality; type: ScaleType };
export type PositionLetter = "G" | "E" | "D" | "C" | "A";
// Neck order of the five regions for a major key; box N is POSITION_LETTERS[N - 1].
export const POSITION_LETTERS: readonly PositionLetter[] = ["G", "E", "D", "C", "A"];
export type NoteKind = "tonic" | "tone" | "relative" | "blue";
export type ScaleNote = { string: number; fret: number; label: string; note: SpelledNote; kind: NoteKind };
export type Position = {
  letter: PositionLetter;
  box: 1 | 2 | 3 | 4 | 5 | null;
  notes: ScaleNote[];
  lowFret: number;
  highFret: number;
};

type Tone = { note: SpelledNote; label: string; kind: NoteKind };

const MAJOR_LABELS = ["1", "2", "3", "4", "5", "6", "7"];
// Minor numbering indexed by MAJOR degree: the relative minor's root is major ⑥.
const MINOR_LABELS = ["♭3", "4", "5", "♭6", "♭7", "1", "2"];
const PENTATONIC = [0, 1, 2, 4, 5]; // major degrees 1 2 3 5 6 — the relative minor's 1 ♭3 4 5 ♭7

// The relative minor shares the major's notes, so one major key drives all six views.
function viewTones(root: Note, view: ScaleView): Tone[] {
  const scale = majorScale(circleKeyFor(root));
  const degrees = view.type === "scale" ? [0, 1, 2, 3, 4, 5, 6] : PENTATONIC;
  const ordered = view.tonality === "major" ? degrees : [...degrees.filter((i) => i >= 5), ...degrees.filter((i) => i < 5)];
  const labels = view.tonality === "major" ? MAJOR_LABELS : MINOR_LABELS;
  const tones: Tone[] = ordered.map((i) => ({
    note: scale[i],
    label: labels[i],
    kind: labels[i] === "1" ? "tonic" : view.tonality === "major" && i === 5 ? "relative" : "tone",
  }));
  if (view.type === "blues") {
    // One pitch: the major ♭3, which is the relative minor's ♭5.
    const blue: Tone = {
      note: { letter: scale[2].letter, accidental: scale[2].accidental - 1 },
      label: view.tonality === "major" ? "♭3" : "♭5",
      kind: "blue",
    };
    tones.splice(tones.findIndex((t) => t.label === (view.tonality === "major" ? "2" : "4")) + 1, 0, blue);
  }
  return tones;
}

export function scaleDegrees(root: Note, view: ScaleView): string[] {
  return viewTones(root, view).map((t) => t.label);
}

export function scaleNotes(root: Note, view: ScaleView): SpelledNote[] {
  return viewTones(root, view).map((t) => t.note);
}

export function scaleName(root: Note, view: ScaleView): string {
  const tonic = viewTones(root, view)[0].note;
  return `${formatNote(tonic)} ${view.tonality}${view.type === "scale" ? "" : ` ${view.type}`}`;
}

function noteAt(tones: Tone[], string: number, fret: number): ScaleNote | null {
  const pitch = (TUNING[string] + fret) % 12;
  const tone = tones.find((t) => pitchClassOf(t.note) === pitch);
  return tone ? { string, fret, label: tone.label, note: tone.note, kind: tone.kind } : null;
}

export function neckNotes(root: Note, view: ScaleView): ScaleNote[] {
  const tones = viewTones(root, view);
  const notes: ScaleNote[] = [];
  for (let string = 0; string < 6; string++) {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const note = noteAt(tones, string, fret);
      if (note) notes.push(note);
    }
  }
  return notes;
}

// CAGED major-scale positions: offsets from the root fret on the root string, per string (6th → 1st).
const FULL: Record<PositionLetter, { rootString: number; offsets: number[][] }> = {
  G: { rootString: 0, offsets: [[-3, -1, 0], [-3, -1, 0], [-3, -1, 1], [-3, -1], [-3, -2, 0], [-3, -1, 0]] },
  E: { rootString: 0, offsets: [[-1, 0, 2], [-1, 0, 2], [-1, 1, 2], [-1, 1, 2], [0, 2], [-1, 0, 2]] },
  D: { rootString: 2, offsets: [[0, 2, 3], [0, 2], [-1, 0, 2], [-1, 0, 2], [0, 2, 3], [0, 2, 3]] },
  C: { rootString: 1, offsets: [[-3, -2, 0], [-3, -1, 0], [-3, -1, 0], [-3, -1], [-3, -2, 0], [-3, -2, 0]] },
  A: { rootString: 1, offsets: [[0, 2], [-1, 0, 2], [-1, 0, 2], [-1, 1, 2], [0, 2, 3], [0, 2]] },
};

// Pentatonic boxes 1–5: frets above the relative minor's root on the 6th string.
const BOXES: number[][][] = [
  [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  [[3, 5], [2, 5], [2, 5], [2, 4], [3, 5], [3, 5]],
  [[5, 7], [5, 7], [5, 7], [4, 7], [5, 8], [5, 7]],
  [[7, 10], [7, 10], [7, 9], [7, 9], [8, 10], [7, 10]],
  [[10, 12], [10, 12], [9, 12], [9, 12], [10, 12], [10, 12]],
];

function makePosition(tones: Tone[], letter: PositionLetter, box: Position["box"], cells: [number, number][]): Position {
  const notes = cells.map(([string, fret]) => {
    const note = noteAt(tones, string, fret);
    if (!note) throw new Error(`string ${string} fret ${fret} is not in the scale`);
    return note;
  });
  const frets = notes.map((n) => n.fret);
  return { letter, box, notes, lowFret: Math.min(...frets), highFret: Math.max(...frets) };
}

export function positions(root: Note, view: ScaleView): Position[] {
  const tones = viewTones(root, view);
  const scale = majorScale(circleKeyFor(root));
  let list: Position[];

  if (view.type === "scale") {
    const rootPitch = pitchClassOf(scale[0]);
    list = POSITION_LETTERS.map((letter) => {
      const { rootString, offsets } = FULL[letter];
      let rootFret = mod(rootPitch - TUNING[rootString], 12);
      if (offsets.flat().some((offset) => rootFret + offset < 0)) rootFret += 12; // up an octave, not past the nut
      return makePosition(tones, letter, null, offsets.flatMap((row, string) => row.map((o) => [string, rootFret + o] as [number, number])));
    });
  } else {
    const minorRootFret = mod(pitchClassOf(scale[5]) - TUNING[0], 12);
    const bluePitch = view.type === "blues" ? pitchClassOf(tones.find((t) => t.kind === "blue")!.note) : null;
    list = BOXES.map((rows, i) => {
      let base = minorRootFret;
      if (rows.flat().some((offset) => base + offset > MAX_FRET)) base -= 12; // down an octave, not off the neck
      const cells = rows.flatMap((row, string) => row.map((o) => [string, base + o] as [number, number]));
      const position = makePosition(tones, POSITION_LETTERS[i], (i + 1) as Position["box"], cells);
      if (bluePitch !== null) {
        for (let string = 0; string < 6; string++) {
          for (let fret = position.lowFret; fret <= position.highFret; fret++) {
            if ((TUNING[string] + fret) % 12 === bluePitch) position.notes.push(noteAt(tones, string, fret)!);
          }
        }
        position.notes.sort((a, b) => a.string - b.string || a.fret - b.fret);
      }
      return position;
    });
  }

  return list.sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory/scales.ts tests/unit/scales.test.ts
git commit -m "Theory: scale views, numbering, CAGED positions and pentatonic boxes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Extract the shared fretboard pieces; Chord Compass becomes adapters

**Files:**
- Create: `components/fretboard/marker-style.ts`, `components/fretboard/neck.tsx`, `components/fretboard/fret-diagram.tsx`, `components/fretboard/position-chips.tsx`, `components/fretboard/focus-card.tsx`, `components/fretboard/root-stepper.tsx`
- Modify (replace contents): `components/chords/neck-overview.tsx`, `components/chords/chord-diagram.tsx`, `components/chords/shape-chips.tsx`, `components/chords/focus-card.tsx`, `components/chords/root-picker.tsx`
- Modify: `lib/chords/neck-geometry.ts` (add `nearestByCentre`), `lib/chords/shape-store.ts` (`nearestShape` delegates)
- Test: `tests/unit/fretboard-neck.test.tsx`, `tests/unit/fret-diagram.test.tsx` (new); every existing Chord Compass unit test is **unchanged** and must still pass.

**Interfaces:**
- Consumes: `NECK`, `fretAtX`, `fretCenterX`, `fretLineX`, `stringY` (`lib/chords/neck-geometry.ts`); `MAX_FRET`, `STRING_ORDINALS`, `majorTriad` (`lib/theory/fretboard.ts`); `classifyGesture` (`lib/circle/wheel-math.ts`); `formatNote`.
- Produces:
  - `type MarkerKind = "tonic" | "tone" | "relative" | "blue"`, `MARKER_STYLE`
  - `Neck({ markers: NeckMarker[]; windowLow; windowHigh; ariaLabel; onPickFret })`, `type NeckMarker = { string; fret; label; kind; inWindow }`
  - `FretDiagram({ markers: DiagramMarker[]; lowFret; highFret; ariaLabel; showMuted; openStyle: "hollow" | "marker"; showNoteNames })`, `type DiagramMarker = { string; fret; label; kind; srText; noteName?: string }`
  - `PositionChips({ items: ChipItem[]; selected; onSelect(id); groupLabel })`, `type ChipItem = { id; label; sub; ariaLabel }`
  - `FocusCard({ regionLabel; title; subtitle; previousLabel; nextLabel; canPrevious; canNext; count; index; onStep; children; footer? })`
  - `RootStepper({ name; onStep(direction) })`
  - `nearestByCentre<T extends { lowFret; highFret }>(items: readonly T[], fret): T`

- [ ] **Step 1: Write the failing tests for the new behaviour**

`tests/unit/fretboard-neck.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Neck, type NeckMarker } from "@/components/fretboard/neck";
import { nearestByCentre } from "@/lib/chords/neck-geometry";

const markers: NeckMarker[] = [
  { string: 0, fret: 3, label: "", kind: "tonic", inWindow: true },
  { string: 0, fret: 0, label: "6", kind: "relative", inWindow: false },
  { string: 1, fret: 1, label: "♭5", kind: "blue", inWindow: true },
];

describe("Neck", () => {
  it("styles relative and blue markers distinctly", () => {
    const { container } = render(<Neck markers={markers} windowLow={0} windowHigh={3} ariaLabel="neck" onPickFret={() => {}} />);
    const circle = (kind: string) => container.querySelector(`[data-kind="${kind}"] circle`)!;
    expect(circle("relative").getAttribute("stroke")).toBe("#2F5BC0");
    expect(Number(circle("blue").getAttribute("r"))).toBeLessThan(Number(circle("tonic").getAttribute("r")));
    expect(circle("blue").getAttribute("fill")).toBe("#5B8DEF");
    expect(container.querySelector('[data-kind="relative"]')!.getAttribute("data-in-shape")).toBe("false");
  });
});

describe("nearestByCentre", () => {
  it("returns the item whose window centre is nearest, lower on a tie", () => {
    const items = [
      { id: "a", lowFret: 0, highFret: 4 },
      { id: "b", lowFret: 4, highFret: 8 },
      { id: "c", lowFret: 9, highFret: 12 },
    ];
    expect(nearestByCentre(items, 1).id).toBe("a");
    expect(nearestByCentre(items, 4).id).toBe("a");
    expect(nearestByCentre(items, 11).id).toBe("c");
  });
});
```

`tests/unit/fret-diagram.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FretDiagram, type DiagramMarker } from "@/components/fretboard/fret-diagram";

// E minor pentatonic box 1, low E and A strings only (enough to exercise the options).
const markers: DiagramMarker[] = [
  { string: 0, fret: 0, label: "1", kind: "tonic", srText: "6th string, fret 0, E, 1" },
  { string: 0, fret: 3, label: "♭3", kind: "tone", srText: "6th string, fret 3, G, ♭3" },
  { string: 1, fret: 1, label: "♭5", kind: "blue", srText: "5th string, fret 1, B♭, ♭5" },
];

describe("FretDiagram", () => {
  it("draws open-string notes as markers and no × when muting is off", () => {
    const { container } = render(
      <FretDiagram markers={markers} lowFret={0} highFret={3} ariaLabel="box" showMuted={false} openStyle="marker" showNoteNames={false} />,
    );
    expect(screen.queryByText("×")).toBeNull();
    expect(container.querySelector("[data-nut]")).not.toBeNull();
    const open = container.querySelector('[data-open="true"] circle')!;
    expect(open.getAttribute("fill")).toBe("#161718"); // a tonic marker, not a hollow ○
    expect(container.querySelectorAll("[data-string-note]")).toHaveLength(0);
    expect(screen.getByText("5th string, fret 1, B♭, ♭5")).toBeInTheDocument();
  });

  it("labels markers by role, R for the tonic", () => {
    const { container } = render(
      <FretDiagram markers={markers} lowFret={0} highFret={3} ariaLabel="box" showMuted={false} openStyle="marker" showNoteNames={false} />,
    );
    expect([...container.querySelectorAll("[data-role]")].map((m) => m.getAttribute("data-role"))).toEqual(["R", "♭3", "♭5"]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/fretboard-neck.test.tsx tests/unit/fret-diagram.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/fretboard/..."`.

- [ ] **Step 3: Implement the shared pieces**

Append to `lib/chords/neck-geometry.ts`:
```ts

// For neck taps: the window whose centre is nearest the fret; items in neck order, so a tie keeps the lower.
export function nearestByCentre<T extends { lowFret: number; highFret: number }>(items: readonly T[], fret: number): T {
  let best = items[0];
  for (const item of items) {
    if (Math.abs((item.lowFret + item.highFret) / 2 - fret) < Math.abs((best.lowFret + best.highFret) / 2 - fret)) best = item;
  }
  return best;
}
```

In `lib/chords/shape-store.ts`, replace the body of `nearestShape` (keep its comment and signature) with:
```ts
  return nearestByCentre(shapes, fret).name;
```
and add `import { nearestByCentre } from "./neck-geometry";` to its imports.

`components/fretboard/marker-style.ts`:
```ts
export type MarkerKind = "tonic" | "tone" | "relative" | "blue";

// Marker colours are fixed (they sit on the wood, not the page), so they read in both themes.
export const MARKER_STYLE: Record<MarkerKind, { fill: string; stroke: string; ring: number; scale: number; text: string }> = {
  tonic: { fill: "#161718", stroke: "#161718", ring: 1.5, scale: 1, text: "#FFFFFF" },
  tone: { fill: "#FFFFFF", stroke: "#161718", ring: 1.5, scale: 1, text: "#161718" },
  relative: { fill: "#FFFFFF", stroke: "#2F5BC0", ring: 3, scale: 1, text: "#161718" }, // the relative-minor root, as on the device
  blue: { fill: "#5B8DEF", stroke: "#161718", ring: 1.2, scale: 0.72, text: "#FFFFFF" },
};
```

`components/fretboard/neck.tsx`:
```tsx
"use client";

import type { MouseEvent } from "react";
import { NECK, fretAtX, fretCenterX, fretLineX, stringY } from "@/lib/chords/neck-geometry";
import { MAX_FRET } from "@/lib/theory/fretboard";
import { MARKER_STYLE, type MarkerKind } from "./marker-style";

const INLAYS = [3, 5, 7, 9, 15];
const FRET_NUMBERS = [3, 5, 7, 9, 12, 15];

export type NeckMarker = { string: number; fret: number; label: string; kind: MarkerKind; inWindow: boolean };

interface NeckProps {
  markers: NeckMarker[];
  windowLow: number;
  windowHigh: number;
  ariaLabel: string;
  onPickFret: (fret: number) => void;
}

export function Neck({ markers, windowLow, windowHigh, ariaLabel, onPickFret }: NeckProps) {
  const windowLeft = windowLow === 0 ? 2 : fretLineX(windowLow - 1) - 4;
  const windowRight = fretLineX(windowHigh) + 4;
  const neckBottom = stringY(0) + 10;

  // Taps are a shortcut; every position is also reachable by its chip.
  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPickFret(fretAtX(((event.clientX - rect.left) / rect.width) * NECK.width));
  };

  return (
    <svg viewBox={`0 0 ${NECK.width} ${NECK.height}`} role="img" aria-label={ariaLabel} className="w-full cursor-pointer select-none" onClick={pick}>
      {/* The wood starts left of the nut so open-string notes sit on it too. */}
      <rect data-fretboard x={4} y={8} width={fretLineX(MAX_FRET) - 4} height={neckBottom - 8} rx={4} className="fill-fretboard" />
      {INLAYS.map((fret) => (
        <circle key={fret} cx={fretCenterX(fret)} cy={(stringY(2) + stringY(3)) / 2} r={5} fill="#C9AE7D" />
      ))}
      <circle cx={fretCenterX(12)} cy={(stringY(3) + stringY(4)) / 2} r={5} fill="#C9AE7D" />
      <circle cx={fretCenterX(12)} cy={(stringY(1) + stringY(2)) / 2} r={5} fill="#C9AE7D" />
      {Array.from({ length: MAX_FRET + 1 }, (_, fret) => (
        <line
          key={fret}
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={8}
          y2={neckBottom}
          className={fret === 0 ? "stroke-text-primary" : "stroke-fret-wire"}
          strokeWidth={fret === 0 ? 4 : 1.5}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line key={string} data-string-line x1={4} x2={fretLineX(MAX_FRET)} y1={stringY(string)} y2={stringY(string)} className="stroke-string" strokeWidth={1 + (5 - string) * 0.3} />
      ))}
      <rect
        data-window-low={windowLow}
        data-window-high={windowHigh}
        x={windowLeft}
        y={2}
        width={windowRight - windowLeft}
        height={neckBottom + 4}
        rx={8}
        className="fill-accent stroke-accent"
        fillOpacity={0.12}
        strokeWidth={2.5}
      />
      {markers.map((m) => {
        const style = MARKER_STYLE[m.kind];
        return (
          <g key={`${m.string}:${m.fret}`} data-tone data-kind={m.kind} data-in-shape={m.inWindow} opacity={m.inWindow ? 1 : 0.3}>
            <circle cx={fretCenterX(m.fret)} cy={stringY(m.string)} r={9 * style.scale} fill={style.fill} stroke={style.stroke} strokeWidth={style.ring} />
            {m.label && m.kind !== "blue" && (
              <text x={fretCenterX(m.fret)} y={stringY(m.string) + 4} textAnchor="middle" fontSize={m.label.length > 1 ? 8 : 10} fontWeight={700} fill={style.text} className="hidden md:inline">
                {m.label}
              </text>
            )}
          </g>
        );
      })}
      {FRET_NUMBERS.map((fret) => (
        <text key={fret} x={fretCenterX(fret)} y={NECK.height - 4} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-text-secondary">
          {fret}
        </text>
      ))}
    </svg>
  );
}
```

`components/fretboard/fret-diagram.tsx`:
```tsx
import { MARKER_STYLE, type MarkerKind } from "./marker-style";

const LEFT = 70;
const STRING_GAP = 40;
const FRET_H = 56;

export type DiagramMarker = { string: number; fret: number; label: string; kind: MarkerKind; srText: string; noteName?: string };

interface FretDiagramProps {
  markers: DiagramMarker[];
  lowFret: number;
  highFret: number;
  ariaLabel: string;
  showMuted: boolean; // × over strings with no marker (chords)
  openStyle: "hollow" | "marker"; // ○ for chords, the note's marker for scales
  showNoteNames: boolean; // one note per string under the diagram (chords)
}

export function FretDiagram({ markers, lowFret, highFret, ariaLabel, showMuted, openStyle, showNoteNames }: FretDiagramProps) {
  const open = lowFret === 0;
  const used = new Set(markers.map((m) => m.string));
  const muted = showMuted ? [0, 1, 2, 3, 4, 5].filter((s) => !used.has(s)) : [];
  // Room above the nut only when there's something to draw there.
  const TOP = open || muted.length > 0 ? 44 : 14;
  const start = open ? 1 : lowFret; // first fret row drawn
  const rows = Math.max(4, highFret - start + 1);
  const height = TOP + rows * FRET_H + (showNoteNames ? 40 : 16);
  const x = (string: number) => LEFT + string * STRING_GAP;
  const y = (fret: number) => (fret === 0 ? TOP - 20 : TOP + (fret - start + 0.5) * FRET_H);

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg viewBox={`0 0 300 ${height}`} role="img" aria-label={ariaLabel} className="w-full max-w-[300px]">
        {!open && (
          <text x={14} y={TOP + FRET_H / 2 + 5} fontSize={14} fontWeight={700} className="fill-text-secondary">
            {start}fr
          </text>
        )}
        <rect x={LEFT - 20} y={TOP} width={5 * STRING_GAP + 40} height={rows * FRET_H} className="fill-fretboard" />
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={i} x1={LEFT - 20} x2={x(5) + 20} y1={TOP + i * FRET_H} y2={TOP + i * FRET_H} className="stroke-fret-wire" strokeWidth={2} />
        ))}
        {open && <line data-nut x1={LEFT - 20} x2={x(5) + 20} y1={TOP} y2={TOP} className="stroke-text-primary" strokeWidth={6} />}
        {[0, 1, 2, 3, 4, 5].map((string) => {
          const noteName = markers.find((m) => m.string === string)?.noteName;
          return (
            <g key={string}>
              <line data-string-line x1={x(string)} x2={x(string)} y1={TOP} y2={TOP + rows * FRET_H} className="stroke-string" strokeWidth={1 + (5 - string) * 0.4} />
              {showNoteNames && noteName && (
                <text data-string-note x={x(string)} y={height - 12} textAnchor="middle" fontSize={16} className="fill-text-primary font-display font-semibold">
                  {noteName}
                </text>
              )}
              {muted.includes(string) && (
                <text x={x(string)} y={TOP - 14} textAnchor="middle" fontSize={20} className="fill-text-secondary font-bold">
                  ×
                </text>
              )}
            </g>
          );
        })}
        {markers.map((m) => {
          const key = `${m.string}:${m.fret}`;
          const role = m.kind === "tonic" ? "R" : m.label;
          if (m.fret === 0 && openStyle === "hollow") {
            // The standard open-string ○; its role is in the sr-only list.
            return (
              <g key={key} data-role={role} data-open>
                <circle cx={x(m.string)} cy={y(0)} r={10} fill="none" className="stroke-text-primary" strokeWidth={2.5} />
              </g>
            );
          }
          const style = MARKER_STYLE[m.kind];
          return (
            <g key={key} data-role={role} data-open={m.fret === 0}>
              <circle cx={x(m.string)} cy={y(m.fret)} r={18 * style.scale} fill={style.fill} stroke={style.stroke} strokeWidth={style.ring + 0.5} />
              {m.label && m.kind !== "tonic" && (
                <text x={x(m.string)} y={y(m.fret) + (m.label.length > 1 ? 5 : 6)} textAnchor="middle" fontSize={m.label.length > 1 ? 13 : 17} fontWeight={700} fill={style.text}>
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {markers.map((m) => (
          <li key={`${m.string}:${m.fret}`}>{m.srText}</li>
        ))}
      </ul>
    </figure>
  );
}
```

`components/fretboard/position-chips.tsx`:
```tsx
export type ChipItem = { id: string; label: string; sub: string; ariaLabel: string };

interface PositionChipsProps {
  items: ChipItem[];
  selected: string;
  onSelect: (id: string) => void;
  groupLabel: string;
}

export function PositionChips({ items, selected, onSelect, groupLabel }: PositionChipsProps) {
  return (
    <div role="group" aria-label={groupLabel} className="grid grid-cols-5 gap-1 xl:gap-2">
      {items.map((item) => {
        const active = item.id === selected;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            aria-label={item.ariaLabel}
            onClick={() => onSelect(item.id)}
            className={`flex min-h-11 flex-col items-center justify-center rounded-[10px] border-[1.5px] xl:min-h-[60px] xl:rounded-xl ${
              active ? "border-ink bg-accent text-ink" : "border-text-primary text-text-primary"
            }`}
          >
            <span className={`font-display font-semibold leading-none ${item.label.length > 1 ? "text-sm xl:text-lg" : "text-base xl:text-[22px]"}`}>
              {item.label}
            </span>
            <span className="text-[10px] font-semibold xl:text-xs">{item.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
```

`components/fretboard/focus-card.tsx`:
```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { classifyGesture } from "@/lib/circle/wheel-math";

const ARROW = "grid h-11 w-11 shrink-0 place-items-center text-[28px] text-accent-ink disabled:opacity-25";

interface FocusCardProps {
  regionLabel: string;
  title: string;
  subtitle: string;
  previousLabel: string;
  nextLabel: string;
  canPrevious: boolean;
  canNext: boolean;
  count: number;
  index: number;
  onStep: (direction: 1 | -1) => void;
  children: ReactNode; // the diagram
  footer?: ReactNode;
}

export function FocusCard(props: FocusCardProps) {
  const { regionLabel, title, subtitle, previousLabel, nextLabel, canPrevious, canNext, count, index, onStep, children, footer } = props;
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <section
      aria-label={regionLabel}
      className="flex min-w-0 flex-1 touch-pan-y select-none flex-col items-center gap-2 rounded-[22px] border border-border bg-surface px-3 py-3.5 xl:flex-row xl:gap-4 xl:px-5"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const gesture = classifyGesture(event.clientX - from.x, event.clientY - from.y);
        if (gesture === "swipe-left" && canNext) onStep(1);
        else if (gesture === "swipe-right" && canPrevious) onStep(-1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div className="flex w-full items-center justify-between xl:contents">
        <button type="button" disabled={!canPrevious} aria-label={previousLabel} onClick={() => onStep(-1)} className={`${ARROW} xl:order-first`}>
          ‹
        </button>
        <div className="flex flex-col items-center text-center xl:order-2 xl:flex-1 xl:items-start xl:text-left">
          <h3 className="font-display text-[26px] font-semibold leading-tight xl:text-[30px]">{title}</h3>
          <p className="text-[13px] text-text-secondary xl:text-sm">{subtitle}</p>
        </div>
        <button type="button" disabled={!canNext} aria-label={nextLabel} onClick={() => onStep(1)} className={`${ARROW} xl:order-last`}>
          ›
        </button>
      </div>
      <div className="w-full max-w-[300px] xl:order-1 xl:w-[250px]">
        {children}
        {footer && <p className="mt-1 text-center text-[13px] font-semibold text-text-secondary">{footer}</p>}
      </div>
      <div aria-hidden className="flex gap-1.5 xl:hidden">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`h-2 rounded-full ${i === index ? "w-[22px] bg-accent" : "w-2 bg-border"}`} />
        ))}
      </div>
    </section>
  );
}
```

`components/fretboard/root-stepper.tsx`:
```tsx
const ARROW = "grid h-11 w-11 place-items-center text-2xl font-bold text-accent-ink";

export function RootStepper({ name, onStep }: { name: string; onStep: (direction: 1 | -1) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Previous root" onClick={() => onStep(-1)} className={ARROW}>
        ←
      </button>
      <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-ink font-display text-[30px] font-semibold text-white">
        {name}
      </span>
      <button type="button" aria-label="Next root" onClick={() => onStep(1)} className={ARROW}>
        →
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Turn the Chord Compass components into adapters**

`components/chords/neck-overview.tsx` (replace):
```tsx
import { Neck } from "@/components/fretboard/neck";
import type { CagedShape } from "@/lib/theory/caged";
import type { ChordTone } from "@/lib/theory/fretboard";

interface NeckOverviewProps {
  tones: ChordTone[];
  shape: CagedShape;
  chordName: string;
  onPickFret: (fret: number) => void;
}

export function NeckOverview({ tones, shape, chordName, onPickFret }: NeckOverviewProps) {
  const inShape = new Set(shape.tones.map((t) => `${t.string}:${t.fret}`));
  return (
    <Neck
      markers={tones.map((t) => ({
        string: t.string,
        fret: t.fret,
        label: t.role === "R" ? "" : t.role,
        kind: t.role === "R" ? "tonic" : "tone",
        inWindow: inShape.has(`${t.string}:${t.fret}`),
      }))}
      windowLow={shape.lowFret}
      windowHigh={shape.highFret}
      ariaLabel={`${chordName} across the neck, ${shape.name}-shape at frets ${shape.lowFret} to ${shape.highFret}`}
      onPickFret={onPickFret}
    />
  );
}
```

`components/chords/chord-diagram.tsx` (replace):
```tsx
import { FretDiagram } from "@/components/fretboard/fret-diagram";
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS, type Role } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";

const ROLE_NAME: Record<Role, string> = { R: "root", "3": "3rd", "5": "5th" };

export function ChordDiagram({ shape, chordName }: { shape: CagedShape; chordName: string }) {
  return (
    <FretDiagram
      markers={shape.tones.map((t) => ({
        string: t.string,
        fret: t.fret,
        label: t.role === "R" ? "" : t.role,
        kind: t.role === "R" ? "tonic" : "tone",
        noteName: formatNote(t.note),
        srText: `${STRING_ORDINALS[t.string]} string, fret ${t.fret}, ${formatNote(t.note)}, ${ROLE_NAME[t.role]}`,
      }))}
      lowFret={shape.lowFret}
      highFret={shape.highFret}
      ariaLabel={`${chordName}, ${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      showMuted
      openStyle="hollow"
      showNoteNames
    />
  );
}
```

`components/chords/shape-chips.tsx` (replace):
```tsx
import { PositionChips } from "@/components/fretboard/position-chips";
import type { CagedShape, ShapeName } from "@/lib/theory/caged";

interface ShapeChipsProps {
  shapes: CagedShape[];
  selected: ShapeName;
  onSelect: (name: ShapeName) => void;
}

export function ShapeChips({ shapes, selected, onSelect }: ShapeChipsProps) {
  return (
    <PositionChips
      groupLabel="CAGED shapes up the neck"
      items={shapes.map((s) => ({
        id: s.name,
        label: s.name,
        sub: `${s.lowFret}–${s.highFret}`,
        ariaLabel: `${s.name}-shape, frets ${s.lowFret} to ${s.highFret}`,
      }))}
      selected={selected}
      onSelect={(id) => onSelect(id as ShapeName)}
    />
  );
}
```

`components/chords/focus-card.tsx` (replace):
```tsx
import { FocusCard as SharedFocusCard } from "@/components/fretboard/focus-card";
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { ChordDiagram } from "./chord-diagram";

interface FocusCardProps {
  shape: CagedShape;
  shapes: CagedShape[]; // neck order
  chordName: string;
  onStep: (direction: 1 | -1) => void;
}

export function FocusCard({ shape, shapes, chordName, onStep }: FocusCardProps) {
  const index = shapes.findIndex((s) => s.name === shape.name);
  const previous = shapes[index - 1];
  const next = shapes[index + 1];
  return (
    <SharedFocusCard
      regionLabel={`${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      title={`${shape.name}-shape`}
      subtitle={`frets ${shape.lowFret}–${shape.highFret} · root on the ${STRING_ORDINALS[shape.rootString]} string`}
      previousLabel={previous ? `Previous shape: ${previous.name}-shape` : "Previous shape"}
      nextLabel={next ? `Next shape: ${next.name}-shape` : "Next shape"}
      canPrevious={!!previous}
      canNext={!!next}
      count={shapes.length}
      index={index}
      onStep={onStep}
    >
      <ChordDiagram shape={shape} chordName={chordName} />
    </SharedFocusCard>
  );
}
```

`components/chords/root-picker.tsx` (replace):
```tsx
import { RootStepper } from "@/components/fretboard/root-stepper";
import { majorTriad } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

export function RootPicker({ root, onStep }: { root: Note; onStep: (direction: 1 | -1) => void }) {
  const triad = majorTriad(root);
  const name = formatNote(triad[0]);
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={name} onStep={onStep} />
      <div className="flex flex-col items-end gap-0.5">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{name} major</h2>
        <p className="text-[13px] font-semibold">{triad.map(formatNote).join(" · ")}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run everything that covers the Chord Compass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:e2e`
Expected: all PASS. The new fretboard tests pass, every existing Chord Compass unit test passes **unchanged**, and the e2e suite (including `chord-compass.spec.ts`) passes in both projects.

- [ ] **Step 6: Commit**

```bash
git add components/fretboard components/chords lib/chords tests/unit/fretboard-neck.test.tsx tests/unit/fret-diagram.test.tsx
git commit -m "Shared fretboard pieces; Chord Compass now uses them

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Scale view store and position wording

**Files:**
- Create: `lib/scales/view-store.ts`, `lib/scales/use-scale-view.ts`, `lib/scales/position-text.ts`
- Test: `tests/unit/scale-view-store.test.ts`, `tests/unit/position-text.test.ts`

**Interfaces:**
- Consumes: `createPersistedStore`; `POSITION_LETTERS`, `PositionLetter`, `Position`, `ScaleView`, `Tonality`, `ScaleType`, `scaleDegrees` (Task 1); `Note`.
- Produces:
  - `type ScaleViewState = { tonality: Tonality; type: ScaleType; position: PositionLetter }`, `VIEW_KEY`, `DEFAULT_VIEW`, `parseView(raw)`, `viewStore`
  - `useScaleView(): [ScaleViewState, (patch: Partial<ScaleViewState>) => void]`
  - `positionText(position, view): { name; shortName; title; subtitle; chipLabel; ariaLabel }`, `formulaLine(root, view): string`

- [ ] **Step 1: Write the failing tests**

`tests/unit/scale-view-store.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, parseView } from "@/lib/scales/view-store";

describe("parseView", () => {
  it("defaults to Major · Scale · E-shape", () => {
    expect(parseView(null)).toEqual({ tonality: "major", type: "scale", position: "E" });
    expect(DEFAULT_VIEW).toEqual({ tonality: "major", type: "scale", position: "E" });
  });

  it("reads a stored view", () => {
    expect(parseView(JSON.stringify({ tonality: "minor", type: "blues", position: "G" }))).toEqual({
      tonality: "minor",
      type: "blues",
      position: "G",
    });
  });

  it("falls back field by field", () => {
    expect(parseView(JSON.stringify({ tonality: "minor", type: "pentatonic", position: "X" }))).toEqual({
      tonality: "minor",
      type: "pentatonic",
      position: "E",
    });
    expect(parseView(JSON.stringify({ tonality: "dorian", type: "blues" }))).toEqual({ tonality: "major", type: "blues", position: "E" });
  });

  it.each([["bad json", "{oops"], ["an array", "[]"], ["a number", "3"]])("falls back entirely for %s", (_label, raw) => {
    expect(parseView(raw)).toEqual(DEFAULT_VIEW);
  });
});
```

`tests/unit/position-text.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formulaLine, positionText } from "@/lib/scales/position-text";
import { positions, type ScaleView } from "@/lib/theory/scales";

const MAJOR: ScaleView = { tonality: "major", type: "scale" };
const MIN_BLUES: ScaleView = { tonality: "minor", type: "blues" };

describe("positionText", () => {
  it("names full-scale positions by CAGED letter", () => {
    const e = positions("G", MAJOR).find((p) => p.letter === "E")!;
    expect(positionText(e, MAJOR)).toEqual({
      name: "E-shape position",
      shortName: "E-shape",
      title: "E-shape position",
      subtitle: "frets 2–5",
      chipLabel: "E",
      ariaLabel: "E-shape position, frets 2 to 5",
    });
  });

  it("names pentatonic and blues positions by box, with the letter in the title", () => {
    const box1 = positions("G", MIN_BLUES).find((p) => p.box === 1)!;
    expect(positionText(box1, MIN_BLUES)).toEqual({
      name: "Box 1",
      shortName: "Box 1",
      title: "Box 1 · G-shape",
      subtitle: "frets 0–3 · open position",
      chipLabel: "Box 1",
      ariaLabel: "Box 1, frets 0 to 3",
    });
  });
});

describe("formulaLine", () => {
  it("shows steps for full scales and degrees for pentatonic and blues", () => {
    expect(formulaLine("G", MAJOR)).toBe("W · W · H · W · W · W · H");
    expect(formulaLine("G", { tonality: "minor", type: "scale" })).toBe("W · H · W · W · H · W · W");
    expect(formulaLine("G", MIN_BLUES)).toBe("1 · ♭3 · 4 · ♭5 · 5 · ♭7");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/scale-view-store.test.ts tests/unit/position-text.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/scales/..."`.

- [ ] **Step 3: Implement**

`lib/scales/view-store.ts`:
```ts
import { createPersistedStore } from "@/lib/storage/persisted-store";
import { POSITION_LETTERS, type PositionLetter, type ScaleType, type Tonality } from "@/lib/theory/scales";

// The position is the CAGED letter in every view, so scale ↔ pentatonic and root changes keep the neck region.
export type ScaleViewState = { tonality: Tonality; type: ScaleType; position: PositionLetter };

export const VIEW_KEY = "nomad:scales:view:v1";
export const DEFAULT_VIEW: ScaleViewState = { tonality: "major", type: "scale", position: "E" };

const TONALITIES: readonly unknown[] = ["major", "minor"];
const TYPES: readonly unknown[] = ["scale", "pentatonic", "blues"];

export function parseView(raw: string | null): ScaleViewState {
  let value: Record<string, unknown> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) value = parsed;
  } catch {
    // Corrupt JSON: every field falls back.
  }
  return {
    tonality: TONALITIES.includes(value.tonality) ? (value.tonality as Tonality) : DEFAULT_VIEW.tonality,
    type: TYPES.includes(value.type) ? (value.type as ScaleType) : DEFAULT_VIEW.type,
    position: (POSITION_LETTERS as readonly unknown[]).includes(value.position) ? (value.position as PositionLetter) : DEFAULT_VIEW.position,
  };
}

export const viewStore = createPersistedStore(VIEW_KEY, parseView, DEFAULT_VIEW);
```

`lib/scales/use-scale-view.ts`:
```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import { viewStore, type ScaleViewState } from "./view-store";

export function useScaleView(): [ScaleViewState, (patch: Partial<ScaleViewState>) => void] {
  const view = useSyncExternalStore(viewStore.subscribe, viewStore.get, viewStore.getServer);
  const update = useCallback((patch: Partial<ScaleViewState>) => viewStore.set({ ...viewStore.get(), ...patch }), []);
  return [view, update];
}
```

`lib/scales/position-text.ts`:
```ts
import type { Note } from "@/lib/theory/notes";
import { scaleDegrees, type Position, type ScaleView } from "@/lib/theory/scales";

const STEPS = { major: "W · W · H · W · W · W · H", minor: "W · H · W · W · H · W · W" } as const;

// Letters for full scales; boxes (with their letter in the title) for pentatonic and blues.
export function positionText(position: Position, view: ScaleView) {
  const boxes = view.type !== "scale";
  const shortName = boxes ? `Box ${position.box}` : `${position.letter}-shape`;
  const name = boxes ? shortName : `${shortName} position`;
  const { lowFret: low, highFret: high } = position;
  return {
    name,
    shortName,
    title: boxes ? `${shortName} · ${position.letter}-shape` : name,
    subtitle: `frets ${low}–${high}${low === 0 ? " · open position" : ""}`,
    chipLabel: boxes ? shortName : position.letter,
    ariaLabel: `${name}, frets ${low} to ${high}`,
  };
}

export function formulaLine(root: Note, view: ScaleView): string {
  return view.type === "scale" ? STEPS[view.tonality] : scaleDegrees(root, view).join(" · ");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/scales tests/unit/scale-view-store.test.ts tests/unit/position-text.test.ts
git commit -m "Scales: persisted view and position wording

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Scale header and view toggles

**Files:**
- Modify: `app/theme.css`, `tailwind.config.ts` (relative colour token)
- Create: `components/scales/scale-header.tsx`, `components/scales/view-toggles.tsx`
- Test: `tests/unit/scale-header.test.tsx`, `tests/unit/view-toggles.test.tsx`

**Interfaces:**
- Consumes: `RootStepper` (Task 2); `scaleName`, `scaleNotes`, `ScaleView` (Task 1); `circleKeyFor`, `majorScale`, `formatNote`; `Note`.
- Produces: `ScaleHeader({ root; view; onStep })` (renders `h2` with the scale name), `ViewToggles({ view; onChange(patch: Partial<ScaleView>) })`, a Tailwind colour `relative`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/scale-header.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ScaleHeader } from "@/components/scales/scale-header";

describe("ScaleHeader", () => {
  it("names a major view and points to its relative minor", () => {
    render(<ScaleHeader root="G" view={{ tonality: "major", type: "scale" }} onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "G major" })).toBeInTheDocument();
    expect(screen.getByText("G A B C D E F♯")).toBeInTheDocument();
    expect(screen.getByText("Relative minor: E (⑥)")).toHaveClass("text-relative");
  });

  it("names a minor view and points back to its major", () => {
    render(<ScaleHeader root="G" view={{ tonality: "minor", type: "blues" }} onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "E minor blues" })).toBeInTheDocument();
    expect(screen.getByText("E G A B♭ B D")).toBeInTheDocument();
    expect(screen.getByText("Relative of G major (⑥)")).toBeInTheDocument();
  });

  it("steps the root", () => {
    const onStep = vi.fn();
    render(<ScaleHeader root="G" view={{ tonality: "major", type: "scale" }} onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Next root" }));
    expect(onStep).toHaveBeenCalledWith(1);
  });
});
```

`tests/unit/view-toggles.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ViewToggles } from "@/components/scales/view-toggles";

describe("ViewToggles", () => {
  it("shows the current tonality and type as pressed", () => {
    render(<ViewToggles view={{ tonality: "minor", type: "blues" }} onChange={() => {}} />);
    const tonality = within(screen.getByRole("group", { name: "Major or minor" }));
    expect(tonality.getByRole("button", { name: "Minor" })).toHaveAttribute("aria-pressed", "true");
    expect(tonality.getByRole("button", { name: "Major" })).toHaveAttribute("aria-pressed", "false");
    const type = within(screen.getByRole("group", { name: "Scale type" }));
    expect(type.getAllByRole("button").map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
  });

  it("reports changes as patches", () => {
    const onChange = vi.fn();
    render(<ViewToggles view={{ tonality: "major", type: "scale" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Minor" }));
    expect(onChange).toHaveBeenLastCalledWith({ tonality: "minor" });
    fireEvent.click(screen.getByRole("button", { name: "Pentatonic" }));
    expect(onChange).toHaveBeenLastCalledWith({ type: "pentatonic" });
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/scale-header.test.tsx tests/unit/view-toggles.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/scales/..."`.

- [ ] **Step 3: Implement**

In `app/theme.css`, add `--color-relative: #2f5bc0;` after `--color-fret-wire: #b89b6a;` in the `:root` block, and add `--color-relative: #8fb0ff;` after `--color-fret-wire: #a08862;` in the dark-mode `:root` block.

In `tailwind.config.ts`, add after the `"fret-wire"` colour:
```ts
        relative: "var(--color-relative)",
```

`components/scales/scale-header.tsx`:
```tsx
import { RootStepper } from "@/components/fretboard/root-stepper";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { scaleName, scaleNotes, type ScaleView } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";

interface ScaleHeaderProps {
  root: Note;
  view: ScaleView;
  onStep: (direction: 1 | -1) => void;
}

export function ScaleHeader({ root, view, onStep }: ScaleHeaderProps) {
  const major = majorScale(circleKeyFor(root));
  const relation =
    view.tonality === "major"
      ? `Relative minor: ${formatNote(major[5])} (⑥)`
      : `Relative of ${formatNote(major[0])} major (⑥)`;
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={formatNote(major[0])} onStep={onStep} />
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{scaleName(root, view)}</h2>
        <p className="text-[13px] font-semibold">{scaleNotes(root, view).map(formatNote).join(" ")}</p>
        <p className="text-xs font-semibold text-relative">{relation}</p>
      </div>
    </div>
  );
}
```

`components/scales/view-toggles.tsx`:
```tsx
import type { ScaleType, ScaleView, Tonality } from "@/lib/theory/scales";

const SEGMENT = "min-h-10 px-3.5 font-display text-[15px] font-semibold";
const TONALITIES: [Tonality, string][] = [["major", "Major"], ["minor", "Minor"]];
const TYPES: [ScaleType, string][] = [["scale", "Scale"], ["pentatonic", "Pentatonic"], ["blues", "Blues"]];

interface ViewTogglesProps {
  view: ScaleView;
  onChange: (patch: Partial<ScaleView>) => void;
}

export function ViewToggles({ view, onChange }: ViewTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div role="group" aria-label="Major or minor" className="flex overflow-hidden rounded-full border-[1.5px] border-text-primary">
        {TONALITIES.map(([value, label]) => {
          const active = view.tonality === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ tonality: value })}
              className={`${SEGMENT} ${active ? "bg-text-primary text-bg" : "text-text-primary"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div role="group" aria-label="Scale type" className="flex flex-1 overflow-hidden rounded-full border-[1.5px] border-text-primary">
        {TYPES.map(([value, label], i) => {
          const active = view.type === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ type: value })}
              className={`${SEGMENT} flex-1 ${i > 0 ? "border-l-[1.5px] border-text-primary" : ""} ${
                active ? "bg-accent text-ink" : "text-text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add app/theme.css tailwind.config.ts components/scales/scale-header.tsx components/scales/view-toggles.tsx tests/unit/scale-header.test.tsx tests/unit/view-toggles.test.tsx
git commit -m "Scales: header with relative-key line and view toggles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The page, clean-up, e2e, docs

**Files:**
- Create: `components/scales/scale-compass.tsx`, `tests/e2e/scale-compass.spec.ts`
- Modify: `app/scales/page.tsx`, `tests/e2e/key-link.spec.ts`, `CLAUDE.md`
- Delete: `components/key/key-picker.tsx`, `components/key/tool-placeholder.tsx`, `tests/unit/key-picker.test.tsx`

**Interfaces:**
- Consumes: `useToolKey`; `stepNote`; `positions`, `neckNotes`, `scaleName`, `PositionLetter` (Task 1); `Neck`, `FretDiagram`, `PositionChips`, `FocusCard`, `nearestByCentre` (Task 2); `useScaleView`, `positionText`, `formulaLine` (Task 3); `ScaleHeader`, `ViewToggles` (Task 4); `STRING_ORDINALS`, `formatNote`.
- Produces: the finished `/scales/` page.

- [ ] **Step 1: Rewrite the linking e2e around the root steppers**

Replace the whole of `tests/e2e/key-link.spec.ts` with:
```ts
import { expect, test, type Page } from "@playwright/test";

const toggle = (page: Page) => page.getByRole("button", { name: "Link key across tools" });
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });
const step = async (page: Page, label: "Next root" | "Previous root", times = 1) => {
  for (let i = 0; i < times; i++) await page.getByRole("button", { name: label }).click();
};
// Waits for the navigation to land: several assertions below hold on both the
// old and new page, so without this they can pass before the route changes.
const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page");
};

test("tools keep their own key until linked", async ({ page }) => {
  await page.goto("/scales/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await step(page, "Next root");
  await expect(heading(page, "D♭ major")).toBeVisible();
  await go(page, "Chords");
  await expect(heading(page, "C major")).toBeVisible();
});

test("linking shares the key across tools", async ({ page }) => {
  await page.goto("/scales/");
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(3);
  await step(page, "Next root", 7); // C → G
  await expect(heading(page, "G major")).toBeVisible();

  await go(page, "Chords");
  await expect(heading(page, "G major")).toBeVisible();
  await step(page, "Next root");
  await expect(heading(page, "A♭ major")).toBeVisible();
  await go(page, "Scales");
  await expect(heading(page, "A♭ major")).toBeVisible();
});

test("unlinking keeps the shared key, then tools diverge", async ({ page }) => {
  await page.goto("/scales/");
  await toggle(page).click();
  await step(page, "Next root", 9); // C → A
  await toggle(page).click();
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(0);

  await go(page, "Chords");
  await expect(heading(page, "A major")).toBeVisible();
  await step(page, "Next root");
  await expect(heading(page, "B♭ major")).toBeVisible();
  await go(page, "Scales");
  await expect(heading(page, "A major")).toBeVisible();
});

test("keys and link state survive a reload", async ({ page }) => {
  await page.goto("/scales/");
  await step(page, "Previous root", 2); // C → B♭
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(heading(page, "B♭ major")).toBeVisible();
});
```

- [ ] **Step 2: Write the failing Scale Compass e2e**

`tests/e2e/scale-compass.spec.ts`:
```ts
import { expect, test, type Page } from "@playwright/test";

// Fresh storage: root C. C major positions C 0–3 · A 2–6 · G 5–9 · E 7–10 · D 9–13;
// A-minor boxes 5 2–5 · 1 5–8 · 2 7–10 · 3 9–13 · 4 12–15.
const focus = (page: Page, name: string) => page.getByRole("region", { name });
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });
const press = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.goto("/scales/");
  await expect(heading(page, "C major")).toBeVisible();
});

test("opens on C major at the E-shape position", async ({ page }) => {
  await expect(focus(page, "E-shape position, frets 7 to 10")).toBeVisible();
  await expect(page.getByText("C D E F G A B", { exact: true })).toBeVisible();
  await expect(page.getByText("Relative minor: A (⑥)", { exact: true })).toBeVisible();
});

test("minor re-centres on the relative minor", async ({ page }) => {
  await press(page, "Minor");
  await expect(heading(page, "A minor")).toBeVisible();
  await expect(page.getByText("Relative of C major (⑥)", { exact: true })).toBeVisible();
  await expect(focus(page, "E-shape position, frets 7 to 10")).toBeVisible();
});

test("pentatonic keeps the same region and switches to boxes", async ({ page }) => {
  await press(page, "Minor");
  await press(page, "Pentatonic");
  await expect(heading(page, "A minor pentatonic")).toBeVisible();
  await expect(focus(page, "Box 2, frets 7 to 10")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Box 2 · E-shape" })).toBeVisible();
});

test("blues adds the blue note inside the box", async ({ page }) => {
  await press(page, "Minor");
  await press(page, "Blues");
  await page.getByRole("button", { name: "Box 1, frets 5 to 8" }).click();
  await expect(focus(page, "Box 1, frets 5 to 8")).toBeVisible();
  await expect(page.getByText("5th string, fret 6, E♭, ♭5", { exact: true })).toBeAttached();
  await expect(page.getByText("3rd string, fret 8, E♭, ♭5", { exact: true })).toBeAttached();
});

test("arrows, swipe and a neck tap move between positions", async ({ page }) => {
  await page.getByRole("button", { name: "Previous position: G-shape" }).click();
  await expect(focus(page, "G-shape position, frets 5 to 9")).toBeVisible();

  const card = focus(page, "G-shape position, frets 5 to 9");
  const box = (await card.boundingBox())!;
  const y = box.y + box.height * 0.6;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8 - 140, y, { steps: 6 });
  await page.mouse.up();
  await expect(focus(page, "E-shape position, frets 7 to 10")).toBeVisible();

  const neck = page.getByRole("img", { name: /across the neck/ });
  const neckBox = (await neck.boundingBox())!;
  await neck.click({ position: { x: ((30 + 0.5 * 43) / 680) * neckBox.width, y: neckBox.height / 2 } }); // fret 1
  await expect(focus(page, "C-shape position, frets 0 to 3")).toBeVisible();
});

test("changing the root keeps the position letter", async ({ page }) => {
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();
  await expect(focus(page, "E-shape position, frets 8 to 11")).toBeVisible();
});

test("the view survives a reload", async ({ page }) => {
  await press(page, "Minor");
  await press(page, "Pentatonic");
  await page.reload();
  await expect(focus(page, "Box 2, frets 7 to 10")).toBeVisible();
  await expect(page.getByRole("button", { name: "Minor", exact: true })).toHaveAttribute("aria-pressed", "true");
});
```

Run: `pnpm exec playwright test tests/e2e/scale-compass.spec.ts tests/e2e/key-link.spec.ts`
Expected: FAIL, because `/scales/` still has the placeholder and no `C major` heading.

- [ ] **Step 3: Implement the page**

`components/scales/scale-compass.tsx`:
```tsx
"use client";

import { FocusCard } from "@/components/fretboard/focus-card";
import { FretDiagram } from "@/components/fretboard/fret-diagram";
import { Neck } from "@/components/fretboard/neck";
import { PositionChips } from "@/components/fretboard/position-chips";
import { nearestByCentre } from "@/lib/chords/neck-geometry";
import { useToolKey } from "@/lib/key-state/hooks";
import { formulaLine, positionText } from "@/lib/scales/position-text";
import { useScaleView } from "@/lib/scales/use-scale-view";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { neckNotes, positions, scaleName, type PositionLetter } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";
import { ScaleHeader } from "./scale-header";
import { ViewToggles } from "./view-toggles";

export function ScaleCompass() {
  const [root, setRoot] = useToolKey("scales");
  const [state, update] = useScaleView();
  const view = { tonality: state.tonality, type: state.type };
  const all = positions(root, view);
  const index = Math.max(0, all.findIndex((p) => p.letter === state.position));
  const position = all[index];
  const text = positionText(position, view);
  const name = scaleName(root, view);
  const range = `frets ${position.lowFret} to ${position.highFret}`;
  const inWindow = new Set(position.notes.map((n) => `${n.string}:${n.fret}`));
  const previous = all[index - 1];
  const next = all[index + 1];

  const chips = (
    <PositionChips
      groupLabel="Positions up the neck"
      items={all.map((p) => {
        const t = positionText(p, view);
        return { id: p.letter, label: t.chipLabel, sub: `${p.lowFret}–${p.highFret}`, ariaLabel: t.ariaLabel };
      })}
      selected={position.letter}
      onSelect={(id) => update({ position: id as PositionLetter })}
    />
  );

  const stepPosition = (direction: 1 | -1) => {
    const target = all[index + direction];
    if (target) update({ position: target.letter });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Scale Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <ScaleHeader root={root} view={view} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <ViewToggles view={view} onChange={update} />
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <Neck
            markers={neckNotes(root, view).map((n) => ({
              string: n.string,
              fret: n.fret,
              label: n.kind === "tonic" ? "" : n.label,
              kind: n.kind,
              inWindow: inWindow.has(`${n.string}:${n.fret}`),
            }))}
            windowLow={position.lowFret}
            windowHigh={position.highFret}
            ariaLabel={`${name} across the neck, ${text.name} at ${range}`}
            onPickFret={(fret) => update({ position: nearestByCentre(all, fret).letter })}
          />
          <div className="xl:hidden">{chips}</div>
        </section>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="hidden xl:flex xl:w-[400px] xl:shrink-0 xl:flex-col xl:gap-3.5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em]">Positions</h2>
            {chips}
            <p className="text-sm leading-relaxed text-text-secondary">
              Five positions up the neck, in the same regions as the Chord Compass&apos;s CAGED shapes. Click the
              neck to jump to the position under the pointer.
            </p>
          </div>
          <FocusCard
            regionLabel={text.ariaLabel}
            title={text.title}
            subtitle={text.subtitle}
            previousLabel={previous ? `Previous position: ${positionText(previous, view).shortName}` : "Previous position"}
            nextLabel={next ? `Next position: ${positionText(next, view).shortName}` : "Next position"}
            canPrevious={!!previous}
            canNext={!!next}
            count={all.length}
            index={index}
            onStep={stepPosition}
            footer={formulaLine(root, view)}
          >
            <FretDiagram
              markers={position.notes.map((n) => ({
                string: n.string,
                fret: n.fret,
                label: n.kind === "tonic" ? "" : n.label,
                kind: n.kind,
                srText: `${STRING_ORDINALS[n.string]} string, fret ${n.fret}, ${formatNote(n.note)}, ${n.label}`,
              }))}
              lowFret={position.lowFret}
              highFret={position.highFret}
              ariaLabel={`${name}, ${text.name}, ${range}`}
              showMuted={false}
              openStyle="marker"
              showNoteNames={false}
            />
          </FocusCard>
        </div>
      </div>
    </div>
  );
}
```

`app/scales/page.tsx` (replace):
```tsx
import type { Metadata } from "next";
import { ScaleCompass } from "@/components/scales/scale-compass";

export const metadata: Metadata = { title: "Scale Compass" };

export default function ScalesPage() {
  return <ScaleCompass />;
}
```

Delete the now-unused placeholder pieces:
```bash
git rm components/key/key-picker.tsx components/key/tool-placeholder.tsx tests/unit/key-picker.test.tsx
```

- [ ] **Step 4: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all PASS in both projects. That includes the rewritten linking tests, the Circle's linking test (Chords heading), the Chord Compass spec, and the navigation and offline specs (they find the `sr-only` "Scale Compass" `h1`). The layout spec covers the real page at 320–1440px.

If a gesture test fails only in `iphone` (WebKit), skip just that test for WebKit with the exact error as the reason, record a ruling, and report it.

- [ ] **Step 5: Visual check against the canvas**

Take screenshots at 390×844 (iPhone 14, WebKit), 834×1194 and 1280×800 (Chromium), in light **and** dark mode, for G major · Scale and for Minor · Blues · Box 1 (root G: link from the Circle or step the root). Compare them with the canvas "Scale Compass" artboards and the Chord Compass desktop artboard. Check the toggles, the ⑥ blue ring in Major views, the smaller blue ♭5 dot, open-string markers on the nut in Box 1, the formula line, that the relationship line is readable in dark mode, and that the chip labels are letters for Scale and Box N for pentatonic and blues. Fix any drift before committing.

- [ ] **Step 6: Document it in CLAUDE.md**

In `CLAUDE.md` under `## Architecture`, add after the Chord Compass bullet:
```markdown
- **Scale Compass (`components/scales/`, `lib/scales/`, `lib/theory/scales.ts`):** the root is always the
  major tonic; Minor is the relative minor (⑥), re-numbered from its own root. Six views (Major/Minor ×
  Scale/Pentatonic/Blues) come from one major scale. Positions are ten fixed templates — five CAGED
  full-scale positions (letters) and five pentatonic boxes (Box 1–5; Box N ↔ letter G E D C A) — and the
  selection is stored as the letter (`nomad:scales:view:v1`) so scale ↔ pentatonic stays in the same region.
- **Shared fretboard (`components/fretboard/`):** the SVG neck, diagram, position chips, focus card and root
  stepper used by both compasses; the Chord Compass's components are thin adapters over them.
```

- [ ] **Step 7: Commit**

```bash
git add components/scales/scale-compass.tsx app/scales/page.tsx tests/e2e/scale-compass.spec.ts tests/e2e/key-link.spec.ts CLAUDE.md
git commit -m "Scale Compass: the page, linking e2e, docs; remove the placeholder picker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
