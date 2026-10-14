"use client";

import { useRef } from "react";
import { classifyGesture } from "@/lib/circle/wheel-math";
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { ChordDiagram } from "./chord-diagram";

const ARROW = "grid h-11 w-11 shrink-0 place-items-center text-[28px] text-accent-ink disabled:opacity-25";

interface FocusCardProps {
  shape: CagedShape;
  shapes: CagedShape[]; // neck order
  chordName: string;
  onStep: (direction: 1 | -1) => void;
}

export function FocusCard({ shape, shapes, chordName, onStep }: FocusCardProps) {
  const index = shapes.findIndex((s) => s.name === shape.name);
  const previous = shapes[index - 1];
  const next = shapes[index + 1];
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <section
      aria-label={`${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      className="flex min-w-0 flex-1 touch-pan-y select-none flex-col items-center gap-2 rounded-[22px] border border-border bg-surface px-3 py-3.5 xl:flex-row xl:gap-4 xl:px-5"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const gesture = classifyGesture(event.clientX - from.x, event.clientY - from.y);
        if (gesture === "swipe-left" && next) onStep(1);
        else if (gesture === "swipe-right" && previous) onStep(-1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div className="flex w-full items-center justify-between xl:contents">
        <button
          type="button"
          disabled={!previous}
          aria-label={previous ? `Previous shape: ${previous.name}-shape` : "Previous shape"}
          onClick={() => onStep(-1)}
          className={`${ARROW} xl:order-first`}
        >
          ‹
        </button>
        <div className="flex flex-col items-center xl:order-2 xl:flex-1 xl:items-start">
          <h3 className="font-display text-[26px] font-semibold leading-tight xl:text-[30px]">{shape.name}-shape</h3>
          <p className="text-[13px] text-text-secondary xl:text-sm">
            frets {shape.lowFret}–{shape.highFret} · root on the {STRING_ORDINALS[shape.rootString]} string
          </p>
        </div>
        <button
          type="button"
          disabled={!next}
          aria-label={next ? `Next shape: ${next.name}-shape` : "Next shape"}
          onClick={() => onStep(1)}
          className={`${ARROW} xl:order-last`}
        >
          ›
        </button>
      </div>
      <div className="w-full max-w-[300px] xl:order-1 xl:w-[250px]">
        <ChordDiagram shape={shape} chordName={chordName} />
      </div>
      <div aria-hidden className="flex gap-1.5 xl:hidden">
        {shapes.map((s, i) => (
          <span key={s.name} className={`h-2 rounded-full ${i === index ? "w-[22px] bg-accent" : "w-2 bg-border"}`} />
        ))}
      </div>
    </section>
  );
}
