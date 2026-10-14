# Scale Compass — design

Date: 2026-10-14
Status: approved in conversation, awaiting spec review
Visual reference: "Nomad App Design" canvas, page "Scale Compass" —
https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm (artboards "Phone · G major, full scale, E-shape position"
and "Phone · Minor (E) · Blues, G-shape (open) position"). Tablet and desktop follow the Chord Compass
artboards ("Desktop · 1280" on the Chord Compass page) with the two toggles added above the overview.

## Purpose

Replace the `/scales/` placeholder with a digital Noisy Clan Decoder Scale Compass.

What the owner uses it for, in priority order:

1. **Map a scale on the neck** — pick a key and see every note, numbered by degree.
2. **Pentatonic and blues for soloing** — strip to the pentatonic, add the blue note, in the major or its
   relative minor.
3. **Some movable box shapes** — five positions up the neck to practise from.

### Success criteria

- For all 12 keys and all six views, every note on frets 0–15 is shown, correctly spelled and numbered.
- Five positions per view, in neck order, each a playable fingering that lies within 0–15.
- Switching view (major/minor, scale/pentatonic/blues) or root keeps you in the same region of the neck.
- With the chain link on, the root here is the same major key as the Circle and the Chord Compass.
- Phone-first, readable held upright; no horizontal page scroll from 320px to 1440px+; works offline.

### Non-goals

- Modes (Dorian etc.), harmonic/melodic minor, other scale families.
- Three-notes-per-string patterns.
- Parallel minor (the minor is always the relative minor — decided).
- Audio, alternate tunings, left-handed necks.

## Behaviour

**Root.** Always the major tonic (as on the device), via `useToolKey("scales")`. Minor views show its
relative minor (degree ⑥): in G, Minor shows **E minor**.

**Views** — Major / Minor × Scale / Pentatonic / Blues:

| View | Notes, numbered in that view | Name in G |
|---|---|---|
| Major · Scale | 1 2 3 4 5 6 7 | G major |
| Major · Pentatonic | 1 2 3 5 6 | G major pentatonic |
| Major · Blues | 1 2 ♭3 3 5 6 | G major blues |
| Minor · Scale | 1 2 ♭3 4 5 ♭6 ♭7 (counted from ⑥) | E minor |
| Minor · Pentatonic | 1 ♭3 4 5 ♭7 | E minor pentatonic |
| Minor · Blues | 1 ♭3 4 ♭5 5 ♭7 | E minor blues |

Minor views re-number from the minor root (decided). The blue note is one pitch — the major ♭3, which is
the minor ♭5 — spelled as the major's 3rd lowered (B♭ in G, C in A major).

**Positions.** Five per view, sorted up the neck:

- Scale views: five CAGED major-scale positions, labelled by letter (`G · E · D · C · A` for G).
- Pentatonic / Blues: the five pentatonic boxes, labelled `Box 1`–`Box 5`; titles carry the matching
  CAGED letter ("Box 1 · G-shape"). Box ↔ letter is fixed: 1 G, 2 E, 3 D, 4 C, 5 A.
- The selected position is stored as its CAGED letter in every view, so scale ↔ pentatonic and root changes
  stay in the same neck region.

## Visual design

Same structure and styling as the Chord Compass, with the Scales teal accent (`data-tool="scales"`).

**Phone, top to bottom:**

1. **Header:** the root stepper (← **G** →) and, on the right, the view's name ("G major"), its notes
   ("G A B C D E F♯") and a blue relationship line — Major views: "Relative minor: E (⑥)"; Minor views:
   "Relative of G major (⑥)".
2. **Toggles:** two segmented groups, `Major | Minor` and `Scale | Pentatonic | Blues`.
3. **Overview card:** the 0–15 neck with every note of the view (faded outside the selected position), the
   teal window over the position, then the position chips with fret ranges.
4. **Focus card:** title ("E-shape position" / "Box 1 · G-shape"), subtitle (frets, and "open position"
   when it starts at the nut), ‹ ›, a vertical diagram of the position, and a formula line under it
   (Scale views: `W · W · H · W · W · W · H` for major, `W · H · W · W · H · W · W` for minor; Pentatonic
   and Blues: the view's degrees, e.g. `1 · ♭3 · 4 · ♭5 · 5 · ♭7`).

**Markers:** ● tonic (no number); every other note a white circle with its degree; in Major views ⑥ gets a
blue ring (the relative-minor root, as on the device); the blue note is a smaller blue-filled dot labelled
♭3 (major) / ♭5 (minor). Overview markers show numbers from tablet up, like the Chord Compass.

**Diagram:** like the Chord Compass's, without × (scales use every string): base-fret label or nut;
open-string notes drawn above the nut with their markers; the screen-reader list names each note
("6th string, fret 3, G, 1").

**Tablet / desktop:** identical to the Chord Compass layout (desktop: full-width overview; chips beside the
focus card), with the toggles above the overview.

## Theory — `lib/theory/scales.ts`

Plain TypeScript on `circle.ts` / `fretboard.ts` / `spelling.ts`.

```ts
type Tonality = "major" | "minor";
type ScaleType = "scale" | "pentatonic" | "blues";
type ScaleView = { tonality: Tonality; type: ScaleType };
type ScaleNote = { string: number; fret: number; label: string; note: SpelledNote;
                   kind: "tonic" | "tone" | "relative" | "blue" };
type Position = { letter: "G" | "E" | "D" | "C" | "A"; box: 1 | 2 | 3 | 4 | 5 | null;
                  notes: ScaleNote[]; lowFret: number; highFret: number };

scaleName(root: Note, view: ScaleView): string          // "E minor blues"
scaleNotes(root: Note, view: ScaleView): SpelledNote[]  // in view order, from its tonic
neckNotes(root: Note, view: ScaleView): ScaleNote[]     // every view note on frets 0–15
positions(root: Note, view: ScaleView): Position[]      // five, sorted by lowFret then highFret
```

`relative` marks degree 6 in Major views only. `blue` marks the blue note in Blues views only.

**Full-scale positions** — templates `[string, offsets from the root fret]`, placed like the Chord Compass's
CAGED shapes (root fret = `mod(majorRootPitch − TUNING[rootString], 12)`, moved up 12 if any note would be
below 0). Strings listed 6th → 1st:

| Letter | Root string | 6th | 5th | 4th | 3rd | 2nd | 1st |
|---|---|---|---|---|---|---|---|
| G | 6th (0) | −3 −1 0 | −3 −1 0 | −3 −1 +1 | −3 −1 | −3 −2 0 | −3 −1 0 |
| E | 6th (0) | −1 0 +2 | −1 0 +2 | −1 +1 +2 | −1 +1 +2 | 0 +2 | −1 0 +2 |
| D | 4th (2) | 0 +2 +3 | 0 +2 | −1 0 +2 | −1 0 +2 | 0 +2 +3 | 0 +2 +3 |
| C | 5th (1) | −3 −2 0 | −3 −1 0 | −3 −1 0 | −3 −1 | −3 −2 0 | −3 −2 0 |
| A | 5th (1) | 0 +2 | −1 0 +2 | −1 0 +2 | −1 +1 +2 | 0 +2 +3 | 0 +2 |

For G major these give G 0–4, E 2–5, D 4–8, C 7–10, A 9–13. Minor Scale views use the same positions (same
notes) with minor numbering.

**Pentatonic boxes** — frets above `r`, the minor root on the 6th string (`r = mod(minorRootPitch − 4, 12)`);
each box takes the lowest octave that fits on the neck (down 12 whenever every fret stays ≥ 0), the same rule
as the full-scale positions, so box N always shares letter N's region:

| Box | Letter | 6th | 5th | 4th | 3rd | 2nd | 1st |
|---|---|---|---|---|---|---|---|
| 1 | G | 0 3 | 0 2 | 0 2 | 0 2 | 0 3 | 0 3 |
| 2 | E | 3 5 | 2 5 | 2 5 | 2 4 | 3 5 | 3 5 |
| 3 | D | 5 7 | 5 7 | 5 7 | 4 7 | 5 8 | 5 7 |
| 4 | C | 7 10 | 7 10 | 7 9 | 7 9 | 8 10 | 7 10 |
| 5 | A | 10 12 | 10 12 | 9 12 | 9 12 | 10 12 | 10 12 |

For E minor (G major) these give 0–3, 2–5, 4–8, 7–10, 9–12; for A minor (C major), Box 4 0–3 sits with the C-shape 0–3. Major Pentatonic uses the same boxes with major
numbering. **Blues** adds, to each box, the blue note on every string where its fret lies within that box's
`[lowFret, highFret]` (E box 1: 5th string fret 1, 3rd string fret 3).

## Components and state

**Shared fretboard pieces** — extracted from the Chord Compass into `components/fretboard/` (the Chord
Compass then uses them through thin adapters; its unit and e2e tests must stay green unchanged):

| File | From | Props (summary) |
|---|---|---|
| `neck.tsx` | `chords/neck-overview.tsx` | markers `{ string, fret, label, kind, inWindow }`, window `[low, high]`, `ariaLabel`, `onPickFret` |
| `fret-diagram.tsx` | `chords/chord-diagram.tsx` | markers for one window, `showMuted` (× on unused strings), `ariaLabel`, sr-only lines |
| `position-chips.tsx` | `chords/shape-chips.tsx` | `{ id, label, lowFret, highFret, ariaLabel }[]`, `selected`, `onSelect`, group label |
| `focus-card.tsx` | `chords/focus-card.tsx` | `title`, `subtitle`, region label, previous/next names, `onStep`, diagram + footer as children |
| `root-stepper.tsx` | arrows + disc of `chords/root-picker.tsx` | `root`, `onStep` |

Marker `kind` styling: `tonic` ink fill; `tone` white with ink ring and label; `relative` white with a
blue ring; `blue` smaller blue fill with a white label. Chord tones map to `tonic` (root) and `tone` (3, 5).

**Scale Compass** — `components/scales/scale-compass.tsx` (client root) plus `scale-header.tsx` (name, notes,
relationship line) and `view-toggles.tsx` (the two segmented groups). `app/scales/page.tsx` renders it.

**View state** — persisted `nomad:scales:view:v1` via `createPersistedStore`:
`{ tonality: Tonality; type: ScaleType; position: "G" | "E" | "D" | "C" | "A" }`, default
`{ tonality: "major", type: "scale", position: "E" }`. Each invalid field falls back to its default
independently.

- ‹ › and swipes step to the neighbouring position in neck order (no wrap); chips select directly; a neck
  tap picks the position whose window centre is nearest (ties → lower).
- Changing tonality, type or root keeps `position` (the CAGED letter).

**Clean-up.** `components/key/tool-placeholder.tsx` and `components/key/key-picker.tsx` lose their last user
and are deleted with their unit tests. The linking e2e (`tests/e2e/key-link.spec.ts`, the Circle's linking
test) moves from the Scales note picker to the root steppers and the tools' headings.

**Accessibility.** Toggles are two `role="group"` button sets with `aria-pressed`. Overview and diagram are
`role="img"` with summaries ("E minor blues across the neck, Box 1 at frets 0 to 3"); the diagram adds an
sr-only list. Chips "E-shape position, frets 2 to 5" / "Box 2, frets 2 to 5"; ‹ › "Previous position: G-shape" /
"Next position: Box 2". Targets ≥ 44px.

## Error handling

- Corrupt / old stored view → per-field defaults; storage blocked → in-memory (shared store).
- Positions outside 0–15 cannot occur (unit-tested for all 12 keys), so there is no runtime check.
- Neck taps outside the neck clamp to a fret, as in the Chord Compass.

## Testing

**Unit (Vitest):**

- `scales`: the G-major position frets and E-minor box frets from the tables; for all 12 keys, every
  full-scale position contains all 7 notes, 2–3 per string, spans ≤ 5 frets and lies in 0–15, and every box
  has exactly 2 notes per string, all 5 notes, and lies in 0–15; every templated note is in the scale;
  numbering for all six views in G; the blue note is B♭ in G and C in A; E minor blues box 1 adds exactly
  5th string fret 1 and 3rd string fret 3; `scaleName` for all six views in G.
- Shared fretboard: the existing Chord Compass unit tests pass unchanged; new tests for the `relative` and
  `blue` marker kinds and for a diagram with `showMuted` off.
- View store: default; per-field fallbacks; position kept across tonality/type changes.
- Scale components: header name and relationship line in both tonalities; toggles `aria-pressed`; chip
  labels (letters vs Box N) in neck order with ranges.

**E2E (Playwright, iPhone WebKit + desktop Chromium):**

- Default: G major, "E-shape position, frets 2 to 5", notes G A B C D E F♯, "Relative minor: E (⑥)".
- Minor: "E minor", "Relative of G major (⑥)".
- Pentatonic: chips read Box 1–5; the focus card reads "Box 2 · E-shape" (same region kept).
- Blues (minor): a blue-note marker on the 5th string at fret 1 when Box 1 is selected.
- ‹ ›, swipe and a neck tap move between positions; the root arrows keep the position letter.
- The view survives a reload.
- Rewritten linking tests (root steppers + headings) for Circle ↔ Chords ↔ Scales.
- The existing no-horizontal-scroll spec covers `/scales/`; wait for navigation to land before asserting.

**Visual check:** 390 / 834 / 1280 screenshots, light and dark, against the canvas.
