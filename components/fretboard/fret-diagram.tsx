import { MARKER_STYLE, type MarkerKind } from "./marker-style";

const LEFT = 70;
const STRING_GAP = 40;
const FRET_H = 56;

export type DiagramMarker = { string: number; fret: number; label: string; kind: MarkerKind; srText: string; noteName?: string };

interface FretDiagramProps {
  markers: DiagramMarker[];
  lowFret: number;
  highFret: number;
  ariaLabel: string;
  showMuted: boolean; // × over strings with no marker (chords)
  openStyle: "hollow" | "marker"; // ○ for chords, the note's marker for scales
  showNoteNames: boolean; // one note per string under the diagram (chords)
}

export function FretDiagram({ markers, lowFret, highFret, ariaLabel, showMuted, openStyle, showNoteNames }: FretDiagramProps) {
  const open = lowFret === 0;
  const used = new Set(markers.map((m) => m.string));
  const muted = showMuted ? [0, 1, 2, 3, 4, 5].filter((s) => !used.has(s)) : [];
  // Room above the nut only when there's something to draw there.
  const TOP = open || muted.length > 0 ? 44 : 14;
  const start = open ? 1 : lowFret; // first fret row drawn
  const rows = Math.max(4, highFret - start + 1);
  const height = TOP + rows * FRET_H + (showNoteNames ? 40 : 16);
  const x = (string: number) => LEFT + string * STRING_GAP;
  const y = (fret: number) => (fret === 0 ? TOP - 20 : TOP + (fret - start + 0.5) * FRET_H);

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg viewBox={`0 0 300 ${height}`} role="img" aria-label={ariaLabel} className="w-full max-w-[300px]">
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
          const noteName = markers.find((m) => m.string === string)?.noteName;
          return (
            <g key={string}>
              <line data-string-line x1={x(string)} x2={x(string)} y1={TOP} y2={TOP + rows * FRET_H} className="stroke-string" strokeWidth={1 + (5 - string) * 0.4} />
              {showNoteNames && noteName && (
                <text data-string-note x={x(string)} y={height - 12} textAnchor="middle" fontSize={16} className="fill-text-primary font-display font-semibold">
                  {noteName}
                </text>
              )}
              {muted.includes(string) && (
                <text x={x(string)} y={TOP - 14} textAnchor="middle" fontSize={20} className="fill-text-secondary font-bold">
                  ×
                </text>
              )}
            </g>
          );
        })}
        {markers.map((m) => {
          const key = `${m.string}:${m.fret}`;
          const role = m.kind === "tonic" ? "R" : m.label;
          if (m.fret === 0 && openStyle === "hollow") {
            // The standard open-string ○; its role is in the sr-only list.
            return (
              <g key={key} data-role={role} data-open>
                <circle cx={x(m.string)} cy={y(0)} r={10} fill="none" className="stroke-text-primary" strokeWidth={2.5} />
              </g>
            );
          }
          const style = MARKER_STYLE[m.kind];
          return (
            <g key={key} data-role={role} data-open={m.fret === 0}>
              <circle cx={x(m.string)} cy={y(m.fret)} r={18 * style.scale} fill={style.fill} stroke={style.stroke} strokeWidth={style.ring + 0.5} />
              {m.label && m.kind !== "tonic" && (
                <text x={x(m.string)} y={y(m.fret) + (m.label.length > 1 ? 5 : 6)} textAnchor="middle" fontSize={m.label.length > 1 ? 13 : 17} fontWeight={700} fill={style.text}>
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {markers.map((m) => (
          <li key={`${m.string}:${m.fret}`}>{m.srText}</li>
        ))}
      </ul>
    </figure>
  );
}
