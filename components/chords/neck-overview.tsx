"use client";

import type { MouseEvent } from "react";
import { NECK, fretAtX, fretCenterX, fretLineX, stringY } from "@/lib/chords/neck-geometry";
import type { CagedShape } from "@/lib/theory/caged";
import { MAX_FRET, type ChordTone } from "@/lib/theory/fretboard";

const INLAYS = [3, 5, 7, 9, 15];
const FRET_NUMBERS = [3, 5, 7, 9, 12, 15];

interface NeckOverviewProps {
  tones: ChordTone[];
  shape: CagedShape;
  chordName: string;
  onPickFret: (fret: number) => void;
}

export function NeckOverview({ tones, shape, chordName, onPickFret }: NeckOverviewProps) {
  const inShape = new Set(shape.tones.map((t) => `${t.string}:${t.fret}`));
  const windowLeft = shape.lowFret === 0 ? 2 : fretLineX(shape.lowFret - 1) - 4;
  const windowRight = fretLineX(shape.highFret) + 4;
  const neckBottom = stringY(0) + 10;

  // Taps are a shortcut; every shape is also reachable by its chip.
  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPickFret(fretAtX(((event.clientX - rect.left) / rect.width) * NECK.width));
  };

  return (
    <svg
      viewBox={`0 0 ${NECK.width} ${NECK.height}`}
      role="img"
      aria-label={`${chordName} across the neck, ${shape.name}-shape at frets ${shape.lowFret} to ${shape.highFret}`}
      className="w-full cursor-pointer select-none"
      onClick={pick}
    >
      <rect x={NECK.nutX} y={8} width={fretLineX(MAX_FRET) - NECK.nutX} height={neckBottom - 8} className="fill-fretboard" />
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
          stroke={fret === 0 ? "#161718" : "#B89B6A"}
          strokeWidth={fret === 0 ? 4 : 1.5}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line key={string} x1={NECK.nutX} x2={fretLineX(MAX_FRET)} y1={stringY(string)} y2={stringY(string)} stroke="#6B5A40" strokeWidth={1 + (5 - string) * 0.3} />
      ))}
      <rect
        data-window-low={shape.lowFret}
        data-window-high={shape.highFret}
        x={windowLeft}
        y={2}
        width={windowRight - windowLeft}
        height={neckBottom + 4}
        rx={8}
        className="fill-accent stroke-accent"
        fillOpacity={0.12}
        strokeWidth={2.5}
      />
      {tones.map((tone) => {
        const on = inShape.has(`${tone.string}:${tone.fret}`);
        return (
          <g key={`${tone.string}:${tone.fret}`} data-tone data-in-shape={on} opacity={on ? 1 : 0.3}>
            <circle
              cx={fretCenterX(tone.fret)}
              cy={stringY(tone.string)}
              r={9}
              fill={tone.role === "R" ? "#161718" : "#FFFFFF"}
              stroke="#161718"
              strokeWidth={1.5}
            />
            {tone.role !== "R" && (
              <text x={fretCenterX(tone.fret)} y={stringY(tone.string) + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#161718" className="hidden md:inline">
                {tone.role}
              </text>
            )}
          </g>
        );
      })}
      {FRET_NUMBERS.map((fret) => (
        <text key={fret} x={fretCenterX(fret)} y={NECK.height - 4} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-text-secondary">
          {fret}
        </text>
      ))}
    </svg>
  );
}
