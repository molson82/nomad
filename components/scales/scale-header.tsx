import { RootStepper } from "@/components/fretboard/root-stepper";
import { InfoButton } from "@/components/notes/info-button";
import { relativeMinorNote } from "@/lib/notes/chord-notes";
import { scaleBuildNote } from "@/lib/notes/scale-notes";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { scaleDegrees, scaleName, scaleNotes, type ScaleView } from "@/lib/theory/scales";
import { formatExact, formatNote } from "@/lib/theory/spelling";

interface ScaleHeaderProps {
  root: Note;
  view: ScaleView;
  onStep: (direction: 1 | -1) => void;
}

export function ScaleHeader({ root, view, onStep }: ScaleHeaderProps) {
  const major = majorScale(circleKeyFor(root));
  const relation =
    view.tonality === "major"
      ? `Relative minor: ${formatExact(major[5])} (⑥)`
      : `Relative of ${formatExact(major[0])} major (⑥)`;
  // True letters (F♯ major ends on E♯), but the blue note is a passing tone written as players read it (E in D♭ blues).
  const degrees = scaleDegrees(root, view);
  const blue = view.type === "blues" ? (view.tonality === "major" ? "♭3" : "♭5") : null;
  const notes = scaleNotes(root, view).map((note, i) => (degrees[i] === blue ? formatNote(note) : formatExact(note)));
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={formatExact(major[0])} onStep={onStep} />
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <div className="flex items-center">
          <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{scaleName(root, view)}</h2>
          <InfoButton label="About how the scale is built" note={scaleBuildNote(root, view.tonality)} />
        </div>
        <p className="text-[13px] font-semibold">{notes.join(" ")}</p>
        <p className="flex items-center text-xs font-semibold text-relative">
          {relation}
          <InfoButton label="About the relative minor" note={relativeMinorNote(root)} />
        </p>
      </div>
    </div>
  );
}
