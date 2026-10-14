import { createPersistedStore } from "@/lib/storage/persisted-store";
import { POSITION_LETTERS, type PositionLetter, type ScaleType, type Tonality } from "@/lib/theory/scales";

// The position is the CAGED letter in every view, so scale ↔ pentatonic and root changes keep the neck region.
export type ScaleViewState = { tonality: Tonality; type: ScaleType; position: PositionLetter };

export const VIEW_KEY = "nomad:scales:view:v1";
export const DEFAULT_VIEW: ScaleViewState = { tonality: "major", type: "scale", position: "E" };

const TONALITIES: readonly unknown[] = ["major", "minor"];
const TYPES: readonly unknown[] = ["scale", "pentatonic", "blues"];

export function parseView(raw: string | null): ScaleViewState {
  let value: Record<string, unknown> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) value = parsed;
  } catch {
    // Corrupt JSON: every field falls back.
  }
  return {
    tonality: TONALITIES.includes(value.tonality) ? (value.tonality as Tonality) : DEFAULT_VIEW.tonality,
    type: TYPES.includes(value.type) ? (value.type as ScaleType) : DEFAULT_VIEW.type,
    position: (POSITION_LETTERS as readonly unknown[]).includes(value.position) ? (value.position as PositionLetter) : DEFAULT_VIEW.position,
  };
}

export const viewStore = createPersistedStore(VIEW_KEY, parseView, DEFAULT_VIEW);
