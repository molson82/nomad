import { nextPlayable, type ProgressionStep } from "@/lib/chords/progression-chords";

const ARROW = "grid h-14 w-11 shrink-0 place-items-center text-2xl text-accent-ink disabled:opacity-30";

interface ProgressionStripProps {
  steps: ProgressionStep[];
  selected: number | null;
  onSelect: (step: number | null) => void; // null: back to the key
}

export function ProgressionStrip({ steps, selected, onSelect }: ProgressionStripProps) {
  const previous = selected === null ? null : nextPlayable(steps, selected, -1);
  const next = nextPlayable(steps, selected, 1);
  return (
    <section aria-label="Progression" className="flex items-center gap-0.5">
      <button type="button" aria-label="Previous chord" disabled={previous === null} onClick={() => onSelect(previous)} className={ARROW}>
        ‹
      </button>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {steps.map((step, i) => {
          const active = i === selected;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={active}
              aria-label={step.quality ? `${step.roman}, ${step.longName}` : `${step.longName}, no shapes yet`}
              disabled={!step.quality}
              onClick={() => onSelect(active ? null : i)}
              className={`flex min-h-14 flex-col items-center justify-center gap-px rounded-xl border-[1.5px] border-text-primary disabled:opacity-40 ${
                active ? "bg-text-primary text-bg" : "text-text-primary"
              }`}
            >
              <span className="text-[11px] font-bold opacity-70">{step.roman}</span>
              <span className="font-display text-xl font-semibold leading-none">{step.name}</span>
            </button>
          );
        })}
      </div>
      <button type="button" aria-label="Next chord" disabled={next === null} onClick={() => onSelect(next)} className={ARROW}>
        ›
      </button>
    </section>
  );
}
