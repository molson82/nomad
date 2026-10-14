import { keySignature, type CircleKey } from "@/lib/theory/circle";
import { formatNote } from "@/lib/theory/spelling";

// "no sharps or flats" · "1 sharp: F♯" · "5 flats: B♭ E♭ A♭ D♭ G♭"
export function signatureText(key: CircleKey): string {
  const notes = keySignature(key);
  if (notes.length === 0) return "no sharps or flats";
  const kind = key.sharpsOrFlats > 0 ? "sharp" : "flat";
  return `${notes.length} ${kind}${notes.length > 1 ? "s" : ""}: ${notes.map(formatNote).join(" ")}`;
}
