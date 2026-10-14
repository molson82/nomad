import { RootStepper } from "@/components/fretboard/root-stepper";
import { triad } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

export function RootPicker({ root, onStep }: { root: Note; onStep: (direction: 1 | -1) => void }) {
  const chord = triad(root);
  const name = formatNote(chord[0]);
  return (
    <div className="flex items-center justify-between gap-3">
      <RootStepper name={name} onStep={onStep} />
      <div className="flex flex-col items-end gap-0.5">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{name} major</h2>
        <p className="text-[13px] font-semibold">{chord.map(formatNote).join(" · ")}</p>
      </div>
    </div>
  );
}
