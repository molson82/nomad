import { chordLongName, chordName, type Chord } from "@/lib/theory/chords";

interface ProgressionTrayProps {
  keyChords: Chord[]; // diatonicChords(current key); index d-1 is degree d
  degrees: number[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function ProgressionTray({ keyChords, degrees, onRemove, onClear }: ProgressionTrayProps) {
  return (
    <section
      aria-labelledby="progression-heading"
      className="flex flex-col gap-3 rounded-[22px] border border-border bg-surface p-3.5 md:p-[18px]"
    >
      <div className="flex items-center justify-between">
        <h2 id="progression-heading" className="font-display text-lg font-semibold uppercase tracking-[0.06em] md:text-xl">
          Progression
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={degrees.length === 0}
          className="min-h-11 px-1 text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      {degrees.length > 0 ? (
        <ol aria-label="Progression chords" className="grid grid-cols-4 gap-2">
          {degrees.map((degree, i) => {
            const chord = keyChords[degree - 1];
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${chordLongName(chord)}, step ${i + 1}`}
                  className="flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-[14px] bg-ink text-white xl:min-h-[76px]"
                >
                  <span className="text-xs font-bold text-decoder">{chord.roman}</span>
                  <span className="font-display text-2xl font-semibold leading-none xl:text-[28px]">{chordName(chord)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-text-secondary">No chords yet — tap a chord or pick a progression.</p>
      )}
      <p className="text-[13px] text-text-secondary">Tap chords on the card to add · tap a chip to remove</p>
    </section>
  );
}
