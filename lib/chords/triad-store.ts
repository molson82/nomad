import { createPersistedStore } from "@/lib/storage/persisted-store";
import { INVERSIONS, STRING_SETS, type Inversion, type StringSet, type Triad } from "@/lib/theory/triads";
import { nearestByCentre } from "./neck-geometry";

// Stored as string set + inversion + where on the neck, so a new key or tuning lands nearby.
// `frets` pins the exact triad (two of one inversion can share a centre); `centre` finds the nearest
// one after a key or tuning change.
export type TriadSelection = { set: StringSet; inversion: Inversion; centre: number | null; frets: [number, number, number] | null };

export const TRIAD_KEY = "nomad:chords:triad:v1";
export const DEFAULT_TRIAD: TriadSelection = { set: 2, inversion: "root", centre: null, frets: null };

export function parseTriadSelection(raw: string | null): TriadSelection {
  if (!raw) return DEFAULT_TRIAD;
  try {
    const value = JSON.parse(raw);
    const valid =
      (STRING_SETS as readonly unknown[]).includes(value?.set) &&
      (INVERSIONS as readonly unknown[]).includes(value?.inversion) &&
      (value.centre === null || (typeof value.centre === "number" && Number.isFinite(value.centre)));
    const frets =
      Array.isArray(value.frets) && value.frets.length === 3 && value.frets.every((f: unknown) => Number.isInteger(f)) ? value.frets : null;
    return valid ? { set: value.set, inversion: value.inversion, centre: value.centre, frets } : DEFAULT_TRIAD;
  } catch {
    return DEFAULT_TRIAD;
  }
}

export function resolveTriad(triads: Triad[], sel: TriadSelection): Triad | null {
  if (triads.length === 0) return null;
  const same = triads.filter((t) => t.inversion === sel.inversion);
  if (same.length === 0) return triads[0];
  const exact = sel.frets && same.find((t) => t.frets.every((f, i) => f === sel.frets![i]));
  if (exact) return exact;
  return sel.centre === null ? same[0] : nearestByCentre(same, sel.centre);
}

export function selectionFor(triad: Triad): TriadSelection {
  return { set: triad.set, inversion: triad.inversion, centre: (triad.lowFret + triad.highFret) / 2, frets: triad.frets };
}

export const triadStore = createPersistedStore(TRIAD_KEY, parseTriadSelection, DEFAULT_TRIAD);
