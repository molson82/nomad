"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Neck } from "@/components/fretboard/neck";
import { usePathfinder } from "@/lib/pathfinder/hooks";
import { EMPTY_FRETS, canBuildPath, tapFret } from "@/lib/pathfinder/state";
import { MAX_FRET } from "@/lib/theory/fretboard";
import { useTuning } from "@/lib/tuning/use-tuning";
import { ChordTitle } from "./chord-title";
import { TAP_NECK, TapNeck, tapFretX } from "./tap-neck";

export function BuildScreen({ onBuild }: { onBuild: () => void }) {
  const [state, setState] = usePathfinder();
  const [tuning] = useTuning();
  const { frets } = state;
  const notes = frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret }]));
  const scroller = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState({ low: 0, high: MAX_FRET });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    const scale = el.scrollWidth / TAP_NECK.width;
    const fretAt = (px: number) => Math.round((px / scale - TAP_NECK.openW) / TAP_NECK.fretW);
    setInView({
      low: Math.max(0, fretAt(el.scrollLeft) + 1),
      high: Math.min(MAX_FRET, fretAt(el.scrollLeft + el.clientWidth)),
    });
  }, []);

  const scrollToFret = useCallback((fret: number) => {
    const el = scroller.current;
    if (el) el.scrollLeft = tapFretX(fret) * (el.scrollWidth / TAP_NECK.width) - el.clientWidth / 2;
  }, []);

  // Open where the chord is, or at the nut when there isn't one yet. Only on arrival: taps mustn't move the neck.
  useEffect(() => {
    const placed = frets.filter((fret) => fret !== null);
    scrollToFret(placed.length > 0 ? placed.reduce((sum, fret) => sum + fret, 0) / placed.length : 0);
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <ChordTitle frets={frets} offsets={tuning} />
      <section aria-label="Where you are on the neck" className="rounded-[20px] border-2 border-accent bg-surface p-2 lg:hidden">
        <Neck
          markers={notes.map((n) => ({ ...n, label: "", kind: "chosen", inWindow: true }))}
          windowLow={inView.low}
          windowHigh={inView.high}
          ariaLabel="Whole neck, showing the part in view below"
          onPickFret={scrollToFret}
        />
      </section>
      <section aria-label="Place your notes" className="-mx-4 flex flex-col gap-1.5 border-y border-border bg-surface py-2 md:mx-0 md:rounded-[20px] md:border lg:p-3">
        <p className="text-center text-xs text-text-secondary">
          Tap a fret to place a note<span className="lg:hidden"> · swipe to move along the neck</span>
        </p>
        <div ref={scroller} onScroll={measure} className="overflow-x-auto lg:overflow-visible">
          <TapNeck frets={frets} offsets={tuning} onTap={(string, fret) => setState({ ...state, frets: tapFret(frets, string, fret) })} />
        </div>
      </section>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={notes.length === 0}
          onClick={() => setState({ ...state, frets: EMPTY_FRETS })}
          className="min-h-[52px] rounded-full border-[1.5px] border-text-primary px-5 font-display text-base font-semibold disabled:border-text-tertiary disabled:text-text-tertiary"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={!canBuildPath(frets, tuning)}
          onClick={onBuild}
          className="min-h-[52px] flex-1 rounded-full border-[1.5px] border-text-primary bg-accent font-display text-lg font-semibold uppercase tracking-[0.04em] text-accent-on disabled:border-text-tertiary disabled:bg-transparent disabled:text-text-tertiary"
        >
          Build path
        </button>
      </div>
    </div>
  );
}
