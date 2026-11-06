"use client";

import { ChordDiagram } from "@/components/chords/chord-diagram";
import { Neck } from "@/components/fretboard/neck";
import { usePathfinder } from "@/lib/pathfinder/hooks";
import { chordsToTry, keysFor, type TryChord } from "@/lib/pathfinder/paths";
import { chordNames, noteList, voicingOf } from "@/lib/theory/chord-names";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { useTuning } from "@/lib/tuning/use-tuning";
import { keyTitle } from "./key-card";

interface TryScreenProps {
  keyName: Note;
  chord: TryChord;
  onChord: (chord: TryChord) => void;
  onBack: () => void;
}

// A preview only: nothing here is saved or sent to the other tools.
export function TryScreen({ keyName, chord, onChord, onBack }: TryScreenProps) {
  const [{ frets }] = usePathfinder();
  const [tuning] = useTuning();
  const voicing = voicingOf(frets, tuning)!;
  const primary = chordNames(voicing, circleKeyFor(keyName))[0] ?? null;
  const yours = primary?.text ?? noteList(voicing, null).join(" · ");
  const degree = keysFor(voicing, primary).find((k) => k.key === keyName)?.degree ?? null;
  const chords = chordsToTry(keyName, degree, primary?.root ?? null, frets, tuning);
  const shape = chord.shape!;
  const range = shape.lowFret === shape.highFret ? `fret ${shape.lowFret}` : `frets ${shape.lowFret}–${shape.highFret}`;
  const yourNotes = frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret, dashed: true }]));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-accent-ink">Trying · in {keyTitle(keyName)}</p>
          <p className="font-display text-4xl font-semibold leading-tight">
            {chord.name} <span className="text-xl text-text-secondary">{chord.role}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 flex-shrink-0 rounded-full border-[1.5px] border-text-primary px-3.5 font-display text-[15px] font-semibold"
        >
          Back to {yours}
        </button>
      </div>

      <section aria-label={`${chord.name} on the neck, with your ${yours} as a dashed outline`} className="flex flex-col gap-1.5 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
        <Neck
          markers={shape.tones.map((t) => ({ string: t.string, fret: t.fret, label: "", kind: "chosen", inWindow: true }))}
          ariaLabel={`${chord.name} at ${range}`}
          rings={yourNotes}
        />
        <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-3 rounded-full border-[1.5px] border-text-primary bg-pathfinder" />
            {`${chord.name}, ${range}`}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-3 rounded-full border-2 border-dashed border-pathfinder" />
            {`Your ${yours}`}
          </span>
        </div>
      </section>

      <section aria-label={`${chord.name} chord diagram`} className="flex justify-center rounded-[22px] border border-border bg-surface p-2.5">
        <div className="w-full max-w-[232px] lg:max-w-[300px]">
          <ChordDiagram shape={shape} chordName={chord.name} ariaLabel={`${chord.name}, ${shape.label}, ${range}`} />
        </div>
      </section>

      <section aria-labelledby="try-heading" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface px-3.5 py-3">
        <h2 id="try-heading" className="font-display text-base font-semibold uppercase tracking-[0.06em]">
          Chords to try
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(52px,1fr))] gap-1.5">
          {chords.map((c) => {
            const active = c.name === chord.name;
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={active}
                disabled={!c.shape}
                onClick={() => (active ? onBack() : onChord(c))}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-[1.5px] border-text-primary disabled:border-text-tertiary disabled:text-text-tertiary ${
                  active ? "bg-accent text-accent-on" : ""
                }`}
              >
                <span className="font-display text-lg font-semibold leading-tight">{c.name}</span>{" "}
                <span className="text-[11px] font-semibold">{c.role}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
