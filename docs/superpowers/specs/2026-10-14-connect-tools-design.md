# Connecting the tools — design

Date: 2026-10-14
Status: approved in conversation, awaiting spec review
Visual reference: "Nomad App Design" canvas — https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm
- Circle of Fifths page: "Proposed · progression + jumps to Chords and Scales"
- Chord Compass page: "E · Progression strip (key G, V = D, C-shape) — proposed"

## Purpose

Let the owner carry work from the Circle into the other two tools:

1. **Walk a progression on the neck** — build I–V–vi–IV in the Circle, then step through each chord's CAGED
   shapes in the Chord Compass, staying in one region of the neck.
2. **The key's scale** — jump from the Circle to the Scale Compass on the same key.

### Success criteria

- From the Circle, one tap opens the Chord Compass on the progression's first chord, in the Circle's key.
- Every major and minor chord of the progression shows its five CAGED shapes, spelled exactly as the Circle
  spells it, for all 12 keys.
- Stepping chord to chord keeps the shape window in the same region of the neck.
- Walking a progression never changes the key — linked or not, the Circle doesn't turn.
- From the Circle, one tap opens the Scale Compass on the Circle's key.

### Non-goals

- Shapes for diminished chords (vii°) — shown greyed and skipped.
- Jumps back to the Circle, or from Scales to Chords.
- Editing the progression from the Chord Compass (it is read-only there).
- Changing the Scale Compass's view (Major/Minor, Scale/Pentatonic/Blues) on a jump.
- Playback or auto-advance.

## Behaviour

### Circle of Fifths

Under the progression tray, a `nav` labelled "Open in another tool" with two links (44px+ tall):

- **See on the neck →** (subtitle "Chord Compass · G · D · Em · C") — shown only when the progression has at
  least one chord. Sets the Chord Compass key to the Circle's committed key, selects step 1 (or the first
  non-diminished step), and navigates to `/chords/`.
- **Scale for G major →** (subtitle "Scale Compass") — always shown. Sets the Scale Compass key to the
  Circle's committed key and navigates to `/scales/`.

Setting a key uses `withRoot(state, tool, root)`; when the tools are linked the key is already the same, so
nothing changes. The committed key is used (not the mid-spin display key).

### Chord Compass — progression strip

Shown whenever the Circle's progression (`nomad:circle:progression:v1`) has at least one chord; hidden
otherwise. It sits under the Major | Minor switch.

- A `section` labelled "Progression" with ‹ and › buttons and one chip per step: roman numeral above the
  chord name (I G, V D, vi Em, IV C), computed from the progression's degrees in the **Chord Compass's**
  current key. Chips are `aria-pressed` buttons, 44px+ tall; long progressions (up to 8) wrap to a second row.
- **No step selected** (default): the normal key view (Major/Minor of the key), exactly as today.
- **Tap a chip**: that chord is shown. Tap the selected chip again, or tap Major or Minor on the switch, to
  return to the key view (the switch shows neither pressed while a step is selected).
- **‹ ›** are always present and step to the previous / next non-diminished chord, disabled at the ends.
  With no step selected, › selects the first non-diminished step and ‹ is disabled.
- **vii° chips** are disabled, shown at reduced opacity, with the label "B diminished, no shapes yet".
- **Header** while a step is selected: chord name + quality ("D major", "E minor"), its notes ("D · F♯ · A"),
  and in blue "V in G major" (roman numeral + key) in place of the relative line. The disc still shows the
  key; the root arrows change the key, and the progression transposes with it while the selected step stays.
- **Neck, chips and focus card** show the selected chord's five CAGED shapes (minor templates for minor
  chords, `m` labels, ♭3).

### Shape selection while walking

The selected shape is still stored by letter (`nomad:chords:shape:v1`). Moving to a different chord (tap,
‹ ›, or returning to the key view) picks the new chord's shape whose window centre is nearest the current
window's centre (`nearestByCentre`, lower on a tie). Example: G major E-shape (frets 3–5) → step to D →
D major C-shape (frets 2–5).

### Persistence

The selected step is per tool: `nomad:chords:step:v1`, JSON integer index into the progression, or `null`
for the key view. Default `null`. A stored index that is out of range for the current progression, not an
integer, or points at a vii° step reads as `null`.

## Theory

- `lib/theory/caged.ts` — `cagedShapesFor(chord: [SpelledNote, SpelledNote, SpelledNote], quality)`:
  the same template sliding as today, from an already-spelled triad. `cagedShapes(root, quality)` becomes
  `cagedShapesFor(triad(root, quality), quality)`.
- `lib/chords/progression-chords.ts` (new) — `progressionSteps(root: Note, degrees: number[])` →
  `{ degree, roman, name, longName, quality: Quality | null, notes }[]` built from
  `diatonicChords(circleKeyFor(root))`; `quality` is `null` for vii°. Spelling therefore matches the Circle
  (F♯ major's V is C♯, not D♭).

## Components and state

- `lib/chords/step-store.ts` + `use-progression-step.ts` — the persisted step, parse/validate as above
  (validation needs the current progression, so the hook returns the validated step).
- `components/chords/progression-strip.tsx` — the strip.
- `components/chords/chord-compass.tsx` — reads the Circle's progression (`useProgression`), the step and the
  quality; when a step is selected, shapes/tones/header come from that step's chord; selection changes go
  through one function that also re-picks the nearest shape.
- `components/chords/root-picker.tsx` — accepts an optional step chord to render the "V in G major" header.
- `components/circle/tool-jumps.tsx` — the two links; `circle-of-fifths.tsx` renders it under the tray.

## Error handling

Bad stored steps read as `null` (key view). Storage failures fall back to in-memory state
(`persisted-store`). A progression cleared in the Circle hides the strip and the Chord Compass shows the key
view.

## Testing

**Unit**
- `progressionSteps` for all 12 keys and degrees 1–7: names and notes equal the Circle's `diatonicChords`;
  vii° has `quality: null`.
- `cagedShapesFor` for every non-diminished chord of every key: five shapes, all tones in the chord, 0–15.
- Step store: valid index; `null`; out of range, junk and vii° → `null`.
- Stepping keeps the region (G E-shape 3–5 → D C-shape 2–5); ‹ › skip vii° and stop at the ends.
- Strip: chips, pressed state, disabled vii°, tap-again deselects. Header: "D major", "D · F♯ · A",
  "V in G major". Tool jumps: link visibility and the key they set.

**E2E (iphone + desktop)**
- In the Circle, pick a common progression, tap "See on the neck": Chord Compass shows step 1 and the strip;
  › walks to the next chord; the Circle's key is unchanged afterwards.
- "Scale for … major" opens the Scale Compass on the Circle's key with the tools unlinked.
