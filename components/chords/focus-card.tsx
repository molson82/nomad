import type { ReactNode } from "react";
import { FocusCard as SharedFocusCard } from "@/components/fretboard/focus-card";
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { ChordDiagram } from "./chord-diagram";

interface FocusCardProps {
  shape: CagedShape;
  shapes: CagedShape[]; // neck order
  chordName: string;
  onStep: (direction: 1 | -1) => void;
  info?: ReactNode;
}

export function FocusCard({ shape, shapes, chordName, onStep, info }: FocusCardProps) {
  const index = shapes.findIndex((s) => s.name === shape.name);
  const previous = shapes[index - 1];
  const next = shapes[index + 1];
  return (
    <SharedFocusCard
      titleAction={info}
      regionLabel={`${shape.label}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      title={`${shape.label}-shape`}
      subtitle={`frets ${shape.lowFret}–${shape.highFret} · root on the ${STRING_ORDINALS[shape.rootString]} string`}
      previousLabel={previous ? `Previous shape: ${previous.label}-shape` : "Previous shape"}
      nextLabel={next ? `Next shape: ${next.label}-shape` : "Next shape"}
      canPrevious={!!previous}
      canNext={!!next}
      count={shapes.length}
      index={index}
      onStep={onStep}
    >
      <ChordDiagram shape={shape} chordName={chordName} />
    </SharedFocusCard>
  );
}
