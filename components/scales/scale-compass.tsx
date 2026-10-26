"use client";

import { FocusCard } from "@/components/fretboard/focus-card";
import { InfoButton } from "@/components/notes/info-button";
import { pentatonicNote } from "@/lib/notes/scale-notes";
import { FretDiagram } from "@/components/fretboard/fret-diagram";
import { Neck } from "@/components/fretboard/neck";
import { PositionChips } from "@/components/fretboard/position-chips";
import { nearestByCentre } from "@/lib/chords/neck-geometry";
import { useToolKey } from "@/lib/key-state/hooks";
import { formulaLine, positionText } from "@/lib/scales/position-text";
import { useScaleView } from "@/lib/scales/use-scale-view";
import { useScaleWindow } from "@/lib/scales/use-scale-window";
import { FRET_WINDOWS, notesInWindow } from "@/lib/scales/window-store";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { neckNotes, positions, scaleName, type PositionLetter, type ScaleNote } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";
import { isUniform, openPitches, pitchName, tuningName } from "@/lib/theory/tuning";
import { useTuning } from "@/lib/tuning/use-tuning";
import { TuningPill } from "@/components/tuning/tuning-pill";
import { ScaleHeader } from "./scale-header";
import { ViewToggles } from "./view-toggles";

// What the chips, neck band and focus card show: CAGED positions or boxes when the tuning keeps
// standard intervals, otherwise fixed fret windows.
type Region = {
  id: string;
  lowFret: number;
  highFret: number;
  notes: ScaleNote[];
  chipLabel: string;
  chipSub: string;
  ariaLabel: string; // the chip
  regionLabel: string; // the focus card
  name: string; // for the neck and diagram labels
  shortName: string; // for the ‹ › labels
  title: string;
  subtitle: string;
};

export function ScaleCompass() {
  const [root, setRoot] = useToolKey("scales");
  const [state, update] = useScaleView();
  const [windowIndex, setWindowIndex] = useScaleWindow();
  const [tuning] = useTuning();
  const open = openPitches(tuning);
  const byPosition = isUniform(tuning);
  const view = { tonality: state.tonality, type: state.type };
  const name = scaleName(root, view);
  const notes = neckNotes(root, view, open);

  const regions: Region[] = byPosition
    ? positions(root, view, open).map((p) => {
        const t = positionText(p, view);
        return { id: p.letter, lowFret: p.lowFret, highFret: p.highFret, notes: p.notes, chipLabel: t.chipLabel, chipSub: `${p.lowFret}–${p.highFret}`, ariaLabel: t.ariaLabel, regionLabel: t.ariaLabel, name: t.name, shortName: t.shortName, title: t.title, subtitle: t.subtitle };
      })
    : FRET_WINDOWS.map(([low, high], i) => ({
        id: String(i),
        lowFret: low,
        highFret: high,
        notes: notesInWindow(notes, [low, high]),
        chipLabel: `${low}–${high}`,
        chipSub: low === 0 ? "open" : "",
        ariaLabel: `Frets ${low} to ${high}`,
        regionLabel: `Frets ${low}–${high}, ${name} in ${tuningName(tuning)}`,
        name: `frets ${low} to ${high}`,
        shortName: `frets ${low}–${high}`,
        title: `Frets ${low}–${high}`,
        subtitle: `${name} in ${tuningName(tuning)}`,
      }));
  const selectedId = byPosition ? state.position : String(windowIndex);
  const index = Math.max(0, regions.findIndex((r) => r.id === selectedId));
  const region = regions[index];
  const select = (id: string) => (byPosition ? update({ position: id as PositionLetter }) : setWindowIndex(Number(id)));
  const range = `frets ${region.lowFret} to ${region.highFret}`;
  const inWindow = new Set(region.notes.map((n) => `${n.string}:${n.fret}`));
  const previous = regions[index - 1];
  const next = regions[index + 1];

  const chips = (
    <PositionChips
      groupLabel={byPosition ? "Positions up the neck" : "Frets up the neck"}
      items={regions.map((r) => ({ id: r.id, label: r.chipLabel, sub: r.chipSub, ariaLabel: r.ariaLabel }))}
      selected={region.id}
      onSelect={select}
    />
  );

  const stepRegion = (direction: 1 | -1) => {
    const target = regions[index + direction];
    if (target) select(target.id);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Scale Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <ScaleHeader root={root} view={view} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <ViewToggles
          view={view}
          onChange={update}
          info={<InfoButton label="About pentatonic and blues" note={pentatonicNote(root, view.tonality)} />}
        />
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <TuningPill />
          <Neck
            markers={notes.map((n) => ({
              string: n.string,
              fret: n.fret,
              label: n.kind === "tonic" ? "" : n.label,
              kind: n.kind,
              inWindow: inWindow.has(`${n.string}:${n.fret}`),
            }))}
            windowLow={region.lowFret}
            windowHigh={region.highFret}
            ariaLabel={`${name} across the neck, ${region.name} at ${range}`}
            onPickFret={(fret) => select(nearestByCentre(regions, fret).id)}
            strings={open.map((pitch, s) => ({ name: pitchName(pitch), changed: tuning[s] !== 0 }))}
          />
          <div className="xl:hidden">{chips}</div>
        </section>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="hidden xl:flex xl:w-[400px] xl:shrink-0 xl:flex-col xl:gap-3.5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em]">{byPosition ? "Positions" : "Fret windows"}</h2>
            {chips}
            <p className="text-sm leading-relaxed text-text-secondary">
              {byPosition
                ? "Five positions up the neck, in the same regions as the Chord Compass's CAGED shapes. Click the neck to jump to the position under the pointer."
                : "This tuning moves the strings apart unevenly, so the CAGED positions don't apply. Five overlapping windows show the key's notes instead. Click the neck to jump to the window under the pointer."}
            </p>
          </div>
          <FocusCard
            regionLabel={region.regionLabel}
            title={region.title}
            subtitle={region.subtitle}
            previousLabel={previous ? `Previous position: ${previous.shortName}` : "Previous position"}
            nextLabel={next ? `Next position: ${next.shortName}` : "Next position"}
            canPrevious={!!previous}
            canNext={!!next}
            count={regions.length}
            index={index}
            onStep={stepRegion}
            footer={formulaLine(root, view)}
          >
            <FretDiagram
              markers={region.notes.map((n) => ({
                string: n.string,
                fret: n.fret,
                label: n.kind === "tonic" ? "" : n.label,
                kind: n.kind,
                srText: `${STRING_ORDINALS[n.string]} string, fret ${n.fret}, ${formatNote(n.note)}, ${n.label}`,
              }))}
              lowFret={region.lowFret}
              highFret={region.highFret}
              ariaLabel={`${name}, ${region.name}, ${range}`}
              showMuted={false}
              openStyle="marker"
              showNoteNames={false}
            />
          </FocusCard>
        </div>
      </div>
    </div>
  );
}
