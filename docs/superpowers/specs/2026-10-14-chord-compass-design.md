# Chord Compass — design

Date: 2026-10-14
Status: approved in conversation, awaiting spec review
Visual reference: "Nomad App Design" canvas, page "Chord Compass" —
https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm (option C "Neck overview + shape focus" was chosen;
A and B are kept for reference; the triads and desktop artboards were added with this spec)

## Purpose

Replace the `/chords/` placeholder with a digital Noisy Clan Decoder Chord Compass.

What the owner uses it for, in priority order:

1. **Map the neck for a chord** — pick a root and see every root, 3rd and 5th of its major chord.
2. **Learn CAGED** — see each of the five shapes inside that map and how they link up the neck.
3. **Some triads and inversions** — three-note grips on string sets, root position / 1st / 2nd inversion.

### Success criteria

- For any of the 12 roots, the overview shows every chord tone on frets 0–15, correctly spelled.
- The five CAGED shapes are placed correctly for every root, listed in neck order, each complete on the neck.
- Triads mode lists every root-position, 1st- and 2nd-inversion grip on each of the four string sets.
- The selected shape (or string set + inversion) survives a root change and a reload.
- With the chain link on, the root here follows the Circle and the other tools.
- Readable and usable on a phone held upright; no horizontal page scroll from 320px to 1440px+.

### Non-goals

- Chord qualities other than major (the device is major-only; minor, 7ths etc. are a later spec).
- Audio.
- Alternate tunings, left-handed necks.
- Scales (the Scale Compass is its own tool).

## Visual design

The approved phone layout is canvas option C. Card style follows the physical Compass: white cards, an
orange-red accent (the existing `data-tool="chords"` theme), a cream neck (the skeleton's `fretboard`
token), ink markers.

**Phone (top to bottom):**

1. **Root row:** ← **G** → (ink disc, white letter), with "G major" and its notes "G · B · D" on the right.
2. **Overview card** (white, orange border): a horizontal neck, high E on top, frets 0–15, every chord
   tone as a small marker (● root, hollow 3rd/5th; no numbers at phone size), position inlays, fret numbers
   at 3·5·7·9·12·15, and an orange window over the selected shape or grip. Below it, the chips:
   - CAGED mode: the five shapes in neck order with their fret ranges (for G: `G 0–3 · E 3–5 · D 5–8 · C 7–10 · A 10–12`).
   - Triads mode: the four string sets `6-5-4 · 5-4-3 · 4-3-2 · 3-2-1`.
3. **Focus card** (white): a two-button **CAGED / Triads** toggle; title with ‹ › on either side
   ("E-shape" / "frets 3–5 · root on the 6th string", or "1st inversion" / "frets 3–4 · strings 3-2-1");
   a vertical chord diagram; position dots under it.

**Chord diagram:** vertical, low E on the left, a 4-fret window (5 if the shape spans 5), base-fret label
("3fr") when the window doesn't start at the nut, a thick nut line when it does; markers ● root,
③ 3rd, ⑤ 5th (white with ink ring and number); ○ above the nut for an open string in the shape,
× for strings the shape doesn't use; the spelled note name under each used string.

**Tablet (768–1279):** same order; overview taller with ③/⑤ numbers on its markers; focus card larger.
**Desktop (≥ 1280):** the overview becomes a full-width horizontal neck (canvas option A's look, no
sideways scroll); below it the focus card and the chips/toggle side by side.

## Theory — `lib/theory/`

Plain TypeScript, building on the Circle's `spelling.ts` / `circle.ts`.

**`fretboard.ts`**

- `TUNING = [4, 9, 2, 7, 11, 4]` (string 0 = low E … 5 = high E), `STRING_NAMES`, `MAX_FRET = 15`.
- `type ChordTone = { string: number; fret: number; role: "R" | "3" | "5"; note: SpelledNote }`.
- `majorTriad(root: Note): [SpelledNote, SpelledNote, SpelledNote]` — via `circleKeyFor(root)`: tonic,
  scale degree 3, scale degree 5. C# → D♭ F A♭ (consistent with the Circle).
- `chordTones(root: Note): ChordTone[]` — every chord tone on frets 0–15, all strings.

The neck runs to fret 15 (the device stops at 13) so every CAGED shape is complete for every root — the
G-shape of F♯, the C-shape of B and the D-shape of D♭ reach fret 14.

**`caged.ts`**

Templates `[string, offset from the root fret]`, root role fixed by the shape:

| Shape | Root string | Offsets (string: offset) |
|---|---|---|
| C | 1 (A) | 1:0, 2:−1, 3:−3, 4:−2, 5:−3 |
| A | 1 (A) | 1:0, 2:+2, 3:+2, 4:+2, 5:0 |
| G | 0 (E) | 0:0, 1:−1, 2:−3, 3:−3, 4:−3, 5:0 |
| E | 0 (E) | 0:0, 1:+2, 2:+2, 3:+1, 4:0, 5:0 |
| D | 2 (D) | 2:0, 3:+2, 4:+3, 5:+2 |

Root fret = `mod(rootPitch − TUNING[rootString], 12)`; if any note in the shape would be below 0, the
whole shape moves up 12. `type CagedShape = { name: "C"|"A"|"G"|"E"|"D"; tones: ChordTone[]; lowFret; highFret; rootString }`.
`cagedShapes(root: Note): CagedShape[]` — all five, sorted by `lowFret` then `highFret`.

**`triads.ts`**

`STRING_SETS = [[0,1,2], [1,2,3], [2,3,4], [3,4,5]]` (labels `6-5-4 · 5-4-3 · 4-3-2 · 3-2-1`).
`type Inversion = "root" | "first" | "second"`;
`type TriadGrip = { set: 0–3; inversion: Inversion; tones: [ChordTone, ChordTone, ChordTone]; lowFret; highFret }`.
`triadGrips(root: Note, set): TriadGrip[]` — every combination of one chord tone per string on the set
(frets 0–15) that uses R, 3 and 5 exactly once with `highFret − lowFret ≤ 4`; inversion from the lowest
string's role (R → root, 3 → first, 5 → second); sorted by `lowFret`.

Reference (G major, set 3-2-1): 1st inversion G4·B3·e3 (frets 3–4), 2nd inversion G7·B8·e7 (frets 7–8),
root position G12·B12·e10 (frets 10–12).

## Components and state

`app/chords/page.tsx` renders `<ChordCompass />` instead of `ToolPlaceholder`. Components in
`components/chords/`:

| File | Responsibility |
|---|---|
| `chord-compass.tsx` | Client root: root + view state, derived shapes/grips, responsive layout |
| `root-picker.tsx` | ← root →, chord name + notes; arrows step one semitone, wrapping B ↔ C |
| `neck-overview.tsx` | Horizontal SVG neck 0–15, all chord tones, selection window; tap → nearest shape/grip |
| `focus-card.tsx` | Mode toggle, title, ‹ ›, diagram, dots; horizontal swipe steps (reuses `classifyGesture`) |
| `chord-diagram.tsx` | The vertical diagram for one shape or grip |

**Root.** `useToolKey("chords")`; the arrows call `setRoot` with the next/previous `NOTES` entry.

**View state.** Persisted `nomad:chords:view:v1` via `createPersistedStore`:
`{ mode: "caged" | "triads"; shape: "C"|"A"|"G"|"E"|"D"; set: 0|1|2|3; inversion: Inversion }`.
Default `{ mode: "caged", shape: "E", set: 3, inversion: "root" }`; any invalid stored value → default.

- CAGED: the selection is the shape *name*, so a root change keeps the same shape. ‹ › and swipes move
  to the neighbouring shape in neck order (no wrap).
- Triads: chips pick the set; ‹ › / swipes move through that set's grips in neck order and store the
  new grip's inversion. On a root change (or a set change) the shown grip is the lowest grip with the
  stored inversion on that set (there is always at least one — tested).
- Overview tap: the fret under the pointer (clamped to 0–15) selects the shape/grip whose window centre
  `(lowFret + highFret) / 2` is nearest; ties go to the lower one.

**Accessibility.** Overview and diagram are `role="img"` with summaries ("G major, E-shape, frets 3 to 5");
the diagram adds a visually hidden list of its notes ("6th string, fret 3, G, root"). Chips and the mode
toggle use `aria-pressed`; ‹ › are named "Previous shape: G-shape" / "Next grip: 2nd inversion"; the
root arrows "Previous root" / "Next root". The overview tap is a convenience — every selection is also
reachable by buttons. Targets ≥ 44px.

## Error handling

- Corrupt / old stored view → default view; storage blocked → in-memory (shared store behaviour).
- Overview tap outside the neck → clamped fret.
- Shapes or grips outside 0–15 cannot occur (unit-tested for all 12 roots), so there is no runtime check.

## Testing

**Unit (Vitest):**

- `fretboard`: `majorTriad` for G (G B D), F (F A C), C# (D♭ F A♭); `chordTones` for G lists exactly the
  chord tones on frets 0–15 of every string (e.g. low E: 3 R, 7 3rd, 10 5th, 15 R).
- `caged`: G → G 0–3, E 3–5, D 5–8, C 7–10, A 10–12 with exact frets (G-shape 3·2·0·0·0·3, E-shape
  3·5·5·4·3·3, D-shape 5·7·8·7, C-shape 10·9·7·8·7, A-shape 10·12·12·12·10); C → C-shape at the open
  position x32010; every root's five shapes lie within 0–15; every shape tone is a chord tone with the
  template's role.
- `triads`: the G 3-2-1 reference above; every root and set has ≥ 1 grip of each inversion; every grip
  uses R/3/5 once and spans ≤ 4 frets.
- View store: default; invalid mode / shape / set / inversion → default; selection survives a root change;
  triads carry the inversion across roots.
- Components: `ChordDiagram` for G E-shape (base "3fr", six markers, ③/⑤ labels, notes G D G B D G) and
  D-shape (× on strings 6 and 5); `FocusCard` chips in neck order with ranges, toggle `aria-pressed`,
  ‹ › names; `NeckOverview` marker count = `chordTones(root).length`, window over the selected range;
  `RootPicker` wraps B → C and C → B.

**E2E (Playwright, iPhone WebKit + desktop Chromium):**

- Linked with the Circle on G → Chord Compass opens on G; default E-shape "frets 3–5".
- → root moves G → A♭; the E-shape stays selected with its new frets.
- Tap the D chip → "D-shape · frets 5–8"; swipe the focus card and ‹ › step shapes.
- Tap the overview near fret 10 → A-shape.
- Triads: toggle → set chips; on 3-2-1 ‹ › walks 1st (3–4) → 2nd (7–8) → root position (10–12) for G.
- The view survives a reload.
- The existing layout spec (no horizontal scroll 320–1440) covers `/chords/`.
- Wait for navigation to land before asserting (see `CLAUDE.md`).

**Visual check:** phone, tablet and desktop screenshots compared with the canvas before calling it done.
