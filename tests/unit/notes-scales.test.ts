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
