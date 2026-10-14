import { createPersistedStore } from "@/lib/storage/persisted-store";
import { SHAPE_NAMES, type CagedShape, type ShapeName } from "@/lib/theory/caged";
import { nearestByCentre } from "./neck-geometry";

// The selection is a shape name, so changing the root keeps the same shape.
export const SHAPE_KEY = "nomad:chords:shape:v1";
export const DEFAULT_SHAPE: ShapeName = "E";

export function parseShape(raw: string | null): ShapeName {
  if (!raw) return DEFAULT_SHAPE;
  try {
    const value = JSON.parse(raw);
    return (SHAPE_NAMES as readonly unknown[]).includes(value) ? (value as ShapeName) : DEFAULT_SHAPE;
  } catch {
    return DEFAULT_SHAPE;
  }
}

// shapes are in neck order, so the strict < keeps the lower one on a tie.
export function nearestShape(shapes: CagedShape[], fret: number): ShapeName {
  return nearestByCentre(shapes, fret).name;
}

// Moving to another chord keeps the hand in the same region of the neck.
export function shapeNear(shapes: CagedShape[], from: CagedShape): ShapeName {
  return nearestShape(shapes, (from.lowFret + from.highFret) / 2);
}

export const shapeStore = createPersistedStore(SHAPE_KEY, parseShape, DEFAULT_SHAPE);
