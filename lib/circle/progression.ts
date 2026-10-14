import { createPersistedStore } from "@/lib/storage/persisted-store";
import { COMMON_PROGRESSIONS } from "@/lib/theory/chords";

// Degrees, never chord names: turning the wheel transposes for free.
export type Progression = { degrees: number[]; presetId: string | null };

export const PROGRESSION_KEY = "nomad:circle:progression:v1";
export const EMPTY_PROGRESSION: Progression = { degrees: [], presetId: null };
export const MAX_CHORDS = 8;

const isDegree = (value: unknown) => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 7;
const isPresetId = (value: unknown) => COMMON_PROGRESSIONS.some((preset) => preset.id === value);

export function parseProgression(raw: string | null): Progression {
  if (!raw) return EMPTY_PROGRESSION;
  try {
    const value = JSON.parse(raw);
    if (
      Array.isArray(value?.degrees) &&
      value.degrees.length <= MAX_CHORDS &&
      value.degrees.every(isDegree) &&
      (value.presetId === null || isPresetId(value.presetId))
    ) {
      return { degrees: [...value.degrees], presetId: value.presetId };
    }
  } catch {
    // Corrupt JSON: fall through to an empty tray.
  }
  return EMPTY_PROGRESSION;
}

export function withChord(progression: Progression, degree: number): Progression {
  if (progression.degrees.length >= MAX_CHORDS) return progression;
  return { degrees: [...progression.degrees, degree], presetId: null };
}

export function withoutStep(progression: Progression, index: number): Progression {
  return { degrees: progression.degrees.filter((_, i) => i !== index), presetId: null };
}

export function withPreset(id: string): Progression {
  const preset = COMMON_PROGRESSIONS.find((p) => p.id === id);
  return preset ? { degrees: [...preset.degrees], presetId: preset.id } : EMPTY_PROGRESSION;
}

// degree → its 1-based steps; a chord used twice gets both ("1·3").
export function stepBadges(degrees: readonly number[]): Map<number, number[]> {
  const badges = new Map<number, number[]>();
  degrees.forEach((degree, i) => badges.set(degree, [...(badges.get(degree) ?? []), i + 1]));
  return badges;
}

export const progressionStore = createPersistedStore(PROGRESSION_KEY, parseProgression, EMPTY_PROGRESSION);
