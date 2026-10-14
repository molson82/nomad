// A note is plain text with the live values (key, notes, chords) marked strong.
export type Segment = string | { strong: string };
export type Paragraph = Segment[];
export type TheoryNote = { title: string; paragraphs: Paragraph[] };

export function plainText(paragraph: Paragraph): string {
  return paragraph.map((s) => (typeof s === "string" ? s : s.strong)).join("");
}
