const ARROW = "grid h-11 w-11 place-items-center text-2xl font-bold text-accent-ink";

export function RootStepper({ name, onStep }: { name: string; onStep: (direction: 1 | -1) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Previous root" onClick={() => onStep(-1)} className={ARROW}>
        ←
      </button>
      <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-ink font-display text-[30px] font-semibold text-white dark:bg-surface dark:ring-2 dark:ring-text-secondary">
        {name}
      </span>
      <button type="button" aria-label="Next root" onClick={() => onStep(1)} className={ARROW}>
        →
      </button>
    </div>
  );
}
