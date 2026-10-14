# Minor Chords in the Chord Compass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Major | Minor switch to the Chord Compass that shows the key's relative minor triad in five minor CAGED shapes.

**Architecture:** The theory layer gains a `Quality` (`"major" | "minor"`): `triad`, `toneAt`, `chordTones` and `cagedShapes` take it, defaulting to `"major"` so existing callers keep working. Minor templates sit beside the major ones. The UI adds a per-tool persisted quality store, a shared `MajorMinorToggle` (extracted from Scale Compass), and a relative line in the root picker. Switching quality picks the shape nearest the current window.

**Tech Stack:** Next 15 static export, React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (jsdom), Playwright (`iphone` WebKit + `desktop` Chromium), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-minor-chords-design.md`

## Global Constraints

- Minor is always the relative minor (degree ⑥ of the major key) — never the parallel minor.
- The disc and the shared key stay the major key (`useToolKey("chords")`); Major/Minor is per tool: `nomad:chords:quality:v1`, JSON `"major" | "minor"`, default `"major"`.
- Spelling comes from `majorScale(circleKeyFor(root))` so it matches the Circle and Scale Compass. Display through `formatNote`.
- Shape letters stay `C A G E D` and are stored by letter in `nomad:chords:shape:v1`; minor display names add `m` (Cm, Am, Gm, Em, Dm).
- Minor third role is `"♭3"`; screen-reader name "flat 3rd".
- All shapes lie within frets 0–15; neck order (sorted by `lowFret`, then `highFret`).
- Switch: `role="group"`, `aria-label="Major or minor"`, buttons with `aria-pressed`, 44px tall.
- Header copy: Major → "Relative minor: E (⑥)"; Minor → "Relative of G major (⑥)" (G key example).
- No new dependencies.

## Review Focus

1. Round trip Major → Minor → Major should land back on the original region, not drift (test in Task 2).
2. Keys whose Circle spelling is flat (D♭, A♭, …) must spell the minor from that key (D♭ → B♭ D♭ F), never as A♯ (test in Task 1).
3. A neck tap in minor must select a minor shape by its window, same as major (test in Task 2 via `nearestShape` on minor shapes).
4. Scale Compass's Major/Minor control must behave exactly as before after the toggle is extracted (existing `view-toggles.test.tsx` stays green, Task 3).
5. Storage junk in `nomad:chords:quality:v1` must fall back to Major, not crash (test in Task 2).

---

### Task 1: Minor theory — triads, roles and minor CAGED shapes

**Files:**
- Modify: `lib/theory/fretboard.ts`
- Modify: `lib/theory/caged.ts`
- Test: `tests/unit/fretboard.test.ts`, `tests/unit/caged.test.ts`

**Interfaces:**
- Produces:
  - `type Quality = "major" | "minor"` (fretboard.ts)
  - `type Role = "R" | "♭3" | "3" | "5"`
  - `triad(root: Note, quality?: Quality): [SpelledNote, SpelledNote, SpelledNote]` (replaces `majorTriad`, which is deleted)
  - `toneAt(chord: readonly SpelledNote[], string: number, fret: number, quality?: Quality): ChordTone`
  - `chordTones(root: Note, quality?: Quality): ChordTone[]`
  - `cagedShapes(root: Note, quality?: Quality): CagedShape[]`
  - `CagedShape` gains `label: string` — `"D"` in major, `"Dm"` in minor. (Ruling vs spec "CagedShape is unchanged": one display field saves threading `quality` through four components.)

- [ ] **Step 1: Write the failing tests**

In `tests/unit/fretboard.test.ts`, replace every `majorTriad` with `triad` (import included):

```bash
sed -i '' 's/majorTriad/triad/g' tests/unit/fretboard.test.ts
```

Then append:

```ts
describe("triad (minor)", () => {
  it("is the key's relative minor, spelled as the Circle spells the key", () => {
    expect(triad("G", "minor").map(formatNote).join(" ")).toBe("E G B");
    expect(triad("C", "minor").map(formatNote).join(" ")).toBe("A C E");
    expect(triad("C#", "minor").map(formatNote).join(" ")).toBe("B♭ D♭ F");
  });

  it("matches the major scale's ⑥ ① ③ in every key", () => {
    for (const root of NOTES) {
      const s = majorScale(circleKeyFor(root));
      expect(triad(root, "minor")).toEqual([s[5], s[0], s[2]]);
    }
  });
});

describe("chordTones (minor)", () => {
  it("labels the minor third ♭3", () => {
    const roles = new Set(chordTones("G", "minor").map((t) => t.role));
    expect([...roles].sort()).toEqual(["5", "R", "♭3"]);
    expect(toneAt(triad("G", "minor"), 5, 3, "minor")).toMatchObject({ role: "♭3" }); // high E fret 3 = G
  });
});
```

Add the imports this needs at the top of the file (keep the existing ones):

```ts
import { NOTES } from "@/lib/theory/notes";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
```

In `tests/unit/caged.test.ts`, append:

```ts
describe("cagedShapes (minor)", () => {
  const minor = (root: (typeof NOTES)[number]) => cagedShapes(root, "minor");
  const named = (root: (typeof NOTES)[number], name: string) => minor(root).find((s) => s.name === name)!;

  it("places E minor's five shapes up the neck for the key of G", () => {
    expect(minor("G").map((s) => `${s.label} ${s.lowFret}–${s.highFret}`).join(" · ")).toBe(
      "Em 0–2 · Dm 2–5 · Cm 4–7 · Am 7–9 · Gm 9–12",
    );
    expect(frets(named("G", "E"))).toEqual([0, 2, 2, 0, 0, 0]);
    expect(frets(named("G", "D"))).toEqual([null, null, 2, 4, 5, 3]);
    expect(frets(named("G", "C"))).toEqual([null, 7, 5, 4, 5, 7]);
    expect(frets(named("G", "A"))).toEqual([null, 7, 9, 9, 8, 7]);
    expect(frets(named("G", "G"))).toEqual([12, 10, 9, 9, 12, 12]);
    expect(named("G", "E").tones.map((t) => t.role).join(" ")).toBe("R 5 R ♭3 5 R");
  });

  it("puts A minor's Am-shape at the open chord x02210 in the key of C", () => {
    expect(frets(named("C", "A"))).toEqual([null, 0, 2, 2, 1, 0]);
  });

  it("keeps major labels as bare letters", () => {
    expect(cagedShapes("G").map((s) => s.label)).toEqual(["G", "E", "D", "C", "A"]);
  });

  it("every key's minor shapes lie within 0–15, are complete and in neck order", () => {
    const sizes: Record<string, number> = { C: 5, A: 5, G: 6, E: 6, D: 4 };
    for (const root of NOTES) {
      const shapes = minor(root);
      expect(new Set(shapes.map((s) => s.name)).size).toBe(5);
      const tones = new Set(chordTones(root, "minor").map((t) => `${t.string}:${t.fret}:${t.role}`));
      for (const shape of shapes) {
        expect(shape.tones).toHaveLength(sizes[shape.name]);
        expect(shape.lowFret).toBeGreaterThanOrEqual(0);
        expect(shape.highFret).toBeLessThanOrEqual(15);
        expect(shape.tones.find((t) => t.string === shape.rootString)!.role).toBe("R");
        for (const t of shape.tones) expect(tones.has(`${t.string}:${t.fret}:${t.role}`)).toBe(true);
      }
      for (let i = 1; i < shapes.length; i++) expect(shapes[i].lowFret).toBeGreaterThanOrEqual(shapes[i - 1].lowFret);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:unit tests/unit/fretboard.test.ts tests/unit/caged.test.ts`
Expected: FAIL — `triad` is not exported / `cagedShapes(root, "minor")` returns major shapes, `label` undefined.

- [ ] **Step 3: Implement the theory**

`lib/theory/fretboard.ts` — replace from `export type Role` to the end of the file:

```ts
export type Quality = "major" | "minor";
export type Role = "R" | "♭3" | "3" | "5";
export type ChordTone = { string: number; fret: number; role: Role; note: SpelledNote };

const ROLES: Record<Quality, Role[]> = { major: ["R", "3", "5"], minor: ["R", "♭3", "5"] };

// Spelled as the Circle spells the key (C# → D♭ F A♭). Minor is the key's relative minor: ⑥ ① ③.
export function triad(root: Note, quality: Quality = "major"): [SpelledNote, SpelledNote, SpelledNote] {
  const scale = majorScale(circleKeyFor(root));
  return quality === "major" ? [scale[0], scale[2], scale[4]] : [scale[5], scale[0], scale[2]];
}

export function toneAt(chord: readonly SpelledNote[], string: number, fret: number, quality: Quality = "major"): ChordTone {
  const pitch = (TUNING[string] + fret) % 12;
  const i = chord.findIndex((note) => pitchClassOf(note) === pitch);
  if (i < 0) throw new Error(`string ${string} fret ${fret} is not a chord tone`);
  return { string, fret, role: ROLES[quality][i], note: chord[i] };
}

export function chordTones(root: Note, quality: Quality = "major"): ChordTone[] {
  const chord = triad(root, quality);
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

`lib/theory/caged.ts` — full file:

```ts
import type { Note } from "@/lib/theory/notes";
import { TUNING, toneAt, triad, type ChordTone, type Quality } from "./fretboard";
import { mod, pitchClassOf } from "./spelling";

export type ShapeName = "C" | "A" | "G" | "E" | "D";
export const SHAPE_NAMES: readonly ShapeName[] = ["C", "A", "G", "E", "D"];

export type CagedShape = {
  name: ShapeName;
  label: string; // "D" in major, "Dm" in minor
  rootString: number;
  tones: ChordTone[]; // low string → high string
  lowFret: number;
  highFret: number;
};

type Template = { rootString: number; offsets: [number, number][] };

// The five open-chord shapes as [string, fret offset from the root fret].
const TEMPLATES: Record<Quality, Record<ShapeName, Template>> = {
  major: {
    C: { rootString: 1, offsets: [[1, 0], [2, -1], [3, -3], [4, -2], [5, -3]] },
    A: { rootString: 1, offsets: [[1, 0], [2, 2], [3, 2], [4, 2], [5, 0]] },
    G: { rootString: 0, offsets: [[0, 0], [1, -1], [2, -3], [3, -3], [4, -3], [5, 0]] },
    E: { rootString: 0, offsets: [[0, 0], [1, 2], [2, 2], [3, 1], [4, 0], [5, 0]] },
    D: { rootString: 2, offsets: [[2, 0], [3, 2], [4, 3], [5, 2]] },
  },
  minor: {
    C: { rootString: 1, offsets: [[1, 0], [2, -2], [3, -3], [4, -2], [5, 0]] }, // x31013
    A: { rootString: 1, offsets: [[1, 0], [2, 2], [3, 2], [4, 1], [5, 0]] }, // x02210
    G: { rootString: 0, offsets: [[0, 0], [1, -2], [2, -3], [3, -3], [4, 0], [5, 0]] }, // 310033
    E: { rootString: 0, offsets: [[0, 0], [1, 2], [2, 2], [3, 0], [4, 0], [5, 0]] }, // 022000
    D: { rootString: 2, offsets: [[2, 0], [3, 2], [4, 3], [5, 1]] }, // xx0231
  },
};

export function cagedShapes(root: Note, quality: Quality = "major"): CagedShape[] {
  const chord = triad(root, quality);
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

Update the two app callers of the deleted `majorTriad` so typecheck passes (behaviour unchanged until Task 4):

```bash
sed -i '' 's/majorTriad/triad/g' components/chords/chord-compass.tsx components/chords/root-picker.tsx
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test:unit tests/unit/fretboard.test.ts tests/unit/caged.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/theory tests/unit/fretboard.test.ts tests/unit/caged.test.ts components/chords
git commit -m "Theory: minor triads and minor CAGED shapes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Quality store and the quality-switch rule

**Files:**
- Create: `lib/chords/quality-store.ts`, `lib/chords/use-chord-quality.ts`
- Test: `tests/unit/quality-store.test.ts`

**Interfaces:**
- Consumes: `cagedShapes(root, quality)`, `Quality`, `CagedShape` (Task 1); `nearestShape(shapes, fret)` (existing, `lib/chords/shape-store.ts`); `createPersistedStore(key, parse, fallback)` (existing).
- Produces:
  - `QUALITY_KEY = "nomad:chords:quality:v1"`, `DEFAULT_QUALITY: Quality = "major"`
  - `parseQuality(raw: string | null): Quality`
  - `shapeForQuality(root: Note, from: CagedShape, to: Quality): ShapeName`
  - `qualityStore` (PersistedStore<Quality>)
  - `useChordQuality(): [Quality, (q: Quality) => void]`

- [ ] **Step 1: Write the failing test**

`tests/unit/quality-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_QUALITY, parseQuality, shapeForQuality } from "@/lib/chords/quality-store";
import { nearestShape } from "@/lib/chords/shape-store";
import { cagedShapes } from "@/lib/theory/caged";

const shape = (root: "G" | "C", quality: "major" | "minor", name: string) =>
  cagedShapes(root, quality).find((s) => s.name === name)!;

describe("parseQuality", () => {
  it("reads a stored quality", () => {
    expect(parseQuality(JSON.stringify("minor"))).toBe("minor");
    expect(parseQuality(JSON.stringify("major"))).toBe("major");
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["unknown value", JSON.stringify("dim")],
    ["a number", "3"],
  ])("falls back to major for %s", (_label, raw) => {
    expect(parseQuality(raw)).toBe(DEFAULT_QUALITY);
    expect(DEFAULT_QUALITY).toBe("major");
  });
});

describe("shapeForQuality", () => {
  it("keeps the region: G major E-shape (3–5) becomes the E minor Dm-shape (2–5)", () => {
    expect(shapeForQuality("G", shape("G", "major", "E"), "minor")).toBe("D");
  });

  it("round-trips back to where it started", () => {
    expect(shapeForQuality("G", shape("G", "minor", "D"), "major")).toBe("E");
    expect(shapeForQuality("C", shape("C", "major", "E"), "minor")).toBe("D"); // C E-shape 8–10 → A minor Dm 7–10
    expect(shapeForQuality("C", shape("C", "minor", "D"), "major")).toBe("E");
  });

  it("lets a neck tap pick minor shapes by window", () => {
    const em = cagedShapes("G", "minor"); // Em 0–2 · Dm 2–5 · Cm 4–7 · Am 7–9 · Gm 9–12
    expect(nearestShape(em, 0)).toBe("E");
    expect(nearestShape(em, 8)).toBe("A");
    expect(nearestShape(em, 15)).toBe("G");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/quality-store.test.ts`
Expected: FAIL — cannot resolve `@/lib/chords/quality-store`.

- [ ] **Step 3: Implement**

`lib/chords/quality-store.ts`:

```ts
import { createPersistedStore } from "@/lib/storage/persisted-store";
import { cagedShapes, type CagedShape, type ShapeName } from "@/lib/theory/caged";
import type { Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { nearestShape } from "./shape-store";

// Per tool: the shared key stays the major key; Minor shows its relative minor.
export const QUALITY_KEY = "nomad:chords:quality:v1";
export const DEFAULT_QUALITY: Quality = "major";

export function parseQuality(raw: string | null): Quality {
  if (!raw) return DEFAULT_QUALITY;
  try {
    const value = JSON.parse(raw);
    return value === "major" || value === "minor" ? value : DEFAULT_QUALITY;
  } catch {
    return DEFAULT_QUALITY;
  }
}

// Switching quality stays in the same region of the neck.
export function shapeForQuality(root: Note, from: CagedShape, to: Quality): ShapeName {
  return nearestShape(cagedShapes(root, to), (from.lowFret + from.highFret) / 2);
}

export const qualityStore = createPersistedStore(QUALITY_KEY, parseQuality, DEFAULT_QUALITY);
```

`lib/chords/use-chord-quality.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";
import type { Quality } from "@/lib/theory/fretboard";
import { qualityStore } from "./quality-store";

export function useChordQuality(): [Quality, (quality: Quality) => void] {
  const quality = useSyncExternalStore(qualityStore.subscribe, qualityStore.get, qualityStore.getServer);
  return [quality, qualityStore.set];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/quality-store.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/chords/quality-store.ts lib/chords/use-chord-quality.ts tests/unit/quality-store.test.ts
git commit -m "Chord Compass: persisted major/minor and the region-keeping switch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: UI pieces — shared toggle, header, labels

**Files:**
- Create: `components/fretboard/major-minor-toggle.tsx`
- Modify: `components/scales/view-toggles.tsx` (use the shared toggle)
- Modify: `components/chords/root-picker.tsx`, `components/chords/shape-chips.tsx`, `components/chords/focus-card.tsx`, `components/chords/chord-diagram.tsx`
- Test: `tests/unit/major-minor-toggle.test.tsx` (new), `tests/unit/root-picker.test.tsx`, `tests/unit/shape-chips.test.tsx`, `tests/unit/focus-card.test.tsx`, `tests/unit/chord-diagram.test.tsx`

**Interfaces:**
- Consumes: `Quality`, `triad`, `cagedShapes(root, quality)`, `CagedShape.label` (Task 1).
- Produces:
  - `MajorMinorToggle({ value: Quality; onChange: (q: Quality) => void })`
  - `RootPicker({ root: Note; quality: Quality; onStep })`
  - Chips, focus card and diagram read `shape.label` for names.

- [ ] **Step 1: Write the failing tests**

`tests/unit/major-minor-toggle.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";

describe("MajorMinorToggle", () => {
  it("presses the current quality and reports a change", () => {
    const onChange = vi.fn();
    render(<MajorMinorToggle value="minor" onChange={onChange} />);
    const group = screen.getByRole("group", { name: "Major or minor" });
    expect(within(group).getByRole("button", { name: "Minor" })).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: "Major" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(within(group).getByRole("button", { name: "Major" }));
    expect(onChange).toHaveBeenCalledWith("major");
  });
});
```

`tests/unit/root-picker.test.tsx` — change the two existing renders to pass `quality="major"`, then add:

```tsx
  it("names the relative minor in major", () => {
    render(<RootPicker root="G" quality="major" onStep={() => {}} />);
    expect(screen.getByText("Relative minor: E (⑥)")).toBeInTheDocument();
  });

  it("shows the relative minor chord in minor", () => {
    render(<RootPicker root="G" quality="minor" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "E minor" })).toBeInTheDocument();
    expect(screen.getByText("E · G · B")).toBeInTheDocument();
    expect(screen.getByText("Relative of G major (⑥)")).toBeInTheDocument();
  });

  it("spells a flat key's relative minor with flats", () => {
    render(<RootPicker root="C#" quality="minor" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "B♭ minor" })).toBeInTheDocument();
    expect(screen.getByText("B♭ · D♭ · F")).toBeInTheDocument();
  });
```

`tests/unit/shape-chips.test.tsx` — append inside the describe:

```tsx
  it("names minor shapes with an m", () => {
    render(<ShapeChips shapes={cagedShapes("G", "minor")} selected="D" onSelect={() => {}} />);
    const chips = within(screen.getByRole("group", { name: "CAGED shapes up the neck" })).getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "Em-shape, frets 0 to 2",
      "Dm-shape, frets 2 to 5",
      "Cm-shape, frets 4 to 7",
      "Am-shape, frets 7 to 9",
      "Gm-shape, frets 9 to 12",
    ]);
    expect(chips[1]).toHaveAttribute("aria-pressed", "true");
    expect(chips[1]).toHaveTextContent("Dm2–5");
  });
```

`tests/unit/focus-card.test.tsx` — append inside the describe:

```tsx
  it("titles minor shapes with an m", () => {
    const minor = cagedShapes("G", "minor");
    const dm = minor.find((s) => s.name === "D")!;
    render(<FocusCard shape={dm} shapes={minor} chordName="E minor" onStep={() => {}} />);
    expect(screen.getByRole("region", { name: "Dm-shape, frets 2 to 5" })).toBeInTheDocument();
    expect(screen.getByText("frets 2–5 · root on the 4th string")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous shape: Em-shape" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next shape: Cm-shape" })).toBeEnabled();
  });
```

`tests/unit/chord-diagram.test.tsx` — append inside the describe:

```tsx
  it("labels the minor third ♭3 and reads it as flat 3rd", () => {
    const dm = cagedShapes("G", "minor").find((s) => s.name === "D")!;
    render(<ChordDiagram shape={dm} chordName="E minor" />);
    expect(screen.getByRole("img", { name: "E minor, Dm-shape, frets 2 to 5" })).toBeInTheDocument();
    expect(screen.getByText("♭3")).toBeInTheDocument();
    expect(screen.getByText("1st string, fret 3, G, flat 3rd")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:unit tests/unit/major-minor-toggle.test.tsx tests/unit/root-picker.test.tsx tests/unit/shape-chips.test.tsx tests/unit/focus-card.test.tsx tests/unit/chord-diagram.test.tsx`
Expected: FAIL — missing toggle module, no relative line / "E minor", labels "D-shape" not "Dm-shape", no "flat 3rd".

- [ ] **Step 3: Implement**

`components/fretboard/major-minor-toggle.tsx` (moved from the Scale Compass's tonality group, same classes):

```tsx
import type { Quality } from "@/lib/theory/fretboard";

const SEGMENT = "min-h-11 px-3.5 font-display text-[15px] font-semibold";
const OPTIONS: [Quality, string][] = [["major", "Major"], ["minor", "Minor"]];

export function MajorMinorToggle({ value, onChange }: { value: Quality; onChange: (quality: Quality) => void }) {
  return (
    <div role="group" aria-label="Major or minor" className="flex overflow-hidden rounded-full border-[1.5px] border-text-primary">
      {OPTIONS.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`${SEGMENT} ${active ? "bg-text-primary text-bg" : "text-text-primary"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

`components/scales/view-toggles.tsx` — delete `TONALITIES` and the first `role="group"` block; render the shared toggle in its place:

```tsx
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";
// ...
    <div className="flex flex-wrap gap-2">
      <MajorMinorToggle value={view.tonality} onChange={(tonality) => onChange({ tonality })} />
      <div role="group" aria-label="Scale type" ...>  {/* unchanged */}
```

(`Tonality` is no longer used in this file; drop it from the import.)

`components/chords/root-picker.tsx` — full file:

```tsx
import { RootStepper } from "@/components/fretboard/root-stepper";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import { triad, type Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

interface RootPickerProps {
  root: Note;
  quality: Quality;
  onStep: (direction: 1 | -1) => void;
}

export function RootPicker({ root, quality, onStep }: RootPickerProps) {
  const key = majorScale(circleKeyFor(root));
  const chord = triad(root, quality);
  const relation =
    quality === "major"
      ? `Relative minor: ${formatNote(key[5])} (⑥)`
      : `Relative of ${formatNote(key[0])} major (⑥)`;
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={formatNote(key[0])} onStep={onStep} />
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">
          {formatNote(chord[0])} {quality}
        </h2>
        <p className="text-[13px] font-semibold">{chord.map(formatNote).join(" · ")}</p>
        <p className="text-xs font-semibold text-relative">{relation}</p>
      </div>
    </div>
  );
}
```

`components/chords/shape-chips.tsx` — in the `items` map use the label:

```tsx
      items={shapes.map((s) => ({
        id: s.name,
        label: s.label,
        sub: `${s.lowFret}–${s.highFret}`,
        ariaLabel: `${s.label}-shape, frets ${s.lowFret} to ${s.highFret}`,
      }))}
```

`components/chords/focus-card.tsx` — replace every `shape.name`, `previous.name`, `next.name` used in text with `.label` (the `findIndex` by `s.name === shape.name` stays):

```tsx
      regionLabel={`${shape.label}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      title={`${shape.label}-shape`}
      subtitle={`frets ${shape.lowFret}–${shape.highFret} · root on the ${STRING_ORDINALS[shape.rootString]} string`}
      previousLabel={previous ? `Previous shape: ${previous.label}-shape` : "Previous shape"}
      nextLabel={next ? `Next shape: ${next.label}-shape` : "Next shape"}
```

`components/chords/chord-diagram.tsx`:

```tsx
const ROLE_NAME: Record<Role, string> = { R: "root", "♭3": "flat 3rd", "3": "3rd", "5": "5th" };
// ...
      ariaLabel={`${chordName}, ${shape.label}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
```

`components/chords/neck-overview.tsx` — its aria-label uses `shape.name`; change to `shape.label`:

```tsx
      ariaLabel={`${chordName} across the neck, ${shape.label}-shape at frets ${shape.lowFret} to ${shape.highFret}`}
```

- [ ] **Step 4: Run tests, the Scale Compass toggle tests, and typecheck**

Run: `pnpm test:unit tests/unit/major-minor-toggle.test.tsx tests/unit/root-picker.test.tsx tests/unit/shape-chips.test.tsx tests/unit/focus-card.test.tsx tests/unit/chord-diagram.test.tsx tests/unit/view-toggles.test.tsx tests/unit/neck-overview.test.tsx && pnpm typecheck`
Expected: PASS. Typecheck fails only in `components/chords/chord-compass.tsx` (missing `quality` prop on `RootPicker`) — fixed in Task 4. If so, pass `quality="major"` there now to keep the build green:

```tsx
        <RootPicker root={root} quality="major" onStep={(direction) => setRoot(stepNote(root, direction))} />
```

Re-run `pnpm typecheck`. Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components tests/unit
git commit -m "Chord Compass UI: shared Major/Minor toggle, relative line, minor labels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Wire it up — Chord Compass in minor, e2e, docs

**Files:**
- Modify: `components/chords/chord-compass.tsx`
- Modify: `tests/e2e/chord-compass.spec.ts`
- Modify: `CLAUDE.md` (Chord Compass architecture line)

**Interfaces:**
- Consumes: `useChordQuality()`, `shapeForQuality(root, from, to)` (Task 2); `MajorMinorToggle`, `RootPicker({ root, quality, onStep })` (Task 3); `cagedShapes(root, quality)`, `chordTones(root, quality)`, `triad(root, quality)` (Task 1).

- [ ] **Step 1: Write the failing e2e test**

Append to `tests/e2e/chord-compass.spec.ts`:

```ts
test("Minor shows the relative minor in the same region, and survives a reload", async ({ page }) => {
  await focus(page, "E-shape, frets 8 to 10").waitFor(); // C major, E-shape
  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Minor" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "A minor" })).toBeVisible();
  await expect(page.getByText("Relative of C major (⑥)")).toBeVisible();
  await expect(focus(page, "Dm-shape, frets 7 to 10")).toBeVisible();
  await expect(chip(page, "Am-shape, frets 0 to 2")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: "A minor" })).toBeVisible();
  await expect(focus(page, "Dm-shape, frets 7 to 10")).toBeVisible();

  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Major" }).click();
  await expect(heading(page, "C")).toBeVisible();
  await expect(focus(page, "E-shape, frets 8 to 10")).toBeVisible();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec playwright test tests/e2e/chord-compass.spec.ts --project=iphone`
Expected: the new test FAILS (no "Major or minor" group on the page); existing tests pass.

- [ ] **Step 3: Implement**

`components/chords/chord-compass.tsx` — changes:

```tsx
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";
import { shapeForQuality } from "@/lib/chords/quality-store";
import { nearestShape } from "@/lib/chords/shape-store";
import { useChordQuality } from "@/lib/chords/use-chord-quality";
import { useSelectedShape } from "@/lib/chords/use-selected-shape";
import { useToolKey } from "@/lib/key-state/hooks";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones, triad, type Quality } from "@/lib/theory/fretboard";
// ...

export function ChordCompass() {
  const [root, setRoot] = useToolKey("chords");
  const [quality, setQuality] = useChordQuality();
  const [shapeName, setShapeName] = useSelectedShape();
  const shapes = cagedShapes(root, quality);
  const index = shapes.findIndex((s) => s.name === shapeName);
  const shape = shapes[index];
  const chordName = `${formatNote(triad(root, quality)[0])} ${quality}`;
  // ...

  const switchQuality = (next: Quality) => {
    if (next === quality) return;
    setShapeName(shapeForQuality(root, shape, next));
    setQuality(next);
  };
```

In the JSX, pass the quality to the picker, add the toggle right under it (wrapped in `flex` so it doesn't stretch across the `flex-col` column), and give the overview minor tones:

```tsx
        <RootPicker root={root} quality={quality} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <div className="flex">
          <MajorMinorToggle value={quality} onChange={switchQuality} />
        </div>
        <section aria-label="Whole neck" ...>
          <NeckOverview
            tones={chordTones(root, quality)}
            ...
```

`CLAUDE.md` — in the Chord Compass architecture bullet, replace `major chords only, frets 0–15` with:

```
major and minor chords (Minor is the key's relative minor, as in Scale Compass; stored per tool in
  `nomad:chords:quality:v1`), frets 0–15
```

and after "so it survives root changes." add: "Switching Major ↔ Minor picks the shape nearest the current window."

- [ ] **Step 4: Run the full verification**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all green — unit count rises from 213; e2e 76 passed, 2 skipped.

- [ ] **Step 5: Commit**

```bash
git add components/chords/chord-compass.tsx tests/e2e/chord-compass.spec.ts CLAUDE.md
git commit -m "Chord Compass: Major | Minor switch keeps your place on the neck

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
