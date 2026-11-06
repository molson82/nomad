import { withLinked, type KeyState } from "@/lib/key-state/store";
import { transposeVoicing, voicingOf, type Frets, type Voicing } from "@/lib/theory/chord-names";
import { MAX_FRET } from "@/lib/theory/fretboard";
import { NOTES, isNote, type Note } from "@/lib/theory/notes";
import { mod } from "@/lib/theory/spelling";
import type { TuningOffsets } from "@/lib/theory/tuning";

export type Lock = { frets: Frets; key: Note; tuning: number[]; createdLink: boolean };
export type PathfinderState = { frets: Frets; lock: Lock | null };

export const PATHFINDER_KEY = "nomad:pathfinder:v1";
export const EMPTY_FRETS: Frets = [null, null, null, null, null, null];
export const EMPTY_STATE: PathfinderState = { frets: EMPTY_FRETS, lock: null };

const isFrets = (value: unknown): value is Frets =>
  Array.isArray(value) &&
  value.length === 6 &&
  value.every((fret) => fret === null || (Number.isInteger(fret) && fret >= 0 && fret <= MAX_FRET));

const isLock = (value: Partial<Lock> | null | undefined): value is Lock =>
  !!value &&
  isFrets(value.frets) &&
  isNote(value.key) &&
  typeof value.createdLink === "boolean" &&
  Array.isArray(value.tuning) &&
  value.tuning.length === 6 &&
  value.tuning.every(Number.isInteger);

export function parsePathfinder(raw: string | null): PathfinderState {
  if (!raw) return EMPTY_STATE;
  try {
    const value = JSON.parse(raw);
    if (!isFrets(value?.frets)) return EMPTY_STATE;
    if (value.lock !== null && !isLock(value.lock)) return EMPTY_STATE;
    return { frets: value.frets, lock: value.lock };
  } catch {
    return EMPTY_STATE;
  }
}

// One note per string, as on a guitar: another fret moves it, the same fret lifts it.
export function tapFret(frets: Frets, string: number, fret: number): Frets {
  return frets.map((current, s) => (s !== string ? current : current === fret ? null : fret));
}

export function canBuildPath(frets: Frets, offsets: TuningOffsets): boolean {
  return (voicingOf(frets, offsets)?.pitchClasses.length ?? 0) >= 2;
}

export function lockIn(state: PathfinderState, keys: KeyState, key: Note, offsets: TuningOffsets): { pathfinder: PathfinderState; keys: KeyState } {
  return {
    pathfinder: { frets: state.frets, lock: { frets: state.frets, key, tuning: [...offsets], createdLink: !keys.linked } },
    keys: { ...keys, linked: true, shared: key },
  };
}

// The key stays put; only a link lock-in made, and that's still there, comes off.
export function resetPath(state: PathfinderState, keys: KeyState): { pathfinder: PathfinderState; keys: KeyState } {
  const unlink = state.lock?.createdLink && keys.linked;
  return { pathfinder: EMPTY_STATE, keys: unlink ? withLinked(keys, "circle", false) : keys };
}

// The shorter way round: C → E is up 4, C → B is down 1.
function keyInterval(from: Note, to: Note): number {
  const up = mod(NOTES.indexOf(to) - NOTES.indexOf(from), 12);
  return up > 6 ? up - 12 : up;
}

function onNeck(fret: number): number {
  if (fret < 0) return fret + 12;
  return fret > MAX_FRET ? fret - 12 : fret;
}

export function highlightFrets(lock: Lock, toolKey: Note, offsets: TuningOffsets): Frets {
  const shift = keyInterval(lock.key, toolKey);
  return lock.frets.map((fret, s) => {
    if (fret === null) return null;
    // Same pitch in the new tuning, then moved with the key.
    return onNeck(onNeck(fret - (offsets[s] - lock.tuning[s])) + shift);
  });
}

export function lockedVoicing(lock: Lock, currentKey: Note): Voicing {
  return transposeVoicing(voicingOf(lock.frets, lock.tuning)!, keyInterval(lock.key, currentKey));
}
