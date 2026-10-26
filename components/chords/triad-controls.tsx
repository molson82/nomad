import type { Quality } from "@/lib/theory/fretboard";
import { INVERSIONS, STRING_SETS, type Inversion, type StringSet } from "@/lib/theory/triads";

const SET_LABEL: Record<StringSet, string> = { 0: "6–5–4", 1: "5–4–3", 2: "4–3–2", 3: "3–2–1" };
const INVERSION_CHIP: Record<Inversion, string> = { root: "Root pos", first: "1st inv", second: "2nd inv" };

export const setLabel = (set: StringSet) => SET_LABEL[set];

interface TriadControlsProps {
  set: StringSet;
  inversion: Inversion;
  quality: Quality;
  available: Record<StringSet, Record<Inversion, number>>; // playable triads per set and inversion
  strings: readonly string[]; // open-string names, low → high
  onSet: (set: StringSet) => void;
  onInversion: (inversion: Inversion) => void;
}

// In tunings that move the strings unevenly, these replace the CAGED chips.
export function TriadControls({ set, inversion, quality, available, strings, onSet, onInversion }: TriadControlsProps) {
  const bass: Record<Inversion, string> = { root: "R", first: quality === "minor" ? "♭3" : "3", second: "5" };
  return (
    <div className="flex flex-col gap-1.5">
      <div role="group" aria-label="Triads on three strings" className="grid grid-cols-4 gap-1 xl:gap-2">
        {STRING_SETS.map((s) => {
          const active = s === set;
          const empty = INVERSIONS.every((i) => available[s][i] === 0);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              disabled={empty}
              onClick={() => onSet(s)}
              className={`flex min-h-11 flex-col items-center justify-center rounded-[10px] border-[1.5px] disabled:opacity-35 ${
                active ? "border-ink bg-accent text-ink" : "border-text-primary text-text-primary"
              }`}
            >
              <span className="font-display text-sm font-semibold leading-none xl:text-lg">{SET_LABEL[s]}</span>
              <span className="text-[10px] font-semibold xl:text-xs">{strings.slice(s, s + 3).join(" ")}</span>
            </button>
          );
        })}
      </div>
      <div role="group" aria-label="Inversion" className="flex overflow-hidden rounded-xl border-[1.5px] border-text-primary">
        {INVERSIONS.map((inv, i) => {
          const count = available[set][inv];
          const active = inv === inversion;
          return (
            <button
              key={inv}
              type="button"
              aria-pressed={active}
              disabled={count === 0}
              onClick={() => onInversion(inv)}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center px-1 disabled:opacity-40 ${i > 0 ? "border-l-[1.5px] border-text-primary" : ""} ${
                active ? "bg-accent text-ink" : "text-text-primary"
              }`}
            >
              <span className="font-display text-[15px] font-semibold leading-none">{INVERSION_CHIP[inv]}</span>
              <span className="text-[10px] font-semibold">
                {count === 0 ? "too wide to play" : `${bass[inv]} in the bass · ${count} shape${count === 1 ? "" : "s"}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
