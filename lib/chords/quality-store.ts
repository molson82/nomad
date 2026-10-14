import { createPersistedStore } from "@/lib/storage/persisted-store";
import { cagedShapes, type CagedShape, type ShapeName } from "@/lib/theory/caged";
import type { Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { nearestShape } from "./shape-store";

// Per tool: the shared key stays the major key; Minor shows its relative minor.
export const QUALITY_KEY = "nomad:chords:quality:v1";
export const DEFAULT_QUALITY: Quality = "major";

export function parseQuality(raw: string | null): Quality {
  if (!raw) return DEFAULT_QUALITY;
  try {
    const value = JSON.parse(raw);
    return value === "major" || value === "minor" ? value : DEFAULT_QUALITY;
  } catch {
    return DEFAULT_QUALITY;
  }
}

// Switching quality stays in the same region of the neck.
export function shapeForQuality(root: Note, from: CagedShape, to: Quality): ShapeName {
  return nearestShape(cagedShapes(root, to), (from.lowFret + from.highFret) / 2);
}

export const qualityStore = createPersistedStore(QUALITY_KEY, parseQuality, DEFAULT_QUALITY);

// Remembers the last switch so switching straight back returns to the starting shape.
export type SwitchMemo = { root: Note; from: Quality; fromName: ShapeName; toName: ShapeName } | null;

export function switchQualityShape(
  root: Note,
  quality: Quality,
  name: ShapeName,
  to: Quality,
  memo: SwitchMemo,
): { name: ShapeName; memo: SwitchMemo } {
  const back = memo && memo.root === root && memo.from === to && memo.toName === name;
  const current = cagedShapes(root, quality).find((s) => s.name === name)!;
  const target = back ? memo.fromName : shapeForQuality(root, current, to);
  return { name: target, memo: { root, from: quality, fromName: name, toName: target } };
}
