import { COMMON_PROGRESSIONS, progressionLabel } from "@/lib/theory/chords";

interface CommonProgressionsProps {
  activeId: string | null;
  onPick: (id: string) => void;
}

export function CommonProgressions({ activeId, onPick }: CommonProgressionsProps) {
  return (
    <section aria-labelledby="common-heading" className="flex flex-col gap-2.5">
      <h2 id="common-heading" className="font-display text-lg font-semibold uppercase tracking-[0.06em] md:text-xl">
        Common progressions
      </h2>
      <div className="flex flex-wrap gap-2">
        {COMMON_PROGRESSIONS.map((preset) => {
          const active = preset.id === activeId;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(preset.id)}
              className={`flex min-h-11 flex-col items-start justify-center rounded-full border-[1.5px] px-3.5 ${
                active ? "border-ink bg-decoder text-ink" : "border-text-primary text-text-primary"
              }`}
            >
              <span className="text-sm font-bold">{progressionLabel(preset.degrees)}</span>
              <span className={`text-[11px] font-medium ${active ? "text-ink" : "text-text-secondary"}`}>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
