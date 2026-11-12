"use client";

import { useMemo, useState } from "react";
import { lockInKey, usePathfinder } from "@/lib/pathfinder/hooks";
import { chordsToTry, keyDetails, keysFor, progressionFor, type TryChord } from "@/lib/pathfinder/paths";
import { chordNames, noteList, voicingOf } from "@/lib/theory/chord-names";
import type { Note } from "@/lib/theory/notes";
import { openPitches, stringLabels } from "@/lib/theory/tuning";
import { useTuning } from "@/lib/tuning/use-tuning";
import { KeyCard, keyTitle } from "./key-card";
import { PathPreview, regionLine, type PreviewMode } from "./path-preview";

interface KeysScreenProps {
  onEdit: () => void;
  onTry: (key: Note, chord: TryChord) => void;
  initialKey?: Note;
}

export function KeysScreen({ onEdit, onTry, initialKey }: KeysScreenProps) {
  const [{ frets }] = usePathfinder();
  const [tuning] = useTuning();
  const [mode, setMode] = useState<PreviewMode>("pentatonic");
  const voicing = voicingOf(frets, tuning)!;
  const names = chordNames(voicing);
  const primary = names[0] ?? null;
  const fits = keysFor(voicing, primary);
  const [picked, setPicked] = useState<Note>(initialKey ?? fits[0].key);
  const selected = fits.find((k) => k.key === picked) ?? fits[0];
  // keyDetails walks every position and triad, so work it out once per key, not on each mode or key tap.
  const allDetails = useMemo(
    () => new Map(fits.map((fit) => [fit.key, keyDetails(fit.key, frets, tuning)])),
    // `fits` follows from frets and tuning alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frets, tuning],
  );
  const details = allDetails.get(selected.key)!;
  const rings = frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret }]));
  const chordLabel = primary?.text ?? noteList(voicing, null).join(" · ");
  const heading =
    selected.fit === "near"
      ? `${chordLabel} fits no key: closest keys`
      : `${chordLabel} fits ${fits.length} key${fits.length === 1 ? "" : "s"}`;
  const toTry = chordsToTry(selected.key, selected.degree, primary?.root ?? null, frets, tuning);
  const progression = progressionFor(selected.key, selected.degree);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <p className={`font-display font-semibold leading-none ${primary ? "text-4xl" : "text-2xl"}`}>{chordLabel}</p>
          {names.length > 1 && (
            <p className="text-[13px] font-semibold text-text-secondary">
              also {names.slice(1).map((n) => n.text).join(", ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 flex-shrink-0 rounded-full border-[1.5px] border-text-primary px-3.5 font-display text-[15px] font-semibold"
        >
          Edit chord
        </button>
      </div>

      <PathPreview keyName={selected.key} details={details} mode={mode} onMode={setMode} open={openPitches(tuning)} rings={rings} strings={stringLabels(tuning)} />

      <h2 className="mt-1.5 font-display text-lg font-semibold uppercase tracking-[0.06em]">{heading}</h2>

      <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {fits.map((fit) => (
          <KeyCard
            key={fit.key}
            fit={fit}
            details={allDetails.get(fit.key)!}
            selected={fit.key === selected.key}
            onSelect={() => setPicked(fit.key)}
            rowSpan={fits.length}
          >
            <div className="flex flex-col gap-3">
              <dl className="m-0 grid grid-cols-[62px_1fr] gap-x-2 gap-y-1.5 text-[13px] leading-snug">
                <dt className="font-bold text-text-secondary">Scale</dt>
                <dd className="m-0 font-semibold">{regionLine(details.scale)}</dd>
                {details.triads.length > 0 && (
                  <>
                    <dt className="font-bold text-text-secondary">Triads</dt>
                    <dd className="m-0 flex flex-col font-semibold">
                      {details.triads.map((t) => (
                        <span key={t.label}>{t.label}</span>
                      ))}
                    </dd>
                  </>
                )}
                {details.usedIn && (
                  <>
                    <dt className="font-bold text-text-secondary">Used in</dt>
                    <dd className="m-0 font-semibold">{details.usedIn}</dd>
                  </>
                )}
              </dl>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <h3 className="font-display text-base font-semibold uppercase tracking-[0.06em]">Chords to try</h3>
                {progression && (
                  <p className="text-[13px] font-medium text-text-secondary">
                    <span className="font-semibold text-text-primary">{progression.chords.join(" – ")}</span> · {progression.name} progression
                  </p>
                )}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(52px,1fr))] gap-1.5">
                  {toTry.map((chord) => (
                    <button
                      key={chord.name}
                      type="button"
                      disabled={!chord.shape}
                      onClick={() => onTry(selected.key, chord)}
                      className="flex min-h-14 flex-col items-center justify-center rounded-xl border-[1.5px] border-text-primary disabled:border-text-tertiary disabled:text-text-tertiary"
                    >
                      <span className="font-display text-lg font-semibold leading-tight">{chord.name}</span>{" "}
                      <span className="text-[11px] font-semibold">{chord.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => lockInKey(selected.key, tuning)}
                className="min-h-[52px] rounded-full border-[1.5px] border-text-primary bg-accent font-display text-lg font-semibold uppercase tracking-[0.04em] text-accent-on"
              >
                Lock in {keyTitle(selected.key)}
              </button>
            </div>
          </KeyCard>
        ))}
      </div>
    </div>
  );
}
