import { RootStepper } from "@/components/fretboard/root-stepper";
import { InfoButton } from "@/components/notes/info-button";
import { relativeMinorNote } from "@/lib/notes/chord-notes";
import { scaleBuildNote } from "@/lib/notes/scale-notes";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { scaleName, scaleNotes, type ScaleView } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";

interface ScaleHeaderProps {
  root: Note;
  view: ScaleView;
  onStep: (direction: 1 | -1) => void;
}

export function ScaleHeader({ root, view, onStep }: ScaleHeaderProps) {
  const major = majorScale(circleKeyFor(root));
  const relation =
    view.tonality === "major"
      ? `Relative minor: ${formatNote(major[5])} (⑥)`
      : `Relative of ${formatNote(major[0])} major (⑥)`;
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={formatNote(major[0])} onStep={onStep} />
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <div className="flex items-center">
          <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{scaleName(root, view)}</h2>
          <InfoButton label="About how the scale is built" note={scaleBuildNote(root, view.tonality)} />
        </div>
        <p className="text-[13px] font-semibold">{scaleNotes(root, view).map(formatNote).join(" ")}</p>
        <p className="flex items-center text-xs font-semibold text-relative">
          {relation}
          <InfoButton label="About the relative minor" note={relativeMinorNote(root)} />
        </p>
      </div>
    </div>
  );
}
