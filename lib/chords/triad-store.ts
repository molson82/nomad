import { createPersistedStore } from "@/lib/storage/persisted-store";
import { INVERSIONS, STRING_SETS, type Inversion, type StringSet, type Triad } from "@/lib/theory/triads";
import { nearestByCentre } from "./neck-geometry";

// Stored as string set + inversion + where on the neck, so a new key or tuning lands nearby.
export type TriadSelection = { set: StringSet; inversion: Inversion; centre: number | null };

export const TRIAD_KEY = "nomad:chords:triad:v1";
export const DEFAULT_TRIAD: TriadSelection = { set: 2, inversion: "root", centre: null };

export function parseTriadSelection(raw: string | null): TriadSelection {
  if (!raw) return DEFAULT_TRIAD;
  try {
    const value = JSON.parse(raw);
    const valid =
      (STRING_SETS as readonly unknown[]).includes(value?.set) &&
      (INVERSIONS as readonly unknown[]).includes(value?.inversion) &&
      (value.centre === null || (typeof value.centre === "number" && Number.isFinite(value.centre)));
    return valid ? { set: value.set, inversion: value.inversion, centre: value.centre } : DEFAULT_TRIAD;
  } catch {
    return DEFAULT_TRIAD;
  }
}

export function resolveTriad(triads: Triad[], sel: TriadSelection): Triad | null {
  if (triads.length === 0) return null;
  const same = triads.filter((t) => t.inversion === sel.inversion);
  if (same.length === 0) return triads[0];
  return sel.centre === null ? same[0] : nearestByCentre(same, sel.centre);
}

export function selectionFor(triad: Triad): TriadSelection {
  return { set: triad.set, inversion: triad.inversion, centre: (triad.lowFret + triad.highFret) / 2 };
}

export const triadStore = createPersistedStore(TRIAD_KEY, parseTriadSelection, DEFAULT_TRIAD);
