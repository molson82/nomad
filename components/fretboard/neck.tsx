"use client";

import type { MouseEvent } from "react";
import { NECK, fretAtX, fretCenterX, fretLineX, stringY } from "@/lib/chords/neck-geometry";
import { MAX_FRET } from "@/lib/theory/fretboard";
import { MARKER_STYLE, type MarkerKind } from "./marker-style";

const INLAYS = [3, 5, 7, 9, 15];
const FRET_NUMBERS = [3, 5, 7, 9, 12, 15];

export type NeckMarker = { string: number; fret: number; label: string; kind: MarkerKind; inWindow: boolean };
export type NeckString = { name: string; changed: boolean }; // changed: retuned from standard

// String names sit in extra room left of the nut, so the fret geometry (and tap math) is unchanged.
const NAME_GUTTER = 28;

interface NeckProps {
  markers: NeckMarker[];
  windowLow: number;
  windowHigh: number;
  ariaLabel: string;
  onPickFret: (fret: number) => void;
  strings?: NeckString[]; // low → high
}

export function Neck({ markers, windowLow, windowHigh, ariaLabel, onPickFret, strings }: NeckProps) {
  const viewX = strings ? -NAME_GUTTER : 0;
  const viewWidth = NECK.width - viewX;
  const windowLeft = windowLow === 0 ? 2 : fretLineX(windowLow - 1) - 4;
  const windowRight = fretLineX(windowHigh) + 4;
  const neckBottom = stringY(0) + 10;

  // Taps are a shortcut; every position is also reachable by its chip.
  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPickFret(fretAtX(viewX + ((event.clientX - rect.left) / rect.width) * viewWidth));
  };

  return (
    <svg viewBox={`${viewX} 0 ${viewWidth} ${NECK.height}`} role="img" aria-label={ariaLabel} className="w-full cursor-pointer select-none" onClick={pick}>
      {/* The wood starts left of the nut so open-string notes sit on it too. */}
      <rect data-fretboard x={4} y={8} width={fretLineX(MAX_FRET) - 4} height={neckBottom - 8} rx={4} className="fill-fretboard" />
      {INLAYS.map((fret) => (
        <circle key={fret} cx={fretCenterX(fret)} cy={(stringY(2) + stringY(3)) / 2} r={5} fill="#C9AE7D" />
      ))}
      <circle cx={fretCenterX(12)} cy={(stringY(3) + stringY(4)) / 2} r={5} fill="#C9AE7D" />
      <circle cx={fretCenterX(12)} cy={(stringY(1) + stringY(2)) / 2} r={5} fill="#C9AE7D" />
      {Array.from({ length: MAX_FRET + 1 }, (_, fret) => (
        <line
          key={fret}
          x1={fretLineX(fret)}
          x2={fretLineX(fret)}
          y1={8}
          y2={neckBottom}
          className={fret === 0 ? "stroke-text-primary" : "stroke-fret-wire"}
          strokeWidth={fret === 0 ? 4 : 1.5}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line key={string} data-string-line x1={4} x2={fretLineX(MAX_FRET)} y1={stringY(string)} y2={stringY(string)} className="stroke-string" strokeWidth={1 + (5 - string) * 0.3} />
      ))}
      <rect
        data-window-low={windowLow}
        data-window-high={windowHigh}
        x={windowLeft}
        y={2}
        width={windowRight - windowLeft}
        height={neckBottom + 4}
        rx={8}
        className="fill-accent stroke-accent"
        fillOpacity={0.12}
        strokeWidth={2.5}
      />
      {markers.map((m) => {
        const style = MARKER_STYLE[m.kind];
        return (
          <g key={`${m.string}:${m.fret}`} data-tone data-kind={m.kind} data-in-shape={m.inWindow} opacity={m.inWindow ? 1 : 0.3}>
            <circle cx={fretCenterX(m.fret)} cy={stringY(m.string)} r={9 * style.scale} fill={style.fill} stroke={style.stroke} strokeWidth={style.ring} className={m.kind === "tonic" ? "stroke-text-primary" : undefined} />
            {m.label && m.kind !== "blue" && (
              <text x={fretCenterX(m.fret)} y={stringY(m.string) + 4} textAnchor="middle" fontSize={m.label.length > 1 ? 8 : 10} fontWeight={700} fill={style.text} className="hidden md:inline">
                {m.label}
              </text>
            )}
          </g>
        );
      })}
      {strings?.map((s, string) => (
        <text
          key={string}
          data-string-name
          x={-NAME_GUTTER / 2 + 2}
          y={stringY(string) + 5}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          className={`font-display ${s.changed ? "fill-tuning-ink" : "fill-text-primary"}`}
        >
          {s.name}
        </text>
      ))}
      {FRET_NUMBERS.map((fret) => (
        <text key={fret} x={fretCenterX(fret)} y={NECK.height - 4} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-text-secondary">
          {fret}
        </text>
      ))}
    </svg>
  );
}
