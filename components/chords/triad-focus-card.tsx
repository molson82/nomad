import { FocusCard as SharedFocusCard } from "@/components/fretboard/focus-card";
import type { Triad } from "@/lib/theory/triads";
import { ChordDiagram } from "./chord-diagram";
import { setLabel } from "./triad-controls";

const TITLE = { root: "Root position", first: "1st inversion", second: "2nd inversion" } as const;

interface TriadFocusCardProps {
  triad: Triad;
  triads: Triad[]; // every playable triad on the string set, low → high
  chordName: string;
  onStep: (direction: 1 | -1) => void;
}

export const triadTitle = (triad: Triad) => TITLE[triad.inversion];

export function TriadFocusCard({ triad, triads, chordName, onStep }: TriadFocusCardProps) {
  const index = triads.indexOf(triad);
  const previous = triads[index - 1];
  const next = triads[index + 1];
  const strings = setLabel(triad.set);
  const frets = `frets ${triad.lowFret} to ${triad.highFret}`;
  const describe = (t: Triad) => `${TITLE[t.inversion]}, frets ${t.lowFret} to ${t.highFret}`;
  return (
    <SharedFocusCard
      regionLabel={`${TITLE[triad.inversion]}, strings ${strings}, ${frets}`}
      title={TITLE[triad.inversion]}
      subtitle={`strings ${strings} · frets ${triad.lowFret}–${triad.highFret} · ${triad.tones.map((t) => t.role).join(" · ")}`}
      previousLabel={previous ? `Previous triad: ${describe(previous)}` : "Previous triad"}
      nextLabel={next ? `Next triad: ${describe(next)}` : "Next triad"}
      canPrevious={!!previous}
      canNext={!!next}
      count={triads.length}
      index={index}
      onStep={onStep}
    >
      <ChordDiagram shape={triad} chordName={chordName} ariaLabel={`${chordName}, ${TITLE[triad.inversion]} on strings ${strings}, ${frets}`} />
    </SharedFocusCard>
  );
}
