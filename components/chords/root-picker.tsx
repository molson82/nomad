import { majorTriad } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

const ARROW = "grid h-11 w-11 place-items-center text-2xl font-bold text-accent-ink";

export function RootPicker({ root, onStep }: { root: Note; onStep: (direction: 1 | -1) => void }) {
  const triad = majorTriad(root);
  const name = formatNote(triad[0]);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label="Previous root" onClick={() => onStep(-1)} className={ARROW}>
          ←
        </button>
        <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-ink font-display text-[30px] font-semibold text-white">
          {name}
        </span>
        <button type="button" aria-label="Next root" onClick={() => onStep(1)} className={ARROW}>
          →
        </button>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <h2 className="font-display text-[22px] font-semibold leading-tight md:text-2xl">{name} major</h2>
        <p className="text-[13px] font-semibold">{triad.map(formatNote).join(" · ")}</p>
      </div>
    </div>
  );
}
