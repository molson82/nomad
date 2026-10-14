import { chordLongName, chordName, type Chord } from "@/lib/theory/chords";
import { formatNote } from "@/lib/theory/spelling";

const LABEL = "text-[11px] font-bold tracking-[0.08em] md:text-[13px] xl:text-xs";

// Phone / tablet (md) / desktop (xl), from the canvas artboards.
const CIRCLE_SIZES = {
  key: "h-[84px] w-[84px] text-[44px] md:h-[108px] md:w-[108px] md:text-[56px] xl:h-[92px] xl:w-[92px] xl:text-[48px]",
  major: "h-16 w-16 text-[30px] md:h-[84px] md:w-[84px] md:text-[38px] xl:h-[72px] xl:w-[72px] xl:text-[34px]",
  relative: "h-[72px] w-[72px] text-[32px] md:h-[94px] md:w-[94px] md:text-[40px] xl:h-20 xl:w-20 xl:text-[36px]",
  minor: "h-[60px] w-[60px] text-[26px] md:h-[78px] md:w-[78px] md:text-[32px] xl:h-[66px] xl:w-[66px] xl:text-[28px]",
} as const;

export function DegreeDots({ degrees, small = false }: { degrees: readonly number[]; small?: boolean }) {
  return (
    <span aria-hidden className="flex gap-[3px]">
      {degrees.map((degree, i) => (
        <span
          key={i}
          data-degree
          data-filled={i === 0}
          className={`grid place-items-center rounded-full border-[1.5px] border-ink font-bold ${
            small ? "h-[18px] w-[18px] text-[10px]" : "h-5 w-5 text-[11px] md:h-6 md:w-6 md:text-[13px] xl:h-[22px] xl:w-[22px] xl:text-xs"
          } ${i === 0 ? "bg-ink text-decoder" : "text-ink"}`}
        >
          {degree}
        </span>
      ))}
    </span>
  );
}

export function StepBadge({ steps }: { steps: readonly number[] }) {
  if (steps.length === 0) return null;
  return (
    <span
      data-testid="step-badge"
      aria-hidden
      className="absolute -right-2 -top-1.5 grid h-[26px] min-w-[26px] place-items-center rounded-full border-2 border-ink bg-surface px-1 font-display text-sm font-bold text-ink md:h-[30px] md:min-w-[30px] md:text-base"
    >
      {steps.join("·")}
    </span>
  );
}

interface ChordButtonProps {
  chord: Chord;
  size: keyof typeof CIRCLE_SIZES;
  label: string;
  labelPosition: "top" | "bottom";
  steps: readonly number[];
  onAdd: (degree: number) => void;
}

export function ChordButton({ chord, size, label, labelPosition, steps, onAdd }: ChordButtonProps) {
  const label_ = <span className={LABEL}>{label}</span>;
  return (
    <button
      type="button"
      onClick={() => onAdd(chord.degree)}
      aria-label={`Add ${chordLongName(chord)}, ${chord.roman}, to progression`}
      className="flex min-w-0 flex-col items-center gap-[5px] py-1 text-ink"
    >
      {labelPosition === "top" && label_}
      <span
        className={`relative grid place-items-center rounded-full bg-ink font-display font-semibold ${CIRCLE_SIZES[size]} ${
          chord.quality === "maj" ? "text-decoder" : "text-white"
        }`}
      >
        {chordName(chord)}
        <StepBadge steps={steps} />
      </span>
      <DegreeDots degrees={chord.degrees} />
      <span className="text-[13px] font-semibold md:text-[15px] xl:text-sm">{chord.notes.map(formatNote).join(" ")}</span>
      {labelPosition === "bottom" && label_}
    </button>
  );
}

export function DimChordButton({ chord, steps, onAdd }: Omit<ChordButtonProps, "size" | "label" | "labelPosition">) {
  return (
    <button
      type="button"
      onClick={() => onAdd(chord.degree)}
      aria-label={`Add ${chordLongName(chord)}, ${chord.roman}, to progression`}
      className="flex min-h-[66px] items-center gap-2 bg-decoder px-1.5 text-ink"
    >
      <span className="relative grid h-[54px] w-[54px] place-items-center rounded-full border-2 border-ink font-display text-xl font-semibold md:h-[62px] md:w-[62px] md:text-[23px] xl:h-14 xl:w-14 xl:text-[21px]">
        {chordName(chord)}
        <StepBadge steps={steps} />
      </span>
      <span className="flex flex-col items-start gap-[3px]">
        <span className={LABEL}>vii° dim.</span>
        <DegreeDots degrees={chord.degrees} small />
      </span>
    </button>
  );
}
