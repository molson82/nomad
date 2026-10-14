# Chord Compass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/chords/` placeholder with the Chord Compass: a root picker, a 0–15 neck overview showing every root/3rd/5th of the major chord, the five CAGED shapes in neck order, and a focus card with a large chord diagram of the selected shape.

**Architecture:** Plain-TypeScript theory (`lib/theory/fretboard.ts`, `lib/theory/caged.ts`) builds on the Circle's spelling. CAGED shapes come from five templates slid to the root. The selected shape is a persisted name (`nomad:chords:shape:v1`) on the shared `createPersistedStore`. One SVG geometry module drives the overview at every size (it scales by `viewBox`). Components live in `components/chords/`.

**Tech Stack:** Next 15 (static export), React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (jsdom), Playwright (iPhone WebKit + desktop Chromium). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-14-chord-compass-design.md`
**Visual reference:** canvas https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm, page "Chord Compass". The chosen phone layout is "C · Neck overview + shape focus"; also see "Desktop · 1280".

## Global Constraints

- Major chords only. **No triads, inversions or mode toggle.** No audio, no new dependencies.
- Standard tuning `[4, 9, 2, 7, 11, 4]`: string 0 is low E, string 5 is high E. The neck shows frets **0–15**.
- Spelling comes from the Circle: the root goes through `circleKeyFor`, and the 3rd and 5th are scale degrees 3 and 5. So C# is shown as **D♭ major (D♭ · F · A♭)**.
- CAGED templates `[string, offset]`: C {1:0, 2:−1, 3:−3, 4:−2, 5:−3}, A {1:0, 2:2, 3:2, 4:2, 5:0}, G {0:0, 1:−1, 2:−3, 3:−3, 4:−3, 5:0}, E {0:0, 1:2, 2:2, 3:1, 4:0, 5:0}, D {2:0, 3:2, 4:3, 5:2}. Root fret = `mod(rootPitch − TUNING[rootString], 12)`, moved up 12 if any note would go below 0. Shapes are sorted by `lowFret` then `highFret`.
- Selected shape storage: `nomad:chords:shape:v1`, holding one of `"C" | "A" | "G" | "E" | "D"`, default `"E"`.
- ‹ › and swipes move to the neighbouring shape in neck order and **don't wrap**. Swipe left = next (up the neck), matching the Circle.
- Overview tap: pick the shape whose centre `(lowFret + highFret) / 2` is nearest the tapped fret; on a tie, the lower one wins.
- Root arrows step one semitone through `NOTES`, wrapping B ↔ C.
- Accessible names: `Previous root` / `Next root`; `Previous shape: <X>-shape` / `Next shape: <X>-shape` (just `Previous shape` / `Next shape` when disabled at an end); chips `<X>-shape, frets <low> to <high>`; focus card region `<X>-shape, frets <low> to <high>`; chord heading `<Root> major` (h2).
- Breakpoints as in the skeleton: phone < 768 (`md`), desktop ≥ 1280 (`xl`). Accent = the existing `data-tool="chords"` orange-red; the neck uses the `fretboard` token.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Roots whose shapes run high** (F♯, B, C♯/D♭): every shape stays complete and inside 0–15, so the diagram never draws a note off its window. Pinned by the "every root's shapes lie within 0–15 and are complete" test in Task 2.
2. **Changing the root while a shape is selected** keeps that shape, even when it moves from the top of the neck to the bottom (e.g. the G-shape of F♯ at 11–14, then G at 0–3). Pinned by the e2e "the selected shape follows the root" step in Task 6.
3. **Open-position shapes** (any shape with fret 0) draw a nut, ○ for open strings and no "fr" label; shapes up the neck draw "Nfr" and no nut. Pinned by the ChordDiagram open-G-shape test in Task 4.
4. **Overview taps on the nut or past fret 15** clamp to a real fret and still select a shape. Pinned by the `fretAtX` clamp tests in Task 3.
5. **A corrupt stored shape** (`"X"`, a number, bad JSON) shows the E-shape instead of crashing. Pinned by the `parseShape` cases in Task 3.

## Plan notes (decided while planning)

- `stepNote(note, direction)` goes in `lib/theory/notes.ts`, so the B ↔ C wrap is unit-tested, not buried in a component.
- `toneAt(triad, string, fret)` (in `fretboard.ts`) throws if a template points at a non-chord tone. A template bug fails loudly in the unit tests instead of drawing a wrong dot.
- The overview is one SVG with a fixed `viewBox` (680 × 158) that scales to its container. It's about 338px wide on phones and fills the content width on desktop, matching the canvas. Its ③/⑤ marker labels show from `md` up.
- On desktop the shape chips sit beside the focus card. Below `xl` they sit under the overview. Both copies are rendered, and the hidden one is `display: none`, which also removes it from the accessibility tree.
- Two existing e2e specs use the Chords placeholder's note picker, which goes away: `tests/e2e/key-link.spec.ts` and the Circle's linking test in `tests/e2e/circle.spec.ts`. Task 6 moves them to Scales' picker and the Chord Compass's `<Root> major` heading.

---

## File Map

```
lib/theory/notes.ts (modify)     + stepNote
lib/theory/fretboard.ts          TUNING, STRING_NAMES, STRING_ORDINALS, MAX_FRET, Role, ChordTone, majorTriad, toneAt, chordTones
lib/theory/caged.ts              ShapeName, SHAPE_NAMES, CagedShape, cagedShapes
lib/chords/shape-store.ts        SHAPE_KEY, DEFAULT_SHAPE, parseShape, nearestShape, shapeStore
lib/chords/use-selected-shape.ts useSelectedShape()
lib/chords/neck-geometry.ts      NECK, fretCenterX, fretLineX, stringY, fretAtX
components/chords/root-picker.tsx
components/chords/shape-chips.tsx
components/chords/neck-overview.tsx
components/chords/chord-diagram.tsx
components/chords/focus-card.tsx
components/chords/chord-compass.tsx
app/chords/page.tsx (modify)
tests/unit/notes-step.test.ts, fretboard.test.ts, caged.test.ts, shape-store.test.ts, neck-geometry.test.ts,
  root-picker.test.tsx, shape-chips.test.tsx, neck-overview.test.tsx, chord-diagram.test.tsx, focus-card.test.tsx
tests/e2e/chord-compass.spec.ts (new); tests/e2e/key-link.spec.ts, tests/e2e/circle.spec.ts (modify)
CLAUDE.md (modify)
```

---

### Task 1: Neck theory — stepping roots, chord tones on the fretboard

**Files:**
- Modify: `lib/theory/notes.ts`
- Create: `lib/theory/fretboard.ts`
- Test: `tests/unit/notes-step.test.ts`, `tests/unit/fretboard.test.ts`

**Interfaces:**
- Consumes: `NOTES`, `Note` (skeleton); `circleKeyFor`, `majorScale` (Circle `lib/theory/circle.ts`); `mod`, `pitchClassOf`, `formatNote`, `SpelledNote` (`lib/theory/spelling.ts`).
- Produces:
  - `stepNote(note: Note, direction: 1 | -1): Note`
  - `TUNING: readonly number[]`, `STRING_NAMES`, `STRING_ORDINALS` (`["6th","5th","4th","3rd","2nd","1st"]`, indexed by string number), `MAX_FRET = 15`
  - `type Role = "R" | "3" | "5"`, `type ChordTone = { string: number; fret: number; role: Role; note: SpelledNote }`
  - `majorTriad(root: Note): [SpelledNote, SpelledNote, SpelledNote]`
  - `toneAt(triad, string, fret): ChordTone` (throws for a non-chord tone)
  - `chordTones(root: Note): ChordTone[]`

- [ ] **Step 1: Write the failing tests**

`tests/unit/notes-step.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { stepNote } from "@/lib/theory/notes";

describe("stepNote", () => {
  it("moves one semitone", () => {
    expect(stepNote("G", 1)).toBe("Ab");
    expect(stepNote("G", -1)).toBe("F#");
  });

  it("wraps between B and C", () => {
    expect(stepNote("B", 1)).toBe("C");
    expect(stepNote("C", -1)).toBe("B");
  });
});
```

`tests/unit/fretboard.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { chordTones, majorTriad, toneAt } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";

const triad = (root: Parameters<typeof majorTriad>[0]) => majorTriad(root).map(formatNote).join(" ");
const onString = (root: Parameters<typeof chordTones>[0], string: number) =>
  chordTones(root)
    .filter((t) => t.string === string)
    .map((t) => `${t.fret}${t.role}`)
    .join(" ");

describe("majorTriad", () => {
  it("spells the chord like the Circle does", () => {
    expect(triad("G")).toBe("G B D");
    expect(triad("F")).toBe("F A C");
    expect(triad("C#")).toBe("D♭ F A♭");
    expect(triad("F#")).toBe("F♯ A♯ C♯");
  });
});

describe("chordTones", () => {
  it("finds every G chord tone on frets 0–15", () => {
    expect(onString("G", 0)).toBe("3R 73 105 15R");
    expect(onString("G", 1)).toBe("23 55 10R 143");
    expect(onString("G", 3)).toBe("0R 43 75 12R");
    expect(onString("G", 5)).toBe("3R 73 105 15R");
  });

  it("carries spelled note names", () => {
    const tone = chordTones("C#").find((t) => t.string === 0 && t.role === "3")!;
    expect(formatNote(tone.note)).toBe("F");
  });
});

describe("toneAt", () => {
  it("names the chord tone at a position", () => {
    expect(toneAt(majorTriad("G"), 4, 3)).toMatchObject({ string: 4, fret: 3, role: "5" });
  });

  it("refuses a position that is not in the chord", () => {
    expect(() => toneAt(majorTriad("G"), 0, 1)).toThrow(/not a chord tone/);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/notes-step.test.ts tests/unit/fretboard.test.ts`
Expected: FAIL. `stepNote` isn't exported, and `Failed to resolve import "@/lib/theory/fretboard"`.

- [ ] **Step 3: Implement**

Append to `lib/theory/notes.ts`:
```ts

// One semitone up or down through NOTES, wrapping B ↔ C.
export function stepNote(note: Note, direction: 1 | -1): Note {
  return NOTES[(NOTES.indexOf(note) + direction + 12) % 12];
}
```

`lib/theory/fretboard.ts`:
```ts
import type { Note } from "@/lib/theory/notes";
import { circleKeyFor, majorScale } from "./circle";
import { pitchClassOf, type SpelledNote } from "./spelling";

// String 0 is low E, string 5 is high E.
export const TUNING: readonly number[] = [4, 9, 2, 7, 11, 4];
export const STRING_NAMES: readonly string[] = ["E", "A", "D", "G", "B", "E"];
export const STRING_ORDINALS: readonly string[] = ["6th", "5th", "4th", "3rd", "2nd", "1st"];
// The device stops at 13; 15 keeps every CAGED shape complete for every root.
export const MAX_FRET = 15;

export type Role = "R" | "3" | "5";
export type ChordTone = { string: number; fret: number; role: Role; note: SpelledNote };

const ROLES: Role[] = ["R", "3", "5"];

// Spelled as the Circle spells the key (C# → D♭ F A♭).
export function majorTriad(root: Note): [SpelledNote, SpelledNote, SpelledNote] {
  const scale = majorScale(circleKeyFor(root));
  return [scale[0], scale[2], scale[4]];
}

export function toneAt(triad: readonly SpelledNote[], string: number, fret: number): ChordTone {
  const pitch = (TUNING[string] + fret) % 12;
  const i = triad.findIndex((note) => pitchClassOf(note) === pitch);
  if (i < 0) throw new Error(`string ${string} fret ${fret} is not a chord tone`);
  return { string, fret, role: ROLES[i], note: triad[i] };
}

export function chordTones(root: Note): ChordTone[] {
  const triad = majorTriad(root);
  const pitches = triad.map(pitchClassOf);
  const tones: ChordTone[] = [];
  TUNING.forEach((open, string) => {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      if (pitches.includes((open + fret) % 12)) tones.push(toneAt(triad, string, fret));
    }
  });
  return tones;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory/notes.ts lib/theory/fretboard.ts tests/unit/notes-step.test.ts tests/unit/fretboard.test.ts
git commit -m "Theory: chord tones on the fretboard, semitone root steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: CAGED shapes

**Files:**
- Create: `lib/theory/caged.ts`
- Test: `tests/unit/caged.test.ts`

**Interfaces:**
- Consumes: `TUNING`, `majorTriad`, `toneAt`, `ChordTone` (Task 1); `mod`, `pitchClassOf` (spelling); `NOTES`, `Note`.
- Produces: `type ShapeName = "C" | "A" | "G" | "E" | "D"`, `SHAPE_NAMES`, `type CagedShape = { name: ShapeName; rootString: number; tones: ChordTone[]; lowFret: number; highFret: number }`, `cagedShapes(root: Note): CagedShape[]` (sorted up the neck).

- [ ] **Step 1: Write the failing test**

`tests/unit/caged.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cagedShapes, type CagedShape } from "@/lib/theory/caged";
import { chordTones } from "@/lib/theory/fretboard";
import { NOTES } from "@/lib/theory/notes";

// Frets low E → high E, null for strings the shape doesn't use.
function frets(shape: CagedShape): (number | null)[] {
  return [0, 1, 2, 3, 4, 5].map((s) => shape.tones.find((t) => t.string === s)?.fret ?? null);
}
const order = (root: (typeof NOTES)[number]) =>
  cagedShapes(root).map((s) => `${s.name} ${s.lowFret}–${s.highFret}`).join(" · ");
const byName = (root: (typeof NOTES)[number], name: string) => cagedShapes(root).find((s) => s.name === name)!;

describe("cagedShapes", () => {
  it("places G's five shapes up the neck", () => {
    expect(order("G")).toBe("G 0–3 · E 3–5 · D 5–8 · C 7–10 · A 10–12");
    expect(frets(byName("G", "G"))).toEqual([3, 2, 0, 0, 0, 3]);
    expect(frets(byName("G", "E"))).toEqual([3, 5, 5, 4, 3, 3]);
    expect(frets(byName("G", "D"))).toEqual([null, null, 5, 7, 8, 7]);
    expect(frets(byName("G", "C"))).toEqual([null, 10, 9, 7, 8, 7]);
    expect(frets(byName("G", "A"))).toEqual([null, 10, 12, 12, 12, 10]);
  });

  it("puts C's C-shape at the open chord x32010", () => {
    expect(frets(byName("C", "C"))).toEqual([null, 3, 2, 0, 1, 0]);
    expect(order("C")).toBe("C 0–3 · A 3–5 · G 5–8 · E 8–10 · D 10–13");
  });

  it("moves a shape up 12 rather than off the nut", () => {
    expect(order("E")).toBe("E 0–2 · D 2–5 · C 4–7 · A 7–9 · G 9–12");
    expect(frets(byName("E", "G"))).toEqual([12, 11, 9, 9, 9, 12]);
  });

  it("names the root string and role of each note", () => {
    const e = byName("G", "E");
    expect(e.rootString).toBe(0);
    expect(e.tones.map((t) => t.role).join("")).toBe("R5R35R");
  });

  it("every root's shapes lie within 0–15 and are complete", () => {
    const sizes: Record<string, number> = { C: 5, A: 5, G: 6, E: 6, D: 4 };
    for (const root of NOTES) {
      const shapes = cagedShapes(root);
      expect(new Set(shapes.map((s) => s.name)).size).toBe(5);
      const tones = new Set(chordTones(root).map((t) => `${t.string}:${t.fret}:${t.role}`));
      for (const shape of shapes) {
        expect(shape.tones).toHaveLength(sizes[shape.name]);
        expect(shape.lowFret).toBeGreaterThanOrEqual(0);
        expect(shape.highFret).toBeLessThanOrEqual(15);
        for (const t of shape.tones) expect(tones.has(`${t.string}:${t.fret}:${t.role}`)).toBe(true);
      }
      for (let i = 1; i < shapes.length; i++) {
        expect(shapes[i].lowFret).toBeGreaterThanOrEqual(shapes[i - 1].lowFret);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/caged.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/theory/caged"`.

- [ ] **Step 3: Implement**

`lib/theory/caged.ts`:
```ts
import type { Note } from "@/lib/theory/notes";
import { TUNING, majorTriad, toneAt, type ChordTone } from "./fretboard";
import { mod, pitchClassOf } from "./spelling";

export type ShapeName = "C" | "A" | "G" | "E" | "D";
export const SHAPE_NAMES: readonly ShapeName[] = ["C", "A", "G", "E", "D"];

export type CagedShape = {
  name: ShapeName;
  rootString: number;
  tones: ChordTone[]; // low string → high string
  lowFret: number;
  highFret: number;
};

// The five open-chord shapes as [string, fret offset from the root fret].
const TEMPLATES: Record<ShapeName, { rootString: number; offsets: [number, number][] }> = {
  C: { rootString: 1, offsets: [[1, 0], [2, -1], [3, -3], [4, -2], [5, -3]] },
  A: { rootString: 1, offsets: [[1, 0], [2, 2], [3, 2], [4, 2], [5, 0]] },
  G: { rootString: 0, offsets: [[0, 0], [1, -1], [2, -3], [3, -3], [4, -3], [5, 0]] },
  E: { rootString: 0, offsets: [[0, 0], [1, 2], [2, 2], [3, 1], [4, 0], [5, 0]] },
  D: { rootString: 2, offsets: [[2, 0], [3, 2], [4, 3], [5, 2]] },
};

export function cagedShapes(root: Note): CagedShape[] {
  const triad = majorTriad(root);
  const rootPitch = pitchClassOf(triad[0]);
  return SHAPE_NAMES.map((name) => {
    const { rootString, offsets } = TEMPLATES[name];
    let rootFret = mod(rootPitch - TUNING[rootString], 12);
    // Slide up an octave rather than past the nut.
    if (offsets.some(([, offset]) => rootFret + offset < 0)) rootFret += 12;
    const tones = offsets.map(([string, offset]) => toneAt(triad, string, rootFret + offset));
    const frets = tones.map((t) => t.fret);
    return { name, rootString, tones, lowFret: Math.min(...frets), highFret: Math.max(...frets) };
  }).sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory/caged.ts tests/unit/caged.test.ts
git commit -m "Theory: the five CAGED shapes for any root

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Selected-shape store and neck geometry

**Files:**
- Create: `lib/chords/shape-store.ts`, `lib/chords/use-selected-shape.ts`, `lib/chords/neck-geometry.ts`
- Test: `tests/unit/shape-store.test.ts`, `tests/unit/neck-geometry.test.ts`

**Interfaces:**
- Consumes: `createPersistedStore` (`lib/storage/persisted-store.ts`); `SHAPE_NAMES`, `ShapeName`, `CagedShape` (Task 2); `MAX_FRET` (Task 1).
- Produces:
  - `SHAPE_KEY = "nomad:chords:shape:v1"`, `DEFAULT_SHAPE = "E"`, `parseShape(raw: string | null): ShapeName`, `nearestShape(shapes: CagedShape[], fret: number): ShapeName`, `shapeStore`
  - `useSelectedShape(): [ShapeName, (name: ShapeName) => void]`
  - `NECK = { width: 680, height: 158, nutX: 30, fretW: 43, top: 18, stringGap: 22 }`, `fretCenterX(fret)`, `fretLineX(fret)`, `stringY(string)`, `fretAtX(viewX): number` (0–15)

- [ ] **Step 1: Write the failing tests**

`tests/unit/shape-store.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SHAPE, nearestShape, parseShape } from "@/lib/chords/shape-store";
import { cagedShapes, type CagedShape } from "@/lib/theory/caged";

describe("parseShape", () => {
  it("reads a stored shape name", () => {
    expect(parseShape(JSON.stringify("A"))).toBe("A");
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["unknown name", JSON.stringify("X")],
    ["a number", "3"],
    ["lower case", JSON.stringify("e")],
  ])("falls back to the E-shape for %s", (_label, raw) => {
    expect(parseShape(raw)).toBe(DEFAULT_SHAPE);
    expect(DEFAULT_SHAPE).toBe("E");
  });
});

describe("nearestShape", () => {
  const g = cagedShapes("G"); // G 0–3 · E 3–5 · D 5–8 · C 7–10 · A 10–12

  it("picks the shape centred nearest the tapped fret", () => {
    expect(nearestShape(g, 0)).toBe("G");
    expect(nearestShape(g, 4)).toBe("E");
    expect(nearestShape(g, 10)).toBe("A"); // A centre 11 beats C centre 8.5
    expect(nearestShape(g, 15)).toBe("A");
  });

  it("breaks a tie toward the lower shape", () => {
    const shapes = [
      { name: "G", lowFret: 0, highFret: 4 },
      { name: "E", lowFret: 4, highFret: 8 },
    ] as CagedShape[];
    expect(nearestShape(shapes, 4)).toBe("G");
  });
});
```

`tests/unit/neck-geometry.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { NECK, fretAtX, fretCenterX, fretLineX, stringY } from "@/lib/chords/neck-geometry";

describe("neck geometry", () => {
  it("lays frets left to right and puts high E on top", () => {
    expect(fretLineX(0)).toBe(NECK.nutX);
    expect(fretLineX(15)).toBeLessThanOrEqual(NECK.width);
    expect(fretCenterX(1)).toBeCloseTo(NECK.nutX + NECK.fretW / 2);
    expect(stringY(5)).toBeLessThan(stringY(0));
  });

  it("maps a tap back to the fret under it", () => {
    expect(fretAtX(fretCenterX(3))).toBe(3);
    expect(fretAtX(fretCenterX(12))).toBe(12);
    expect(fretAtX(fretLineX(4) - 1)).toBe(4);
    expect(fretAtX(fretLineX(4) + 1)).toBe(5);
  });

  it("clamps taps on the nut and past the last fret", () => {
    expect(fretAtX(5)).toBe(0);
    expect(fretAtX(-40)).toBe(0);
    expect(fretAtX(NECK.width + 100)).toBe(15);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/shape-store.test.ts tests/unit/neck-geometry.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/chords/..."`.

- [ ] **Step 3: Implement**

`lib/chords/shape-store.ts`:
```ts
import { createPersistedStore } from "@/lib/storage/persisted-store";
import { SHAPE_NAMES, type CagedShape, type ShapeName } from "@/lib/theory/caged";

// The selection is a shape name, so changing the root keeps the same shape.
export const SHAPE_KEY = "nomad:chords:shape:v1";
export const DEFAULT_SHAPE: ShapeName = "E";

export function parseShape(raw: string | null): ShapeName {
  if (!raw) return DEFAULT_SHAPE;
  try {
    const value = JSON.parse(raw);
    return (SHAPE_NAMES as readonly unknown[]).includes(value) ? (value as ShapeName) : DEFAULT_SHAPE;
  } catch {
    return DEFAULT_SHAPE;
  }
}

// shapes are in neck order, so the strict < keeps the lower one on a tie.
export function nearestShape(shapes: CagedShape[], fret: number): ShapeName {
  let best = shapes[0];
  for (const shape of shapes) {
    const distance = Math.abs((shape.lowFret + shape.highFret) / 2 - fret);
    if (distance < Math.abs((best.lowFret + best.highFret) / 2 - fret)) best = shape;
  }
  return best.name;
}

export const shapeStore = createPersistedStore(SHAPE_KEY, parseShape, DEFAULT_SHAPE);
```

`lib/chords/use-selected-shape.ts`:
```ts
"use client";

import { useSyncExternalStore } from "react";
import type { ShapeName } from "@/lib/theory/caged";
import { shapeStore } from "./shape-store";

export function useSelectedShape(): [ShapeName, (name: ShapeName) => void] {
  const shape = useSyncExternalStore(shapeStore.subscribe, shapeStore.get, shapeStore.getServer);
  return [shape, shapeStore.set];
}
```

`lib/chords/neck-geometry.ts`:
```ts
import { MAX_FRET } from "@/lib/theory/fretboard";

// One viewBox for the overview at every size; the SVG scales to its container.
export const NECK = { width: 680, height: 158, nutX: 30, fretW: 43, top: 18, stringGap: 22 } as const;

export const fretLineX = (fret: number) => NECK.nutX + fret * NECK.fretW;
export const fretCenterX = (fret: number) => (fret === 0 ? NECK.nutX / 2 : NECK.nutX + (fret - 0.5) * NECK.fretW);
export const stringY = (string: number) => NECK.top + (5 - string) * NECK.stringGap; // high E on top

export function fretAtX(viewX: number): number {
  if (viewX < NECK.nutX) return 0;
  return Math.min(MAX_FRET, Math.max(1, Math.ceil((viewX - NECK.nutX) / NECK.fretW)));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add lib/chords tests/unit/shape-store.test.ts tests/unit/neck-geometry.test.ts
git commit -m "Chords: selected-shape store and neck geometry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Chord diagram

**Files:**
- Create: `components/chords/chord-diagram.tsx`
- Test: `tests/unit/chord-diagram.test.tsx`

**Interfaces:**
- Consumes: `CagedShape` (Task 2); `STRING_ORDINALS` (Task 1); `formatNote` (spelling).
- Produces: `ChordDiagram({ shape: CagedShape; chordName: string })`. It renders `role="img"` named `<chordName>, <X>-shape, frets <low> to <high>`. Each marker has `data-role` (`R` / `3` / `5`) and `data-open` (`true` for open-string markers); muted strings are drawn as text `×`; the base-fret label is `<N>fr`; there's a visually hidden `<ul>` of notes.

- [ ] **Step 1: Write the failing test**

`tests/unit/chord-diagram.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChordDiagram } from "@/components/chords/chord-diagram";
import { cagedShapes } from "@/lib/theory/caged";

const g = (name: string) => cagedShapes("G").find((s) => s.name === name)!;

describe("ChordDiagram", () => {
  it("draws the G E-shape at 3fr with numbered 3rds and 5ths", () => {
    const { container } = render(<ChordDiagram shape={g("E")} chordName="G major" />);
    expect(screen.getByRole("img", { name: "G major, E-shape, frets 3 to 5" })).toBeInTheDocument();
    expect(screen.getByText("3fr")).toBeInTheDocument();
    const roles = [...container.querySelectorAll("[data-role]")].map((m) => m.getAttribute("data-role"));
    expect(roles.sort()).toEqual(["3", "5", "5", "R", "R", "R"]);
    expect([...container.querySelectorAll("[data-string-note]")].map((n) => n.textContent)).toEqual([
      "G", "D", "G", "B", "D", "G",
    ]);
    expect(container.querySelector("[data-nut]")).toBeNull();
  });

  it("marks strings the D-shape doesn't use", () => {
    render(<ChordDiagram shape={g("D")} chordName="G major" />);
    expect(screen.getAllByText("×")).toHaveLength(2);
  });

  it("draws the nut and open strings for an open-position shape", () => {
    const { container } = render(<ChordDiagram shape={g("G")} chordName="G major" />);
    expect(container.querySelector("[data-nut]")).not.toBeNull();
    expect(screen.queryByText(/fr$/)).toBeNull();
    expect(container.querySelectorAll('[data-open="true"]')).toHaveLength(3); // D, G, B strings
  });

  it("lists its notes for screen readers", () => {
    render(<ChordDiagram shape={g("E")} chordName="G major" />);
    expect(screen.getByText("6th string, fret 3, G, root")).toBeInTheDocument();
    expect(screen.getByText("3rd string, fret 4, B, 3rd")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/chord-diagram.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/chords/chord-diagram"`.

- [ ] **Step 3: Implement**

`components/chords/chord-diagram.tsx`:
```tsx
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS, type Role } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";

const LEFT = 70;
const STRING_GAP = 40;
const TOP = 44; // room above the nut for ○ and ×
const FRET_H = 56;
const ROLE_NAME: Record<Role, string> = { R: "root", "3": "3rd", "5": "5th" };

interface ChordDiagramProps {
  shape: CagedShape;
  chordName: string; // "G major"
}

export function ChordDiagram({ shape, chordName }: ChordDiagramProps) {
  const open = shape.lowFret === 0;
  const start = open ? 1 : shape.lowFret; // first fret row drawn
  const rows = Math.max(4, shape.highFret - start + 1);
  const height = TOP + rows * FRET_H + 40;
  const x = (string: number) => LEFT + string * STRING_GAP;
  const y = (fret: number) => (fret === 0 ? TOP - 20 : TOP + (fret - start + 0.5) * FRET_H);
  const used = new Map(shape.tones.map((tone) => [tone.string, tone]));
  const label = `${chordName}, ${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`;

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg viewBox={`0 0 300 ${height}`} role="img" aria-label={label} className="w-full max-w-[300px]">
        {!open && (
          <text x={14} y={TOP + FRET_H / 2 + 5} fontSize={14} fontWeight={700} className="fill-text-secondary">
            {start}fr
          </text>
        )}
        <rect x={LEFT - 20} y={TOP} width={5 * STRING_GAP + 40} height={rows * FRET_H} className="fill-fretboard" />
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={i} x1={LEFT - 20} x2={x(5) + 20} y1={TOP + i * FRET_H} y2={TOP + i * FRET_H} stroke="#B89B6A" strokeWidth={2} />
        ))}
        {open && <line data-nut x1={LEFT - 20} x2={x(5) + 20} y1={TOP} y2={TOP} stroke="#161718" strokeWidth={6} />}
        {[0, 1, 2, 3, 4, 5].map((string) => {
          const tone = used.get(string);
          return (
            <g key={string}>
              <line x1={x(string)} x2={x(string)} y1={TOP} y2={TOP + rows * FRET_H} stroke="#6B5A40" strokeWidth={1 + (5 - string) * 0.4} />
              {tone ? (
                <text data-string-note x={x(string)} y={height - 12} textAnchor="middle" fontSize={16} className="fill-text-primary font-display font-semibold">
                  {formatNote(tone.note)}
                </text>
              ) : (
                <text x={x(string)} y={TOP - 14} textAnchor="middle" fontSize={20} className="fill-text-secondary font-bold">
                  ×
                </text>
              )}
            </g>
          );
        })}
        {shape.tones.map((tone) => {
          const isOpen = tone.fret === 0;
          const r = isOpen ? 12 : 18;
          return (
            <g key={tone.string} data-role={tone.role} data-open={isOpen}>
              <circle
                cx={x(tone.string)}
                cy={y(tone.fret)}
                r={r}
                fill={tone.role === "R" ? "#161718" : "#FFFFFF"}
                stroke="#161718"
                strokeWidth={2}
              />
              {tone.role !== "R" && (
                <text x={x(tone.string)} y={y(tone.fret) + (isOpen ? 4 : 6)} textAnchor="middle" fontSize={isOpen ? 12 : 17} fontWeight={700} fill="#161718">
                  {tone.role}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {shape.tones.map((tone) => (
          <li key={tone.string}>
            {`${STRING_ORDINALS[tone.string]} string, fret ${tone.fret}, ${formatNote(tone.note)}, ${ROLE_NAME[tone.role]}`}
          </li>
        ))}
      </ul>
    </figure>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add components/chords/chord-diagram.tsx tests/unit/chord-diagram.test.tsx
git commit -m "Chords: vertical chord diagram for a CAGED shape

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Root picker, shape chips, neck overview, focus card

**Files:**
- Create: `components/chords/root-picker.tsx`, `components/chords/shape-chips.tsx`, `components/chords/neck-overview.tsx`, `components/chords/focus-card.tsx`
- Test: `tests/unit/root-picker.test.tsx`, `tests/unit/shape-chips.test.tsx`, `tests/unit/neck-overview.test.tsx`, `tests/unit/focus-card.test.tsx`

**Interfaces:**
- Consumes: `majorTriad`, `ChordTone`, `STRING_ORDINALS` (Task 1); `CagedShape`, `ShapeName` (Task 2); `NECK`, `fretCenterX`, `fretLineX`, `stringY`, `fretAtX` (Task 3); `ChordDiagram` (Task 4); `classifyGesture` (`lib/circle/wheel-math.ts`); `formatNote`; `Note`.
- Produces:
  - `RootPicker({ root: Note; onStep(direction: 1 | -1) })`: renders an `h2` `<Root> major` and the notes line
  - `ShapeChips({ shapes: CagedShape[]; selected: ShapeName; onSelect(name) })`
  - `NeckOverview({ tones: ChordTone[]; shape: CagedShape; chordName: string; onPickFret(fret: number) })`: markers have `data-tone`; the window rect has `data-window-low` / `data-window-high`
  - `FocusCard({ shape: CagedShape; shapes: CagedShape[]; chordName: string; onStep(direction: 1 | -1) })`: a `section` region named `<X>-shape, frets <low> to <high>`

- [ ] **Step 1: Write the failing tests**

`tests/unit/root-picker.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RootPicker } from "@/components/chords/root-picker";

describe("RootPicker", () => {
  it("names the chord and spells its notes", () => {
    render(<RootPicker root="C#" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "D♭ major" })).toBeInTheDocument();
    expect(screen.getByText("D♭ · F · A♭")).toBeInTheDocument();
  });

  it("steps down and up", () => {
    const onStep = vi.fn();
    render(<RootPicker root="G" onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous root" }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByRole("button", { name: "Next root" }));
    expect(onStep).toHaveBeenLastCalledWith(1);
  });
});
```

`tests/unit/shape-chips.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ShapeChips } from "@/components/chords/shape-chips";
import { cagedShapes } from "@/lib/theory/caged";

describe("ShapeChips", () => {
  it("lists shapes in neck order with their frets, the selected one pressed", () => {
    render(<ShapeChips shapes={cagedShapes("G")} selected="E" onSelect={() => {}} />);
    const chips = within(screen.getByRole("group", { name: "CAGED shapes up the neck" })).getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "G-shape, frets 0 to 3",
      "E-shape, frets 3 to 5",
      "D-shape, frets 5 to 8",
      "C-shape, frets 7 to 10",
      "A-shape, frets 10 to 12",
    ]);
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false", "false", "false"]);
    expect(chips[3]).toHaveTextContent("C7–10");
  });

  it("selects by name", () => {
    const onSelect = vi.fn();
    render(<ShapeChips shapes={cagedShapes("G")} selected="E" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "A-shape, frets 10 to 12" }));
    expect(onSelect).toHaveBeenCalledWith("A");
  });
});
```

`tests/unit/neck-overview.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NeckOverview } from "@/components/chords/neck-overview";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones } from "@/lib/theory/fretboard";

describe("NeckOverview", () => {
  const tones = chordTones("G");
  const shape = cagedShapes("G").find((s) => s.name === "E")!;

  it("marks every chord tone on frets 0–15", () => {
    const { container } = render(<NeckOverview tones={tones} shape={shape} chordName="G major" onPickFret={() => {}} />);
    expect(container.querySelectorAll("[data-tone]")).toHaveLength(tones.length);
    expect(container.querySelectorAll('[data-tone][data-in-shape="true"]')).toHaveLength(6);
  });

  it("frames the selected shape", () => {
    const { container } = render(<NeckOverview tones={tones} shape={shape} chordName="G major" onPickFret={() => {}} />);
    const frame = container.querySelector("[data-window-low]")!;
    expect(frame.getAttribute("data-window-low")).toBe("3");
    expect(frame.getAttribute("data-window-high")).toBe("5");
    expect(screen.getByRole("img", { name: "G major across the neck, E-shape at frets 3 to 5" })).toBeInTheDocument();
  });
});
```

`tests/unit/focus-card.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FocusCard } from "@/components/chords/focus-card";
import { cagedShapes } from "@/lib/theory/caged";

const shapes = cagedShapes("G");
const named = (n: string) => shapes.find((s) => s.name === n)!;

describe("FocusCard", () => {
  it("titles the shape and names its neighbours", () => {
    render(<FocusCard shape={named("E")} shapes={shapes} chordName="G major" onStep={() => {}} />);
    expect(screen.getByRole("region", { name: "E-shape, frets 3 to 5" })).toBeInTheDocument();
    expect(screen.getByText("frets 3–5 · root on the 6th string")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous shape: G-shape" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next shape: D-shape" })).toBeEnabled();
  });

  it("steps with the arrows", () => {
    const onStep = vi.fn();
    render(<FocusCard shape={named("E")} shapes={shapes} chordName="G major" onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Next shape: D-shape" }));
    expect(onStep).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Previous shape: G-shape" }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
  });

  it("stops at both ends of the neck", () => {
    const { rerender } = render(<FocusCard shape={named("G")} shapes={shapes} chordName="G major" onStep={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous shape" })).toBeDisabled();
    rerender(<FocusCard shape={named("A")} shapes={shapes} chordName="G major" onStep={() => {}} />);
    expect(screen.getByRole("button", { name: "Next shape" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/root-picker.test.tsx tests/unit/shape-chips.test.tsx tests/unit/neck-overview.test.tsx tests/unit/focus-card.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/chords/..."`.

- [ ] **Step 3: Implement**

`components/chords/root-picker.tsx`:
```tsx
import { majorTriad } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

const ARROW = "grid h-11 w-11 place-items-center text-2xl font-bold text-accent-ink";

export function RootPicker({ root, onStep }: { root: Note; onStep: (direction: 1 | -1) => void }) {
  const triad = majorTriad(root);
  const name = formatNote(triad[0]);
  return (
    <div className="flex items-center justify-between gap-3">
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
      <div className="flex flex-col items-end gap-0.5">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{name} major</h2>
        <p className="text-[13px] font-semibold">{triad.map(formatNote).join(" · ")}</p>
      </div>
    </div>
  );
}
```

`components/chords/shape-chips.tsx`:
```tsx
import type { CagedShape, ShapeName } from "@/lib/theory/caged";

interface ShapeChipsProps {
  shapes: CagedShape[];
  selected: ShapeName;
  onSelect: (name: ShapeName) => void;
}

export function ShapeChips({ shapes, selected, onSelect }: ShapeChipsProps) {
  return (
    <div role="group" aria-label="CAGED shapes up the neck" className="grid grid-cols-5 gap-1 xl:gap-2">
      {shapes.map((shape) => {
        const active = shape.name === selected;
        return (
          <button
            key={shape.name}
            type="button"
            aria-pressed={active}
            aria-label={`${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
            onClick={() => onSelect(shape.name)}
            className={`flex min-h-11 flex-col items-center justify-center rounded-[10px] border-[1.5px] xl:min-h-[60px] xl:rounded-xl ${
              active ? "border-ink bg-accent text-ink" : "border-text-primary text-text-primary"
            }`}
          >
            <span className="font-display text-base font-semibold leading-none xl:text-[22px]">{shape.name}</span>
            <span className="text-[10px] font-semibold xl:text-xs">
              {shape.lowFret}–{shape.highFret}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

`components/chords/neck-overview.tsx`:
```tsx
"use client";

import type { MouseEvent } from "react";
import { NECK, fretAtX, fretCenterX, fretLineX, stringY } from "@/lib/chords/neck-geometry";
import type { CagedShape } from "@/lib/theory/caged";
import { MAX_FRET, type ChordTone } from "@/lib/theory/fretboard";

const INLAYS = [3, 5, 7, 9, 15];
const FRET_NUMBERS = [3, 5, 7, 9, 12, 15];

interface NeckOverviewProps {
  tones: ChordTone[];
  shape: CagedShape;
  chordName: string;
  onPickFret: (fret: number) => void;
}

export function NeckOverview({ tones, shape, chordName, onPickFret }: NeckOverviewProps) {
  const inShape = new Set(shape.tones.map((t) => `${t.string}:${t.fret}`));
  const windowLeft = shape.lowFret === 0 ? 2 : fretLineX(shape.lowFret - 1) - 4;
  const windowRight = fretLineX(shape.highFret) + 4;
  const neckBottom = stringY(0) + 10;

  // Taps are a shortcut; every shape is also reachable by its chip.
  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPickFret(fretAtX(((event.clientX - rect.left) / rect.width) * NECK.width));
  };

  return (
    <svg
      viewBox={`0 0 ${NECK.width} ${NECK.height}`}
      role="img"
      aria-label={`${chordName} across the neck, ${shape.name}-shape at frets ${shape.lowFret} to ${shape.highFret}`}
      className="w-full cursor-pointer select-none"
      onClick={pick}
    >
      <rect x={NECK.nutX} y={8} width={fretLineX(MAX_FRET) - NECK.nutX} height={neckBottom - 8} className="fill-fretboard" />
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
          stroke={fret === 0 ? "#161718" : "#B89B6A"}
          strokeWidth={fret === 0 ? 4 : 1.5}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line key={string} x1={NECK.nutX} x2={fretLineX(MAX_FRET)} y1={stringY(string)} y2={stringY(string)} stroke="#6B5A40" strokeWidth={1 + (5 - string) * 0.3} />
      ))}
      <rect
        data-window-low={shape.lowFret}
        data-window-high={shape.highFret}
        x={windowLeft}
        y={2}
        width={windowRight - windowLeft}
        height={neckBottom + 4}
        rx={8}
        className="fill-accent stroke-accent"
        fillOpacity={0.12}
        strokeWidth={2.5}
      />
      {tones.map((tone) => {
        const on = inShape.has(`${tone.string}:${tone.fret}`);
        return (
          <g key={`${tone.string}:${tone.fret}`} data-tone data-in-shape={on} opacity={on ? 1 : 0.3}>
            <circle
              cx={fretCenterX(tone.fret)}
              cy={stringY(tone.string)}
              r={9}
              fill={tone.role === "R" ? "#161718" : "#FFFFFF"}
              stroke="#161718"
              strokeWidth={1.5}
            />
            {tone.role !== "R" && (
              <text x={fretCenterX(tone.fret)} y={stringY(tone.string) + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#161718" className="hidden md:inline">
                {tone.role}
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

`components/chords/focus-card.tsx`:
```tsx
"use client";

import { useRef } from "react";
import { classifyGesture } from "@/lib/circle/wheel-math";
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { ChordDiagram } from "./chord-diagram";

const ARROW = "grid h-11 w-11 shrink-0 place-items-center text-[28px] text-accent-ink disabled:opacity-25";

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
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <section
      aria-label={`${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      className="flex min-w-0 flex-1 touch-pan-y select-none flex-col items-center gap-2 rounded-[22px] border border-border bg-surface px-3 py-3.5 xl:flex-row xl:gap-4 xl:px-5"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const gesture = classifyGesture(event.clientX - from.x, event.clientY - from.y);
        if (gesture === "swipe-left" && next) onStep(1);
        else if (gesture === "swipe-right" && previous) onStep(-1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div className="flex w-full items-center justify-between xl:contents">
        <button
          type="button"
          disabled={!previous}
          aria-label={previous ? `Previous shape: ${previous.name}-shape` : "Previous shape"}
          onClick={() => onStep(-1)}
          className={`${ARROW} xl:order-first`}
        >
          ‹
        </button>
        <div className="flex flex-col items-center xl:order-2 xl:flex-1 xl:items-start">
          <h3 className="font-display text-[26px] font-semibold leading-tight xl:text-[30px]">{shape.name}-shape</h3>
          <p className="text-[13px] text-text-secondary xl:text-sm">
            frets {shape.lowFret}–{shape.highFret} · root on the {STRING_ORDINALS[shape.rootString]} string
          </p>
        </div>
        <button
          type="button"
          disabled={!next}
          aria-label={next ? `Next shape: ${next.name}-shape` : "Next shape"}
          onClick={() => onStep(1)}
          className={`${ARROW} xl:order-last`}
        >
          ›
        </button>
      </div>
      <div className="w-full max-w-[300px] xl:order-1 xl:w-[250px]">
        <ChordDiagram shape={shape} chordName={chordName} />
      </div>
      <div aria-hidden className="flex gap-1.5 xl:hidden">
        {shapes.map((s, i) => (
          <span key={s.name} className={`h-2 rounded-full ${i === index ? "w-[22px] bg-accent" : "w-2 bg-border"}`} />
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
git add components/chords tests/unit/root-picker.test.tsx tests/unit/shape-chips.test.tsx tests/unit/neck-overview.test.tsx tests/unit/focus-card.test.tsx
git commit -m "Chords: root picker, shape chips, neck overview, focus card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Wire up the page, move the linking e2e, Chord Compass e2e, docs

**Files:**
- Create: `components/chords/chord-compass.tsx`, `tests/e2e/chord-compass.spec.ts`
- Modify: `app/chords/page.tsx`, `tests/e2e/key-link.spec.ts`, `tests/e2e/circle.spec.ts`, `CLAUDE.md`

**Interfaces:**
- Consumes: `useToolKey` (skeleton); `stepNote`, `chordTones`, `majorTriad` (Task 1); `cagedShapes` (Task 2); `useSelectedShape`, `nearestShape` (Task 3); `RootPicker`, `ShapeChips`, `NeckOverview`, `FocusCard` (Task 5); `formatNote`.
- Produces: the finished `/chords/` page.

- [ ] **Step 1: Move the linking e2e off the Chords note picker**

In `tests/e2e/key-link.spec.ts`, keep the helpers `root`, `toggle` and `go` exactly as they are. Add one helper below them:
```ts
const chordHeading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name: `${name} major` });
```
Then replace the four tests with:
```ts
test("tools keep their own key until linked", async ({ page }) => {
  await page.goto("/scales/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await root(page, "G").click();
  await go(page, "Chords");
  await expect(chordHeading(page, "C")).toBeVisible();
});

test("linking shares the key across tools", async ({ page }) => {
  await page.goto("/scales/");
  await root(page, "G").click();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(3);

  await go(page, "Chords");
  await expect(chordHeading(page, "G")).toBeVisible();
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(chordHeading(page, "A♭")).toBeVisible();
  await go(page, "Scales");
  await expect(root(page, "Ab")).toHaveAttribute("aria-pressed", "true");
});

test("unlinking keeps the shared key, then tools diverge", async ({ page }) => {
  await page.goto("/scales/");
  await toggle(page).click();
  await root(page, "A").click();
  await toggle(page).click();
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(0);

  await go(page, "Chords");
  await expect(chordHeading(page, "A")).toBeVisible();
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(chordHeading(page, "B♭")).toBeVisible();
  await go(page, "Scales");
  await expect(root(page, "A")).toHaveAttribute("aria-pressed", "true");
});

test("keys and link state survive a reload", async ({ page }) => {
  await page.goto("/scales/");
  await root(page, "Bb").click();
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(root(page, "Bb")).toHaveAttribute("aria-pressed", "true");
});
```

In `tests/e2e/circle.spec.ts`, in the test `with the chain linked, the Circle's key reaches Chords`, replace the final assertion (the `getByRole("group", { name: "Root note" })` … `"G"` … `aria-pressed` block) with:
```ts
  await expect(page.getByRole("heading", { level: 2, name: "G major" })).toBeVisible();
```

These edits fail until the page exists, which is expected; Step 3 makes them pass.

- [ ] **Step 2: Write the failing Chord Compass e2e**

`tests/e2e/chord-compass.spec.ts`:
```ts
import { expect, test, type Page } from "@playwright/test";

const focus = (page: Page, name: string) => page.getByRole("region", { name });
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name: `${name} major` });
const chip = (page: Page, name: string) => page.getByRole("button", { name });

test.beforeEach(async ({ page }) => {
  await page.goto("/chords/");
  await expect(heading(page, "C")).toBeVisible();
});

test("opens on C with the E-shape", async ({ page }) => {
  await expect(focus(page, "E-shape, frets 8 to 10")).toBeVisible();
  await expect(page.getByText("C · E · G", { exact: true })).toBeVisible();
});

test("the selected shape follows the root", async ({ page }) => {
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭")).toBeVisible();
  await expect(focus(page, "E-shape, frets 9 to 11")).toBeVisible();

  // D♭ → C → B → B♭ → A → A♭ → G → F♯
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Previous root" }).click();
  await expect(heading(page, "F♯")).toBeVisible();
  await chip(page, "G-shape, frets 11 to 14").click();
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "G")).toBeVisible();
  await expect(focus(page, "G-shape, frets 0 to 3")).toBeVisible(); // jumped from the top of the neck to the nut
});

test("chips and arrows move between shapes, stopping at the ends", async ({ page }) => {
  await chip(page, "D-shape, frets 10 to 13").click();
  await expect(focus(page, "D-shape, frets 10 to 13")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next shape" })).toBeDisabled();

  await page.getByRole("button", { name: "Previous shape: E-shape" }).click();
  await expect(focus(page, "E-shape, frets 8 to 10")).toBeVisible();

  await chip(page, "C-shape, frets 0 to 3").click();
  await expect(page.getByRole("button", { name: "Previous shape" })).toBeDisabled();
});

test("swiping the focus card steps up and down the neck", async ({ page }) => {
  const card = focus(page, "E-shape, frets 8 to 10");
  const box = (await card.boundingBox())!;
  const y = box.y + box.height * 0.6;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8 - 140, y, { steps: 6 });
  await page.mouse.up();
  await expect(focus(page, "D-shape, frets 10 to 13")).toBeVisible();
});

test("tapping the neck picks the shape under the finger", async ({ page }) => {
  const neck = page.getByRole("img", { name: /across the neck/ });
  const box = (await neck.boundingBox())!;
  // Fret 4 sits at x = 30 + 3.5 × 43 in the 680-wide viewBox; A-shape (3–5) is centred nearest.
  await neck.click({ position: { x: ((30 + 3.5 * 43) / 680) * box.width, y: box.height / 2 } });
  await expect(focus(page, "A-shape, frets 3 to 5")).toBeVisible();
});

test("the selected shape survives a reload", async ({ page }) => {
  await chip(page, "A-shape, frets 3 to 5").click();
  await page.reload();
  await expect(focus(page, "A-shape, frets 3 to 5")).toBeVisible();
});
```

Run: `pnpm exec playwright test tests/e2e/chord-compass.spec.ts`
Expected: FAIL, because there is no `C major` heading on `/chords/` yet.

- [ ] **Step 3: Implement the page**

`components/chords/chord-compass.tsx`:
```tsx
"use client";

import { nearestShape } from "@/lib/chords/shape-store";
import { useSelectedShape } from "@/lib/chords/use-selected-shape";
import { useToolKey } from "@/lib/key-state/hooks";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones, majorTriad } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { FocusCard } from "./focus-card";
import { NeckOverview } from "./neck-overview";
import { RootPicker } from "./root-picker";
import { ShapeChips } from "./shape-chips";

export function ChordCompass() {
  const [root, setRoot] = useToolKey("chords");
  const [shapeName, setShapeName] = useSelectedShape();
  const shapes = cagedShapes(root);
  const index = shapes.findIndex((s) => s.name === shapeName);
  const shape = shapes[index];
  const chordName = `${formatNote(majorTriad(root)[0])} major`;
  const chips = <ShapeChips shapes={shapes} selected={shapeName} onSelect={setShapeName} />;

  const stepShape = (direction: 1 | -1) => {
    const next = shapes[index + direction];
    if (next) setShapeName(next.name);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Chord Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <RootPicker root={root} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <NeckOverview
            tones={chordTones(root)}
            shape={shape}
            chordName={chordName}
            onPickFret={(fret) => setShapeName(nearestShape(shapes, fret))}
          />
          <div className="xl:hidden">{chips}</div>
        </section>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="hidden xl:flex xl:w-[400px] xl:shrink-0 xl:flex-col xl:gap-3.5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em]">CAGED shapes</h2>
            {chips}
            <p className="text-sm leading-relaxed text-text-secondary">
              Shapes run up the neck in CAGED order, each sharing a root with the next. Click the neck to jump
              to the shape under the pointer.
            </p>
          </div>
          <FocusCard shape={shape} shapes={shapes} chordName={chordName} onStep={stepShape} />
        </div>
      </div>
    </div>
  );
}
```

`app/chords/page.tsx` (replace):
```tsx
import type { Metadata } from "next";
import { ChordCompass } from "@/components/chords/chord-compass";

export const metadata: Metadata = { title: "Chord Compass" };

export default function ChordsPage() {
  return <ChordCompass />;
}
```

- [ ] **Step 4: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all PASS in both projects. That includes the moved linking tests and the Circle's linking test. The navigation and offline specs find the `sr-only` "Chord Compass" `h1`, and the layout spec covers the real page at 320–1440px.

If a gesture test fails only in the `iphone` (WebKit) project because `page.mouse` produces no pointer events there, skip just that test for WebKit with the exact error as the reason, record a ledger ruling, and report it. On the Circle, WebKit gestures worked.

- [ ] **Step 5: Visual check against the canvas**

Take screenshots at 390×844 (iPhone 14, WebKit), 834×1194 and 1280×800 (Chromium), light mode, with root G and the E-shape selected. Compare them by eye with the canvas artboards "C · Neck overview + shape focus" and "Desktop · 1280". Check the overview window, faded off-shape markers, chip order and ranges, diagram markers and notes, and that ③/⑤ labels on the overview appear only from tablet up. Fix any layout drift before committing.

- [ ] **Step 6: Document it in CLAUDE.md**

In `CLAUDE.md` under `## Architecture`, add after the Circle of Fifths bullet:
```markdown
- **Chord Compass (`components/chords/`, `lib/chords/`, `lib/theory/fretboard.ts`, `lib/theory/caged.ts`):**
  major chords only, frets 0–15 (one past the device so every shape is complete). CAGED shapes are five
  templates slid to the root (`cagedShapes`), sorted up the neck. The selected shape is stored by *name*
  (`nomad:chords:shape:v1`) so it survives root changes. The overview is one SVG `viewBox` from
  `neck-geometry.ts` that scales to every screen size.
```

- [ ] **Step 7: Commit**

```bash
git add components/chords/chord-compass.tsx app/chords/page.tsx tests/e2e/chord-compass.spec.ts tests/e2e/key-link.spec.ts tests/e2e/circle.spec.ts CLAUDE.md
git commit -m "Chord Compass: the page, e2e, docs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
