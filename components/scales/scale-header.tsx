import { RootStepper } from "@/components/fretboard/root-stepper";
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
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{scaleName(root, view)}</h2>
        <p className="text-[13px] font-semibold">{scaleNotes(root, view).map(formatNote).join(" ")}</p>
        <p className="text-xs font-semibold text-relative">{relation}</p>
      </div>
    </div>
  );
}
