import { FretDiagram } from "@/components/fretboard/fret-diagram";
import type { CagedShape } from "@/lib/theory/caged";
import { STRING_ORDINALS, type Role } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";

const ROLE_NAME: Record<Role, string> = { R: "root", "♭3": "flat 3rd", "3": "3rd", "5": "5th" };

export function ChordDiagram({ shape, chordName }: { shape: CagedShape; chordName: string }) {
  return (
    <FretDiagram
      markers={shape.tones.map((t) => ({
        string: t.string,
        fret: t.fret,
        label: t.role === "R" ? "" : t.role,
        kind: t.role === "R" ? "tonic" : "tone",
        noteName: formatNote(t.note),
        srText: `${STRING_ORDINALS[t.string]} string, fret ${t.fret}, ${formatNote(t.note)}, ${ROLE_NAME[t.role]}`,
      }))}
      lowFret={shape.lowFret}
      highFret={shape.highFret}
      ariaLabel={`${chordName}, ${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
      showMuted
      openStyle="hollow"
      showNoteNames
    />
  );
}
