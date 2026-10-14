// One fixed spelling per pitch class. Key-aware spelling (F# vs Gb) belongs
// to the tool specs; the skeleton only needs a stable set of 12 names.
export const NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

export type Note = (typeof NOTES)[number];

export function isNote(value: unknown): value is Note {
  return typeof value === "string" && (NOTES as readonly string[]).includes(value);
}
