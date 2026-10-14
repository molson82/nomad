# Connect the Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Walk the Circle's progression chord by chord in the Chord Compass (without changing the key), and jump from the Circle to the Chord and Scale Compasses on the Circle's key.

**Architecture:** A pure step model (`progressionSteps`) turns the Circle's stored degrees into spelled chords via `diatonicChords`, and `cagedShapesFor` builds shapes from an already-spelled triad. The Chord Compass reads the Circle's progression store plus a per-tool persisted step and shows either the key chord or the step's chord; moving between chords re-picks the nearest shape window. The Circle gets two `next/link` jumps that set the target tool's key (and the step) before navigating.

**Tech Stack:** Next 15 static export, React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (jsdom), Playwright (`iphone` + `desktop`), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-connect-tools-design.md`

## Global Constraints

- Walking a progression never changes any key; only the two Circle jumps set a key, and only the target tool's (via `withRoot`).
- Chord names and notes come from `diatonicChords(circleKeyFor(root))`, so they match the Circle (F♯ major's V is C♯).
- Step store: `nomad:chords:step:v1`, JSON integer index or `null`; default `null`; out of range / junk / a vii° step reads as `null`.
- vii° chips are disabled ("F♯ diminished, no shapes yet") and ‹ › skip them. With no step selected, › selects the first playable step and ‹ is disabled.
- Moving between chords (tap, ‹ ›, back to key view) picks the shape whose window centre is nearest the current window's centre.
- The strip shows only when the Circle's progression is non-empty. "See on the neck" shows only when the progression has a playable (non-vii°) chord. (Ruling vs spec "at least one chord": a vii°-only progression has nothing to open.)
- Jumps use the Circle's committed key (`useToolKey("circle")`), never the mid-spin display key.
- All tap targets ≥ 44px. No new dependencies.

## Review Focus

1. A progression cleared or shortened in the Circle while a later step is stored must show the key view, not crash (Task 2 `validStep` test; Task 5 e2e covers a live progression only).
2. Changing the key with the root arrows while a step is selected keeps the step and transposes it (Task 5 e2e: Next root → "B♭ minor", "vi in D♭ major").
3. Major/Minor tapped while a step is selected returns to the key view in that quality (Task 5 e2e).
4. Unlinked tools: the jump sets only the target tool's key and leaves the Circle's alone (Task 3 test).
5. A minor step (vi) uses minor templates and `m` labels, consistent with the key view's Minor (Task 1 equivalence test).

---

### Task 1: Theory — shapes from a spelled triad, progression steps

**Files:**
- Modify: `lib/theory/caged.ts`, `lib/theory/fretboard.ts`
- Create: `lib/chords/progression-chords.ts`
- Test: `tests/unit/progression-chords.test.ts` (new)

**Interfaces:**
- Produces:
  - `cagedShapesFor(chord: readonly [SpelledNote, SpelledNote, SpelledNote], quality: Quality): CagedShape[]`
  - `chordTonesFor(chord: readonly SpelledNote[], quality: Quality): ChordTone[]`
  - `type ProgressionStep = { degree: number; roman: string; name: string; longName: string; quality: Quality | null; notes: [SpelledNote, SpelledNote, SpelledNote] }`
  - `progressionSteps(root: Note, degrees: readonly number[]): ProgressionStep[]`
  - `nextPlayable(steps: readonly ProgressionStep[], from: number | null, direction: 1 | -1): number | null`

- [ ] **Step 1: Write the failing test**

`tests/unit/progression-chords.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextPlayable, progressionSteps } from "@/lib/chords/progression-chords";
import { cagedShapes, cagedShapesFor } from "@/lib/theory/caged";
import { chordLongName, chordName, diatonicChords } from "@/lib/theory/chords";
import { circleKeyFor } from "@/lib/theory/circle";
import { chordTonesFor } from "@/lib/theory/fretboard";
import { NOTES } from "@/lib/theory/notes";
import { formatNote, pitchClassOf } from "@/lib/theory/spelling";

describe("progressionSteps", () => {
  it("names each step as the Circle does", () => {
    const steps = progressionSteps("G", [1, 5, 6, 4, 7]);
    expect(steps.map((s) => `${s.roman} ${s.name} ${s.quality}`)).toEqual([
      "I G major",
      "V D major",
      "vi Em minor",
      "IV C major",
      "vii° F♯° null",
    ]);
    expect(steps[1].notes.map(formatNote).join(" ")).toBe("D F♯ A");
    expect(steps[2].longName).toBe("E minor");
  });

  it("spells V of F♯ major as C♯, like the Circle", () => {
    expect(progressionSteps("F#", [5])[0].name).toBe("C♯");
  });

  it("matches the Circle's chords for every key and degree", () => {
    for (const root of NOTES) {
      const chords = diatonicChords(circleKeyFor(root));
      progressionSteps(root, [1, 2, 3, 4, 5, 6, 7]).forEach((step, i) => {
        expect(step.name).toBe(chordName(chords[i]));
        expect(step.longName).toBe(chordLongName(chords[i]));
        expect(step.notes).toEqual(chords[i].notes);
      });
    }
  });
});

describe("cagedShapesFor", () => {
  it("builds five in-range shapes for every playable chord of every key", () => {
    for (const root of NOTES) {
      for (const step of progressionSteps(root, [1, 2, 3, 4, 5, 6])) {
        const shapes = cagedShapesFor(step.notes, step.quality!);
        const pitches = new Set(step.notes.map(pitchClassOf));
        expect(shapes).toHaveLength(5);
        for (const shape of shapes) {
          expect(shape.lowFret).toBeGreaterThanOrEqual(0);
          expect(shape.highFret).toBeLessThanOrEqual(15);
          for (const t of shape.tones) expect(pitches.has(pitchClassOf(t.note))).toBe(true);
        }
      }
    }
  });

  it("gives vi the same shapes as the key's Minor view", () => {
    for (const root of NOTES) {
      const vi = progressionSteps(root, [6])[0];
      expect(cagedShapesFor(vi.notes, "minor")).toEqual(cagedShapes(root, "minor"));
    }
  });

  it("labels minor chord tones ♭3 on the whole neck", () => {
    const ii = progressionSteps("C", [2])[0]; // D minor
    expect(new Set(chordTonesFor(ii.notes, "minor").map((t) => t.role))).toEqual(new Set(["R", "♭3", "5"]));
  });
});

describe("nextPlayable", () => {
  const steps = progressionSteps("G", [7, 1, 7, 5, 7]); // F♯° G F♯° D F♯°

  it("skips diminished steps in both directions", () => {
    expect(nextPlayable(steps, 1, 1)).toBe(3);
    expect(nextPlayable(steps, 3, -1)).toBe(1);
  });

  it("stops at the ends", () => {
    expect(nextPlayable(steps, 3, 1)).toBeNull();
    expect(nextPlayable(steps, 1, -1)).toBeNull();
  });

  it("starts from the first playable step when nothing is selected", () => {
    expect(nextPlayable(steps, null, 1)).toBe(1);
    expect(nextPlayable(progressionSteps("G", [7]), null, 1)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/progression-chords.test.ts`
Expected: FAIL — cannot resolve `@/lib/chords/progression-chords`.

- [ ] **Step 3: Implement**

`lib/theory/fretboard.ts` — replace `chordTones` with:

```ts
export function chordTones(root: Note, quality: Quality = "major"): ChordTone[] {
  return chordTonesFor(triad(root, quality), quality);
}

export function chordTonesFor(chord: readonly SpelledNote[], quality: Quality): ChordTone[] {
  const pitches = chord.map(pitchClassOf);
  const tones: ChordTone[] = [];
  TUNING.forEach((open, string) => {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      if (pitches.includes((open + fret) % 12)) tones.push(toneAt(chord, string, fret, quality));
    }
  });
  return tones;
}
```

`lib/theory/caged.ts` — replace `cagedShapes` with the pair below and add `import type { SpelledNote } from "./spelling";` (merge into the existing `./spelling` import):

```ts
export function cagedShapes(root: Note, quality: Quality = "major"): CagedShape[] {
  return cagedShapesFor(triad(root, quality), quality);
}

// From an already-spelled triad, so a progression's chords keep the Circle's spelling.
export function cagedShapesFor(chord: readonly [SpelledNote, SpelledNote, SpelledNote], quality: Quality): CagedShape[] {
  const rootPitch = pitchClassOf(chord[0]);
  return SHAPE_NAMES.map((name) => {
    const { rootString, offsets } = TEMPLATES[quality][name];
    let rootFret = mod(rootPitch - TUNING[rootString], 12);
    // Slide up an octave rather than past the nut.
    if (offsets.some(([, offset]) => rootFret + offset < 0)) rootFret += 12;
    const tones = offsets.map(([string, offset]) => toneAt(chord, string, rootFret + offset, quality));
    const frets = tones.map((t) => t.fret);
    const label = quality === "minor" ? `${name}m` : name;
    return { name, label, rootString, tones, lowFret: Math.min(...frets), highFret: Math.max(...frets) };
  }).sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
}
```

`lib/chords/progression-chords.ts`:

```ts
import { chordLongName, chordName, diatonicChords } from "@/lib/theory/chords";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import type { SpelledNote } from "@/lib/theory/spelling";

export type ProgressionStep = {
  degree: number;
  roman: string;
  name: string; // "Em", as the Circle writes it
  longName: string; // "E minor"
  quality: Quality | null; // null: diminished, no shapes yet
  notes: [SpelledNote, SpelledNote, SpelledNote];
};

const QUALITY = { maj: "major", min: "minor", dim: null } as const;

// The Circle stores degrees, so the same progression follows whatever key it is read in.
export function progressionSteps(root: Note, degrees: readonly number[]): ProgressionStep[] {
  const chords = diatonicChords(circleKeyFor(root));
  return degrees.map((degree) => {
    const chord = chords[degree - 1];
    return {
      degree,
      roman: chord.roman,
      name: chordName(chord),
      longName: chordLongName(chord),
      quality: QUALITY[chord.quality],
      notes: chord.notes,
    };
  });
}

// The next step with shapes; from no selection, the first one in that direction.
export function nextPlayable(steps: readonly ProgressionStep[], from: number | null, direction: 1 | -1): number | null {
  let i = from === null ? (direction === 1 ? 0 : steps.length - 1) : from + direction;
  for (; i >= 0 && i < steps.length; i += direction) if (steps[i].quality) return i;
  return null;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test:unit tests/unit/progression-chords.test.ts tests/unit/caged.test.ts tests/unit/fretboard.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory lib/chords/progression-chords.ts tests/unit/progression-chords.test.ts
git commit -m "Theory: progression steps and shapes from a spelled triad

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Step store and the nearest-window helper

**Files:**
- Create: `lib/chords/step-store.ts`, `lib/chords/use-progression-step.ts`
- Modify: `lib/chords/shape-store.ts` (add `shapeNear`)
- Test: `tests/unit/step-store.test.ts` (new)

**Interfaces:**
- Consumes: `ProgressionStep`, `progressionSteps` (Task 1); `nearestShape` (existing).
- Produces:
  - `STEP_KEY = "nomad:chords:step:v1"`, `parseStep(raw: string | null): number | null`
  - `validStep(step: number | null, steps: readonly ProgressionStep[]): number | null`
  - `stepStore` (PersistedStore<number | null>)
  - `useProgressionStep(steps: readonly ProgressionStep[]): [number | null, (step: number | null) => void]`
  - `shapeNear(shapes: CagedShape[], from: CagedShape): ShapeName` (shape-store.ts)

- [ ] **Step 1: Write the failing test**

`tests/unit/step-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { progressionSteps } from "@/lib/chords/progression-chords";
import { shapeNear } from "@/lib/chords/shape-store";
import { parseStep, validStep } from "@/lib/chords/step-store";
import { cagedShapes, cagedShapesFor } from "@/lib/theory/caged";

describe("parseStep", () => {
  it("reads an index or null", () => {
    expect(parseStep("2")).toBe(2);
    expect(parseStep("null")).toBeNull();
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["negative", "-1"],
    ["fraction", "1.5"],
    ["a string", JSON.stringify("1")],
  ])("reads %s as no step", (_label, raw) => {
    expect(parseStep(raw)).toBeNull();
  });
});

describe("validStep", () => {
  const steps = progressionSteps("G", [1, 5, 7]);

  it("keeps a step that exists and has shapes", () => {
    expect(validStep(1, steps)).toBe(1);
  });

  it("drops a step past the end, e.g. after the progression was shortened", () => {
    expect(validStep(3, steps)).toBeNull();
    expect(validStep(0, [])).toBeNull();
  });

  it("drops a diminished step", () => {
    expect(validStep(2, steps)).toBeNull();
  });
});

describe("shapeNear", () => {
  it("stays in the region: G major E-shape (3–5) → D major C-shape (2–5)", () => {
    const from = cagedShapes("G").find((s) => s.name === "E")!;
    const d = progressionSteps("G", [5])[0];
    expect(shapeNear(cagedShapesFor(d.notes, "major"), from)).toBe("C");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/step-store.test.ts`
Expected: FAIL — cannot resolve `@/lib/chords/step-store`.

- [ ] **Step 3: Implement**

`lib/chords/step-store.ts`:

```ts
import { createPersistedStore } from "@/lib/storage/persisted-store";
import type { ProgressionStep } from "./progression-chords";

// Which chord of the Circle's progression the Chord Compass shows; null is the key view.
export const STEP_KEY = "nomad:chords:step:v1";

export function parseStep(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return Number.isInteger(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

// The progression lives in the Circle and can change under us.
export function validStep(step: number | null, steps: readonly ProgressionStep[]): number | null {
  return step !== null && step < steps.length && steps[step].quality ? step : null;
}

export const stepStore = createPersistedStore<number | null>(STEP_KEY, parseStep, null);
```

`lib/chords/use-progression-step.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";
import type { ProgressionStep } from "./progression-chords";
import { stepStore, validStep } from "./step-store";

export function useProgressionStep(steps: readonly ProgressionStep[]): [number | null, (step: number | null) => void] {
  const step = useSyncExternalStore(stepStore.subscribe, stepStore.get, stepStore.getServer);
  return [validStep(step, steps), stepStore.set];
}
```

`lib/chords/shape-store.ts` — add after `nearestShape`:

```ts
// Moving to another chord keeps the hand in the same region of the neck.
export function shapeNear(shapes: CagedShape[], from: CagedShape): ShapeName {
  return nearestShape(shapes, (from.lowFret + from.highFret) / 2);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/step-store.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/chords tests/unit/step-store.test.ts
git commit -m "Chord Compass: persisted progression step

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Circle jumps

**Files:**
- Create: `lib/circle/jumps.ts`, `components/circle/tool-jumps.tsx`
- Modify: `components/circle/circle-of-fifths.tsx`
- Test: `tests/unit/tool-jumps.test.tsx` (new)

**Interfaces:**
- Consumes: `progressionSteps`, `nextPlayable` (Task 1); `stepStore` (Task 2); `getKeyState`, `updateKeyState`, `withRoot` (`lib/key-state/store.ts`).
- Produces: `openChordsAt(root: Note, step: number): void`, `openScalesIn(root: Note): void`, `ToolJumps({ root: Note; degrees: readonly number[] })`.

- [ ] **Step 1: Write the failing test**

`tests/unit/tool-jumps.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolJumps } from "@/components/circle/tool-jumps";
import { stepStore } from "@/lib/chords/step-store";
import { openChordsAt, openScalesIn } from "@/lib/circle/jumps";
import { getKeyState, updateKeyState } from "@/lib/key-state/store";

const fresh = (linked: boolean) =>
  updateKeyState({ linked, shared: "C", tools: { circle: "C", chords: "D", scales: "A" } });

describe("jumps", () => {
  beforeEach(() => fresh(false));

  it("sets only the target tool's key when the tools are unlinked", () => {
    openScalesIn("G");
    expect(getKeyState().tools).toEqual({ circle: "C", chords: "D", scales: "G" });
  });

  it("opens the Chord Compass on a step in the Circle's key", () => {
    openChordsAt("G", 1);
    expect(getKeyState().tools.chords).toBe("G");
    expect(stepStore.get()).toBe(1);
  });

  it("leaves a linked key as it is", () => {
    fresh(true);
    openChordsAt("C", 0);
    expect(getKeyState()).toMatchObject({ linked: true, shared: "C" });
  });
});

describe("ToolJumps", () => {
  it("links to the neck with the progression's chords and to the key's scale", () => {
    render(<ToolJumps root="G" degrees={[1, 5, 6, 4]} />);
    const neck = screen.getByRole("link", { name: /See on the neck/ });
    expect(neck).toHaveAttribute("href", "/chords/");
    expect(neck).toHaveTextContent("Chord Compass · G · D · Em · C");
    expect(screen.getByRole("link", { name: /Scale for G major/ })).toHaveAttribute("href", "/scales/");
  });

  it("hides the neck link when there is nothing to show", () => {
    const { rerender } = render(<ToolJumps root="G" degrees={[]} />);
    expect(screen.queryByRole("link", { name: /See on the neck/ })).toBeNull();
    rerender(<ToolJumps root="G" degrees={[7]} />);
    expect(screen.queryByRole("link", { name: /See on the neck/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Scale for G major/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/tool-jumps.test.tsx`
Expected: FAIL — cannot resolve `@/components/circle/tool-jumps`.

- [ ] **Step 3: Implement**

`lib/circle/jumps.ts`:

```ts
import { stepStore } from "@/lib/chords/step-store";
import { getKeyState, updateKeyState, withRoot } from "@/lib/key-state/store";
import type { Note } from "@/lib/theory/notes";

// Linked tools already share the key; unlinked, only the target tool follows the Circle.
export function openChordsAt(root: Note, step: number) {
  updateKeyState(withRoot(getKeyState(), "chords", root));
  stepStore.set(step);
}

export function openScalesIn(root: Note) {
  updateKeyState(withRoot(getKeyState(), "scales", root));
}
```

`components/circle/tool-jumps.tsx`:

```tsx
import Link from "next/link";
import { nextPlayable, progressionSteps } from "@/lib/chords/progression-chords";
import { openChordsAt, openScalesIn } from "@/lib/circle/jumps";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

const JUMP = "flex min-h-[52px] items-center justify-between rounded-2xl px-4";

export function ToolJumps({ root, degrees }: { root: Note; degrees: readonly number[] }) {
  const steps = progressionSteps(root, degrees);
  const first = nextPlayable(steps, null, 1);
  const keyName = formatNote(majorScale(circleKeyFor(root))[0]);
  return (
    <nav aria-label="Open in another tool" className="flex flex-col gap-2">
      {first !== null && (
        <Link href="/chords/" onClick={() => openChordsAt(root, first)} className={`${JUMP} bg-ink text-white`}>
          <span className="flex flex-col">
            <span className="font-display text-lg font-semibold">See on the neck</span>
            <span className="text-xs font-semibold text-decoder">
              Chord Compass · {steps.map((s) => s.name).join(" · ")}
            </span>
          </span>
          <span aria-hidden className="text-[22px] text-decoder">→</span>
        </Link>
      )}
      <Link href="/scales/" onClick={() => openScalesIn(root)} className={`${JUMP} border-[1.5px] border-text-primary text-text-primary`}>
        <span className="flex flex-col">
          <span className="font-display text-lg font-semibold">Scale for {keyName} major</span>
          <span className="text-xs font-semibold text-text-secondary">Scale Compass</span>
        </span>
        <span aria-hidden className="text-[22px]">→</span>
      </Link>
    </nav>
  );
}
```

`components/circle/circle-of-fifths.tsx` — import `ToolJumps` and wrap the tray with it (keeps the md two-column grid intact):

```tsx
import { ToolJumps } from "./tool-jumps";
// ...
          <div className="flex flex-col gap-3">
            <ProgressionTray
              keyChords={diatonicChords(CIRCLE[displayIndex])}
              degrees={progression.degrees}
              onRemove={actions.remove}
              onClear={actions.clear}
            />
            <ToolJumps root={root} degrees={progression.degrees} />
          </div>
```

(`root` is the committed key from `useToolKey("circle")`, already in scope.)

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test:unit tests/unit/tool-jumps.test.tsx && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/circle/jumps.ts components/circle tests/unit/tool-jumps.test.tsx
git commit -m "Circle: jump to the neck and to the key's scale

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Chord Compass pieces — strip, step header, unpressed switch

**Files:**
- Create: `components/chords/progression-strip.tsx`
- Modify: `components/chords/root-picker.tsx`, `components/fretboard/major-minor-toggle.tsx`
- Test: `tests/unit/progression-strip.test.tsx` (new), `tests/unit/root-picker.test.tsx`, `tests/unit/major-minor-toggle.test.tsx`

**Interfaces:**
- Consumes: `ProgressionStep`, `progressionSteps`, `nextPlayable` (Task 1).
- Produces:
  - `ProgressionStrip({ steps: ProgressionStep[]; selected: number | null; onSelect: (step: number | null) => void })`
  - `RootPicker({ root, quality, step?: ProgressionStep | null, onStep })`
  - `MajorMinorToggle({ value: Quality | null; onChange })` — `null` presses neither.

- [ ] **Step 1: Write the failing tests**

`tests/unit/progression-strip.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProgressionStrip } from "@/components/chords/progression-strip";
import { progressionSteps } from "@/lib/chords/progression-chords";

const steps = progressionSteps("G", [1, 5, 6, 4, 7]);
const strip = () => within(screen.getByRole("region", { name: "Progression" }));

describe("ProgressionStrip", () => {
  it("lists the chords, the selected one pressed, vii° disabled", () => {
    render(<ProgressionStrip steps={steps} selected={1} onSelect={() => {}} />);
    const chips = strip().getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "I, G major",
      "V, D major",
      "vi, E minor",
      "IV, C major",
      "F♯ diminished, no shapes yet",
    ]);
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false", "false", "false"]);
    expect(chips[4]).toBeDisabled();
  });

  it("selects a chip, and tapping the selected chip goes back to the key", () => {
    const onSelect = vi.fn();
    render(<ProgressionStrip steps={steps} selected={1} onSelect={onSelect} />);
    fireEvent.click(strip().getByRole("button", { name: "vi, E minor" }));
    expect(onSelect).toHaveBeenLastCalledWith(2);
    fireEvent.click(strip().getByRole("button", { name: "V, D major" }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("steps with the arrows, skipping vii° and stopping at the ends", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ProgressionStrip steps={steps} selected={null} onSelect={onSelect} />);
    expect(strip().getByRole("button", { name: "Previous chord" })).toBeDisabled();
    fireEvent.click(strip().getByRole("button", { name: "Next chord" }));
    expect(onSelect).toHaveBeenLastCalledWith(0);
    rerender(<ProgressionStrip steps={steps} selected={3} onSelect={onSelect} />);
    expect(strip().getByRole("button", { name: "Next chord" })).toBeDisabled();
    fireEvent.click(strip().getByRole("button", { name: "Previous chord" }));
    expect(onSelect).toHaveBeenLastCalledWith(2);
  });
});
```

`tests/unit/root-picker.test.tsx` — add inside the describe (and `import { progressionSteps } from "@/lib/chords/progression-chords";` at the top):

```tsx
  it("names a progression chord and its place in the key", () => {
    render(<RootPicker root="G" quality="major" step={progressionSteps("G", [5])[0]} onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "D major" })).toBeInTheDocument();
    expect(screen.getByText("D · F♯ · A")).toBeInTheDocument();
    expect(screen.getByText("V in G major")).toBeInTheDocument();
  });
```

`tests/unit/major-minor-toggle.test.tsx` — add inside the describe:

```tsx
  it("presses neither while a progression chord is shown", () => {
    render(<MajorMinorToggle value={null} onChange={() => {}} />);
    const buttons = within(screen.getByRole("group", { name: "Major or minor" })).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false"]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:unit tests/unit/progression-strip.test.tsx tests/unit/root-picker.test.tsx tests/unit/major-minor-toggle.test.tsx`
Expected: FAIL — missing strip module; RootPicker ignores `step`; `value={null}` is a type error at typecheck (vitest still runs; the toggle test may pass already — if so, the type change in Step 3 is still required for Task 5).

- [ ] **Step 3: Implement**

`components/chords/progression-strip.tsx`:

```tsx
import { nextPlayable, type ProgressionStep } from "@/lib/chords/progression-chords";

const ARROW = "grid h-14 w-9 shrink-0 place-items-center text-2xl text-accent-ink disabled:opacity-30";

interface ProgressionStripProps {
  steps: ProgressionStep[];
  selected: number | null;
  onSelect: (step: number | null) => void; // null: back to the key
}

export function ProgressionStrip({ steps, selected, onSelect }: ProgressionStripProps) {
  const previous = selected === null ? null : nextPlayable(steps, selected, -1);
  const next = nextPlayable(steps, selected, 1);
  return (
    <section aria-label="Progression" className="flex items-center gap-0.5">
      <button type="button" aria-label="Previous chord" disabled={previous === null} onClick={() => onSelect(previous)} className={ARROW}>
        ‹
      </button>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {steps.map((step, i) => {
          const active = i === selected;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={active}
              aria-label={step.quality ? `${step.roman}, ${step.longName}` : `${step.longName}, no shapes yet`}
              disabled={!step.quality}
              onClick={() => onSelect(active ? null : i)}
              className={`flex min-h-14 flex-col items-center justify-center gap-px rounded-xl border-[1.5px] border-text-primary disabled:opacity-40 ${
                active ? "bg-text-primary text-bg" : "text-text-primary"
              }`}
            >
              <span className="text-[11px] font-bold opacity-70">{step.roman}</span>
              <span className="font-display text-xl font-semibold leading-none">{step.name}</span>
            </button>
          );
        })}
      </div>
      <button type="button" aria-label="Next chord" disabled={next === null} onClick={() => onSelect(next)} className={ARROW}>
        ›
      </button>
    </section>
  );
}
```

`components/chords/root-picker.tsx` — add the optional `step` prop:

```tsx
import type { ProgressionStep } from "@/lib/chords/progression-chords";
// ...
interface RootPickerProps {
  root: Note;
  quality: Quality;
  step?: ProgressionStep | null; // a progression chord replaces the key chord
  onStep: (direction: 1 | -1) => void;
}

export function RootPicker({ root, quality, step, onStep }: RootPickerProps) {
  const key = majorScale(circleKeyFor(root));
  const chord = step ? step.notes : triad(root, quality);
  const title = step ? step.longName : `${formatNote(chord[0])} ${quality}`;
  const relation = step
    ? `${step.roman} in ${formatNote(key[0])} major`
    : quality === "major"
      ? `Relative minor: ${formatNote(key[5])} (⑥)`
      : `Relative of ${formatNote(key[0])} major (⑥)`;
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={formatNote(key[0])} onStep={onStep} />
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{title}</h2>
        <p className="text-[13px] font-semibold">{chord.map(formatNote).join(" · ")}</p>
        <p className="text-xs font-semibold text-relative">{relation}</p>
      </div>
    </div>
  );
}
```

`components/fretboard/major-minor-toggle.tsx` — widen the value type:

```tsx
export function MajorMinorToggle({ value, onChange }: { value: Quality | null; onChange: (quality: Quality) => void }) {
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test:unit tests/unit/progression-strip.test.tsx tests/unit/root-picker.test.tsx tests/unit/major-minor-toggle.test.tsx tests/unit/view-toggles.test.tsx && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add components tests/unit
git commit -m "Chord Compass UI: progression strip and step header

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Wire the Chord Compass, e2e, docs

**Files:**
- Modify: `components/chords/chord-compass.tsx`, `CLAUDE.md`
- Create: `tests/e2e/connect-tools.spec.ts`

**Interfaces:**
- Consumes: `progressionSteps` (Task 1), `useProgressionStep` / `shapeNear` (Task 2), `ProgressionStrip`, `RootPicker({ step })`, `MajorMinorToggle({ value: null })` (Task 4), `useProgression` (existing), `cagedShapesFor`, `chordTonesFor` (Task 1).

- [ ] **Step 1: Write the failing e2e test**

`tests/e2e/connect-tools.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label, exact: true });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page"); // see CLAUDE.md
};
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });

test("See on the neck walks the Circle's progression in the Circle's key", async ({ page }) => {
  // Unlinked tools: give the Chord Compass a different key first.
  await page.goto("/chords/");
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();

  await go(page, "Circle");
  await page.getByRole("button", { name: /I–V–vi–IV/ }).click();
  await page.getByRole("link", { name: /See on the neck/ }).click();

  await expect(page.getByText("I in C major")).toBeVisible();
  await expect(page.getByRole("button", { name: "I, C major" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next chord" }).click();
  await expect(heading(page, "G major")).toBeVisible();
  await expect(page.getByText("V in C major")).toBeVisible();
  await page.getByRole("button", { name: "Next chord" }).click();
  await expect(heading(page, "A minor")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Am-shape/ }).first()).toBeVisible();

  // Changing the key keeps the step and transposes it.
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "B♭ minor")).toBeVisible();
  await expect(page.getByText("vi in D♭ major")).toBeVisible();

  // Major on the switch returns to the key view.
  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Major" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();
  await expect(page.getByText("Relative minor: B♭ (⑥)")).toBeVisible();

  await go(page, "Circle");
  await expect(page.getByRole("slider", { name: "Key" })).toHaveAttribute("aria-valuetext", "C major, no sharps or flats");
});

test("Scale for C major opens the Scale Compass on the Circle's key", async ({ page }) => {
  await page.goto("/scales/");
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();

  await go(page, "Circle");
  await page.getByRole("link", { name: /Scale for C major/ }).click();
  await expect(heading(page, "C major")).toBeVisible();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec playwright test tests/e2e/connect-tools.spec.ts --project=iphone`
Expected: the first test FAILS at "I in C major" (the Chord Compass has no strip yet). The second may already pass (Task 3 wired the Scale jump) — that is acceptable; it guards the jump end to end.

- [ ] **Step 3: Implement**

`components/chords/chord-compass.tsx` — full file:

```tsx
"use client";

import { useRef } from "react";
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";
import { useProgression } from "@/lib/circle/use-progression";
import { progressionSteps } from "@/lib/chords/progression-chords";
import { switchQualityShape, type SwitchMemo } from "@/lib/chords/quality-store";
import { nearestShape, shapeNear } from "@/lib/chords/shape-store";
import { useChordQuality } from "@/lib/chords/use-chord-quality";
import { useProgressionStep } from "@/lib/chords/use-progression-step";
import { useSelectedShape } from "@/lib/chords/use-selected-shape";
import { useToolKey } from "@/lib/key-state/hooks";
import { cagedShapesFor } from "@/lib/theory/caged";
import { chordTonesFor, triad, type Quality } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { FocusCard } from "./focus-card";
import { NeckOverview } from "./neck-overview";
import { ProgressionStrip } from "./progression-strip";
import { RootPicker } from "./root-picker";
import { ShapeChips } from "./shape-chips";

export function ChordCompass() {
  const [root, setRoot] = useToolKey("chords");
  const [quality, setQuality] = useChordQuality();
  const lastSwitch = useRef<SwitchMemo>(null);
  const [progression] = useProgression();
  const steps = progressionSteps(root, progression.degrees);
  const [step, setStep] = useProgressionStep(steps);
  const current = step === null ? null : steps[step];
  // A progression chord (always major or minor here) replaces the key chord.
  const chord = current ? current.notes : triad(root, quality);
  const chordQuality: Quality = current?.quality ?? quality;
  const [shapeName, setShapeName] = useSelectedShape();
  const shapes = cagedShapesFor(chord, chordQuality);
  const index = shapes.findIndex((s) => s.name === shapeName);
  const shape = shapes[index];
  const chordName = `${formatNote(chord[0])} ${chordQuality}`;
  const chips = <ShapeChips shapes={shapes} selected={shapeName} onSelect={setShapeName} />;

  const stepShape = (direction: 1 | -1) => {
    const next = shapes[index + direction];
    if (next) setShapeName(next.name);
  };

  // Moving to another chord keeps the window in the same region of the neck.
  const goTo = (next: number | null, keyQuality: Quality = quality) => {
    const target = next === null ? cagedShapesFor(triad(root, keyQuality), keyQuality) : cagedShapesFor(steps[next].notes, steps[next].quality!);
    lastSwitch.current = null;
    setShapeName(shapeNear(target, shape));
    setStep(next);
  };

  const switchQuality = (next: Quality) => {
    if (current) {
      setQuality(next);
      goTo(null, next);
      return;
    }
    if (next === quality) return;
    const result = switchQualityShape(root, quality, shape.name, next, lastSwitch.current);
    lastSwitch.current = result.memo;
    setShapeName(result.name);
    setQuality(next);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Chord Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <RootPicker root={root} quality={quality} step={current} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <div className="flex">
          <MajorMinorToggle value={current ? null : quality} onChange={switchQuality} />
        </div>
        {steps.length > 0 && <ProgressionStrip steps={steps} selected={step} onSelect={(next) => goTo(next)} />}
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <NeckOverview
            tones={chordTonesFor(chord, chordQuality)}
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

`CLAUDE.md` — at the end of the Chord Compass architecture bullet, add:

```
  When the Circle has a progression, a strip under the switch walks its chords (`progressionSteps`,
  spelled by `diatonicChords`; vii° is skipped) without changing the key; the step is per tool in
  `nomad:chords:step:v1` and moving between chords keeps the nearest window (`shapeNear`). The Circle's
  "See on the neck" / "Scale for … major" links (`lib/circle/jumps.ts`) set the target tool's key first.
```

- [ ] **Step 4: Run the full verification**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all green; e2e 80 passed (76 + 2 tests × 2 projects), 2 skipped.

- [ ] **Step 5: Commit**

```bash
git add components/chords/chord-compass.tsx tests/e2e/connect-tools.spec.ts CLAUDE.md
git commit -m "Chord Compass: walk the Circle's progression on the neck

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
