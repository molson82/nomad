import type { ScaleType, ScaleView, Tonality } from "@/lib/theory/scales";

const SEGMENT = "min-h-10 px-3.5 font-display text-[15px] font-semibold";
const TONALITIES: [Tonality, string][] = [["major", "Major"], ["minor", "Minor"]];
const TYPES: [ScaleType, string][] = [["scale", "Scale"], ["pentatonic", "Pentatonic"], ["blues", "Blues"]];

interface ViewTogglesProps {
  view: ScaleView;
  onChange: (patch: Partial<ScaleView>) => void;
}

export function ViewToggles({ view, onChange }: ViewTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div role="group" aria-label="Major or minor" className="flex overflow-hidden rounded-full border-[1.5px] border-text-primary">
        {TONALITIES.map(([value, label]) => {
          const active = view.tonality === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ tonality: value })}
              className={`${SEGMENT} ${active ? "bg-text-primary text-bg" : "text-text-primary"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div role="group" aria-label="Scale type" className="flex flex-1 overflow-hidden rounded-full border-[1.5px] border-text-primary">
        {TYPES.map(([value, label], i) => {
          const active = view.type === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ type: value })}
              className={`${SEGMENT} flex-1 ${i > 0 ? "border-l-[1.5px] border-text-primary" : ""} ${
                active ? "bg-accent text-ink" : "text-text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
