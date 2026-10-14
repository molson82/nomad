import { RootStepper } from "@/components/fretboard/root-stepper";
import { InfoButton } from "@/components/notes/info-button";
import { chordBuildNote, relativeMinorNote } from "@/lib/notes/chord-notes";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { ProgressionStep } from "@/lib/chords/progression-chords";
import { triad, type Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

interface RootPickerProps {
  root: Note;
  quality: Quality;
  step?: ProgressionStep | null; // a progression chord replaces the key chord
  onStep: (direction: 1 | -1) => void;
}

export function RootPicker({ root, quality, step, onStep }: RootPickerProps) {
  const key = majorScale(circleKeyFor(root));
  const chord = step ? step.notes : triad(root, quality);
  const title = step ? step.longName : `${formatNote(chord[0])} ${quality}`;
  const relation = step
    ? `${step.roman} in ${formatNote(key[0])} major`
    : quality === "major"
      ? `Relative minor: ${formatNote(key[5])} (⑥)`
      : `Relative of ${formatNote(key[0])} major (⑥)`;
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={formatNote(key[0])} onStep={onStep} />
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <div className="flex items-center">
          <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{title}</h2>
          <InfoButton label="About how a chord is built" note={chordBuildNote(chord, step?.quality ?? quality)} />
        </div>
        <p className="text-[13px] font-semibold">{chord.map(formatNote).join(" · ")}</p>
        <p className="flex items-center text-xs font-semibold text-relative">
          {relation}
          {!step && <InfoButton label="About the relative minor" note={relativeMinorNote(root)} />}
        </p>
      </div>
    </div>
  );
}
