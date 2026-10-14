"use client";

import { useRef } from "react";
import { classifyGesture } from "@/lib/circle/wheel-math";
import { InfoButton } from "@/components/notes/info-button";
import { fifthsNote, keyChordsNote } from "@/lib/notes/circle-notes";
import { CIRCLE, describeKey, keySignature, rootNoteFor } from "@/lib/theory/circle";
import { DECODER_LAYOUT, diatonicChords } from "@/lib/theory/chords";
import { formatNote } from "@/lib/theory/spelling";
import { ChordButton, DimChordButton } from "./chord-circle";
import { MiniWheel, type WheelHandlers } from "./mini-wheel";

const FACT_LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] md:text-xs";
const ROW_LABEL = "bg-decoder px-1 font-display text-[17px] font-semibold leading-tight tracking-[0.04em] md:text-xl xl:text-lg";
// Clicks this soon after a swipe ends were part of the swipe, not a tap.
const SUPPRESS_CLICK_MS = 60;

interface DecoderCardProps {
  keyIndex: number;
  theta: number;
  wheelHandlers: WheelHandlers;
  badges: Map<number, number[]>;
  onAddChord: (degree: number) => void;
  onSwipe: (direction: 1 | -1) => void;
}

export function DecoderCard({ keyIndex, theta, wheelHandlers, badges, onAddChord, onSwipe }: DecoderCardProps) {
  const key = CIRCLE[keyIndex];
  const chords = diatonicChords(key);
  const signature = keySignature(key);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressUntil = useRef(0);
  const steps = (degree: number) => badges.get(degree) ?? [];
  const sizeFor = (degree: number) => (degree === 1 ? "key" : degree === 6 ? "relative" : degree === 4 || degree === 5 ? "major" : "minor");
  const labelFor = (degree: number) => (degree === 1 ? "I · KEY" : degree === 6 ? "vi · relative" : chords[degree - 1].roman);

  return (
    <section
      aria-label={`Key of ${describeKey(key)}`}
      // pan-y: vertical drags still scroll the page; horizontal ones are ours.
      className="flex touch-pan-y select-none flex-col gap-3.5 rounded-[28px] bg-decoder px-3.5 pb-5 pt-4 text-ink md:gap-[18px] md:rounded-[32px] md:px-7 md:pb-7 md:pt-[26px] xl:w-[620px] xl:shrink-0 xl:px-6 xl:pt-[22px]"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const gesture = classifyGesture(event.clientX - from.x, event.clientY - from.y);
        if (gesture === "tap") return;
        suppressUntil.current = event.timeStamp + SUPPRESS_CLICK_MS;
        if (gesture === "swipe-left") onSwipe(1);
        else if (gesture === "swipe-right") onSwipe(-1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
      onClickCapture={(event) => {
        if (event.timeStamp < suppressUntil.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="flex items-center gap-3 md:gap-8 xl:gap-6">
        <MiniWheel theta={theta} keyIndex={keyIndex} handlers={wheelHandlers} />
        <dl className="flex min-w-0 flex-col gap-2.5 md:gap-4 xl:gap-3.5">
          <div className="flex flex-col gap-px">
            <dt className={FACT_LABEL}>Key</dt>
            <dd className="flex items-center font-display text-[26px] font-semibold leading-tight md:text-[38px] xl:text-[34px]">
              {formatNote(key.tonic)} major
              <InfoButton label="About why the circle moves in fifths" note={fifthsNote(rootNoteFor(key))} className="text-ink" />
            </dd>
          </div>
          <div className="flex flex-col items-start gap-1">
            <dt className={FACT_LABEL}>Signature</dt>
            <dd className="rounded-[10px] bg-ink px-3 py-1 font-display text-lg font-semibold tracking-[0.04em] text-decoder md:text-[22px] xl:text-xl">
              {signature.length === 0
                ? "none"
                : `${key.sharpsOrFlats > 0 ? "♯" : "♭"} ${signature.map((note) => note.letter).join(" ")}`}
            </dd>
          </div>
          <div className="flex flex-col gap-px">
            <dt className={FACT_LABEL}>Relative minor</dt>
            <dd className="font-display text-xl font-semibold md:text-[26px] xl:text-2xl">{formatNote(key.relativeMinor)} minor</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-3 items-end gap-1.5 md:gap-2.5">
        {DECODER_LAYOUT.major.map((degree) => (
          <ChordButton
            key={degree}
            chord={chords[degree - 1]}
            size={sizeFor(degree)}
            label={labelFor(degree)}
            labelPosition="top"
            steps={steps(degree)}
            onAdd={onAddChord}
          />
        ))}
      </div>

      <div className="relative min-h-[70px]">
        <div aria-hidden className="absolute inset-x-0 top-1/2 border-t-[1.5px] border-dashed border-ink" />
        <div className="absolute left-1.5 top-0 md:left-3">
          <DimChordButton chord={chords[DECODER_LAYOUT.dim - 1]} steps={steps(DECODER_LAYOUT.dim)} onAdd={onAddChord} />
        </div>
        <div className="absolute right-1.5 top-0 flex h-full flex-col items-end justify-between md:right-3">
          <span className="flex items-center">
            <span aria-hidden className={`${ROW_LABEL} uppercase`}>Major ↑</span>
            <InfoButton label="About the key's chords" note={keyChordsNote(rootNoteFor(key))} className="text-ink" />
          </span>
          <span aria-hidden className={ROW_LABEL}>minor ↓</span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-start gap-1.5 md:gap-2.5">
        {DECODER_LAYOUT.minor.map((degree) => (
          <ChordButton
            key={degree}
            chord={chords[degree - 1]}
            size={sizeFor(degree)}
            label={labelFor(degree)}
            labelPosition="bottom"
            steps={steps(degree)}
            onAdd={onAddChord}
          />
        ))}
      </div>
    </section>
  );
}
