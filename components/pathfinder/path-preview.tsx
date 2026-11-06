import { Neck, type NeckMarker, type NeckString, type Ring } from "@/components/fretboard/neck";
import type { KeyDetails, Region } from "@/lib/pathfinder/paths";
import type { Note } from "@/lib/theory/notes";
import { neckNotes, type ScaleView } from "@/lib/theory/scales";

export type PreviewMode = "pentatonic" | "scale" | "triads";

const MODES: { id: PreviewMode; label: string }[] = [
  { id: "pentatonic", label: "Pentatonic" },
  { id: "scale", label: "Scale" },
  { id: "triads", label: "Triads" },
];
const VIEWS: Record<"pentatonic" | "scale", ScaleView> = {
  pentatonic: { tonality: "minor", type: "pentatonic" },
  scale: { tonality: "major", type: "scale" },
};

export const regionLine = (r: Region) =>
  `${r.title} · frets ${r.lowFret}–${r.highFret}`;

interface PathPreviewProps {
  keyName: Note;
  details: KeyDetails;
  mode: PreviewMode;
  onMode: (mode: PreviewMode) => void;
  open: readonly number[];
  rings: Ring[];
  strings: NeckString[];
}

// One neck, in the spot you're playing: your chord stays ringed with the solo material around it.
export function PathPreview({ keyName, details, mode, onMode, open, rings, strings }: PathPreviewProps) {
  const region = mode === "pentatonic" ? details.solo : mode === "scale" ? details.scale : null;
  const inRegion = new Set(region?.notes.map((n) => `${n.string}:${n.fret}`));
  const markers: NeckMarker[] =
    mode === "triads"
      ? // Two triads can share a note, and the neck draws one marker per spot.
        [
          ...new Map(
            details.triads
              .flatMap((t) => t.triad.tones)
              .reverse()
              .map((tone) => [
                `${tone.string}:${tone.fret}`,
                {
                  string: tone.string,
                  fret: tone.fret,
                  label: tone.role === "R" ? "" : tone.role,
                  kind: tone.role === "R" ? ("tonic" as const) : ("tone" as const),
                  inWindow: true,
                },
              ]),
          ).values(),
        ]
      : neckNotes(keyName, VIEWS[mode], open).map((n) => ({
          string: n.string,
          fret: n.fret,
          label: n.kind === "tonic" ? "" : n.label,
          kind: n.kind,
          inWindow: inRegion.has(`${n.string}:${n.fret}`),
        }));
  const caption = region
    ? regionLine(region)
    : details.triads.length > 0
      ? details.triads.map((t) => t.name).join(" and ") + " triads"
      : "No major or minor triad inside this chord";
  return (
    <section aria-label="Preview on the neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
      <Neck
        markers={markers}
        windowLow={region?.lowFret}
        windowHigh={region?.highFret}
        ariaLabel={`Your chord on the neck with ${caption}`}
        rings={rings}
        strings={strings}
      />
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Preview" className="mx-1 flex overflow-hidden rounded-full border-[1.5px] border-text-primary lg:mx-0">
          {MODES.map(({ id, label }, i) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => onMode(id)}
              className={`min-h-11 flex-1 px-3 font-display text-[15px] font-semibold lg:px-[18px] ${i > 0 ? "border-l-[1.5px] border-text-primary" : ""} ${
                mode === id ? "bg-accent text-accent-on" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p data-caption className="text-center text-[13px] font-semibold lg:text-sm">
          {caption}
        </p>
      </div>
    </section>
  );
}
