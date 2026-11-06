# Pathfinder — design

Date: 2026-11-05
Status: drafted from conversation; awaiting the owner's review
Visual reference: "Nomad App Design" canvas, page "Pathfinder" — https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm.
The owner approved these screens, with **"1 · Build — option B"** as the phone build screen. Option A is not built.

## Intent

The owner found a great sound on the fretboard while writing music, but: "I didn't know what chord it was, where
I could go with it, how I could tie it to a key, melody, or structure. It was just a chord with nowhere to go."

Pathfinder starts from that sound rather than from a key. You place the notes you're holding, it names them, and
it shows where they could go. It's the app's idea in one page: "Start somewhere, find your sound, and build upon
it." You choose a key by which one gives you "the best scales and shapes for soloing and building more chords ...
that will sound great with the original one. Defining and chasing that sound."

## Goals

1. Place notes on a full fretboard, any string and any fret, and see the chord's name update live.
2. Build path: compare **every** key the chord fits, each with brief soloing and chord information.
3. Preview a key's solo notes on the neck, and try its other chords on this page.
4. Lock in: set the chosen key, link all tools, and show the chord in Chords and Scales.
5. Reset: return the app to normal.

## Non-goals

- Audio. The owner has the guitar in hand and decides by ear.
- Adding "chords to try" to the Circle's progression. Lock-in sets only the key, link and highlight.
- Showing "chords to try" on the Chords or Scales fretboards.
- In-depth theory. The cards are a brief summary; the other tools carry the depth.
- Saving several chords or a chord library.
- Labelling a key "best". The owner makes that choice by ear.

## Anti-goals (a failure even if it "works")

- A wrong chord name, or a key listed as fitting when a chord note is outside it.
- A dead end: any chord that can't produce a path.
- The highlight disappearing for any reason other than Reset.
- Pathfinder changing the app's key or link before Lock in.
- Any change to Chords or Scales when nothing is locked in.
- The page feeling like a separate app rather than part of Nomad.

## Decided by the owner

- The name is **Pathfinder**, and it's a new page and tab.
- Pathfinder ignores the app's key until Lock in.
- Up to **5 chord names** are shown when several apply.
- Build path shows **all** the keys that fit so the user can compare them and pick one.
- Selecting a key reveals a **Chords to try** section on this page only.
- Lock in sets the key and links the tools, as the link button does, with the link icon showing linked.
- The highlight **moves with key changes and stays after unlinking**. Only Reset removes it.
- **Reset** lives on the Pathfinder page. It clears the highlight and removes the link lock-in set.
- The phone build screen is Option B: a large neck that scrolls sideways.

The owner also approved these proposals:

- Each string holds one note. Tapping another fret moves it; tapping the same fret removes it.
- For a chord that fits no major key, show the closest keys and mark each note outside.
- Keys are major, with the relative minor shown alongside, as the app already treats them.
- The fretboard uses the current tuning.
- A locked chord keeps its notes when the tuning changes, and the shape adjusts.
- A note that would leave the neck when the highlight moves shifts an octave. The neck is frets 0–15.
- The highlight is a ring, on the neck and focus diagram, that leaves the tool's own notes visible. Major/Minor and
  selected position neither affect it nor change because of it. The Circle gets the key but no highlight.
- After Lock in you stay on Pathfinder, with links to Chords and Scales. The neck can't be edited until Reset.
- Reset removes the link only if lock-in created it. The key stays where it is.
- An in-progress chord persists across tabs and app restarts.
- Key cards are ordered with full fits first, then by how central the chord is.
- Card contents: key and relative minor, chord's role, closest pentatonic box and scale position with frets, triads
  near the chord, the scales that contain the chord, and chords to try.
- Tapping a card previews that key on the main neck, with a Pentatonic / Scale / Triads switch.
- Tapping a chord to try shows a playable shape near yours, with your chord as a faint outline. Tapping again
  returns. It's preview only and is never saved; switching keys clears it.

## How it behaves

Example throughout: Am7 at fret 5, `[5,7,5,5,5,5]` low → high, standard tuning. Copy comes from the canvas.

### Page and shell

- Route `/pathfinder/`, label "Pathfinder", title "Pathfinder", lucide `Route` icon, placed between Scales and
  Tuning in `NAV_ITEMS`.
- `pathfinder` is a `Page`, not a `Tool`: no key slot, not written to `nomad:last-tool`, and `/` never opens it.
- `theme.css` gets `[data-tool="pathfinder"]` with a rose accent matching the canvas (`#D9468F`, ink `#A0246A`, tint
  `#FBE3EF`), expressed as hue/lightness like the other tools, and readable in dark mode with text on accent in
  ink. A fixed `--color-pathfinder` is the ring color in every tool, in both themes, since it sits on the wood
  like the fixed marker colors.
- The link icon shows on Pathfinder only while linked (`showLink`). Tapping it unlinks as usual. It's hidden when
  unlinked because the page has no key of its own to link.

### 1. Build

**Name area.** Primary name large, the note list, and other names as "Also called" chips. Empty, single-note and
no-name states follow the "Edge states" board.

**Fretboard.**

- Below `lg` (phones and tablets): a small read-only overview neck showing the notes and a band for what's in view
  (tapping it scrolls there), above a large neck in a native `overflow-x: auto` container at about 66px per fret and
  46px per string, per the Option B board. Native scrolling separates swipes from taps. On load it scrolls to the
  chord, or to the nut when empty. Note names show inside the markers.
- `lg` and up: one whole neck, large enough to tap directly, with no separate overview.
- Tap targets span the full fret cell and string gap. The open-string slot left of the nut places fret 0.
- The chord root is the black marker, other notes rose. An unplaced string is silent.

**Actions.** "Clear" empties the chord. "Build path" is disabled until there are two distinct pitch classes, so a
note doubled in octaves doesn't count.

### 2. Build path

Heading "Am7 fits 3 keys", or "C7♯9 fits no key: closest keys". The first card is selected on arrival, and "Edit
chord" returns to Build with the chord intact. Selecting a card updates the preview neck and collapses the previous
card. Only one is open. Which key was selected isn't persisted.

**Preview neck.** Your chord in rose rings, plus the selected key's material per the switch (default Pentatonic):
the pentatonic box, the scale position, or the triads listed on the card. A caption names what's shown. The
switch's choice carries across keys.

**Card, collapsed.** Key, "Relative minor: A", role badge, solo line, and fit line ("Has all your notes" or "Misses
your C"), which refers to the pentatonic.

**Card, selected.** Adds Scale, Triads, Used in, Chords to try, and "Lock in C major". Rows with nothing to show
are omitted.

### 3. Chords to try

The upper part of the page becomes the "Trying" screen from the canvas: "Trying · in C major", the chord and role,
neck and diagram with your chord dashed, the chord chips, and "Back to Am7". Tapping another chip switches chords;
tapping the active chip or Back returns to the key cards with that key still selected. Not persisted.

### 4. Locked in

Rose banner: "Locked in", chord name, "vi in C major · all tools linked", Reset. Below it, the read-only neck, then
"See where it lives" links to `/chords/` and `/scales/`. Landing on Pathfinder while locked always shows this screen.

### 5. Chords and Scales

Rose rings on the neck overview and the focus diagram, with a "Your chord: Am7" legend under the neck. Rings outside
the current focus window remain on the overview. Applies in all modes, including triads and fret windows in other
tunings. Otherwise these tools are unchanged, and with nothing locked they're identical to today.

### Reset

Clears chord and lock. If lock-in created the link and the tools are still linked, unlink through `withLinked`, which
leaves every tool on the shared key. Otherwise leave the link alone. Returns to an empty Build screen. No confirmation,
per the canvas.

## State

One new store, `nomad:pathfinder:v1`, using `createPersistedStore`, with a defensive parser like the others:

```ts
{
  frets: (number | null)[];   // six entries, low → high; the chord being built
  lock: {
    frets: (number | null)[]; // as locked
    key: Note;                // major root at lock-in
    tuning: number[];         // offsets at lock-in
    createdLink: boolean;     // false if the tools were already linked
  } | null;
}
```

**Lock in** writes `lock` and sets the key state to `{ linked: true, shared: key }`. Other fields are left as they are,
so unlinking behaves as it does today.

**The highlight for a tool** is computed, never stored: `highlightFrets(lock, toolKey, currentOffsets)`.

1. **Tuning:** per string, `fret - (currentOffset - lockOffset)`, so the note's pitch is unchanged.
2. **Key:** shift every note by the interval from `lock.key` to the tool's key, taken as the shorter way round
   (−5…+6 semitones). C → E is +4; C → B is −1.
3. **Neck:** any note outside 0–15 moves an octave, per note.

The tool's key comes from `useToolKey`, so linked tools share one result and unlinked tools each follow their own.

**The locked screen and legend** show the chord transposed to the current key, named live, so C → E reads C♯m7 "vi in
E major". On Pathfinder, the current key is the shared key while linked, and `lock.key` if unlinked.

**A tuning change while building** leaves `frets` alone and renames from the new pitches, since the user is entering
where their fingers are.

## Theory (new, pure TypeScript with tests)

No new dependencies. Reuse `lib/theory/` rather than re-deriving anything. All functions take `open` as a defaulted
last parameter, per the Tuning convention.

**Chord naming, `lib/theory/chord-names.ts`.** Input: the sounded pitch classes and the bass. Output: up to 5 names,
best first.

- **Bass** is the lowest actual pitch, not the lowest string. That needs octave-aware open strings: standard
  `[40,45,50,55,59,64]` plus the tuning offsets. A locked chord keeps the bass from its locked voicing, transposed,
  so octave moves on the neck never change its name.
- Try each sounded pitch class as root. A quality matches when the chord has all its required tones, and nothing
  beyond its required and optional tones:

  | Quality | Required | Optional |
  |---|---|---|
  | `5` | 1 5 | |
  | major, `m`, `dim`, `aug` | 1 and their 3rd and 5th | |
  | `sus2`, `sus4` | 1, the 2 or 4, 5 | |
  | `6`, `m6` | 1, 3rd, 5, 6 | |
  | `add9`, `m(add9)` | 1, 3rd, 5, 9 | |
  | `6/9` | 1, 3, 6, 9 | 5 |
  | `7`, `maj7`, `m7`, `m(maj7)` | 1, 3rd, 7th | 5 |
  | `7sus4` | 1, 4, ♭7 | 5 |
  | `m7♭5`, `dim7`, `7♭5`, `7♯5` | 1, 3rd, altered 5th, 7th | |
  | `9`, `maj9`, `m9` | 1, 3rd, 7th, 9 | 5 |
  | `7♭9`, `7♯9`, `7♯11` | 1, 3, ♭7, the altered tone | 5 |
  | `11`, `m11` | 1, ♭7, 11, and for `m11` the ♭3 | 5, 9 |
  | `13` | 1, 3, ♭7, 13 | 5, 9 |

  So a first-inversion triad is never named a rootless-5th `6`, and 9ths and larger always contain their 7th.
- A name is written as a slash chord (`C6/A`) when bass ≠ root.
- Rank: root is the bass; fewest omitted optional tones; simpler quality (table order).
- **Spelling:** with no key in view (Build, Build path heading), roots use the app's `Note` names (`E♭`, `F♯`). With a
  key known (locked screen, legend, the "Trying" screen), a root in that key is spelled by the key's scale, so it's G♯m7
  in B major and matches `diatonicChords`. Naming takes an optional key for this. A root outside the key keeps its
  `Note` name.
- One pitch class returns the note name. No match returns no names; the UI shows the notes.
- Required test cases: `[5,7,5,5,5,5]` → Am7 first, C6/A also; `[null,3,2,0,1,0]` → C; `[3,2,0,0,0,3]` → G;
  `[0,2,2,0,0,0]` → Em; `[5,7,null,null,null,null]` → A5; `[null,3,2,2,1,0]` → Am/C first, not C6; `[12,0,null,null,null,null]`
  has bass A; a dim7 lists its other roots.

**Keys, `lib/pathfinder/` or `lib/theory/`.**

- **Fit:** a key fits when all chord pitch classes are in its major scale. With none fitting, take the keys with
  the fewest outside notes, at most 3, each carrying those notes.
- **Role:** degree of the primary name's root in the key via `romanFor`, omitted when there's no name or the root is
  outside the key.
- **Order:** by role I, IV, V, vi, ii, iii, vii°; roleless last; ties in circle-of-fifths order. Near-fits are sorted
  by fewest outside notes first.
- **Pentatonic:** always named as the key's relative minor, using `positions(key, { tonality: "minor", type:
  "pentatonic" })`. Same notes as the major pentatonic, and it matches the canvas.
- **Nearest position:** the position containing the most chord notes, ties to the closest centre to the chord.
  Applies to the box and to the full-scale position. In non-uniform tunings use the `FRET_WINDOWS` windows, shown as
  "frets 5–9" with no Box or letter.
- **Triads:** major and minor triads wholly inside the chord's pitch classes, at most 2, root triad first. Each one's
  shape comes from `triadsOn` across all string sets: the most notes in common with your chord (same string and fret),
  then the higher strings because these are for soloing, then the closest centre. Am7 gives "Am on strings 3-2-1 ·
  fret 5" and "C on strings 4-3-2 · fret 5".
- **Used in:** which of the six `scaleNotes` views contain every chord note, in the canvas's condensed form ("C major,
  A minor, both pentatonics, both blues").

**Chords to try.**

- The key's `diatonicChords` without vii°, and without a chord with your chord's root.
- Order by role: I → IV V vi ii iii; IV → I V ii vi iii; V → I vi IV ii iii; vi → IV V I ii iii; ii → V I IV vi iii;
  iii → vi IV ii I V; vii° or roleless → as I.
- Progression line: a `COMMON_PROGRESSIONS` entry starting on your chord's degree, else the first containing it. None
  (e.g. iii) omits the line.
- Shape: the `cagedShapes` entry whose centre is closest to your chord's (as `nearestByCentre` does) when the tuning
  is uniform, otherwise the `triadsOn` entry with the closest centre. Example: G in C major is the D-shape at frets 5–8.

## Shared components

- `Neck`: add an optional `rings` prop drawn above markers, and make the window band optional. Pathfinder needs the
  string as well as the fret on a tap, added without changing existing callers. The large neck is the builder's: a
  sized variant of `Neck` if clean, or a small sibling using `neck-geometry` numbers.
- `FretDiagram`: add optional `rings`.
- Chord and Scale Compass read one hook (e.g. `useChordHighlight(tool)`) and pass the result down.

## Testing

Unit: naming cases above, key fit and order, `highlightFrets` (tuning, key shift, octave wrap), store parsing, lock
and Reset including `createdLink` both ways, chord-to-try order. The contrast test covers new colors if they're
added to what it reads.

E2E, both projects: build Am7 and see the name; compare keys; try a chord and return; lock in and see the link state
and rings in Chords and Scales; change key and see the rings move; unlink and see them stay; Reset clears both; a page
reload keeps chord and lock. Offline is covered automatically by the service-worker build, and `offline.spec` should
include the new route if it lists routes.

## Left to the builder

File layout under `components/pathfinder/` and `lib/pathfinder/`; exact phone sizes around the canvas; the Triads
preview's marker styling; animation, within the app's reduced-motion handling.

Update `CLAUDE.md` Architecture with the new page and store when it ships.
