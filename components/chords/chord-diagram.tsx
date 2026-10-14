import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS, type Role } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";

const LEFT = 70;
const STRING_GAP = 40;
const FRET_H = 56;
const ROLE_NAME: Record<Role, string> = { R: "root", "3": "3rd", "5": "5th" };

interface ChordDiagramProps {
  shape: CagedShape;
  chordName: string; // "G major"
}

export function ChordDiagram({ shape, chordName }: ChordDiagramProps) {
  const open = shape.lowFret === 0;
  // Room above the nut only when there's an ○ or × to draw there.
  const TOP = open || shape.tones.length < 6 ? 44 : 14;
  const start = open ? 1 : shape.lowFret; // first fret row drawn
  const rows = Math.max(4, shape.highFret - start + 1);
  const height = TOP + rows * FRET_H + 40;
  const x = (string: number) => LEFT + string * STRING_GAP;
  const y = (fret: number) => (fret === 0 ? TOP - 20 : TOP + (fret - start + 0.5) * FRET_H);
  const used = new Map(shape.tones.map((tone) => [tone.string, tone]));
  const label = `${chordName}, ${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`;

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg viewBox={`0 0 300 ${height}`} role="img" aria-label={label} className="w-full max-w-[300px]">
        {!open && (
          <text x={14} y={TOP + FRET_H / 2 + 5} fontSize={14} fontWeight={700} className="fill-text-secondary">
            {start}fr
          </text>
        )}
        <rect x={LEFT - 20} y={TOP} width={5 * STRING_GAP + 40} height={rows * FRET_H} className="fill-fretboard" />
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={i} x1={LEFT - 20} x2={x(5) + 20} y1={TOP + i * FRET_H} y2={TOP + i * FRET_H} className="stroke-fret-wire" strokeWidth={2} />
        ))}
        {open && <line data-nut x1={LEFT - 20} x2={x(5) + 20} y1={TOP} y2={TOP} className="stroke-text-primary" strokeWidth={6} />}
        {[0, 1, 2, 3, 4, 5].map((string) => {
          const tone = used.get(string);
          return (
            <g key={string}>
              <line data-string-line x1={x(string)} x2={x(string)} y1={TOP} y2={TOP + rows * FRET_H} className="stroke-string" strokeWidth={1 + (5 - string) * 0.4} />
              {tone ? (
                <text data-string-note x={x(string)} y={height - 12} textAnchor="middle" fontSize={16} className="fill-text-primary font-display font-semibold">
                  {formatNote(tone.note)}
                </text>
              ) : (
                <text x={x(string)} y={TOP - 14} textAnchor="middle" fontSize={20} className="fill-text-secondary font-bold">
                  ×
                </text>
              )}
            </g>
          );
        })}
        {shape.tones.map((tone) => {
          // Open strings are the standard hollow ○ above the nut; their role is in the sr-only list.
          if (tone.fret === 0) {
            return (
              <g key={tone.string} data-role={tone.role} data-open>
                <circle cx={x(tone.string)} cy={y(0)} r={10} fill="none" className="stroke-text-primary" strokeWidth={2.5} />
              </g>
            );
          }
          return (
            <g key={tone.string} data-role={tone.role} data-open={false}>
              <circle
                cx={x(tone.string)}
                cy={y(tone.fret)}
                r={18}
                fill={tone.role === "R" ? "#161718" : "#FFFFFF"}
                stroke="#161718"
                strokeWidth={2}
              />
              {tone.role !== "R" && (
                <text x={x(tone.string)} y={y(tone.fret) + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill="#161718">
                  {tone.role}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {shape.tones.map((tone) => (
          <li key={tone.string}>
            {`${STRING_ORDINALS[tone.string]} string, fret ${tone.fret}, ${formatNote(tone.note)}, ${ROLE_NAME[tone.role]}`}
          </li>
        ))}
      </ul>
    </figure>
  );
}
