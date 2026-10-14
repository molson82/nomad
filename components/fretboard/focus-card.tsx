"use client";

import { useRef, type ReactNode } from "react";
import { classifyGesture } from "@/lib/circle/wheel-math";

const ARROW = "grid h-11 w-11 shrink-0 place-items-center text-[28px] text-accent-ink disabled:opacity-25";

interface FocusCardProps {
  regionLabel: string;
  title: string;
  subtitle: string;
  previousLabel: string;
  nextLabel: string;
  canPrevious: boolean;
  canNext: boolean;
  count: number;
  index: number;
  onStep: (direction: 1 | -1) => void;
  children: ReactNode; // the diagram
  footer?: ReactNode;
}

export function FocusCard(props: FocusCardProps) {
  const { regionLabel, title, subtitle, previousLabel, nextLabel, canPrevious, canNext, count, index, onStep, children, footer } = props;
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <section
      aria-label={regionLabel}
      className="flex min-w-0 flex-1 touch-pan-y select-none flex-col items-center gap-2 rounded-[22px] border border-border bg-surface px-3 py-3.5 xl:flex-row xl:gap-4 xl:px-5"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const gesture = classifyGesture(event.clientX - from.x, event.clientY - from.y);
        if (gesture === "swipe-left" && canNext) onStep(1);
        else if (gesture === "swipe-right" && canPrevious) onStep(-1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div className="flex w-full items-center justify-between xl:contents">
        <button type="button" disabled={!canPrevious} aria-label={previousLabel} onClick={() => onStep(-1)} className={`${ARROW} xl:order-first`}>
          ‹
        </button>
        <div className="flex flex-col items-center text-center xl:order-2 xl:flex-1 xl:items-start xl:text-left">
          <h3 className="text-balance font-display text-[26px] font-semibold leading-tight xl:text-[30px]">{title}</h3>
          <p className="text-[13px] text-text-secondary xl:text-sm">{subtitle}</p>
        </div>
        <button type="button" disabled={!canNext} aria-label={nextLabel} onClick={() => onStep(1)} className={`${ARROW} xl:order-last`}>
          ›
        </button>
      </div>
      <div className="w-full max-w-[300px] xl:order-1 xl:w-[250px]">
        {children}
        {footer && <p className="mt-1 text-center text-[13px] font-semibold text-text-secondary">{footer}</p>}
      </div>
      <div aria-hidden className="flex gap-1.5 xl:hidden">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`h-2 rounded-full ${i === index ? "w-[22px] bg-accent" : "w-2 bg-border"}`} />
        ))}
      </div>
    </section>
  );
}
