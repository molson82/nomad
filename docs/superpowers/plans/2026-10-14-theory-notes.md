# Theory Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eight short, live "why" notes opened from ⓘ buttons in the three tools, shown in a bottom sheet.

**Architecture:** Each note is a pure function in `lib/notes/` returning `{ title, paragraphs }`, where a paragraph is text segments with optional `{ strong }` live values, built from the existing theory modules so spelling matches the tools. A shared `InfoButton` portals a `NoteSheet` (native `<dialog>` + `showModal()`) into `document.body` while open and refocuses itself on close. Tools place `InfoButton`s next to the things they explain.

**Tech Stack:** Next 15 static export, React 19, TypeScript strict, Tailwind 3, lucide-react (already installed), Vitest + Testing Library (jsdom 25), Playwright (`iphone` + `desktop`), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-theory-notes-design.md`

## Global Constraints

- Note text is exactly the spec's wording, filled with live values spelled by `formatNote`. Live values are `{ strong }` segments.
- ⓘ: lucide `Info`, 20px icon, 44 × 44px button, `aria-label` "About …", `aria-haspopup="dialog"`, `text-accent-ink` (on the yellow Decoder card: `text-ink`). Never inside a heading or an `aria-hidden` subtree.
- Sheet: native `<dialog>` via `showModal()`; Esc, backdrop tap, ✕ (44px, "Close") and a > 60px downward swipe on the header close it; focus returns to the ⓘ. Phones: bottom-docked, rounded top, handle, max-h 80vh, body scrolls. md+: centred, max-w 480px. Reduced motion: no slide.
- `aria-labelledby` points at the sheet's `h2` title.
- No new dependencies.

## Review Focus

1. Tapping the ⓘ inside the swipeable Decoder card must open the note, not swipe the wheel or add a chord (Task 5 e2e taps it on the iPhone project).
2. With a progression chord selected in the Chord Compass, "How … is built" must describe that chord, not the key chord (Task 6 unit test).
3. iOS WebKit: Esc and ✕ close the dialog and focus returns to the ⓘ (Task 5/6 e2e run on `iphone`).
4. The blue note named in note 8 must equal the one the Scale Compass draws, in every key and tonality (Task 3 test against `neckNotes`).
5. Server render: no `document` access until the sheet opens (the portal only renders while open — Task 4 implementation; `pnpm build` in Task 6 proves it).

---

### Task 1: Note types and the Circle notes (1–3)

**Files:**
- Create: `lib/notes/types.ts`, `lib/notes/key-facts.ts`, `lib/notes/circle-notes.ts`
- Test: `tests/unit/notes-circle.test.ts`

**Interfaces:**
- Produces:
  - `type Segment = string | { strong: string }`, `type Paragraph = Segment[]`, `type TheoryNote = { title: string; paragraphs: Paragraph[] }`, `plainText(p: Paragraph): string` (types.ts)
  - `signatureText(key: CircleKey): string` (key-facts.ts)
  - `fifthsNote(root: Note): TheoryNote`, `keyChordsNote(root: Note): TheoryNote`, `progressionNote(root: Note, presetId: string | null): TheoryNote`

- [ ] **Step 1: Write the failing test**

`tests/unit/notes-circle.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fifthsNote, keyChordsNote, progressionNote } from "@/lib/notes/circle-notes";
import { plainText, type TheoryNote } from "@/lib/notes/types";
import { COMMON_PROGRESSIONS } from "@/lib/theory/chords";

const text = (note: TheoryNote) => note.paragraphs.map(plainText);
const strong = (note: TheoryNote, p: number) =>
  note.paragraphs[p].flatMap((s) => (typeof s === "string" ? [] : [s.strong]));

describe("fifthsNote", () => {
  it("explains G's neighbours", () => {
    const note = fifthsNote("G");
    expect(note.title).toBe("Why the circle moves in fifths");
    expect(text(note)).toEqual([
      "Each step clockwise is a fifth up: count five letters from G and you land on D (G A B C D).",
      "Every step clockwise adds one sharp, and every step counter-clockwise adds one flat. G major has 1 sharp: F♯.",
      "So C sits to its left and D to its right — neighbours share all but one note, which is why they sound so close.",
    ]);
    expect(strong(note, 1)).toEqual(["G major", "1 sharp: F♯"]);
  });

  it("spells a flat key from its own scale", () => {
    expect(text(fifthsNote("C#"))).toEqual([
      "Each step clockwise is a fifth up: count five letters from D♭ and you land on A♭ (D E F G A).",
      "Every step clockwise adds one sharp, and every step counter-clockwise adds one flat. D♭ major has 5 flats: B♭ E♭ A♭ D♭ G♭.",
      "So G♭ sits to its left and A♭ to its right — neighbours share all but one note, which is why they sound so close.",
    ]);
  });

  it("names C's signature as none", () => {
    expect(text(fifthsNote("C"))[1]).toContain("C major has no sharps or flats.");
  });
});

describe("keyChordsNote", () => {
  it("lists G's scale and chords", () => {
    const note = keyChordsNote("G");
    expect(note.title).toBe("The chords of G major");
    expect(text(note)).toEqual([
      "Stack every other note of the G major scale — G A B C D E F♯ — and you get a three-note chord on each degree.",
      "The pattern never changes: major, minor, minor, major, major, minor, diminished. In G: I G · ii Am · iii Bm · IV C · V D · vi Em · vii° F♯°.",
      "The window shows them as neighbours: the majors IV · I · V on top, each with its relative minor underneath, and the one diminished chord on its own.",
    ]);
  });

  it("spells D♭'s chords with flats", () => {
    expect(text(keyChordsNote("C#"))[1]).toBe(
      "The pattern never changes: major, minor, minor, major, major, minor, diminished. In D♭: I D♭ · ii E♭m · iii Fm · IV G♭ · V A♭ · vi B♭m · vii° C°.",
    );
  });
});

describe("progressionNote", () => {
  const pull = "V → I is the strongest pull in music: V contains the 7th of the scale (F♯), a half step below home (G), and it wants to rise.";

  it("explains Pop in G", () => {
    const note = progressionNote("G", "pop");
    expect(note.title).toBe("Pop · I–V–vi–IV");
    expect(text(note)).toEqual([
      "G – D – Em – C. The V (D) pulls back toward home, but instead of resolving the loop slips to vi (Em), the relative minor, then IV (C) — so it circles forever without quite landing.",
      pull,
    ]);
  });

  it.each([
    ["ii-v-i", "Jazz turnaround · ii–V–I", "Am – D – G. Each chord's root is a fifth above the next, the strongest move in the key: ii sets up V, and V resolves to I."],
    ["i-iv-v", "Three-chord · I–IV–V", "G – C – D. The three major chords of the key; between them they contain every note of G major, which is why so many songs need nothing else."],
    ["vi-iv-i-v", "Sensitive · vi–IV–I–V", "Em – C – G – D. The Pop chords started from the relative minor, so the same loop feels darker and ends hanging on V."],
    ["fifties", "50s · I–vi–IV–V", "G – Em – C – D. Home, its relative minor, then IV and V climbing back to home — the doo-wop loop."],
  ])("explains %s in G", (id, title, first) => {
    const note = progressionNote("G", id);
    expect(note.title).toBe(title);
    expect(text(note)).toEqual([first, pull]);
  });

  it("has a note for every preset", () => {
    for (const preset of COMMON_PROGRESSIONS) expect(progressionNote("C", preset.id).title).toContain(preset.name);
  });

  it("explains tension and release with no preset", () => {
    const note = progressionNote("G", null);
    expect(note.title).toBe("Why progressions work");
    expect(text(note)).toEqual([
      "Chords in a progression trade tension and release: I is home, IV moves away, V leans back.",
      pull,
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/notes-circle.test.ts`
Expected: FAIL — cannot resolve `@/lib/notes/circle-notes`.

- [ ] **Step 3: Implement**

`lib/notes/types.ts`:

```ts
// A note is plain text with the live values (key, notes, chords) marked strong.
export type Segment = string | { strong: string };
export type Paragraph = Segment[];
export type TheoryNote = { title: string; paragraphs: Paragraph[] };

export function plainText(paragraph: Paragraph): string {
  return paragraph.map((s) => (typeof s === "string" ? s : s.strong)).join("");
}
```

`lib/notes/key-facts.ts`:

```ts
import { keySignature, type CircleKey } from "@/lib/theory/circle";
import { formatNote } from "@/lib/theory/spelling";

// "no sharps or flats" · "1 sharp: F♯" · "5 flats: B♭ E♭ A♭ D♭ G♭"
export function signatureText(key: CircleKey): string {
  const notes = keySignature(key);
  if (notes.length === 0) return "no sharps or flats";
  const kind = key.sharpsOrFlats > 0 ? "sharp" : "flat";
  return `${notes.length} ${kind}${notes.length > 1 ? "s" : ""}: ${notes.map(formatNote).join(" ")}`;
}
```

`lib/notes/circle-notes.ts`:

```ts
import { COMMON_PROGRESSIONS, chordName, diatonicChords, progressionLabel } from "@/lib/theory/chords";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { signatureText } from "./key-facts";
import type { Paragraph, Segment, TheoryNote } from "./types";

// The neighbours are named from the key's own scale (its 4th and 5th), so F♯'s right-hand neighbour reads C♯.
export function fifthsNote(root: Note): TheoryNote {
  const key = circleKeyFor(root);
  const scale = majorScale(key);
  const tonic = formatNote(key.tonic);
  const fifth = formatNote(scale[4]);
  const letters = scale.slice(0, 5).map((n) => n.letter).join(" ");
  return {
    title: "Why the circle moves in fifths",
    paragraphs: [
      ["Each step clockwise is a fifth up: count five letters from ", { strong: tonic }, " and you land on ", { strong: fifth }, ` (${letters}).`],
      ["Every step clockwise adds one sharp, and every step counter-clockwise adds one flat. ", { strong: `${tonic} major` }, " has ", { strong: signatureText(key) }, "."],
      ["So ", { strong: formatNote(scale[3]) }, " sits to its left and ", { strong: fifth }, " to its right — neighbours share all but one note, which is why they sound so close."],
    ],
  };
}

export function keyChordsNote(root: Note): TheoryNote {
  const key = circleKeyFor(root);
  const tonic = formatNote(key.tonic);
  const chords = diatonicChords(key);
  return {
    title: `The chords of ${tonic} major`,
    paragraphs: [
      ["Stack every other note of the ", tonic, " major scale — ", { strong: majorScale(key).map(formatNote).join(" ") }, " — and you get a three-note chord on each degree."],
      ["The pattern never changes: major, minor, minor, major, major, minor, diminished. In ", tonic, ": ", { strong: chords.map((c) => `${c.roman} ${chordName(c)}`).join(" · ") }, "."],
      ["The window shows them as neighbours: the majors IV · I · V on top, each with its relative minor underneath, and the one diminished chord on its own."],
    ],
  };
}

type Why = (chord: (degree: number) => string, tonic: string) => Segment[];

const WHY: Record<string, Why> = {
  pop: (c) => ["The V (", { strong: c(5) }, ") pulls back toward home, but instead of resolving the loop slips to vi (", { strong: c(6) }, "), the relative minor, then IV (", { strong: c(4) }, ") — so it circles forever without quite landing."],
  "ii-v-i": () => ["Each chord's root is a fifth above the next, the strongest move in the key: ii sets up V, and V resolves to I."],
  "i-iv-v": (_c, tonic) => ["The three major chords of the key; between them they contain every note of ", tonic, " major, which is why so many songs need nothing else."],
  "vi-iv-i-v": () => ["The Pop chords started from the relative minor, so the same loop feels darker and ends hanging on V."],
  fifties: () => ["Home, its relative minor, then IV and V climbing back to home — the doo-wop loop."],
};

export function progressionNote(root: Note, presetId: string | null): TheoryNote {
  const key = circleKeyFor(root);
  const scale = majorScale(key);
  const chords = diatonicChords(key);
  const chord = (degree: number) => chordName(chords[degree - 1]);
  const tonic = formatNote(key.tonic);
  const pull: Paragraph = ["V → I is the strongest pull in music: V contains the 7th of the scale (", { strong: formatNote(scale[6]) }, "), a half step below home (", { strong: tonic }, "), and it wants to rise."];
  const preset = COMMON_PROGRESSIONS.find((p) => p.id === presetId);
  if (!preset) {
    return {
      title: "Why progressions work",
      paragraphs: [["Chords in a progression trade tension and release: I is home, IV moves away, V leans back."], pull],
    };
  }
  return {
    title: `${preset.name} · ${progressionLabel(preset.degrees)}`,
    paragraphs: [[{ strong: preset.degrees.map(chord).join(" – ") }, ". ", ...WHY[preset.id](chord, tonic)], pull],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/notes-circle.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/notes tests/unit/notes-circle.test.ts
git commit -m "Notes: Circle of Fifths theory notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Chord and relative-minor notes (4–6)

**Files:**
- Create: `lib/notes/chord-notes.ts`
- Test: `tests/unit/notes-chords.test.ts`

**Interfaces:**
- Consumes: `TheoryNote`, `plainText`, `signatureText` (Task 1); `triad`, `Quality` (fretboard.ts); `cagedShapes`, `CagedShape` (caged.ts).
- Produces:
  - `chordBuildNote(chord: readonly SpelledNote[], quality: Quality): TheoryNote`
  - `cagedNote(chord: readonly SpelledNote[], quality: Quality, shapes: readonly CagedShape[]): TheoryNote` (shapes in neck order)
  - `relativeMinorNote(root: Note): TheoryNote`

- [ ] **Step 1: Write the failing test**

`tests/unit/notes-chords.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cagedNote, chordBuildNote, relativeMinorNote } from "@/lib/notes/chord-notes";
import { plainText, type TheoryNote } from "@/lib/notes/types";
import { cagedShapes } from "@/lib/theory/caged";
import { triad } from "@/lib/theory/fretboard";

const text = (note: TheoryNote) => note.paragraphs.map(plainText);
const dots = "Everything you see on the neck is one of those three notes — the black dots are the root.";

describe("chordBuildNote", () => {
  it("builds G major", () => {
    const note = chordBuildNote(triad("G"), "major");
    expect(note.title).toBe("How G major is built");
    expect(text(note)).toEqual([
      "A major chord is the 1st, 3rd and 5th notes of its major scale: G · B · D. The 3rd is four frets above the root; the 5th is seven.",
      dots,
    ]);
  });

  it("builds E minor with a lowered 3rd", () => {
    const note = chordBuildNote(triad("G", "minor"), "minor");
    expect(note.title).toBe("How E minor is built");
    expect(text(note)[0]).toBe("A minor chord lowers the 3rd by one fret: E · G · B. That one note is the whole difference between major and minor.");
  });

  it("spells flat keys", () => {
    expect(chordBuildNote(triad("C#"), "major").title).toBe("How D♭ major is built");
    expect(text(chordBuildNote(triad("C#", "minor"), "minor"))[0]).toContain("B♭ · D♭ · F");
  });
});

describe("cagedNote", () => {
  it("chains G's shapes up the neck", () => {
    const note = cagedNote(triad("G"), "major", cagedShapes("G"));
    expect(note.title).toBe("CAGED: five shapes, one chord");
    expect(text(note)).toEqual([
      "Every major chord can be played with the five open-chord shapes C, A, G, E and D, slid up the neck until their root lands on G.",
      "Each shape shares its root notes with the next, so they link end to end: in G the G-shape (frets 0–3) hands its root to the E-shape (3–5), then D (5–8), C (7–10) and A (10–12).",
      "Learn where the root sits in each shape and you can find G anywhere on the neck.",
    ]);
  });

  it("uses minor shape names for E minor", () => {
    const note = cagedNote(triad("G", "minor"), "minor", cagedShapes("G", "minor"));
    expect(text(note).slice(0, 2)).toEqual([
      "Every minor chord can be played with the five open-chord shapes Cm, Am, Gm, Em and Dm, slid up the neck until their root lands on E.",
      "Each shape shares its root notes with the next, so they link end to end: in Em the Em-shape (frets 0–2) hands its root to the Dm-shape (2–5), then Cm (4–7), Am (7–9) and Gm (9–12).",
    ]);
  });
});

describe("relativeMinorNote", () => {
  it("pairs G major with E minor", () => {
    const note = relativeMinorNote("G");
    expect(note.title).toBe("G major and E minor");
    expect(text(note)).toEqual([
      "Start the G major scale on its 6th note, E, and you get E minor: the same seven notes, just a different home.",
      "That's why the two keys share every chord and the same key signature (1 sharp: F♯), and why switching to Minor keeps you in the same place on the neck.",
    ]);
  });

  it("pairs D♭ major with B♭ minor", () => {
    expect(relativeMinorNote("C#").title).toBe("D♭ major and B♭ minor");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/notes-chords.test.ts`
Expected: FAIL — cannot resolve `@/lib/notes/chord-notes`.

- [ ] **Step 3: Implement**

`lib/notes/chord-notes.ts`:

```ts
import type { CagedShape } from "@/lib/theory/caged";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote, type SpelledNote } from "@/lib/theory/spelling";
import { signatureText } from "./key-facts";
import type { Paragraph, TheoryNote } from "./types";

export function chordBuildNote(chord: readonly SpelledNote[], quality: Quality): TheoryNote {
  const notes = { strong: chord.map(formatNote).join(" · ") };
  const first: Paragraph =
    quality === "major"
      ? ["A major chord is the 1st, 3rd and 5th notes of its major scale: ", notes, ". The 3rd is four frets above the root; the 5th is seven."]
      : ["A minor chord lowers the 3rd by one fret: ", notes, ". That one note is the whole difference between major and minor."];
  return {
    title: `How ${formatNote(chord[0])} ${quality} is built`,
    paragraphs: [first, ["Everything you see on the neck is one of those three notes — the black dots are the root."]],
  };
}

export function cagedNote(chord: readonly SpelledNote[], quality: Quality, shapes: readonly CagedShape[]): TheoryNote {
  const root = formatNote(chord[0]);
  const range = (s: CagedShape) => `${s.lowFret}–${s.highFret}`;
  const [a, b, c, d, e] = shapes;
  return {
    title: "CAGED: five shapes, one chord",
    paragraphs: [
      ["Every ", quality, " chord can be played with the five open-chord shapes ", quality === "minor" ? "Cm, Am, Gm, Em and Dm" : "C, A, G, E and D", ", slid up the neck until their root lands on ", { strong: root }, "."],
      [
        "Each shape shares its root notes with the next, so they link end to end: in ",
        quality === "minor" ? `${root}m` : root,
        " the ",
        { strong: `${a.label}-shape` },
        ` (frets ${range(a)}) hands its root to the `,
        { strong: `${b.label}-shape` },
        ` (${range(b)}), then ${c.label} (${range(c)}), ${d.label} (${range(d)}) and ${e.label} (${range(e)}).`,
      ],
      ["Learn where the root sits in each shape and you can find ", root, " anywhere on the neck."],
    ],
  };
}

export function relativeMinorNote(root: Note): TheoryNote {
  const key = circleKeyFor(root);
  const tonic = formatNote(key.tonic);
  const sixth = formatNote(key.relativeMinor);
  return {
    title: `${tonic} major and ${sixth} minor`,
    paragraphs: [
      ["Start the ", tonic, " major scale on its 6th note, ", { strong: sixth }, ", and you get ", { strong: `${sixth} minor` }, ": the same seven notes, just a different home."],
      ["That's why the two keys share every chord and the same key signature (", signatureText(key), "), and why switching to Minor keeps you in the same place on the neck."],
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/notes-chords.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/notes/chord-notes.ts tests/unit/notes-chords.test.ts
git commit -m "Notes: chord building, CAGED and relative minor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Scale notes (7–8)

**Files:**
- Create: `lib/notes/scale-notes.ts`
- Test: `tests/unit/notes-scales.test.ts`

**Interfaces:**
- Consumes: `TheoryNote`, `plainText` (Task 1); `scaleNotes`, `scaleDegrees`, `neckNotes`, `Tonality` (scales.ts).
- Produces: `scaleBuildNote(root: Note, tonality: Tonality): TheoryNote`, `pentatonicNote(root: Note, tonality: Tonality): TheoryNote`.

- [ ] **Step 1: Write the failing test**

`tests/unit/notes-scales.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pentatonicNote, scaleBuildNote } from "@/lib/notes/scale-notes";
import { plainText, type TheoryNote } from "@/lib/notes/types";
import { NOTES } from "@/lib/theory/notes";
import { neckNotes } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";

const text = (note: TheoryNote) => note.paragraphs.map(plainText);

describe("scaleBuildNote", () => {
  it("builds G major", () => {
    const note = scaleBuildNote("G", "major");
    expect(note.title).toBe("Building G major");
    expect(text(note)).toEqual([
      "A major scale climbs seven notes in a fixed pattern of whole (W) and half (H) steps: W W H W W W H.",
      "From G: G – A – B – C – D – E – F♯ – G. The half steps fall at B–C and F♯–G.",
      "The numbers 1–7 are each note's place in the scale.",
    ]);
  });

  it("renumbers from ⑥ in minor", () => {
    const note = scaleBuildNote("G", "minor");
    expect(note.title).toBe("Building E minor");
    expect(text(note)[2]).toBe("Minor starts the same notes from ⑥ (E) and renumbers, so its 3rd, 6th and 7th come out flat: ♭3 ♭6 ♭7.");
  });

  it("spells D♭ with flats", () => {
    expect(text(scaleBuildNote("C#", "major"))[1]).toBe(
      "From D♭: D♭ – E♭ – F – G♭ – A♭ – B♭ – C – D♭. The half steps fall at F–G♭ and C–D♭.",
    );
  });
});

describe("pentatonicNote", () => {
  it("drops 4 and 7 in G major and adds ♭3 for blues", () => {
    const note = pentatonicNote("G", "major");
    expect(note.title).toBe("Pentatonic and blues");
    expect(text(note)).toEqual([
      "Pentatonic keeps five of the seven notes by dropping the 4th and 7th (C and F♯) — the two that sit a half step from a neighbour, so nothing clashes: G A B D E.",
      "Blues adds one more, the ♭3 (B♭) — the “blue note” between the 2nd and 3rd that you slide up from.",
    ]);
  });

  it("drops 2 and ♭6 in E minor and adds ♭5 for blues", () => {
    expect(text(pentatonicNote("G", "minor"))).toEqual([
      "Pentatonic keeps five of the seven notes by dropping the 2nd and ♭6th (F♯ and C) — the two that sit a half step from a neighbour, so nothing clashes: E G A B D.",
      "Blues adds one more, the ♭5 (B♭) — the “blue note” between the 4th and 5th that you bend into and out of.",
    ]);
  });

  it("names the same blue note the Scale Compass draws, in every key", () => {
    for (const root of NOTES) {
      for (const tonality of ["major", "minor"] as const) {
        const drawn = neckNotes(root, { tonality, type: "blues" }).find((n) => n.kind === "blue")!.note;
        const named = pentatonicNote(root, tonality).paragraphs[1].find((s) => typeof s !== "string") as { strong: string };
        expect(`${root} ${tonality} ${named.strong}`).toBe(`${root} ${tonality} ${formatNote(drawn)}`);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/notes-scales.test.ts`
Expected: FAIL — cannot resolve `@/lib/notes/scale-notes`.

- [ ] **Step 3: Implement**

`lib/notes/scale-notes.ts`:

```ts
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { scaleDegrees, scaleNotes, type Tonality } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";
import type { TheoryNote } from "./types";

export function scaleBuildNote(root: Note, tonality: Tonality): TheoryNote {
  const s = majorScale(circleKeyFor(root)).map(formatNote);
  return {
    title: tonality === "major" ? `Building ${s[0]} major` : `Building ${s[5]} minor`,
    paragraphs: [
      ["A major scale climbs seven notes in a fixed pattern of whole (W) and half (H) steps: ", { strong: "W W H W W W H" }, "."],
      ["From ", s[0], ": ", { strong: [...s, s[0]].join(" – ") }, ". The half steps fall at ", { strong: `${s[2]}–${s[3]}` }, " and ", { strong: `${s[6]}–${s[0]}` }, "."],
      tonality === "major"
        ? ["The numbers 1–7 are each note's place in the scale."]
        : ["Minor starts the same notes from ⑥ (", { strong: s[5] }, ") and renumbers, so its 3rd, 6th and 7th come out flat: ", { strong: "♭3 ♭6 ♭7" }, "."],
    ],
  };
}

// The note named "blue" is read from the Scale Compass's own blues view, never re-derived.
export function pentatonicNote(root: Note, tonality: Tonality): TheoryNote {
  const degreeNote = (type: "scale" | "blues", label: string) => {
    const view = { tonality, type };
    return formatNote(scaleNotes(root, view)[scaleDegrees(root, view).indexOf(label)]);
  };
  const [dropped, first, second] =
    tonality === "major" ? ["4th and 7th", degreeNote("scale", "4"), degreeNote("scale", "7")] : ["2nd and ♭6th", degreeNote("scale", "2"), degreeNote("scale", "♭6")];
  const pentatonic = scaleNotes(root, { tonality, type: "pentatonic" }).map(formatNote).join(" ");
  return {
    title: "Pentatonic and blues",
    paragraphs: [
      ["Pentatonic keeps five of the seven notes by dropping the ", dropped, " (", { strong: first }, " and ", { strong: second }, ") — the two that sit a half step from a neighbour, so nothing clashes: ", { strong: pentatonic }, "."],
      tonality === "minor"
        ? ["Blues adds one more, the ♭5 (", { strong: degreeNote("blues", "♭5") }, ") — the “blue note” between the 4th and 5th that you bend into and out of."]
        : ["Blues adds one more, the ♭3 (", { strong: degreeNote("blues", "♭3") }, ") — the “blue note” between the 2nd and 3rd that you slide up from."],
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/notes-scales.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/notes/scale-notes.ts tests/unit/notes-scales.test.ts
git commit -m "Notes: scale building, pentatonic and blues

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The ⓘ button and the sheet

**Files:**
- Create: `components/notes/info-button.tsx`, `components/notes/note-sheet.tsx`
- Modify: `tests/unit/setup.ts` (dialog stub), `app/globals.css` (sheet keyframes)
- Test: `tests/unit/info-button.test.tsx`

**Interfaces:**
- Consumes: `TheoryNote`, `Paragraph` (Task 1).
- Produces: `InfoButton({ label: string; note: TheoryNote; className?: string })`, `NoteSheet({ note: TheoryNote; onClose: () => void })`.

- [ ] **Step 1: Write the failing test**

`tests/unit/info-button.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InfoButton } from "@/components/notes/info-button";
import type { TheoryNote } from "@/lib/notes/types";

const note: TheoryNote = { title: "CAGED", paragraphs: [["Five ", { strong: "shapes" }, "."], ["Second."]] };

describe("InfoButton", () => {
  it("is a labelled dialog trigger and renders nothing until tapped", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    expect(screen.getByRole("button", { name: "About CAGED shapes" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the note titled by its heading, with live values strong", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    fireEvent.click(screen.getByRole("button", { name: "About CAGED shapes" }));
    const dialog = screen.getByRole("dialog", { name: "CAGED" });
    expect(within(dialog).getByText("shapes").tagName).toBe("STRONG");
    expect(within(dialog).getByText("Second.")).toBeInTheDocument();
  });

  it("closes with ✕ and gives focus back to the ⓘ", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    const button = screen.getByRole("button", { name: "About CAGED shapes" });
    fireEvent.click(button);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("closes on a backdrop tap and on a downward swipe of the header", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    const button = screen.getByRole("button", { name: "About CAGED shapes" });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(button);
    const header = within(screen.getByRole("dialog")).getByRole("heading", { name: "CAGED" });
    // jsdom has no PointerEvent; a MouseEvent of the same type carries clientY to React.
    fireEvent(header, new MouseEvent("pointerdown", { bubbles: true, clientY: 100 }));
    fireEvent(header, new MouseEvent("pointerup", { bubbles: true, clientY: 180 }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/info-button.test.tsx`
Expected: FAIL — cannot resolve `@/components/notes/info-button`.

- [ ] **Step 3: Implement**

`tests/unit/setup.ts` — append (jsdom 25 has no `showModal`/`close`):

```ts
// jsdom implements <dialog> without showModal/close; enough of both for our sheet.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
```

`app/globals.css` — append:

```css
@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}
```

`components/notes/note-sheet.tsx`:

```tsx
"use client";

import { useEffect, useId, useRef } from "react";
import type { Paragraph, TheoryNote } from "@/lib/notes/types";

const SWIPE_CLOSE_PX = 60;

function Text({ paragraph }: { paragraph: Paragraph }) {
  return (
    <p className="text-[15px] leading-normal">
      {paragraph.map((segment, i) => (typeof segment === "string" ? segment : <strong key={i}>{segment.strong}</strong>))}
    </p>
  );
}

// Mounted only while open: showModal() gives focus trapping, Esc and the backdrop for free.
export function NoteSheet({ note, onClose }: { note: TheoryNote; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();

  useEffect(() => {
    const element = dialog.current!;
    if (!element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click whose target is the dialog itself landed on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[80vh] w-full max-w-full flex-col rounded-t-[22px] bg-surface p-0 text-text-primary shadow-[0_-8px_24px_rgba(0,0,0,0.18)] backdrop:bg-[rgba(22,23,24,0.45)] open:flex motion-safe:animate-[sheet-up_200ms_ease-out] md:inset-0 md:m-auto md:h-fit md:max-w-[480px] md:rounded-[22px] md:motion-safe:animate-none"
    >
      <div
        className="flex flex-col px-[18px] pt-2"
        onPointerDown={(event) => {
          swipeFrom.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (swipeFrom.current !== null && event.clientY - swipeFrom.current > SWIPE_CLOSE_PX) close();
          swipeFrom.current = null;
        }}
      >
        <span aria-hidden className="mx-auto h-[5px] w-10 rounded-full bg-border md:hidden" />
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="font-display text-[22px] font-semibold tracking-[0.02em]">
            {note.title}
          </h2>
          <button type="button" aria-label="Close" onClick={close} className="-mr-2.5 grid h-11 w-11 shrink-0 place-items-center text-xl text-text-secondary">
            ✕
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto px-[18px] pb-8 pt-1">
        {note.paragraphs.map((paragraph, i) => (
          <Text key={i} paragraph={paragraph} />
        ))}
      </div>
    </dialog>
  );
}
```

`components/notes/info-button.tsx`:

```tsx
"use client";

import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TheoryNote } from "@/lib/notes/types";
import { NoteSheet } from "./note-sheet";

interface InfoButtonProps {
  label: string; // "About …"
  note: TheoryNote;
  className?: string; // icon colour; defaults to the tool's accent
}

// The sheet is portalled to <body> only while open, so it never sits inside a heading,
// a swipeable card or a server render.
export function InfoButton({ label, note, className = "text-accent-ink" }: InfoButtonProps) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`-my-3 inline-grid h-11 w-11 shrink-0 place-items-center align-middle ${className}`}
      >
        <Info aria-hidden size={20} strokeWidth={2.2} />
      </button>
      {open &&
        createPortal(
          <NoteSheet
            note={note}
            onClose={() => {
              setOpen(false);
              button.current?.focus();
            }}
          />,
          document.body,
        )}
    </>
  );
}
```

- [ ] **Step 4: Run tests, typecheck and lint**

Run: `pnpm test:unit tests/unit/info-button.test.tsx && pnpm typecheck && pnpm lint`
Expected: PASS; clean.

- [ ] **Step 5: Commit**

```bash
git add components/notes tests/unit/setup.ts tests/unit/info-button.test.tsx app/globals.css
git commit -m "Notes: ⓘ button and bottom sheet on the native dialog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Circle of Fifths notes in place

**Files:**
- Modify: `components/circle/decoder-card.tsx`, `components/circle/common-progressions.tsx`, `components/circle/circle-of-fifths.tsx`
- Create: `tests/e2e/notes.spec.ts`
- Test: `tests/unit/common-progressions.test.tsx` (existing renders get `root`)

**Interfaces:**
- Consumes: `InfoButton` (Task 4); `fifthsNote`, `keyChordsNote`, `progressionNote` (Task 1); `rootNoteFor` (circle.ts).
- Produces: `CommonProgressions({ root: Note; activeId; onPick })`.

- [ ] **Step 1: Write the failing e2e test**

`tests/e2e/notes.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("Circle: the key's chords note opens in the current key and closes with Esc", async ({ page }) => {
  await page.goto("/circle/");
  const info = page.getByRole("button", { name: "About the key's chords" });
  await info.click();
  const sheet = page.getByRole("dialog", { name: "The chords of C major" });
  await expect(sheet).toContainText("I C · ii Dm · iii Em · IV F · V G · vi Am · vii° B°");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(info).toBeFocused();
  // The tap opened a note; it didn't add a chord.
  await expect(page.getByText("No chords yet")).toBeVisible();
});

test("Circle: fifths and progression notes", async ({ page }) => {
  await page.goto("/circle/");
  await page.getByRole("button", { name: "About why the circle moves in fifths" }).click();
  await expect(page.getByRole("dialog", { name: "Why the circle moves in fifths" })).toContainText("you land on G (C D E F G)");
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: /I–V–vi–IV/ }).click();
  await page.getByRole("button", { name: "About progressions" }).click();
  await expect(page.getByRole("dialog", { name: "Pop · I–V–vi–IV" })).toContainText("C – G – Am – F");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec playwright test tests/e2e/notes.spec.ts --project=iphone`
Expected: FAIL — no "About the key's chords" button.

- [ ] **Step 3: Implement**

`components/circle/decoder-card.tsx`:
- Imports: `import { InfoButton } from "@/components/notes/info-button";`, `import { fifthsNote, keyChordsNote } from "@/lib/notes/circle-notes";`, and add `rootNoteFor` to the existing `@/lib/theory/circle` import.
- Key `dd`:

```tsx
            <dd className="flex items-center font-display text-[26px] font-semibold leading-tight md:text-[38px] xl:text-[34px]">
              {formatNote(key.tonic)} major
              <InfoButton label="About why the circle moves in fifths" note={fifthsNote(rootNoteFor(key))} className="text-ink" />
            </dd>
```

- Row labels (the button must not sit inside `aria-hidden`):

```tsx
        <div className="absolute right-1.5 top-0 flex h-full flex-col items-end justify-between md:right-3">
          <span className="flex items-center">
            <span aria-hidden className={`${ROW_LABEL} uppercase`}>Major ↑</span>
            <InfoButton label="About the key's chords" note={keyChordsNote(rootNoteFor(key))} className="text-ink" />
          </span>
          <span aria-hidden className={ROW_LABEL}>minor ↓</span>
        </div>
```

`components/circle/common-progressions.tsx` — add the `root` prop and the ⓘ beside (not inside) the heading:

```tsx
import { InfoButton } from "@/components/notes/info-button";
import { progressionNote } from "@/lib/notes/circle-notes";
import type { Note } from "@/lib/theory/notes";
// ...
interface CommonProgressionsProps {
  root: Note; // the committed key, for the note
  activeId: string | null;
  onPick: (id: string) => void;
}

export function CommonProgressions({ root, activeId, onPick }: CommonProgressionsProps) {
  return (
    <section aria-labelledby="common-heading" className="flex flex-col gap-2.5">
      <div className="flex items-center">
        <h2 id="common-heading" className="font-display text-lg font-semibold uppercase tracking-[0.06em] md:text-xl">
          Common progressions
        </h2>
        <InfoButton label="About progressions" note={progressionNote(root, activeId)} />
      </div>
```

(rest unchanged)

`components/circle/circle-of-fifths.tsx`:

```tsx
          <CommonProgressions root={root} activeId={progression.presetId} onPick={actions.pick} />
```

`tests/unit/common-progressions.test.tsx` — add `root="C"` to every `<CommonProgressions … />` render:

```bash
sed -i '' 's/<CommonProgressions /<CommonProgressions root="C" /g' tests/unit/common-progressions.test.tsx
```

- [ ] **Step 4: Run tests**

Run: `pnpm test:unit && pnpm typecheck && pnpm exec playwright test tests/e2e/notes.spec.ts tests/e2e/circle.spec.ts`
Expected: all PASS (both projects).

- [ ] **Step 5: Commit**

```bash
git add components/circle tests/unit/common-progressions.test.tsx tests/e2e/notes.spec.ts
git commit -m "Circle: theory notes for fifths, the key's chords and progressions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Chord and Scale Compass notes in place, docs

**Files:**
- Modify: `components/chords/root-picker.tsx`, `components/chords/focus-card.tsx`, `components/chords/chord-compass.tsx`, `components/fretboard/focus-card.tsx`, `components/scales/scale-header.tsx`, `components/scales/view-toggles.tsx`, `components/scales/scale-compass.tsx`, `CLAUDE.md`
- Modify: `tests/e2e/notes.spec.ts`
- Test: `tests/unit/root-picker.test.tsx`, `tests/unit/scale-header.test.tsx`

**Interfaces:**
- Consumes: `InfoButton` (Task 4); `chordBuildNote`, `cagedNote`, `relativeMinorNote` (Task 2); `scaleBuildNote`, `pentatonicNote` (Task 3).
- Produces: shared `FocusCard` gains `titleAction?: ReactNode`; chord `FocusCard` gains `info?: ReactNode`; `ViewToggles` gains `info?: ReactNode`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/root-picker.test.tsx` — add inside the describe:

```tsx
  it("explains the chord on screen, including a progression chord", () => {
    const { rerender } = render(<RootPicker root="G" quality="minor" onStep={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "About how a chord is built" }));
    expect(screen.getByRole("dialog", { name: "How E minor is built" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    rerender(<RootPicker root="G" quality="major" step={progressionSteps("G", [5])[0]} onStep={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "About how a chord is built" }));
    expect(screen.getByRole("dialog", { name: "How D major is built" })).toBeInTheDocument();
  });

  it("explains the relative minor from the key view only", () => {
    const { rerender } = render(<RootPicker root="G" quality="major" onStep={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "About the relative minor" }));
    expect(screen.getByRole("dialog", { name: "G major and E minor" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    rerender(<RootPicker root="G" quality="major" step={progressionSteps("G", [5])[0]} onStep={() => {}} />);
    expect(screen.queryByRole("button", { name: "About the relative minor" })).toBeNull();
  });
```

`tests/unit/scale-header.test.tsx` — add inside the describe (match the file's existing render props for `ScaleHeader`):

```tsx
  it("explains how the minor scale is built", () => {
    render(<ScaleHeader root="G" view={{ tonality: "minor", type: "scale" }} onStep={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "About how the scale is built" }));
    expect(screen.getByRole("dialog", { name: "Building E minor" })).toHaveTextContent("♭3 ♭6 ♭7");
  });
```

(add `fireEvent` to that file's `@testing-library/react` import if missing)

Append to `tests/e2e/notes.spec.ts`:

```ts
test("Chord Compass: CAGED note lists the key chord's shapes", async ({ page }) => {
  await page.goto("/chords/");
  await page.getByRole("button", { name: "About CAGED shapes" }).click();
  const sheet = page.getByRole("dialog", { name: "CAGED: five shapes, one chord" });
  await expect(sheet).toContainText("in C the C-shape (frets 0–3) hands its root to the A-shape (3–5)");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
});

test("Scale Compass: building and pentatonic notes follow the view", async ({ page }) => {
  await page.goto("/scales/");
  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Minor" }).click();
  await page.getByRole("button", { name: "About how the scale is built" }).click();
  await expect(page.getByRole("dialog", { name: "Building A minor" })).toContainText("♭3 ♭6 ♭7");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "About pentatonic and blues" }).click();
  await expect(page.getByRole("dialog", { name: "Pentatonic and blues" })).toContainText("A C D E G");
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test:unit tests/unit/root-picker.test.tsx tests/unit/scale-header.test.tsx`
Expected: FAIL — no "About …" buttons.

- [ ] **Step 3: Implement**

`components/chords/root-picker.tsx` — imports `InfoButton`, `chordBuildNote`, `relativeMinorNote`; replace the right-hand column:

```tsx
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <div className="flex items-center">
          <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{title}</h2>
          <InfoButton label="About how a chord is built" note={chordBuildNote(chord, step?.quality ?? quality)} />
        </div>
        <p className="text-[13px] font-semibold">{chord.map(formatNote).join(" · ")}</p>
        <p className="flex items-center text-xs font-semibold text-relative">
          {relation}
          {!step && <InfoButton label="About the relative minor" note={relativeMinorNote(root)} />}
        </p>
      </div>
```

`components/fretboard/focus-card.tsx` — add `titleAction?: ReactNode` to the props (import `type ReactNode` from "react"), destructure it, and render it beside the title:

```tsx
          <div className="flex items-center justify-center xl:justify-start">
            <h3 className="text-balance font-display text-[26px] font-semibold leading-tight xl:text-[30px]">{title}</h3>
            {titleAction}
          </div>
```

`components/chords/focus-card.tsx` — add `info?: ReactNode` to `FocusCardProps` and pass `titleAction={info}` to `SharedFocusCard`.

`components/chords/chord-compass.tsx` — imports `InfoButton` and `cagedNote`; pass the note to the focus card:

```tsx
          <FocusCard
            shape={shape}
            shapes={shapes}
            chordName={chordName}
            onStep={stepShape}
            info={<InfoButton label="About CAGED shapes" note={cagedNote(chord, chordQuality, shapes)} />}
          />
```

`components/scales/scale-header.tsx` — imports `InfoButton`, `scaleBuildNote`, `relativeMinorNote`:

```tsx
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <div className="flex items-center">
          <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{scaleName(root, view)}</h2>
          <InfoButton label="About how the scale is built" note={scaleBuildNote(root, view.tonality)} />
        </div>
        <p className="text-[13px] font-semibold">{scaleNotes(root, view).map(formatNote).join(" ")}</p>
        <p className="flex items-center text-xs font-semibold text-relative">
          {relation}
          <InfoButton label="About the relative minor" note={relativeMinorNote(root)} />
        </p>
      </div>
```

`components/scales/view-toggles.tsx` — add `info?: ReactNode` to `ViewTogglesProps` and render `{info}` right after the "Scale type" group (inside the same `flex flex-wrap` container, wrapped so it stays beside the group):

```tsx
      <div className="flex flex-1 items-center">
        <div role="group" aria-label="Scale type" className="flex flex-1 overflow-hidden rounded-full border-[1.5px] border-text-primary">
          {/* …unchanged buttons… */}
        </div>
        {info}
      </div>
```

`components/scales/scale-compass.tsx`:

```tsx
        <ViewToggles
          view={view}
          onChange={update}
          info={<InfoButton label="About pentatonic and blues" note={pentatonicNote(root, view.tonality)} />}
        />
```

`CLAUDE.md` — add an Architecture bullet after "Shared fretboard":

```
- **Theory notes (`lib/notes/`, `components/notes/`):** eight short "why" notes, each a pure function of the
  tool's live state returning `{ title, paragraphs }` (live values as `{ strong }`). `InfoButton` (ⓘ, 44px)
  portals a `NoteSheet` — a native `<dialog>` via `showModal()` — to `<body>` only while open and refocuses
  itself on close. jsdom lacks `showModal`, so `tests/unit/setup.ts` stubs it.
```

- [ ] **Step 4: Run the full verification**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build && pnpm test:e2e`
Expected: all green; e2e 88 passed (80 + 4 tests × 2 projects), 2 skipped.

- [ ] **Step 5: Commit**

```bash
git add components tests CLAUDE.md
git commit -m "Chord and Scale Compass: theory notes in place

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
