import { Neck } from "@/components/fretboard/neck";
import type { CagedShape } from "@/lib/theory/caged";
import type { ChordTone } from "@/lib/theory/fretboard";

interface NeckOverviewProps {
  tones: ChordTone[];
  shape: CagedShape;
  chordName: string;
  onPickFret: (fret: number) => void;
}

export function NeckOverview({ tones, shape, chordName, onPickFret }: NeckOverviewProps) {
  const inShape = new Set(shape.tones.map((t) => `${t.string}:${t.fret}`));
  return (
    <Neck
      markers={tones.map((t) => ({
        string: t.string,
        fret: t.fret,
        label: t.role === "R" ? "" : t.role,
        kind: t.role === "R" ? "tonic" : "tone",
        inWindow: inShape.has(`${t.string}:${t.fret}`),
      }))}
      windowLow={shape.lowFret}
      windowHigh={shape.highFret}
      ariaLabel={`${chordName} across the neck, ${shape.name}-shape at frets ${shape.lowFret} to ${shape.highFret}`}
      onPickFret={onPickFret}
    />
  );
}
