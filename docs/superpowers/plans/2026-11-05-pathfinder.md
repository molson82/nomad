# Pathfinder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pathfinder tab: place notes on a neck, see the chord named live, compare keys, try chords, lock in a key, and see the chord ringed in Chords and Scales until Reset.

**Architecture:** Pure theory (`lib/theory/chord-names.ts`, `lib/pathfinder/paths.ts`) and pure state functions (`lib/pathfinder/state.ts`) with a persisted store and hooks, then React screens in `components/pathfinder/`. `Neck` and `FretDiagram` gain optional `rings`; the compasses read one hook.

**Tech Stack:** Next.js static export, TypeScript, Tailwind 3, Vitest + jsdom, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-05-pathfinder-design.md` (read it; copy and screen layouts come from its canvas, page "Pathfinder": boards "Chosen · 1 · Build — option B", "2 · Build path", "3 · Chords to try", "4 · Locked in", "5 · …", "Desktop", "Edge states").

## Global Constraints

- No new dependencies. Reuse `lib/theory/`; don't re-derive scales, positions, triads or shapes.
- Pathfinder is a `Page`, not a `Tool`: no key slot, never in `nomad:last-tool`, `/` never opens it.
- Pathfinder changes key state only at Lock in and Reset.
- With nothing locked, Chords and Scales render exactly as today.
- Only Reset removes the highlight.
- Rose: accent `#D9468F`, ink `#A0246A`, tint `#FBE3EF`; text on the accent is ink, not white. The ring color is fixed in both themes.
- Tap targets ≥ 44px wide where the layout allows; the large neck is about 66px per fret and 46px per string.
- At most 5 chord names. `triad(root, "minor")` means the *key's relative minor*, so never use it to build a triad from a chord root; build the `SpelledNote` triple directly.
- Each page keeps its own `<h1>` (`sr-only md:not-sr-only`, as the compasses do); chord names aren't headings.

## Review Focus

1. Corrupt or stale `nomad:pathfinder:v1` (wrong length, fret 99, partial lock): falls back to empty rather than crashing. Task 3.
2. A chord with no common name, such as C D♭ F♯: Build path still works, with roleless near-fit cards. Task 2.
3. The user unlinks by hand after Lock in, or relinks, before Reset: Reset never leaves them unexpectedly linked, and never unlinks a link they already had. Task 3.
4. An odd tuning where a chord to try has no playable triad: its chip is disabled, not a crash. Task 2 and Task 8.
5. Tuning changes while locked, including open strings moved down: rings keep pitch and stay within 0–15. Task 3.

---

### Task 1: Chord naming

**Files:**
- Create: `lib/theory/chord-names.ts`
- Test: `tests/unit/chord-names.test.ts`

**Interfaces:**
- Produces:
  - `type Frets = readonly (number | null)[]`, six entries, low → high
  - `type Voicing = { pitchClasses: number[]; bass: number }`, pitch classes sorted and unique
  - `voicingOf(frets: Frets, offsets: TuningOffsets = STANDARD_OFFSETS): Voicing | null`, null when no notes
  - `transposeVoicing(v: Voicing, semitones: number): Voicing`
  - `type ChordName = { text: string; root: number; suffix: string; bass: number }`
  - `chordNames(v: Voicing, key?: CircleKey): ChordName[]`, at most 5, best first
  - `noteList(v: Voicing, name: ChordName | null, key?: CircleKey): string[]`, formatted note names root upward, e.g. `["A","C","E","G"]`
  - `noteLabel(pitchClass: number, name: ChordName | null, key?: CircleKey): string`, one note's display name

- [ ] **Step 1: Write the failing tests**

```ts
const names = (frets: Frets, offsets?: TuningOffsets, key?: CircleKey) =>
  chordNames(voicingOf(frets, offsets)!, key).map((n) => n.text);

it("names the spec's chords", () => {
  expect(names([5, 7, 5, 5, 5, 5])).toEqual(["Am7", "C6/A"]);
  expect(names([null, 3, 2, 0, 1, 0])).toEqual(["C"]);
  expect(names([3, 2, 0, 0, 0, 3])).toEqual(["G"]);
  expect(names([0, 2, 2, 0, 0, 0])).toEqual(["Em"]);
  expect(names([5, 7, null, null, null, null])).toEqual(["A5"]);
});
it("names a first-inversion triad as a slash chord, not a 6th", () => {
  expect(names([null, 3, 2, 2, 1, 0])[0]).toBe("Am/C");
  expect(names([null, 3, 2, 2, 1, 0])).not.toContain("C6");
});
it("keeps 9ths honest", () => {
  const n = names([null, 3, 2, 0, 3, 0]);
  expect(n[0]).toBe("Cadd9");
  expect(n).not.toContain("C9");
});
it("takes the bass from the lowest pitch, not the lowest string", () => {
  expect(voicingOf([12, 0, null, null, null, null])!.bass).toBe(9);
});
it("lists a dim7's other roots", () => {
  const n = names([null, 3, 4, 2, 4, null]);
  expect(n[0]).toBe("Cdim7");
  expect(n).toHaveLength(4);
  expect(n).toContain("Adim7/C");
});
it("names one pitch class as the note, and returns nothing for no match", () => {
  expect(names([5, null, null, null, null, 5])).toEqual(["A"]);
  expect(names([8, 4, null, null, null, 2])).toEqual([]); // C D♭ F♯
});
it("spells for a key when given one", () => {
  const am7Shape = [4, 6, 4, 4, 4, 4];
  expect(names(am7Shape)[0]).toBe("A♭m7");
  expect(names(am7Shape, undefined, circleKeyFor("B"))[0]).toBe("G♯m7");
});
it("spells the note list by the primary name", () => {
  const v = voicingOf([5, 7, 5, 5, 5, 5])!;
  expect(noteList(v, chordNames(v)[0])).toEqual(["A", "C", "E", "G"]);
});
it("reads the tuning for pitch", () => {
  const dropD = [-2, 0, 0, 0, 0, 0];
  expect(voicingOf([0, null, null, null, null, null], dropD)!.bass).toBe(2);
});
it("never returns more than 5", () => {
  for (let f = 0; f < 12; f++) expect(names([f, f + 2, f + 2, f + 1, f, f + 3]).length).toBeLessThanOrEqual(5);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/chord-names.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement in `lib/theory/chord-names.ts`**

The quality table is the spec's "Chord naming" table, one row per suffix in that order, each with `required` and `optional` semitone sets (so `7♯9` requires 0, 4, 10, 3). Absolute pitch: `[40,45,50,55,59,64]` + offset + fret. A voicing with one pitch class returns the note's name with an empty suffix. Rank by bass-is-root, then fewest omitted optional tones, then table order. The root's spelling: the key's scale note when the pitch class is in `majorScale(key)`, else `NOTES[pc]` in `formatNote` glyphs. In a slash name, spell the bass the same way. Note list letters step from the root's letter by each interval's scale degree via `spellAs`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/chord-names.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/theory/chord-names.ts tests/unit/chord-names.test.ts
git commit -m "Pathfinder: name a chord from its notes and bass"
```

### Task 2: Keys and paths

**Files:**
- Create: `lib/pathfinder/paths.ts`
- Test: `tests/unit/pathfinder-paths.test.ts`

**Interfaces:**
- Consumes: Task 1's `Frets`, `Voicing`, `ChordName`, `voicingOf`, `chordNames`.
- Produces:
  - `type KeyFit = { key: Note; fit: "full" | "near"; outside: string[]; degree: number | null; role: string | null }`
  - `keysFor(v: Voicing, name: ChordName | null): KeyFit[]`, in display order
  - `type Region = { title: string; lowFret: number; highFret: number; notes: ScaleNote[] }`
  - `type PathTriad = { name: string; label: string; triad: Triad }`, with `label` like `"Am on strings 3-2-1 · fret 5"`
  - `type KeyDetails = { solo: Region; missing: string[]; scale: Region; triads: PathTriad[]; usedIn: string | null }`
  - `keyDetails(key: Note, frets: Frets, offsets: TuningOffsets = STANDARD_OFFSETS): KeyDetails`
  - `type TryChord = { name: string; role: string; degree: number; shape: { tones: ChordTone[]; lowFret: number; highFret: number; label: string } | null }`
  - `chordsToTry(key: Note, degree: number | null, rootPc: number | null, frets: Frets, offsets?: TuningOffsets): TryChord[]`
  - `progressionFor(key: Note, degree: number | null): { name: string; chords: string[] } | null`
  - `nearestTriad(notes: readonly SpelledNote[], quality: Quality, open: readonly number[], centre: number): Triad | null`

- [ ] **Step 1: Write the failing tests**

```ts
const AM7 = [5, 7, 5, 5, 5, 5];
const v = voicingOf(AM7)!;
const name = chordNames(v)[0];

it("lists the keys Am7 fits, most central role first", () => {
  expect(keysFor(v, name).map((k) => [k.key, k.role, k.fit])).toEqual([
    ["C", "vi", "full"], ["G", "ii", "full"], ["F", "iii", "full"],
  ]);
});
it("falls back to the closest keys with the outside note", () => {
  const c7s9 = voicingOf([null, 3, 2, 3, 4, null])!;
  const keys = keysFor(c7s9, chordNames(c7s9)[0]);
  expect(keys.length).toBeLessThanOrEqual(3);
  expect(keys.every((k) => k.fit === "near")).toBe(true);
  expect(keys.find((k) => k.key === "F")).toMatchObject({ outside: ["D♯"], role: "V" });
});
it("gives a nameless chord roleless near-fits", () => {
  const odd = voicingOf([8, 4, null, null, null, 2])!;
  const keys = keysFor(odd, null);
  expect(keys.length).toBeGreaterThan(0);
  expect(keys.every((k) => k.role === null)).toBe(true);
});
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
  expect(keyDetails("C", AM7, dadgad).solo.title).toBe("A minor pentatonic");
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
it("orders chords to try by role, without vii° or your root", () => {
  expect(chordsToTry("C", 6, 9, AM7).map((c) => `${c.name} ${c.role}`)).toEqual(["F IV", "G V", "C I", "Dm ii", "Em iii"]);
  expect(chordsToTry("C", null, null, AM7).map((c) => c.role)).toEqual(["I", "IV", "V", "vi", "ii", "iii"]);
});
it("shapes a chord to try near yours", () => {
  const g = chordsToTry("C", 6, 9, AM7).find((c) => c.name === "G")!;
  expect(g.shape).toMatchObject({ label: "D", lowFret: 5, highFret: 8 });
});
it("finds no triad when the strings allow none", () => {
  const cNotes = diatonicChords(circleKeyFor("C"))[0].notes;
  expect(nearestTriad(cNotes, "major", [0, 0, 0, 0, 0, 0], 5)).toBeNull();
});
it("finds a progression containing the degree, starting on it when one does", () => {
  expect(progressionFor("C", 6)).toEqual({ name: "Sensitive", chords: ["Am", "F", "C", "G"] });
  expect(progressionFor("F", 3)).toBeNull();
  expect(progressionFor("C", null)).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/pathfinder-paths.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `lib/pathfinder/paths.ts`**

Follow the spec's "Keys" and "Chords to try" rules exactly, including order tables and tie-breaks.

- Keys: iterate `CIRCLE` (ties stay in circle order). Convert to `Note` by pitch class through `NOTES`. `outside` uses `noteLabel` with the name and no key, so `D♯` matches the chord's spelling.
- Regions: `positions(key, { tonality: "minor", type })`; a chord note counts when its exact string and fret is in `p.notes`. Ties go to the closest centre to the chord's mean fret. Titles: `A minor pentatonic · Box 1`, `G-shape position`. In non-uniform tunings use `FRET_WINDOWS` with `notesInWindow(neckNotes(...))`, titles `A minor pentatonic` and `C major`.
- Triads: for each sounded root, a major and a minor triad as `SpelledNote` triples via `spellAs` (not `triad()`), kept when all three pitch classes sound. The chord's own root first, at most 2. Search all `STRING_SETS` with the open pitches; sort by same-string-and-fret notes shared, then higher set, then closest centre. Omit a triad with no shape. Label strings as `6 - set` onward, and frets as `fret 5` or `frets 3–5`.
- Chords to try: `diatonicChords(circleKeyFor(key))` minus vii° and your root. Uniform tuning: `cagedShapesFor(chord.notes, quality, open)` with `nearestByCentre` to the chord's mean fret, `label` = shape's name. Otherwise `nearestTriad`, `label` = `strings 3-2-1`; `shape` null if none. Roleless or vii°: all six chords in the order I, IV, V, vi, ii, iii, less your root.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/pathfinder-paths.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pathfinder/paths.ts tests/unit/pathfinder-paths.test.ts
git commit -m "Pathfinder: work out keys, solo regions, triads and chords to try"
```

### Task 3: State, lock, reset, highlight

**Files:**
- Create: `lib/pathfinder/state.ts` (pure), `lib/pathfinder/store.ts`, `lib/pathfinder/hooks.ts`
- Test: `tests/unit/pathfinder-state.test.ts`

**Interfaces:**
- Consumes: `Frets`, `Voicing`, `voicingOf`, `transposeVoicing`, `chordNames` (Task 1); `KeyState`, `withLinked` (`lib/key-state/store`).
- Produces, in `state.ts`:
  - `type Lock = { frets: Frets; key: Note; tuning: number[]; createdLink: boolean }`
  - `type PathfinderState = { frets: Frets; lock: Lock | null }`
  - `EMPTY_FRETS`, `EMPTY_STATE`, `PATHFINDER_KEY = "nomad:pathfinder:v1"`
  - `parsePathfinder(raw: string | null): PathfinderState`
  - `tapFret(frets: Frets, string: number, fret: number): Frets`
  - `canBuildPath(frets: Frets, offsets: TuningOffsets): boolean`, two or more distinct pitch classes
  - `lockIn(state: PathfinderState, keys: KeyState, key: Note, offsets: TuningOffsets): { pathfinder: PathfinderState; keys: KeyState }`
  - `resetPath(state: PathfinderState, keys: KeyState): { pathfinder: PathfinderState; keys: KeyState }`
  - `highlightFrets(lock: Lock, toolKey: Note, offsets: TuningOffsets): Frets`
  - `lockedVoicing(lock: Lock, currentKey: Note): Voicing`, pitch classes and bass from the locked voicing, transposed
- Produces, in `store.ts`: `pathfinderStore` (`createPersistedStore`).
- Produces, in `hooks.ts`:
  - `usePathfinder(): [PathfinderState, (next: PathfinderState) => void]`
  - `lockInKey(key: Note, offsets: TuningOffsets): void`, `resetPathfinder(): void`, applying both stores
  - `type ChordHighlight = { rings: { string: number; fret: number }[]; name: string }`
  - `useChordHighlight(tool: Tool): ChordHighlight | null`

- [ ] **Step 1: Write the failing tests**

```ts
const AM7 = [5, 7, 5, 5, 5, 5];
const std = [0, 0, 0, 0, 0, 0];
const lock = (over: Partial<Lock> = {}): Lock => ({ frets: AM7, key: "C", tuning: std, createdLink: true, ...over });
const keys = (linked: boolean, shared: Note = "C"): KeyState => ({ linked, shared, tools: { circle: "G", chords: "D", scales: "A" } });

it("places, moves and removes a note", () => {
  const one = tapFret(EMPTY_FRETS, 0, 5);
  expect(one[0]).toBe(5);
  expect(tapFret(one, 0, 7)[0]).toBe(7);
  expect(tapFret(one, 0, 5)[0]).toBeNull();
});
it("needs two distinct pitch classes to build a path", () => {
  expect(canBuildPath([5, null, null, null, null, null], std)).toBe(false);
  expect(canBuildPath([5, null, null, null, null, 5], std)).toBe(false);
  expect(canBuildPath([5, 7, null, null, null, null], std)).toBe(true);
});
it("rejects bad storage", () => {
  for (const raw of [null, "nope", "{}", '{"frets":[1,2]}', '{"frets":[99,null,null,null,null,null],"lock":null}',
    `{"frets":[null,null,null,null,null,null],"lock":{"frets":[1]}}`]) {
    expect(parsePathfinder(raw)).toEqual(EMPTY_STATE);
  }
});
it("locks in by linking on the key, and records who made the link", () => {
  const off = lockIn({ frets: AM7, lock: null }, keys(false), "C", std);
  expect(off.keys).toMatchObject({ linked: true, shared: "C", tools: { circle: "G" } });
  expect(off.pathfinder.lock).toMatchObject({ key: "C", createdLink: true });
  expect(lockIn({ frets: AM7, lock: null }, keys(true, "E"), "C", std).pathfinder.lock!.createdLink).toBe(false);
});
it("resets, unlinking only a link lock-in made and still in place", () => {
  const made = { frets: AM7, lock: lock() };
  expect(resetPath(made, keys(true, "E")).keys).toMatchObject({ linked: false, tools: { circle: "E", chords: "E", scales: "E" } });
  expect(resetPath(made, keys(false)).keys).toEqual(keys(false));
  const theirs = { frets: AM7, lock: lock({ createdLink: false }) };
  expect(resetPath(theirs, keys(true, "E")).keys).toEqual(keys(true, "E"));
  expect(resetPath(made, keys(true)).pathfinder).toEqual(EMPTY_STATE);
});
it("moves the highlight the short way with the key", () => {
  expect(highlightFrets(lock(), "E", std)).toEqual([9, 11, 9, 9, 9, 9]);
  expect(highlightFrets(lock(), "B", std)).toEqual([4, 6, 4, 4, 4, 4]);
  expect(highlightFrets(lock(), "C", std)).toEqual(AM7);
});
it("wraps a note an octave to stay on the neck", () => {
  expect(highlightFrets(lock({ frets: [0, 2, 2, null, null, null] }), "B", std)).toEqual([11, 1, 1, null, null, null]);
  expect(highlightFrets(lock({ frets: [15, 13, null, null, null, null] }), "D", std)).toEqual([5, 15, null, null, null, null]);
});
it("keeps pitch when the tuning changes", () => {
  const dropD = [-2, 0, 0, 0, 0, 0];
  expect(highlightFrets(lock(), "C", dropD)).toEqual([7, 7, 5, 5, 5, 5]);
  expect(highlightFrets(lock({ frets: [0, null, null, null, null, null] }), "C", [2, 0, 0, 0, 0, 0])).toEqual([10, null, null, null, null, null]);
});
it("names a locked chord from its locked voicing", () => {
  const v = lockedVoicing(lock({ frets: [15, 13, null, null, null, null] }), "D");
  expect(v.bass).toBe((voicingOf([15, 13, null, null, null, null])!.bass + 2) % 12);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/pathfinder-state.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`state.ts` per the spec's "State" section: tuning, then key shift −5…+6, then per-note octave wrap into 0–15. `resetPath` uses `withLinked(keys, "circle", false)` so every tool lands on the shared key. `useChordHighlight` returns null with no lock; otherwise rings from `highlightFrets(lock, useToolKey(tool)[0], offsets)`, and `name` from `chordNames(lockedVoicing(lock, toolKey), circleKeyFor(toolKey))[0]`, falling back to `noteList(...).join(" · ")` when nameless. `lockInKey` and `resetPathfinder` read `getKeyState`, then write both stores.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/pathfinder-state.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pathfinder tests/unit/pathfinder-state.test.ts
git commit -m "Pathfinder: chord state, lock in, reset and the moving highlight"
```

### Task 4: Page, tab and theme

**Files:**
- Create: `app/pathfinder/page.tsx`, `components/pathfinder/pathfinder-page.tsx` (placeholder heading for now)
- Modify: `lib/tools.ts`, `components/layout/nav-items.ts`, `components/layout/tab-bar.tsx`, `components/layout/app-shell.tsx`, `app/theme.css`, `tailwind.config.ts`
- Test: `tests/unit/app-shell.test.tsx`, `tests/unit/tools.test.ts`, `tests/e2e/layout.spec.ts`

**Interfaces:**
- Produces: `PAGES` includes `"pathfinder"`; `pathfinder` color token (`bg-pathfinder`, `stroke-pathfinder`) from `--color-pathfinder`; `PathfinderPage` from `components/pathfinder/pathfinder-page.tsx`.

- [ ] **Step 1: Write the failing tests**

In `app-shell.test.tsx`, following its setup: at `/pathfinder/`, `data-tool="pathfinder"`; the link toggle is absent when unlinked and present when linked; `nomad:last-tool` isn't written. In `tools.test.ts`: `pageFromPath("/pathfinder/")` is `"pathfinder"` and `toolFromPath("/pathfinder/")` is null. Add `/pathfinder/` to the paths in `tests/e2e/layout.spec.ts`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/app-shell.test.tsx tests/unit/tools.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- `PAGES = [...TOOLS, "pathfinder", "tuning"]`. `NAV_ITEMS` entry between Scales and Tuning: `/pathfinder/`, "Pathfinder", "Pathfinder", lucide `Route`.
- Tab bar: `min-w-16` → `min-w-0 flex-1`, so five tabs fit a 320px phone. `LinkDot` stays excluded from `tuning` only.
- App shell: `showLink = page === "pathfinder" ? linked : page !== "tuning"`, in both places.
- `theme.css`: `[data-tool="pathfinder"] { --accent-hue: 350; --accent-l: 66%; }`, and `--color-pathfinder: #D9468F` on `:root` with no dark override. Tailwind color `pathfinder: "var(--color-pathfinder)"`. Tune hue and lightness until it reads as `#D9468F`.
- `app/pathfinder/page.tsx` mirrors `app/tuning/page.tsx`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/app-shell.test.tsx tests/unit/tools.test.ts && pnpm typecheck`
Expected: PASS. Fix any exhaustive `Page` switches typecheck reports.

- [ ] **Step 5: Commit**

```bash
git add app components lib tailwind.config.ts tests
git commit -m "Pathfinder: add the page, tab and rose theme"
```

### Task 5: Rings on the shared neck and diagram

**Files:**
- Modify: `components/fretboard/neck.tsx`, `components/fretboard/fret-diagram.tsx`, `components/fretboard/marker-style.ts`, `components/chords/neck-overview.tsx`, `components/chords/chord-diagram.tsx`, `components/chords/focus-card.tsx`, `components/chords/triad-focus-card.tsx`, `components/chords/chord-compass.tsx`, `components/scales/scale-compass.tsx`
- Create: `components/fretboard/chord-legend.tsx`
- Test: `tests/unit/fretboard-neck.test.tsx`, `tests/unit/fret-diagram.test.tsx`, `tests/unit/chord-compass-highlight.test.tsx`

**Interfaces:**
- Consumes: `useChordHighlight` (Task 3).
- Produces:
  - `type Ring = { string: number; fret: number; dashed?: boolean }`, exported from `neck.tsx`
  - `Neck`: `rings?: Ring[]`; `windowLow`, `windowHigh`, `onPickFret` optional (no band drawn or click handler without them)
  - `FretDiagram`: `rings?: Ring[]`; rings outside the rows drawn are skipped
  - `MarkerKind` gains `"chosen"` (`fill #D9468F`, stroke `#161718`, text `#161718`)
  - `ChordLegend({ name }: { name: string })`, "Your chord: Am7" with a ring swatch

- [ ] **Step 1: Write the failing tests**

- `Neck` with `rings`: one `[data-ring]` per ring, each with the class `stroke-pathfinder`, painted after all `[data-tone]`; `dashed` sets `stroke-dasharray`. Without `windowLow` there is no `[data-window-low]`.
- `FretDiagram`: a ring on fret 5 draws with `lowFret={5}` and is skipped with `lowFret={8} highFret={10}`.
- `chord-compass-highlight.test.tsx`: with `EMPTY_STATE`, `ChordCompass` and `ScaleCompass` have no `[data-ring]` and no "Your chord" text. With a lock of `[5,7,5,5,5,5]` in C, linked, they show 6 rings on the neck section and "Your chord: Am7". Set linked key to E: the neck's ring on the low string moves to fret 9 and the legend reads "Your chord: C♯m7". Unlink: rings remain. Reset stores in `afterEach`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/fretboard-neck.test.tsx tests/unit/fret-diagram.test.tsx tests/unit/chord-compass-highlight.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Neck ring: `r=13`, width 4, no fill, drawn after markers. Diagram ring: `r=23`, width 4.5. Each compass calls `useChordHighlight` once and passes `rings` to every `Neck`, `NeckOverview`, `ChordDiagram` and `FretDiagram` it renders, in CAGED, triad, position and window modes, with `ChordLegend` under the neck.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit`
Expected: PASS, every existing test included.

- [ ] **Step 5: Commit**

```bash
git add components tests
git commit -m "Show your locked chord as rings in Chords and Scales"
```

### Task 6: Build screen

**Files:**
- Create: `components/pathfinder/tap-neck.tsx`, `components/pathfinder/chord-title.tsx`, `components/pathfinder/build-screen.tsx`
- Modify: `components/pathfinder/pathfinder-page.tsx`
- Test: `tests/unit/pathfinder-build.test.tsx`

**Interfaces:**
- Consumes: `usePathfinder`, `tapFret`, `canBuildPath`, `chordNames`, `noteList`, `Neck`.
- Produces:
  - `TapNeck({ frets, offsets, rootPc, onTap })`, where `onTap: (string: number, fret: number) => void`
  - `ChordTitle({ frets, offsets })`, name area and all edge states
  - `BuildScreen({ onBuild }: { onBuild: () => void })`
  - `PathfinderPage` holds `stage: "build" | "keys"`, with a locked chord always rendering the locked screen (Task 9)

- [ ] **Step 1: Write the failing tests**

```tsx
const cell = (string: string, fret: number) => screen.getByRole("button", { name: `${string} string, fret ${fret}` });

it("names the chord live as notes are placed", async () => {
  render(<BuildScreen onBuild={() => {}} />);
  expect(screen.getByText("Find your sound")).toBeVisible();
  fireEvent.click(cell("5th", 7));
  expect(screen.getByTestId("chord-name")).toHaveTextContent("E");
  fireEvent.click(cell("6th", 5));
  expect(screen.getByTestId("chord-name")).toHaveTextContent("A5");
  // … through to Am7, then:
  expect(screen.getByText("C6/A")).toBeVisible();
  expect(screen.getByText("A · C · E · G")).toBeVisible();
});
it("moves and removes a note on a string", () => { /* tap 6th fret 5, then 7, assert aria-pressed; tap 7 again, not pressed */ });
it("places an open string", () => { /* tap "6th string, open", pressed */ });
it("enables Build path from two pitch classes, and Clear empties", () => { /* disabled at 0 and 1; click calls onBuild; Clear returns to "Find your sound" */ });
it("shows notes when there is no name", () => { /* C D♭ F♯ shows "No common chord name" and an enabled Build path */ });
it("ignores the app's key", () => { /* store keys in E, linked: name unchanged, key state untouched after tapping */ });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/pathfinder-build.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`TapNeck` is one component for both sizes: a `relative` box containing a decorative `svg` (`aria-hidden`) with wood, frets, strings, inlays, fret numbers and markers, overlaid with real `<button>`s at percentage positions, `aria-pressed`, labelled `"6th string, fret 5"` or `"6th string, open"`. Geometry: open slot 40 + 15 × 66 wide, 46 per string, so 1030 × about 290. Classes: `min-w-[1030px] lg:min-w-0 w-full`, inside an `overflow-x-auto lg:overflow-visible` wrapper. Native scrolling separates swipes from taps.

`BuildScreen` per the Option B board. Below `lg` a `Neck` overview with `chosen` markers and a band tracking the visible frets (from the wrapper's `scroll` event, tapping it scrolls there), `lg:hidden`. On mount, scroll to centre the chord, or to 0 when empty. Copy for the empty, one-note, two-note and no-name states comes from "Edge states". Markers: chord root in `tonic` style, others `chosen`, note names inside. If a tuning change alters notes, the name recalculates and `frets` stay.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/pathfinder-build.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pathfinder tests/unit/pathfinder-build.test.tsx
git commit -m "Pathfinder: place notes on a large neck and name them live"
```

### Task 7: Build path screen

**Files:**
- Create: `components/pathfinder/keys-screen.tsx`, `components/pathfinder/key-card.tsx`, `components/pathfinder/path-preview.tsx`
- Modify: `components/pathfinder/pathfinder-page.tsx`
- Test: `tests/unit/pathfinder-keys.test.tsx`

**Interfaces:**
- Consumes: `keysFor`, `keyDetails`, `chordsToTry`, `progressionFor`, `Neck` with `rings`, `lockInKey`.
- Produces: `KeysScreen({ onEdit, onTry })`, `onTry: (key: Note, chord: TryChord) => void`, holding the selected key and preview mode; accepts `initialKey?: Note` so Back from Try keeps the selection.

- [ ] **Step 1: Write the failing tests**

With `frets` set to Am7:
- Heading "Am7 fits 3 keys"; cards in order C major, G major, F major with roles vi, ii, iii; C selected on arrival.
- The selected card shows "A minor pentatonic · Box 1 · frets 5–8", "Has all your notes", "G-shape position · frets 5–9", "Am on strings 3-2-1 · fret 5", "C major, A minor, both pentatonics, both blues", "Am – F – C – G", and a "Lock in C major" button.
- G's collapsed card shows "E minor pentatonic · Box 3 · frets 4–8" and "Misses your C". Clicking it opens G and collapses C, and shows `Lock in G major`.
- Preview switch: Pentatonic shows box notes as `[data-in-shape=true]` with band 5–8; Scale gives band 5–9; Triads shows the two listed triads with no band. Selection persists across keys.
- 6 rings on the preview neck in all modes.
- "Edit chord" calls `onEdit`. Key state is unchanged until Lock in; clicking it sets linked and `shared` to C.
- Near-fit: C7♯9 heading "C7♯9 fits no key: closest keys", and card text "Your D♯ falls outside this key".
- Chord to try chip with `shape: null` is `disabled`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/pathfinder-keys.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement per the "2 · Build path" and "Desktop" boards**

Phone: stacked. `lg`: preview full-width on top, then a `grid-cols-[300px_1fr]` of key cards and the selected key's details, per the Desktop board. Use one `KeyCard` with a `details` slot; on `lg` render details in the right column, below `lg` inside the selected card. Key cards are real `<button>`s with `aria-pressed`, and the details sit outside that button. Rows with nothing to show are omitted. Reuse `MARKER_STYLE` kinds in the preview through `ScaleNote.kind`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/pathfinder-keys.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pathfinder tests/unit/pathfinder-keys.test.tsx
git commit -m "Pathfinder: compare keys and preview them on the neck"
```

### Task 8: Trying a chord

**Files:**
- Create: `components/pathfinder/try-screen.tsx`
- Modify: `components/pathfinder/pathfinder-page.tsx`
- Test: `tests/unit/pathfinder-try.test.tsx`

**Interfaces:**
- Consumes: `TryChord`, `chordsToTry`, `Neck`, `FretDiagram`, `ChordDiagram`.
- Produces: `TryScreen({ keyName, chord, onChord, onBack })`.

- [ ] **Step 1: Write the failing tests**

In C with G tapped: "Trying · in C major", heading text "G", role "V"; legend "G, frets 5–8" and "Your Am7"; `[data-ring]` with `stroke-dasharray` for all 6 Am7 notes, and 4 `chosen` markers. The G chip is `aria-pressed="true"`. Clicking F switches. Clicking G again calls `onBack`, as does "Back to Am7". Lock in isn't on this screen. Nothing writes to `nomad:pathfinder:v1` (spy on `pathfinderStore.set`). From `PathfinderPage`: Back returns to the keys screen with C still selected.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/pathfinder-try.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement per the "3 · Chords to try" board**

`PathfinderPage` holds `trying: { key, chord } | null` in `useState`. Switching keys can't happen on this screen, so returning clears it.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/pathfinder-try.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pathfinder tests/unit/pathfinder-try.test.tsx
git commit -m "Pathfinder: try the key's other chords on the neck"
```

### Task 9: Locked screen and Reset

**Files:**
- Create: `components/pathfinder/locked-screen.tsx`
- Modify: `components/pathfinder/pathfinder-page.tsx`
- Test: `tests/unit/pathfinder-locked.test.tsx`

**Interfaces:**
- Consumes: `lockedVoicing`, `highlightFrets`, `resetPathfinder`, `chordNames`, `useLinked`.

- [ ] **Step 1: Write the failing tests**

- With lock Am7 in C, linked: banner "Locked in", "Am7", "vi in C major · all tools linked"; no tap buttons; links with hrefs `/chords/` and `/scales/`.
- Key state `shared: "E"`: "C♯m7" and "vi in E major".
- Unlinked: shows `lock.key` and the original name, and the line omits "all tools linked".
- Reset: back to "Find your sound", `linked` false; with `createdLink: false`, stays linked.
- `PathfinderPage` with a stored lock shows the locked screen first, regardless of stage.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:unit tests/unit/pathfinder-locked.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement per the "4 · Locked in" board**

Current key: `keyState.linked ? keyState.shared : lock.key`. Name with `chordNames(lockedVoicing(lock, key), circleKeyFor(key))`; role through `keysFor` for that key. Read-only `Neck` with `chosen` markers from `highlightFrets`, and no `onPickFret`. Copy under the links is verbatim from the board.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:unit tests/unit/pathfinder-locked.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pathfinder tests/unit/pathfinder-locked.test.tsx
git commit -m "Pathfinder: the locked screen and Reset"
```

### Task 10: End to end, docs

**Files:**
- Create: `tests/e2e/pathfinder.spec.ts`
- Modify: `tests/e2e/offline.spec.ts`, `CLAUDE.md`

- [ ] **Step 1: Write the e2e test**

Both projects, waiting on `aria-current="page"` after navigation, per CLAUDE.md:

```ts
test("from a sound to a linked key and back", async ({ page }) => { /* see the steps */ });
```

Steps: open `/pathfinder/`; tap Am7 cells; expect "Am7" and "C6/A"; Build path; expect 3 cards; click G major, then C major; click chip G, expect "Trying", Back; Lock in C major; expect "Locked in"; `aria-pressed="true"` on the link toggle (phones: visible header). Reload: still locked. Go to Chords: `[data-ring]` count ≥ 6 and "Your chord: Am7". Step key up twice to D: low-string ring moved, legend updates. Unlink: rings remain. Go to Scales: rings. Go to Pathfinder: Reset; "Find your sound"; to Chords: no `[data-ring]`, not linked.

Add a phone-only test that swiping the large neck doesn't place a note, and a test that a horizontal page scroll doesn't appear at 320px on `/pathfinder/`. In `offline.spec.ts`, click the Pathfinder link while offline and expect its heading.

- [ ] **Step 2: Run the whole suite**

Stop any `pnpm dev` or `pnpm preview` first (CLAUDE.md's stale server warning).

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all pass on iphone and desktop.

- [ ] **Step 3: Update `CLAUDE.md`**

Routes list adds `/pathfinder/`. New Architecture bullet: `lib/pathfinder/` and `components/pathfinder/`, the `nomad:pathfinder:v1` store, the highlight being computed from `lock` and never stored, `triad(root, "minor")` being the relative minor, and rings through `useChordHighlight`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e CLAUDE.md
git commit -m "Pathfinder: end-to-end coverage and docs"
```
