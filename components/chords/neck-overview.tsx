import { Neck, type NeckString } from "@/components/fretboard/neck";
import type { ChordTone } from "@/lib/theory/fretboard";

// The highlighted window: a CAGED shape, or a triad in other tunings.
export type NeckWindow = { tones: ChordTone[]; lowFret: number; highFret: number; label: string };

interface NeckOverviewProps {
  tones: ChordTone[];
  window: NeckWindow;
  chordName: string;
  onPickFret: (fret: number) => void;
  strings?: NeckString[];
}

export function NeckOverview({ tones, window, chordName, onPickFret, strings }: NeckOverviewProps) {
  const inWindow = new Set(window.tones.map((t) => `${t.string}:${t.fret}`));
  return (
    <Neck
      markers={tones.map((t) => ({
        string: t.string,
        fret: t.fret,
        label: t.role === "R" ? "" : t.role,
        kind: t.role === "R" ? "tonic" : "tone",
        inWindow: inWindow.has(`${t.string}:${t.fret}`),
      }))}
      windowLow={window.lowFret}
      windowHigh={window.highFret}
      ariaLabel={`${chordName} across the neck, ${window.label} at frets ${window.lowFret} to ${window.highFret}`}
      onPickFret={onPickFret}
      strings={strings}
    />
  );
}
