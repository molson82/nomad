"use client";

import { MARKER_STYLE } from "@/components/fretboard/marker-style";
import { chordNames, noteLabel, voicingOf, type Frets } from "@/lib/theory/chord-names";
import { MAX_FRET, STRING_ORDINALS } from "@/lib/theory/fretboard";
import { mod } from "@/lib/theory/spelling";
import { openPitches, pitchName, type TuningOffsets } from "@/lib/theory/tuning";

// Big enough to tap: one viewBox, wider than a phone so it scrolls, and fills the screen on large ones.
export const TAP_NECK = { width: 1030, openW: 40, fretW: 66, stringGap: 46, top: 26, height: 300 } as const;
const STRINGS = [0, 1, 2, 3, 4, 5];
const FRET_NUMBERS = [3, 5, 7, 9, 12, 15];
const INLAYS = [3, 5, 7, 9, 15];

const stringY = (string: number) => TAP_NECK.top + (5 - string) * TAP_NECK.stringGap;
const fretLineX = (fret: number) => TAP_NECK.openW + fret * TAP_NECK.fretW;
export const tapFretX = (fret: number) => (fret === 0 ? TAP_NECK.openW / 2 : fretLineX(fret) - TAP_NECK.fretW / 2);
const percent = (value: number, of: number) => `${(value / of) * 100}%`;

interface TapNeckProps {
  frets: Frets;
  offsets: TuningOffsets;
  onTap: (string: number, fret: number) => void;
}

export function TapNeck({ frets, offsets, onTap }: TapNeckProps) {
  const open = openPitches(offsets);
  const voicing = voicingOf(frets, offsets);
  const name = voicing ? (chordNames(voicing)[0] ?? null) : null;
  const neckBottom = stringY(0) + 22;
  return (
    <div className="relative min-w-[1030px] lg:min-w-0" style={{ aspectRatio: `${TAP_NECK.width} / ${TAP_NECK.height}` }}>
      <svg aria-hidden viewBox={`0 0 ${TAP_NECK.width} ${TAP_NECK.height}`} className="absolute inset-0 h-full w-full select-none">
        <rect x={0} y={4} width={TAP_NECK.width} height={neckBottom - 4} className="fill-fretboard" />
        {INLAYS.map((fret) => (
          <circle key={fret} cx={tapFretX(fret)} cy={(stringY(2) + stringY(3)) / 2} r={8} fill="#C9AE7D" />
        ))}
        <circle cx={tapFretX(12)} cy={(stringY(3) + stringY(4)) / 2} r={8} fill="#C9AE7D" />
        <circle cx={tapFretX(12)} cy={(stringY(1) + stringY(2)) / 2} r={8} fill="#C9AE7D" />
        {Array.from({ length: MAX_FRET + 1 }, (_, fret) => (
          <line
            key={fret}
            x1={fretLineX(fret)}
            x2={fretLineX(fret)}
            y1={4}
            y2={neckBottom}
            className={fret === 0 ? "stroke-text-primary" : "stroke-fret-wire"}
            strokeWidth={fret === 0 ? 5 : 2.5}
          />
        ))}
        {STRINGS.map((string) => (
          <g key={string}>
            <line x1={0} x2={TAP_NECK.width} y1={stringY(string)} y2={stringY(string)} className="stroke-string" strokeWidth={1 + (5 - string) * 0.4} />
            <text x={tapFretX(0)} y={stringY(string) - 6} textAnchor="middle" fontSize={13} fontWeight={700} className="fill-text-primary font-display">
              {pitchName(open[string])}
            </text>
          </g>
        ))}
        {FRET_NUMBERS.map((fret) => (
          <text key={fret} x={tapFretX(fret)} y={TAP_NECK.height - 6} textAnchor="middle" fontSize={14} fontWeight={600} className="fill-text-secondary">
            {fret}
          </text>
        ))}
        {frets.map((fret, string) => {
          if (fret === null) return null;
          const pitch = mod(open[string] + fret, 12);
          const style = MARKER_STYLE[pitch === (name?.root ?? -1) ? "tonic" : "chosen"];
          return (
            <g key={string} data-note>
              <circle
                cx={tapFretX(fret)}
                cy={stringY(string)}
                r={17}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={2}
                className={style === MARKER_STYLE.tonic ? "stroke-text-primary" : undefined}
              />
              <text x={tapFretX(fret)} y={stringY(string) + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={style.text}>
                {noteLabel(pitch, name)}
              </text>
            </g>
          );
        })}
      </svg>
      {STRINGS.map((string) =>
        Array.from({ length: MAX_FRET + 1 }, (_, fret) => {
          const width = fret === 0 ? TAP_NECK.openW : TAP_NECK.fretW;
          const place = fret === 0 ? "open" : `fret ${fret}`;
          return (
            <button
              key={fret}
              type="button"
              aria-label={`${STRING_ORDINALS[string]} string, ${place}`}
              aria-pressed={frets[string] === fret}
              onClick={() => onTap(string, fret)}
              className="absolute rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-ink"
              style={{
                left: percent(tapFretX(fret) - width / 2, TAP_NECK.width),
                top: percent(stringY(string) - TAP_NECK.stringGap / 2, TAP_NECK.height),
                width: percent(width, TAP_NECK.width),
                height: percent(TAP_NECK.stringGap, TAP_NECK.height),
              }}
            />
          );
        }),
      )}
    </div>
  );
}
