import { keySignature, type CircleKey } from "@/lib/theory/circle";

// "no sharps or flats" · "1 sharp: F♯" · "5 flats: B♭ E♭ A♭ D♭ G♭". Spelled from the letter, not
// formatNote, so F♯ major's sixth sharp reads E♯ rather than the plain display F.
export function signatureText(key: CircleKey): string {
  const notes = keySignature(key);
  if (notes.length === 0) return "no sharps or flats";
  const kind = key.sharpsOrFlats > 0 ? "sharp" : "flat";
  const sign = kind === "sharp" ? "♯" : "♭";
  return `${notes.length} ${kind}${notes.length > 1 ? "s" : ""}: ${notes.map((n) => `${n.letter}${sign}`).join(" ")}`;
}
