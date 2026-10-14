import { stepStore } from "@/lib/chords/step-store";
import { getKeyState, updateKeyState, withRoot } from "@/lib/key-state/store";
import type { Note } from "@/lib/theory/notes";

// Linked tools already share the key; unlinked, only the target tool follows the Circle.
export function openChordsAt(root: Note, step: number) {
  updateKeyState(withRoot(getKeyState(), "chords", root));
  stepStore.set(step);
}

export function openScalesIn(root: Note) {
  updateKeyState(withRoot(getKeyState(), "scales", root));
}
