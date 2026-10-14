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

  it("spells F♯'s signature with its E♯", () => {
    expect(text(fifthsNote("F#"))[1]).toContain("F♯ major has 6 sharps: F♯ C♯ G♯ D♯ A♯ E♯.");
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
