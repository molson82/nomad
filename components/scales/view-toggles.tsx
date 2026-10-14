import type { ReactNode } from "react";
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";
import type { ScaleType, ScaleView } from "@/lib/theory/scales";

const SEGMENT = "min-h-11 px-3.5 font-display text-[15px] font-semibold";
const TYPES: [ScaleType, string][] = [["scale", "Scale"], ["pentatonic", "Pentatonic"], ["blues", "Blues"]];

interface ViewTogglesProps {
  view: ScaleView;
  onChange: (patch: Partial<ScaleView>) => void;
  info?: ReactNode; // an ⓘ beside the type group
}

export function ViewToggles({ view, onChange, info }: ViewTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <MajorMinorToggle value={view.tonality} onChange={(tonality) => onChange({ tonality })} />
      <div className="flex flex-1 items-center">
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
        {info}
      </div>
    </div>
  );
}
