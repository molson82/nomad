# Minor chords in the Chord Compass — design

Date: 2026-10-14
Status: approved in conversation, awaiting spec review
Visual reference: "Nomad App Design" canvas, page "Chord Compass" —
https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm (artboard "D · Minor (key G → E minor, Dm-shape) — proposed").
Tablet and desktop keep the "Desktop · 1280" layout with the Major | Minor switch under the root picker.

## Purpose

The Circle names ii, iii and vi in every key, but the Chord Compass can only show major chords. Add minor
chords so every major and minor chord the Circle suggests can be seen on the neck.

### Success criteria

- For all 12 keys, Minor shows the relative minor triad's five CAGED shapes, correctly spelled, every note
  a chord tone, all within frets 0–15, in neck order.
- Switching Major ↔ Minor keeps you in the same region of the neck.
- With the chain link on, the key stays shared with the Circle and Scale Compass; Major/Minor does not.
- Phone-first; no horizontal page scroll from 320px to 1440px+; works offline.

### Non-goals

- Diminished (vii°), sevenths, sus and other chord qualities.
- Parallel minor (G → G minor). Minor is always the relative minor, as in Scale Compass — decided.
- Triads and inversions (removed from the Chord Compass earlier — decided).
- Links from the Circle into the Chord Compass (a later feature).

## Behaviour

**Root.** Unchanged: the disc is the major key via `useToolKey("chords")`. Minor shows the relative minor
(degree ⑥) of that key: in G, Minor shows **E minor**.

**Switch.** A **Major | Minor** segmented control under the root picker, styled like Scale Compass's
Major/Minor group (`role="group"`, `aria-label="Major or minor"`, buttons with `aria-pressed`, 44px tall).

**Header.** Major: "G major", "G · B · D", and a blue line "Relative minor: E (⑥)". Minor: "E minor",
"E · G · B", and "Relative of G major (⑥)". Same `text-relative` styling as the Scale Compass header.

**Shapes.** Five minor CAGED shapes, full forms (like the major G-shape, stretches included), slid to the
minor root exactly as the major ones are:

| Shape | Open form | Root string | Offsets `[string, fret − root fret]` |
|---|---|---|---|
| Cm | x31013 | 5th (1) | `[1,0] [2,−2] [3,−3] [4,−2] [5,0]` |
| Am | x02210 | 5th (1) | `[1,0] [2,2] [3,2] [4,1] [5,0]` |
| Gm | 310033 | 6th (0) | `[0,0] [1,−2] [2,−3] [3,−3] [4,0] [5,0]` |
| Em | 022000 | 6th (0) | `[0,0] [1,2] [2,2] [3,0] [4,0] [5,0]` |
| Dm | xx0231 | 4th (2) | `[2,0] [3,2] [4,3] [5,1]` |

A shape that would cross the nut slides up an octave (existing rule). Every minor shape then ends at
fret 14 or lower.

**Labels.** In minor the third is **♭3** (diagram markers, neck labels on md+, screen-reader text
"flat 3rd"). Chips read **Em Dm Cm Am Gm** (in neck order); the focus card title reads "Dm-shape"; the
neck and diagram aria-labels use "E minor".

**Selection.** The selected shape is still stored by letter (`nomad:chords:shape:v1`). Changing the root
keeps the letter (unchanged). Switching Major ↔ Minor picks the shape of the new quality whose window
centre is nearest the current window's centre (`nearestByCentre`, lower on a tie), so G major E-shape
(frets 3–5) becomes E minor Dm-shape (frets 2–5).

**Persistence.** Major/Minor is per tool: `nomad:chords:quality:v1`, JSON `"major" | "minor"`, default
`"major"`, via `createPersistedStore`. Bad or missing values fall back to `"major"`.

## Theory — `lib/theory/`

- `fretboard.ts`
  - `Role` gains `"♭3"`.
  - `type Quality = "major" | "minor"`.
  - `triad(root, quality)`: major → scale ①③⑤ (today's `majorTriad`); minor → the key's ⑥, ①, ③
    (`majorScale(circleKeyFor(root))`), so spelling matches the Circle and Scale Compass.
  - `toneAt` and `chordTones` take the quality so roles come out as `R ♭3 5` in minor.
  - `majorTriad` stays as a thin wrapper if other callers still need it; otherwise it goes.
- `caged.ts`
  - Templates become `Record<Quality, Record<ShapeName, …>>` with the table above for minor.
  - `cagedShapes(root, quality)`; `CagedShape` is unchanged in shape. `ShapeName` stays `C A G E D`.

## Components and state

- `lib/chords/quality-store.ts` + `use-chord-quality.ts` — the persisted store and hook, mirroring
  `shape-store.ts` / `use-selected-shape.ts`.
- `components/chords/quality-toggle.tsx` — the Major | Minor control.
- `root-picker.tsx` — takes the quality; renders the name, notes and relative line.
- `chord-compass.tsx` — reads the quality, builds shapes and tones for it, and on a quality change sets
  the shape nearest the current window.
- `shape-chips.tsx`, `focus-card.tsx`, `chord-diagram.tsx` — display names get an `m` suffix in minor;
  `ROLE_NAME` gains `"♭3": "flat 3rd"`.
- `neck-overview.tsx` — no change beyond receiving minor tones.

## Error handling

Storage failures fall back to in-memory state (existing `persisted-store` behaviour). `toneAt` still throws
on a non-chord tone; the unit tests prove no template produces one in any key.

## Testing

**Unit**
- `triad(root, "minor")` for all 12 keys equals the key's ⑥ ① ③, spelled as the Circle spells them
  (e.g. G → E G B, D♭ → B♭ D♭ F).
- `cagedShapes(root, "minor")` for all 12 keys: five shapes, neck order, every fret in 0–15, every tone's
  pitch in the minor triad, each shape contains the root on its root string.
- Em shapes in key G match the mockup: Em 0–2, Dm 2–5, Cm 4–7, Am 7–9, Gm 9–12.
- Quality store: parse `"minor"`, fall back on junk/null.
- Switching quality picks the nearest window (G major E 3–5 → E minor Dm 2–5).
- Root picker and diagram render "E minor", "Relative of G major (⑥)", and a ♭3 label.

**E2E (iphone + desktop)**
- Toggle Minor in G: header "E minor", chips Em Dm Cm Am Gm, Dm pressed.
- The choice survives a reload; the linked key in the Circle is unchanged.
