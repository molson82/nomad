# Tuning — design

Date: 2026-10-25
Status: drafted from conversation; awaiting the owner's review
Visual reference: "Nomad App Design" canvas, page "Tuning" — https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm
(boards "Tuning tab · DADGAD set", "Scale Compass · D major in DADGAD", "Chord Compass · D major triads in
DADGAD", "Chord Compass · strings 6–5–4: open root position R·5·3").

## Intent

The owner plays in other tunings: half step down (a Plini tuning), Drop D, DADGAD and math-rock tunings. In
those tunings the CAGED shapes they learned no longer line up, so today they guess. They want Nomad to show
**where the notes of the key they chose actually are** on a guitar tuned that way, so they can play in key by
sight.

In their words: "find the notes of the scale, what to play so everything sounds nice and in the same key
rather than guess and use the CAGED system which won't line up when you change the tuning."

## Goals

1. Set a tuning, one string at a time or from a list of common tunings, and get back to standard in one tap.
2. Scale Compass shows **only the notes of the chosen scale in the chosen key**, in their true places for the
   tuning.
3. Chord Compass shows **only the key chord's triad (R · 3 · 5) and its inversions**, in their true places for
   the tuning.
4. Standard tuning behaves exactly as today.

## Non-goals

- Showing every chromatic note, or notes outside the key.
- Fitting CAGED shapes or scale positions onto tunings where they don't work.
- Seventh chords, extended voicings, or triads on non-adjacent strings.
- Audio, a tuner, capo support, 7-string or non-guitar instruments.
- Changing the Circle of Fifths (it has no fretboard).

## Anti-goals (a failure even if it "works")

- A note drawn on the wrong fret for the tuning.
- CAGED shapes or position boxes drawn as if they still apply in DADGAD.
- A triad diagram that a hand can't play (see "Playable" below).
- The tuning UI cluttering the Chord and Scale Compass screens.
- Any change to what standard tuning shows today.

## Decided by the owner

- Tuning is its **own page: a fourth tab** (Circle · Chords · Scales · Tuning).
- The compasses still **show the string names down the side of the neck**, in the current tuning.
- **Common tunings** are quick chips, like Common progressions on the Circle.
- In other tunings, **Scale Compass** shows just the scale notes of the chosen key and view.
- In other tunings, **Chord Compass** shows just the key chord's triads (R, 3, 5) and their inversions.
- An **inversion is named by its bass note only**: the other two notes may be in either order above it
  (root position is R‑3‑5 *or* R‑5‑3). This keeps open DADGAD shapes such as D major 0‑0‑4 on strings 6–5–4.
- The chosen key is always respected; changing tuning never changes the key.

## The Tuning tab

Route `/tuning/`, fourth tab, its own accent colour.

- **Current tuning card:** the tuning's name if it matches a preset ("DADGAD", "Standard"), otherwise the
  six notes low → high ("D A D G A D"). The card says "Used by Chords and Scales" and has a **Reset to
  standard** button. Reset is disabled when already standard.
- **Strings, high to low:** six rows. Each row has the string number (1st … 6th), ↓ and ↑ buttons (44px)
  that move it one semitone, the current note, and its change from standard ("standard", "−2 semitones").
  A changed string is visually marked. Range: each string from 5 semitones below to 4 above its standard
  note, so strings can't cross into nonsense. The ends disable the button.
- **Common tunings:** chips showing name and notes. The active one is pressed. The list is: Standard
  (E A D G B E), Half step down (E♭ A♭ D♭ G♭ B♭ E♭), Whole step down (D G C F A D), Drop D (D A D G B E),
  DADGAD (D A D G A D), Open G (D G D G B D), Open D (D A D F♯ A D), Open C (C G C G C E),
  FACGCE (F A C G C E).
- **Shared by both compasses:** one tuning for both, saved in `localStorage` like the other stores, and
  per device. Bad or missing data falls back to standard.
- **Note spelling on the Tuning tab:** a string's note is spelled with flats for the five black-key notes
  (E♭ A♭ D♭ G♭ B♭), matching the "Half step down" convention guitarists use, except F♯ (Open D's
  3rd string). It doesn't depend on the key.

## In the compasses

Common to both:

- **String names:** to the left of the overview neck, the string names show the current tuning. A string
  that differs from standard is in the Tuning accent. The diagram shows them under each string as today.
- **Tuning pill:** when the tuning is not standard, a small pill with the tuning's name ("DADGAD ›") sits at
  the top of the neck card. Tapping it opens the Tuning tab. In standard tuning there's no pill.
- **Fret range:** stays 0–15.
- **Note names:** inside the compasses, notes keep the key's spelling (D major's F♯, not G♭). The tuning
  never respells the key.

### Two kinds of tuning

- **Uniform shift:** every string moved by the same amount (Half step down, Whole step down, any all-strings
  shift). The intervals between strings are standard, so CAGED shapes and scale positions still work. The
  compasses behave **exactly as in standard tuning**: same shapes, positions, chips and diagrams, with every
  fret position shifted to match the tuned-down strings, and string names showing the real tuning.
  *(Builder's call how to compute this, e.g. offset frets by the shift, but the drawn frets must match
  the real notes. A shift that pushes a shape past fret 15 or below 0 slides it an octave, using the
  existing rule.)*
- **Changed intervals:** anything else (Drop D, DADGAD, open tunings). The compasses switch to the views
  below.

### Scale Compass, changed intervals

- **The neck:** the Major/Minor and Scale/Pentatonic/Blues controls work as today. The neck shows **only
  the notes of the current scale view in the current key**, numbered by degree, with the same colours as
  today: root filled, ⑥ blue ring in major, blue note in blues.
- **Fret windows:** the position chips are replaced by five **fret windows**: 0–4 · 2–6 · 5–9 · 7–11 ·
  10–15. The selected window is banded on the neck and drawn close up in the focus card ("Frets 0–4",
  ‹ › to step), with open strings shown above the nut when the window starts at 0.
- **What carries over:** the selected window is stored separately from the CAGED position letter.
  Switching back to a standard or uniform tuning restores the position as before.

### Chord Compass, changed intervals

- **The chord:** the key chord only, from the Major/Minor switch. Major → R · 3 · 5, minor → R · ♭3 · 5,
  spelled as today. The progression strip still works, and a selected progression chord's triad is shown
  instead.
- **Choosing a triad:** two controls replace the CAGED chips.
  - **String set:** 6–5–4 · 5–4–3 · 4–3–2 · 3–2–1, each showing its string notes.
  - **Inversion:** Root position (R in the bass) · 1st inversion (3rd in the bass) · 2nd inversion (5th in
    the bass). Each shows how many playable shapes it has on the selected strings.
- **What a triad is (owner's decision):** the bass note is on the lowest of the three strings, and the other
  two chord tones are on the other two strings **in either order**. So each inversion has up to two note
  orders (root position: R‑3‑5 and R‑5‑3), and each order can appear more than once up the neck.
- **Playable:** a triad counts only if its three frets fit within **4 frets** (max − min ≤ 4). Open strings
  count as fret 0. Every fret from 0 to 15 is considered. If an inversion has no playable triad on a string
  set, its chip is disabled and reads "too wide to play". If a string set has none at all, its chip is
  disabled.
- **The neck (my call):** shows every playable triad on the selected string set, all inversions, faded,
  with the selected one solid and its window banded.
- **The focus card:** the selected triad close up, unused strings marked ×, and a title like "Root position ·
  strings 6–5–4 · frets 0–4 · R · 5 · 3".
- **‹ › (my call):** steps through every playable triad on the selected string set from low to high on the
  neck, across inversions. The inversion chip follows along. Tapping an inversion chip jumps to that
  inversion's lowest triad.
- **Defaults and memory:** string set 4–3–2 and root position. The selection is stored as string set +
  inversion + which of that inversion's triads (counted from the bottom of the neck), not as frets. When
  the key or tuning changes, the same string set and inversion are kept and the triad nearest the previous
  window is picked (the existing nearest-window rule). It falls back to the lowest playable one.

## Constraints

- **Fit the existing app.** Next 15 static export, React 19, TS strict, Tailwind 3, Vitest, Playwright, and
  the existing persisted-store pattern. Theory stays in `lib/theory/`, plain TypeScript with no React.
  Reuse the shared fretboard components, `neck-geometry`, `FretDiagram`, `PositionChips` and `FocusCard`.
- **The tuning becomes an input.** `TUNING` in `lib/theory/fretboard.ts` is the standard tuning constant
  and is used by `fretboard.ts`, `caged.ts` and `scales.ts`. The tuning must become an input to those
  functions, with standard as the default, so existing callers and tests keep passing unchanged.
- **The Tuning tab has no key.** `Tool` and `TOOLS` (`lib/tools.ts`) drive the key-state store
  (`Record<Tool, Note>`, and parsing requires every tool). Adding a tab must not add a key slot or reset
  saved keys. The tab list and the key-holding tools need to be separate.
- **Offline.** The new route must be precached like the others (the SW build script picks up `out/` pages).
- **Phones first.** No horizontal scroll from 320px to 1440px+. All tap targets 44px. Dark mode and
  VoiceOver labels like the rest of the app.
- **Look and feel.** Same visual language as the canvas boards. The Tuning accent is violet. The exact
  oklch values are the builder's, but they must pass contrast like the other accents (see the contrast
  tests).

## Left to the builder

- Storage keys and shapes. Suggested: `nomad:tuning:v1` holding six pitch classes or semitone offsets, plus
  the per-tool window and triad selections.
- How uniform shifts are detected and applied.
- How the theory notes (ⓘ) word themselves in other tunings. At minimum, the CAGED note must not claim
  CAGED applies when the tuning has changed intervals: hide that ⓘ or adjust the text.
- Desktop and tablet layouts, following the existing compass layouts with the same additions.
- The Tuning tab's icon (the mockup uses a tuning fork).

## Calls I made (not discussed with the owner)

- **Colour:** violet as the Tuning accent.
- **Presets:** the exact preset list, with FACGCE standing in for "math rock".
- **Scale fret windows:** the five windows used in place of positions.
- **Playable:** the 4-fret playability rule, and "too wide to play" for disabled inversions.
- **Uniform shifts:** these keep the full standard behaviour (CAGED shapes and positions), shifted.
- **Tuning range:** strings tune from 5 below to 4 above standard.
- **Spelling:** the Tuning tab uses flat spelling for its notes, F♯ excepted.
- **Triad neck and stepping:** the neck shows every playable triad on the selected strings; ‹ › walks them
  all and the inversion chip follows.
- **Default triad:** strings 4–3–2, root position.

## Done when

- Every preset, in a few keys (including a flat key), draws every scale note and triad tone on the correct
  fret. Unit tests compare against hand-checked frets. Examples, D major in DADGAD:
  - strings 4–3–2: root position 12‑11‑12, 1st inversion 4‑2‑5, 2nd inversion 7‑7‑9;
  - strings 6–5–4: root position 0‑0‑4 (R·5·3), 1st inversion 4‑0‑0 (3·5·R) and 4‑5‑7 (3·R·5), 2nd
    inversion 7‑5‑4.
- Standard tuning output is byte-for-byte what it is today (existing tests pass unchanged).
- Half step down shows the same shapes as standard, each one fret higher (the strings sound a half step lower), with the string names
  E♭ A♭ D♭ G♭ B♭ E♭.
- E2E: pick DADGAD on the Tuning tab; Scale Compass shows the pill, the DADGAD string names and fret
  windows; Chord Compass shows string-set and inversion chips; Reset to standard brings back CAGED.
