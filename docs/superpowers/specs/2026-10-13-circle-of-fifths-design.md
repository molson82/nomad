# Circle of Fifths — design

Date: 2026-10-13
Status: approved in conversation, awaiting spec review
Visual reference: "Nomad App Design" canvas, page "Circle of Fifths" —
https://claude.ai/artifact/6jEmmWCvk9uC7L3wKza7nm (artboards "Chosen · Phone", "Phone · progression active",
"Desktop · 1280", "Tablet portrait · 834"; A/B/C are the rejected options, kept for reference)

## Purpose

Replace the `/circle/` placeholder with a digital version of the Noisy Clan Decoder Circle of Fifths wheel.

What the owner uses it for, in priority order:

1. **Chords in a key** — glance at the seven diatonic chords mid-practice, at arm's length on a phone.
2. **Learning the theory** — neighbors on the circle, key signatures, relative minors, and how each
   triad is built from scale degrees (the Decoder's "quick chords").
3. **Light progression work** — try a progression in the current key and see it move with the key.

### Success criteria

- Turning to any of the 12 major keys shows the correct, correctly spelled diatonic chords, signature,
  relative minor and degree numbers, laid out in the physical Decoder's order.
- Turning works by dragging the wheel and by swiping the card, with a spring snap; it feels like the
  physical wheel and never fights vertical page scrolling.
- With the chain link on, a key turned here is the root in Chords and Scales.
- A progression can be picked from presets or tapped together, transposes when the key turns, and
  survives a reload.
- Works offline and at every width from 320px to 1440px+ (the skeleton guarantees both; this feature
  must not regress them).

### Non-goals

- Audio of any kind.
- Tap-a-wedge-to-jump and a note-picker row (the owner chose drag + swipe only). Keyboard arrows on the
  wheel exist for accessibility only.
- A dedicated transpose feature (turning the wheel with a progression is the transpose).
- Minor-key mode: the wheel centers major keys; the relative minor is shown.
- Sharing the progression across tools or devices.

## Visual design

The approved layout is option C (small wheel + chord rows) in the Decoder's yellow-card style.

**The Decoder card** (yellow `#FFD21F`, 28–32px radius), top to bottom:

1. **Wheel row:** mini wheel (SVG) on the left; on the right "KEY — G major", "SIGNATURE" as an ink
   chip (`♯ F`), "RELATIVE MINOR — E minor".
   - Wheel: outer ring majors, inner ring relative minors, ink center disc with the tonic in yellow.
   - The seven in-key wedges are ink (majors: yellow text; minors: white text on `#3B3C3E`); the other
     wedges are pale yellow with muted text.
2. **Major row, left to right IV · I · V** (Decoder order): ink circles, yellow letters. I is larger and
   labelled "I · KEY". Under each: degree numbers in outlined circles (first one filled ink), then the
   chord's notes.
3. **Divider:** dashed line; vii° on the left as an outlined circle (`F♯°`) with "vii° dim." and its
   degree numbers (first filled); "MAJOR ↑ / minor ↓" on the right.
4. **Minor row, left to right iii · vi · ii** (Decoder order): ink circles, white letters; vi is larger
   and labelled "vi · relative". Degree numbers (first filled), notes, numeral label.

**Below the card:**

- **Progression tray** (surface card): heading, Clear, up to 8 ink chips (numeral in yellow over the
  chord name), hint line.
- **Common progressions:** wrapping outlined pills (numerals + name); the active preset is filled yellow.
- **Step badges on the card:** when the progression is non-empty, each chord in it gets a small white
  badge with its step number(s); a chord used twice shows both ("1·3") in one badge.

**Sizes and layout** (skeleton breakpoints):

| Width | Layout | Wheel | I circle |
|---|---|---|---|
| < 768 (phone) | card, tray, presets stacked; page scrolls | 176px | 84px |
| 768–1279 (tablet) | full-width card; tray and presets side by side below | 270px | 108px |
| ≥ 1280 (desktop) | card 620px left; tray then presets in the right column | 208px | 92px |

Other chord circles scale proportionally (canvas artboards are the source of exact sizes). Colors use the
skeleton's tokens where one exists (ink, surface, border, text tiers); the Decoder yellows are new tokens
local to this feature (`--decoder-yellow #FFD21F`, `--decoder-yellow-soft #FFE680`, `--decoder-yellow-pale #FFEDA3`).
The card stays yellow in dark mode — it is the physical object — while the page around it follows the theme.

## Theory engine — `lib/theory/`

Plain TypeScript, no React; reused later by Chords and Scales.

**Spelled notes.** `SpelledNote = { letter: "A"…"G", accidental: -2…2 }`. Scales are built by walking
letters, so every major scale uses each letter exactly once. `formatNote` renders `♯`/`♭` glyphs; code
uses `#`/`b`.

**Circle.** `CIRCLE: CircleKey[]` — the 12 major keys in fifths order from C:
C G D A E B F♯ D♭ A♭ E♭ B♭ F.
`CircleKey = { tonic: SpelledNote, pitchClass: 0–11, sharpsOrFlats: number /* +n sharps, −n flats */,
relativeMinor: SpelledNote }`.
The 6 o'clock wedge is labelled **F♯** with a small **G♭** beneath; F♯ major is the key used.
Every other position uses its conventional spelling.

**Mapping to the shared root.** The skeleton stores the root as a pitch-class name from `NOTES`
(`"C#"`, `"Eb"`, `"F#"`, `"Ab"`, `"Bb"`…). `circleKeyFor(note)` maps by pitch class (C# → D♭ major);
`rootNoteFor(circleKey)` maps back. Linking keeps working unchanged.

**API (`lib/theory/circle.ts`, `lib/theory/chords.ts`):**

```ts
CIRCLE: CircleKey[]
circleKeyFor(note: Note): CircleKey
rootNoteFor(key: CircleKey): Note
majorScale(key: CircleKey): SpelledNote[]          // 7 notes
keySignature(key: CircleKey): SpelledNote[]        // ♯ order F C G D A E B / ♭ order B E A D G C F, first n
diatonicChords(key: CircleKey): Chord[]            // 7, degree order
// Chord = { degree: 1–7, roman: "I"|"ii"|…|"vii°", quality: "maj"|"min"|"dim",
//           root: SpelledNote, notes: [SpelledNote, SpelledNote, SpelledNote],
//           degrees: [d, d+2, d+4] wrapped into 1–7 }
DECODER_LAYOUT = { major: [4, 1, 5], minor: [3, 6, 2], dim: 7 } as const
COMMON_PROGRESSIONS: { id, name, degrees: number[] }[]
//   pop "Pop" [1,5,6,4] · ii-v-i "Jazz turnaround" [2,5,1] · i-iv-v "Three-chord" [1,4,5]
//   vi-iv-i-v "Sensitive" [6,4,1,5] · fifties "50s" [1,6,4,5]
```

Progressions are stored as degrees, never chord names, so transposing is just rendering against the
current key.

## Components and state

`app/circle/page.tsx` renders `<CircleOfFifths />` in place of `ToolPlaceholder`.
Components in `components/circle/`:

| File | Responsibility |
|---|---|
| `circle-of-fifths.tsx` | Client root: reads key + progression state, composes the pieces, responsive layout |
| `decoder-card.tsx` | The yellow card; owns swipe detection |
| `mini-wheel.tsx` | SVG wheel at a given rotation; in-key highlighting; drag + keyboard handlers via `useWheelRotation` |
| `chord-circle.tsx` | One chord: label, circle, degree numbers, notes, step badge; a button that adds the chord |
| `progression-tray.tsx` | Chips (tap removes), Clear |
| `common-progressions.tsx` | Preset pills with `aria-pressed` |

**Key state.** `useToolKey("circle")` from the skeleton. A committed turn calls `setRoot(rootNoteFor(key))`.

**Progression state.** New persisted entry `nomad:circle:progression:v1`:
`{ degrees: number[] /* each 1–7, length ≤ 8 */, presetId: string | null }`, read through
`useSyncExternalStore` with the same guarantees as the key store: every storage access in try/catch,
in-memory fallback, invalid or unknown stored data → `{ degrees: [], presetId: null }`, cross-tab
`storage` events honored. Operations:

- add a chord's degree (ignored once 8 are in the tray); clears `presetId`
- remove the chip at an index; clears `presetId`
- clear → empty, `presetId: null`
- pick a preset → `degrees` = the preset's, `presetId` = its id

`stepBadges(degrees): Map<degree, number[]>` (1-based steps) drives the badges.

**Accessibility.**

- Wheel: `role="slider"`, `aria-valuemin=0`, `aria-valuemax=11`, `aria-valuenow` = circle index,
  `aria-valuetext` = "G major, 1 sharp"; ←/→ turn one step (→ = clockwise, G → D).
- Chord buttons: "Add C major, IV, to progression". Tray chips: "Remove C major, step 4".
- A polite live region announces committed key changes ("D major, 2 sharps").
- All targets ≥ 44px; text contrast as drawn on the canvas (ink on yellow).

## Interaction

**Rotation model.** One angle `θ` (degrees). Key at 12 o'clock: `index = round(−θ / 30) mod 12`.
Wedge labels counter-rotate to stay upright.

**Drag the wheel.** `pointerdown` on the wheel captures the pointer; `θ` follows the finger's angle
around the wheel center. While dragging, the card previews the nearest key (center letter, facts,
chord rows) without committing. On release: project `θ` by release angular velocity × 0.15s, take the
nearest key to that, spring `θ` there (~300ms, slight overshoot, like a detent), then commit through
`setRoot` — one storage write per turn. The wheel has `touch-action: none`.

**Swipe the card.** A pointer that starts on the card but not the wheel becomes a swipe when
|dx| > 48px and |dx| > 1.5·|dy|. Left swipe = one step clockwise (G → D, +1 sharp); right = counter-clockwise
(G → C). The wheel animates the same spring, then commits. The card has `touch-action: pan-y` so vertical
scrolling is untouched.

**Tap vs. swipe on chords.** Movement < 8px from pointerdown is a tap (adds the chord); anything more
belongs to the swipe and adds nothing.

**External key changes** (linked tool, another tab, first load). The wheel springs the shortest way to
the new key; on first load it starts at the saved key with no animation.

**Reduced motion.** With `prefers-reduced-motion: reduce`: no spring, no flick projection, no
overshoot — the wheel jumps to the key and chord names change instantly.

**Pure functions (`lib/circle/`):**

```ts
angleToKeyIndex(theta: number): number                         // 0–11
nearestTarget(theta: number, velocityDegPerSec: number): number // target θ, flick-projected, nearest equivalent angle
springStep(s: { x: number; v: number }, target: number, dtSec: number): { x: number; v: number }
classifyGesture(dx: number, dy: number): "tap" | "swipe-left" | "swipe-right" | "none"
```

`useWheelRotation` (hook) runs the `requestAnimationFrame` loop and pointer/keyboard handlers on top of these.

## Error handling

- Corrupt or older-shape stored progression → empty tray, no crash.
- Storage blocked (Safari private mode) → in-memory for the session.
- No Pointer Events support → dragging and swiping do nothing; the keyboard arrows on the wheel still
  turn it. (Every browser this app targets has Pointer Events; this is a no-crash guarantee, not a feature.)

## Testing

**Unit (Vitest):**

- Theory: all 12 major scales against a hand-written reference table; sharps/flats counts; signature
  order; diatonic chords for G, F and D♭ (names, qualities, notes, degree triples); every scale uses
  each letter once; `circleKeyFor`/`rootNoteFor` round-trip for all 12 pitch classes, including
  C# → D♭ and F# → F♯.
- Wheel math: `angleToKeyIndex` with negative and wrapped angles; `nearestTarget` takes the short way
  (B → C♯ never via F♯) and adds steps for a fast flick; `springStep` settles within 400ms with overshoot
  < 30°; `classifyGesture` at the 8px / 48px / 1.5× thresholds.
- Progression store: add up to 8, remove, clear, preset replace, manual edit clears `presetId`,
  `stepBadges` merges duplicates ("1·3"), transposition by rendering against another key, invalid
  stored shapes → empty, storage throwing → in-memory.
- Components: `DecoderCard` in G renders majors C · G · D, minors Bm · Em · Am and F♯° on the divider;
  `ChordCircle` accessible name and filled first degree; `ProgressionTray` remove + Clear;
  `CommonProgressions` `aria-pressed`.

**E2E (Playwright, `iphone` WebKit + `desktop` Chromium):**

- G major: chords in Decoder order, signature `♯ F`.
- Swipe left on the card → D major (2 sharps); swipe right → C major.
- Scripted drag around the wheel commits a new key on release.
- Desktop: ←/→ on the focused wheel step the key.
- Linked: turn to D on the Circle → Chords shows D; unlinked: other tools unchanged.
- Progression: pick Pop → tray G D Em C and badges; swipe → D A Bm G; tap a chip removes it; reload keeps it.
- iPhone: a vertical swipe on the card scrolls the page and adds no chord.
- Reduced motion emulated: key changes without animation.
- The existing layout spec (no horizontal scroll 320–1440) already covers `/circle/`.
- Wait for navigation to land before asserting (see `CLAUDE.md`).

**Visual check:** phone, tablet and desktop screenshots compared to the canvas artboards before
calling it done.
