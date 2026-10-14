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
