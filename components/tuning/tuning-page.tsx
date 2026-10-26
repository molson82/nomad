"use client";

import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import {
  MAX_OFFSET,
  MIN_OFFSET,
  STANDARD_OFFSETS,
  TUNING_PRESETS,
  isStandard,
  openPitches,
  pitchName,
  presetFor,
  tuningName,
  withStringStep,
} from "@/lib/theory/tuning";
import { useTuning } from "@/lib/tuning/use-tuning";

const HEADING = "font-display text-lg font-semibold uppercase tracking-[0.06em] md:text-xl";
const STEP = "grid h-11 w-11 place-items-center text-2xl font-bold text-accent-ink disabled:opacity-30";

// "standard" · "+1 semitone" · "−2 semitones" (a real minus sign).
function changeText(offset: number): string {
  if (offset === 0) return "standard";
  const sign = offset > 0 ? "+" : "−";
  return `${sign}${Math.abs(offset)} semitone${Math.abs(offset) === 1 ? "" : "s"}`;
}

export function TuningPage() {
  const [tuning, setTuning] = useTuning();
  const pitches = openPitches(tuning);
  const active = presetFor(tuning);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 md:gap-6">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only">Tuning</h1>

      <section aria-label="Current tuning" className="flex items-center justify-between gap-3 rounded-[24px] bg-accent px-4 py-3.5 text-ink">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.08em] opacity-80">Tuning</span>
          <h2 className="font-display text-[30px] font-semibold leading-tight">{tuningName(tuning)}</h2>
          <p className="text-[13px] font-semibold opacity-90">Used by Chords and Scales</p>
        </div>
        <button
          type="button"
          onClick={() => setTuning(STANDARD_OFFSETS)}
          disabled={isStandard(tuning)}
          className="min-h-11 shrink-0 rounded-full border-[1.5px] border-ink px-3.5 font-display text-[15px] font-semibold disabled:opacity-40"
        >
          Reset to standard
        </button>
      </section>

      <section aria-labelledby="strings-heading" className="rounded-[22px] border border-border bg-surface px-3 pb-1 pt-3">
        <h2 id="strings-heading" className={`${HEADING} mb-1.5`}>
          Strings · high to low
        </h2>
        <ol>
          {[5, 4, 3, 2, 1, 0].map((string) => {
            const offset = tuning[string];
            const ordinal = STRING_ORDINALS[string];
            return (
              <li key={string} className="flex min-h-[52px] items-center gap-2 border-t border-border px-1">
                <span className="w-9 text-xs font-bold text-text-secondary">{ordinal}</span>
                <button
                  type="button"
                  aria-label={`Tune ${ordinal} string down`}
                  disabled={offset <= MIN_OFFSET}
                  onClick={() => setTuning(withStringStep(tuning, string, -1))}
                  className={STEP}
                >
                  ↓
                </button>
                <span
                  className={`grid h-11 w-[52px] place-items-center rounded-xl border-[1.5px] border-text-primary font-display text-[22px] font-semibold ${
                    offset === 0 ? "" : "bg-text-primary text-bg"
                  }`}
                >
                  {pitchName(pitches[string])}
                </span>
                <button
                  type="button"
                  aria-label={`Tune ${ordinal} string up`}
                  disabled={offset >= MAX_OFFSET}
                  onClick={() => setTuning(withStringStep(tuning, string, 1))}
                  className={STEP}
                >
                  ↑
                </button>
                <span className={`ml-auto text-xs font-semibold ${offset === 0 ? "text-text-tertiary" : "text-accent-ink"}`}>
                  {changeText(offset)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="common-tunings" className="flex flex-col gap-2.5">
        <h2 id="common-tunings" className={HEADING}>
          Common tunings
        </h2>
        <div className="flex flex-wrap gap-2">
          {TUNING_PRESETS.map((preset) => {
            const pressed = preset.id === active?.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setTuning(preset.offsets)}
                className={`flex min-h-11 flex-col items-start justify-center rounded-full border-[1.5px] border-text-primary px-3.5 text-left ${
                  pressed ? "bg-accent text-ink" : "text-text-primary"
                }`}
              >
                <span className="font-display text-[15px] font-semibold leading-tight">{preset.name}</span>
                <span className="text-[11px] font-semibold opacity-80">{openPitches(preset.offsets).map(pitchName).join(" ")}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
