import type { Quality } from "@/lib/theory/fretboard";

const SEGMENT = "min-h-11 px-3.5 font-display text-[15px] font-semibold";
const OPTIONS: [Quality, string][] = [["major", "Major"], ["minor", "Minor"]];

export function MajorMinorToggle({ value, onChange }: { value: Quality; onChange: (quality: Quality) => void }) {
  return (
    <div role="group" aria-label="Major or minor" className="flex overflow-hidden rounded-full border-[1.5px] border-text-primary">
      {OPTIONS.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`${SEGMENT} ${active ? "bg-text-primary text-bg" : "text-text-primary"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
