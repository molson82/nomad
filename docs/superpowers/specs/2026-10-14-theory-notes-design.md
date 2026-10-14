# Theory notes — design

Date: 2026-10-14
Status: approved in conversation, awaiting spec review
Visual reference: "Nomad App Design" canvas, page "Theory notes" —
https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm (boards "Circle · ⓘ by the key and Major ↑", "Chords · ⓘ by
the chord and shape", "Scales · ⓘ by the scale and relative line").

## Purpose

A light, digital stand-in for the Decoder books: short "why" notes in context. While using a tool, the owner
taps a small ⓘ next to the thing they are wondering about and reads 2–4 sentences that explain it **for what is
on screen** (the current key, chord or scale), then closes it and keeps playing.

### Success criteria

- Eight notes (below), each reachable from an ⓘ beside the thing it explains.
- Every note uses the live key/chord/scale and the app's spelling (`formatNote`), never generic "in C" text.
- Opening a note never moves or resets the tool behind it; closing returns focus to the ⓘ.
- Works offline, in dark mode, and with VoiceOver; ⓘ targets are 44px.

### Non-goals

- A lessons / "Learn" section, search, or a glossary.
- Notes on CAGED positions in the Scale Compass, modes, or anything the tools don't show.
- Editing notes, bookmarks, or "don't show again".
- Rich media (diagrams, audio) inside notes.

## Behaviour

### The ⓘ button

- A 20px info icon (lucide `Info`) in a 44 × 44px button, `text-accent-ink`, placed right after the thing it
  explains, with negative margin so it doesn't push the layout.
- `aria-label` "About …" (listed per note below); `aria-haspopup="dialog"`.

### The sheet

- One shared `NoteSheet` on the native `<dialog>` opened with `showModal()`: focus moves into it, Esc closes,
  tapping the backdrop closes, focus returns to the ⓘ on close.
- Phones (< md): docked to the bottom, full width, rounded top corners, a drag handle, max height 80vh with
  its own scroll. Swiping down on the handle/title area by more than 60px closes it.
- md and up: a centred card, max width 480px.
- Contents: an `h2` title (the dialog's `aria-labelledby`), a ✕ close button (44px, "Close"), and 2–4
  paragraphs. Live values are bold (`<strong>`).
- `prefers-reduced-motion`: no slide animation.

## The notes

Notation: `{x}` is a live value, spelled with `formatNote`. Each note shows its G major text as the example.

### Circle of Fifths

**1. Why fifths?** — ⓘ after the key name on the card. Label "About why the circle moves in fifths".
Title: "Why the circle moves in fifths"
1. "Each step clockwise is a fifth up: count five letters from {tonic} and you land on {clockwise} ({tonic} A
   B C {clockwise} for G → D)." — the parenthetical lists the five letters of the live key.
2. "Every step clockwise adds one sharp, and every step counter-clockwise adds one flat. {tonic} major has
   {signature description}." Signature description: "no sharps or flats" / "1 sharp: F♯" / "5 flats: B♭ E♭ A♭
   D♭ G♭".
3. "So {counter} sits to its left and {clockwise} to its right — neighbours share all but one note, which is
   why they sound so close."
G: "Each step clockwise is a fifth up: count five letters from G and you land on D (G A B C D). Every step
clockwise adds one sharp, and every step counter-clockwise adds one flat. G major has 1 sharp: F♯. So C sits
to its left and D to its right — neighbours share all but one note, which is why they sound so close."

**2. The key's chords** — ⓘ after "Major ↑". Label "About the key's chords".
Title: "The chords of {tonic} major"
1. "Stack every other note of the {tonic} major scale — {scale notes} — and you get a three-note chord on each
   degree."
2. "The pattern never changes: major, minor, minor, major, major, minor, diminished. In {tonic}: {I … vii°
   with chord names}."
3. "The window shows them as neighbours: the majors IV · I · V on top, each with its relative minor
   underneath, and the one diminished chord on its own."
G: "… G A B C D E F♯ … In G: I G · ii Am · iii Bm · IV C · V D · vi Em · vii° F♯°."

**3. Why the progression works** — ⓘ after the "Common progressions" heading. Label "About progressions".
Title: the active preset's name and numerals ("Pop · I–V–vi–IV"), or "Why progressions work" with none.
Paragraph 1 per preset, in the live key (G shown):
- Pop (I–V–vi–IV): "G – D – Em – C. The V (D) pulls back toward home, but instead of resolving the loop
  slips to vi (Em), the relative minor, then IV (C) — so it circles forever without quite landing."
- Jazz turnaround (ii–V–I): "Am – D – G. Each chord's root is a fifth above the next, the strongest move
  in the key: ii sets up V, and V resolves to I."
- Three-chord (I–IV–V): "G – C – D. The three major chords of the key; between them they contain every
  note of G major, which is why so many songs need nothing else."
- Sensitive (vi–IV–I–V): "Em – C – G – D. The Pop chords started from the relative minor, so the same
  loop feels darker and ends hanging on V."
- 50s (I–vi–IV–V): "G – Em – C – D. Home, its relative minor, then IV and V climbing back to home — the
  doo-wop loop."
Paragraph 2 (always): "V → I is the strongest pull in music: V contains the 7th of the scale ({seventh}),
a half step below home ({tonic}), and it wants to rise."
With no preset: only paragraph 2, preceded by "Chords in a progression trade tension and release: I is
home, IV moves away, V leans back."

### Chord Compass

**4. How a chord is built** — ⓘ after the chord name in the header. Label "About how a chord is built".
Title: "How {chord} is built"
- Major: "A major chord is the 1st, 3rd and 5th notes of its major scale: {R · 3 · 5}. The 3rd is four
  frets above the root; the 5th is seven." / "Everything you see on the neck is one of those three notes —
  the black dots are the root."
- Minor: "A minor chord lowers the 3rd by one fret: {R · ♭3 · 5}. That one note is the whole difference
  between major and minor." / same second paragraph.
G: "… G · B · D …"; E minor: "… E · G · B …".

**5. CAGED** — ⓘ after the shape title in the focus card. Label "About CAGED shapes".
Title: "CAGED: five shapes, one chord"
1. "Every {quality} chord can be played with the five open-chord shapes C, A, G, E and D{m suffix}, slid
   up the neck until their root lands on {root}."
2. "Each shape shares its root notes with the next, so they link end to end: in {chord} the {shape list
   with fret ranges, in neck order}."
3. "Learn where the root sits in each shape and you can find {root} anywhere on the neck."
G: "… in G the G-shape (frets 0–3) hands its root to the E-shape (3–5), then D (5–8), C (7–10) and A
(10–12)."

**6. Relative minor (⑥)** — ⓘ after the blue relative line in the Chord Compass and Scale Compass headers.
Label "About the relative minor". Title: "{tonic} major and {sixth} minor"
1. "Start the {tonic} major scale on its 6th note, {sixth}, and you get {sixth} minor: the same seven notes,
   just a different home."
2. "That's why the two keys share every chord and the same key signature ({signature description}), and why
   switching to Minor keeps you in the same place on the neck."

### Scale Compass

**7. Building the scale** — ⓘ after the scale name. Label "About how the scale is built".
Title: "Building {tonic} major" (major views) / "Building {sixth} minor" (minor views)
1. "A major scale climbs seven notes in a fixed pattern of whole (W) and half (H) steps: W W H W W W H."
2. "From {tonic}: {scale with dashes}. The half steps fall at {3rd}–{4th} and {7th}–{tonic}."
3. Major views: "The numbers 1–7 are each note's place in the scale." Minor views: "Minor starts the same
   notes from ⑥ ({sixth}) and renumbers, so its 3rd, 6th and 7th come out flat: ♭3 ♭6 ♭7."
G: "From G: G – A – B – C – D – E – F♯ – G. The half steps fall at B–C and F♯–G."

**8. Pentatonic and blues** — ⓘ after the Scale / Pentatonic / Blues group. Label "About pentatonic and blues".
Title: "Pentatonic and blues"
1. Major: "Pentatonic keeps five of the seven notes by dropping the 4th and 7th ({4th} and {7th}) — the two
   that sit a half step from a neighbour, so nothing clashes: {pentatonic notes}." Minor: "… dropping the 2nd
   and ♭6th ({2nd} and {♭6th}) …".
2. Minor: "Blues adds one more, the ♭5 ({blue note}) — the 'blue note' between the 4th and 5th that you
   bend into and out of." Major: "Blues adds one more, the ♭3 ({blue note}) — the 'blue note' between the
   2nd and 3rd that you slide up from." (This matches what the tool draws: major blues adds ♭3, minor blues
   adds ♭5.)
G major: "… dropping the 4th and 7th (C and F♯) … G A B D E." E minor: "… dropping the 2nd and ♭6th (F♯ and
C) … E G A B D. Blues adds … the ♭5 (B♭) …".

Implementation note: paragraph 2's blue note must be the same note the Scale Compass draws for the current
view (read it from `lib/theory/scales.ts`, not re-derived).

## Architecture

- `lib/notes/` — one pure function per note: `(context) => { title: string; paragraphs: Paragraph[] }`,
  where `Paragraph` is an array of `string | { strong: string }` segments. Context types are the tool's live
  state (`{ root }`, `{ root, quality, step? , shape }`, `{ root, view }`, `{ root, presetId }`). No React in
  `lib/notes/`.
- `components/notes/info-button.tsx` — the ⓘ button; owns `open` state and renders `NoteSheet` with the note.
- `components/notes/note-sheet.tsx` — the `<dialog>` and its layout; renders `Paragraph` segments.
- Tools: each places `InfoButton`s next to the anchors above and passes the live context.

## Error handling

Notes are pure functions of state that the tools already validate; there is no I/O. jsdom lacks
`HTMLDialogElement.showModal`, so tests stub it in `tests/unit/setup.ts`.

## Testing

**Unit**
- Each note function in G major and D♭ major (and E minor / B♭ minor for minor-aware notes): exact title and
  paragraph text with the right spelling.
- Note 3 for every preset id and for `null`.
- Note 8's blue note equals the Scale Compass's blue note for all 12 keys and both tonalities.
- `NoteSheet`: renders title as the dialog's label, ✕ closes, segments render `<strong>`.
- `InfoButton`: has its "About …" label and opens the sheet.

**E2E (iphone + desktop)**
- Circle: open "About the key's chords" in C, see "I C · ii Dm", close with Esc; focus is back on the ⓘ.
- Chord Compass: open "About CAGED shapes", see the C chord's shape list; close with ✕.
- Scale Compass: switch to Minor, open "About how the scale is built", see "♭3 ♭6 ♭7".
