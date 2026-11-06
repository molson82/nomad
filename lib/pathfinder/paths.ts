import { nearestByCentre } from "@/lib/chords/neck-geometry";
import { FRET_WINDOWS, notesInWindow } from "@/lib/scales/window-store";
import { cagedShapesFor } from "@/lib/theory/caged";
import { chordNames, noteLabel, spellRoot, voicingOf, type ChordName, type Frets, type Voicing } from "@/lib/theory/chord-names";
import { COMMON_PROGRESSIONS, chordName, diatonicChords, romanFor } from "@/lib/theory/chords";
import { CIRCLE, circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { ChordTone, Quality } from "@/lib/theory/fretboard";
import { NOTES, type Note } from "@/lib/theory/notes";
import { neckNotes, positions, scaleName, scaleNotes, type ScaleNote, type ScaleView } from "@/lib/theory/scales";
import { LETTERS, formatNote, mod, pitchClassOf, spellAs, type SpelledNote } from "@/lib/theory/spelling";
import { STRING_SETS, triadsOn, type Triad } from "@/lib/theory/triads";
import { STANDARD_OFFSETS, isUniform, openPitches, type TuningOffsets } from "@/lib/theory/tuning";

export type KeyFit = { key: Note; fit: "full" | "near"; outside: string[]; degree: number | null; role: string | null };
export type Region = { title: string; lowFret: number; highFret: number; notes: ScaleNote[] };
export type PathTriad = { name: string; label: string; triad: Triad };
export type KeyDetails = { solo: Region; missing: string[]; scale: Region; triads: PathTriad[]; usedIn: string | null };
export type TryShape = { tones: ChordTone[]; lowFret: number; highFret: number; label: string };
export type TryChord = { name: string; role: string; degree: number; shape: TryShape | null };

const MAX_NEAR_KEYS = 3;
const MAX_TRIADS = 2;
const CENTRAL_FIRST = [1, 4, 5, 6, 2, 3, 7];
const PENTATONIC: ScaleView = { tonality: "minor", type: "pentatonic" };
const MAJOR_SCALE: ScaleView = { tonality: "major", type: "scale" };

// Which chords pair best with each degree, strongest first.
const PAIRINGS: Record<number, number[]> = {
  1: [4, 5, 6, 2, 3],
  2: [5, 1, 4, 6, 3],
  3: [6, 4, 2, 1, 5],
  4: [1, 5, 2, 6, 3],
  5: [1, 6, 4, 2, 3],
  6: [4, 5, 1, 2, 3],
};
const NO_ROLE_ORDER = [1, 4, 5, 6, 2, 3];

const placed = (frets: Frets) => frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret }]));

function meanFret(frets: Frets): number {
  const all = placed(frets);
  return all.reduce((sum, p) => sum + p.fret, 0) / all.length;
}

const centreOf = (r: { lowFret: number; highFret: number }) => (r.lowFret + r.highFret) / 2;

export function keysFor(v: Voicing, name: ChordName | null): KeyFit[] {
  const all: KeyFit[] = CIRCLE.map((k) => {
    const scale = majorScale(k).map(pitchClassOf);
    const outside = v.pitchClasses.filter((pc) => !scale.includes(pc));
    const index = name ? scale.indexOf(name.root) : -1;
    return {
      key: NOTES[k.pitchClass],
      fit: outside.length === 0 ? "full" : "near",
      outside: outside.map((pc) => noteLabel(pc, name, k)),
      degree: index < 0 ? null : index + 1,
      role: index < 0 ? null : romanFor(index + 1),
    };
  });
  const byRole = (a: KeyFit, b: KeyFit) => rolePlace(a) - rolePlace(b);
  const full = all.filter((k) => k.fit === "full");
  if (full.length > 0) return full.sort(byRole);
  const fewest = Math.min(...all.map((k) => k.outside.length));
  return all
    .filter((k) => k.outside.length === fewest)
    .sort(byRole)
    .slice(0, MAX_NEAR_KEYS);
}

const rolePlace = (k: KeyFit) => (k.degree === null ? CENTRAL_FIRST.length : CENTRAL_FIRST.indexOf(k.degree));

// The region holding most of the chord's actual notes; ties go to the one nearest the chord.
function regionUnder(regions: Region[], frets: Frets): Region {
  const hits = (r: Region) => r.notes.filter((n) => frets[n.string] === n.fret).length;
  const mean = meanFret(frets);
  return [...regions].sort((a, b) => hits(b) - hits(a) || Math.abs(centreOf(a) - mean) - Math.abs(centreOf(b) - mean))[0];
}

function regionsFor(key: Note, view: ScaleView, offsets: TuningOffsets, open: number[]): Region[] {
  const name = scaleName(key, view);
  if (!isUniform(offsets)) {
    const notes = neckNotes(key, view, open);
    return FRET_WINDOWS.map(([low, high]) => ({ title: name, lowFret: low, highFret: high, notes: notesInWindow(notes, [low, high]) }));
  }
  return positions(key, view, open).map((p) => ({
    title: p.box ? `${name} · Box ${p.box}` : `${p.letter}-shape position`,
    lowFret: p.lowFret,
    highFret: p.highFret,
    notes: p.notes,
  }));
}

function triadNotes(root: SpelledNote, quality: Quality): [SpelledNote, SpelledNote, SpelledNote] {
  const pitch = pitchClassOf(root);
  const start = LETTERS.indexOf(root.letter);
  const third = spellAs(LETTERS[(start + 2) % 7], mod(pitch + (quality === "major" ? 4 : 3), 12));
  const fifth = spellAs(LETTERS[(start + 4) % 7], mod(pitch + 7, 12));
  return [root, third, fifth];
}

const fretsLabel = (t: { lowFret: number; highFret: number }) =>
  t.lowFret === t.highFret ? `fret ${t.lowFret}` : `frets ${t.lowFret}–${t.highFret}`;
const stringsLabel = (set: number) => `${6 - set}-${5 - set}-${4 - set}`;

// For soloing: the shape sharing most of your notes, on the highest strings it can.
function triadsInside(v: Voicing, name: ChordName | null, key: Note, frets: Frets, open: number[]): PathTriad[] {
  const circleKey = circleKeyFor(key);
  const from = name?.root ?? v.bass;
  const roots = [...v.pitchClasses].sort((a, b) => mod(a - from, 12) - mod(b - from, 12));
  const mean = meanFret(frets);
  const shared = (t: Triad) => t.tones.filter((tone) => frets[tone.string] === tone.fret).length;
  const found: PathTriad[] = [];
  for (const pc of roots) {
    for (const quality of ["major", "minor"] as const) {
      const third = mod(pc + (quality === "major" ? 4 : 3), 12);
      if (!v.pitchClasses.includes(third) || !v.pitchClasses.includes(mod(pc + 7, 12))) continue;
      const root = spellRoot(pc, circleKey);
      const notes = triadNotes(root, quality);
      const best = STRING_SETS.flatMap((set) => triadsOn(notes, quality, open, set)).sort(
        (a, b) => shared(b) - shared(a) || b.set - a.set || Math.abs(centreOf(a) - mean) - Math.abs(centreOf(b) - mean),
      )[0];
      if (!best) continue;
      const label = `${formatNote(root)}${quality === "minor" ? "m" : ""}`;
      found.push({ name: label, label: `${label} on strings ${stringsLabel(best.set)} · ${fretsLabel(best)}`, triad: best });
    }
  }
  return found.slice(0, MAX_TRIADS);
}

function usedIn(key: Note, v: Voicing): string | null {
  const holds = (view: ScaleView) => {
    const notes = scaleNotes(key, view).map(pitchClassOf);
    return v.pitchClasses.every((pc) => notes.includes(pc));
  };
  const parts = [
    ...(holds(MAJOR_SCALE) ? [scaleName(key, MAJOR_SCALE), scaleName(key, { tonality: "minor", type: "scale" })] : []),
    ...(holds(PENTATONIC) ? ["both pentatonics"] : []),
    ...(holds({ tonality: "minor", type: "blues" }) ? ["both blues"] : []),
  ];
  return parts.length > 0 ? parts.join(", ") : null;
}

export function keyDetails(key: Note, frets: Frets, offsets: TuningOffsets = STANDARD_OFFSETS): KeyDetails {
  const v = voicingOf(frets, offsets)!;
  const name = chordNames(v)[0] ?? null;
  const open = openPitches(offsets);
  const pentatonic = scaleNotes(key, PENTATONIC).map(pitchClassOf);
  return {
    solo: regionUnder(regionsFor(key, PENTATONIC, offsets, open), frets),
    missing: v.pitchClasses.filter((pc) => !pentatonic.includes(pc)).map((pc) => noteLabel(pc, name, circleKeyFor(key))),
    scale: regionUnder(regionsFor(key, MAJOR_SCALE, offsets, open), frets),
    triads: triadsInside(v, name, key, frets, open),
    usedIn: usedIn(key, v),
  };
}

export function nearestTriad(notes: readonly SpelledNote[], quality: Quality, open: readonly number[], centre: number): Triad | null {
  const all = STRING_SETS.flatMap((set) => triadsOn(notes, quality, open, set));
  return all.length > 0 ? nearestByCentre(all, centre) : null;
}

export function chordsToTry(
  key: Note,
  degree: number | null,
  rootPc: number | null,
  frets: Frets,
  offsets: TuningOffsets = STANDARD_OFFSETS,
): TryChord[] {
  const chords = diatonicChords(circleKeyFor(key));
  const open = openPitches(offsets);
  const mean = meanFret(frets);
  const order = (degree !== null && PAIRINGS[degree]) || NO_ROLE_ORDER;
  return order
    .map((d) => chords[d - 1])
    .filter((chord) => pitchClassOf(chord.root) !== rootPc)
    .map((chord) => {
      const quality: Quality = chord.quality === "min" ? "minor" : "major";
      let shape: TryShape | null;
      if (isUniform(offsets)) {
        const near = nearestByCentre(cagedShapesFor(chord.notes, quality, open), mean);
        shape = { tones: near.tones, lowFret: near.lowFret, highFret: near.highFret, label: near.label };
      } else {
        const near = nearestTriad(chord.notes, quality, open, mean);
        shape = near && { tones: near.tones, lowFret: near.lowFret, highFret: near.highFret, label: `strings ${stringsLabel(near.set)}` };
      }
      return { name: chordName(chord), role: chord.roman, degree: chord.degree, shape };
    });
}

export function progressionFor(key: Note, degree: number | null): { name: string; chords: string[] } | null {
  if (degree === null) return null;
  const preset =
    COMMON_PROGRESSIONS.find((p) => p.degrees[0] === degree) ?? COMMON_PROGRESSIONS.find((p) => p.degrees.includes(degree));
  if (!preset) return null;
  const chords = diatonicChords(circleKeyFor(key));
  return { name: preset.name, chords: preset.degrees.map((d) => chordName(chords[d - 1])) };
}
