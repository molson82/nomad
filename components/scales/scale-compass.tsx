"use client";

import { FocusCard } from "@/components/fretboard/focus-card";
import { FretDiagram } from "@/components/fretboard/fret-diagram";
import { Neck } from "@/components/fretboard/neck";
import { PositionChips } from "@/components/fretboard/position-chips";
import { nearestByCentre } from "@/lib/chords/neck-geometry";
import { useToolKey } from "@/lib/key-state/hooks";
import { formulaLine, positionText } from "@/lib/scales/position-text";
import { useScaleView } from "@/lib/scales/use-scale-view";
import { STRING_ORDINALS } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { neckNotes, positions, scaleName, type PositionLetter } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";
import { ScaleHeader } from "./scale-header";
import { ViewToggles } from "./view-toggles";

export function ScaleCompass() {
  const [root, setRoot] = useToolKey("scales");
  const [state, update] = useScaleView();
  const view = { tonality: state.tonality, type: state.type };
  const all = positions(root, view);
  const index = Math.max(0, all.findIndex((p) => p.letter === state.position));
  const position = all[index];
  const text = positionText(position, view);
  const name = scaleName(root, view);
  const range = `frets ${position.lowFret} to ${position.highFret}`;
  const inWindow = new Set(position.notes.map((n) => `${n.string}:${n.fret}`));
  const previous = all[index - 1];
  const next = all[index + 1];

  const chips = (
    <PositionChips
      groupLabel="Positions up the neck"
      items={all.map((p) => {
        const t = positionText(p, view);
        return { id: p.letter, label: t.chipLabel, sub: `${p.lowFret}–${p.highFret}`, ariaLabel: t.ariaLabel };
      })}
      selected={position.letter}
      onSelect={(id) => update({ position: id as PositionLetter })}
    />
  );

  const stepPosition = (direction: 1 | -1) => {
    const target = all[index + direction];
    if (target) update({ position: target.letter });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Scale Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <ScaleHeader root={root} view={view} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <ViewToggles view={view} onChange={update} />
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <Neck
            markers={neckNotes(root, view).map((n) => ({
              string: n.string,
              fret: n.fret,
              label: n.kind === "tonic" ? "" : n.label,
              kind: n.kind,
              inWindow: inWindow.has(`${n.string}:${n.fret}`),
            }))}
            windowLow={position.lowFret}
            windowHigh={position.highFret}
            ariaLabel={`${name} across the neck, ${text.name} at ${range}`}
            onPickFret={(fret) => update({ position: nearestByCentre(all, fret).letter })}
          />
          <div className="xl:hidden">{chips}</div>
        </section>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="hidden xl:flex xl:w-[400px] xl:shrink-0 xl:flex-col xl:gap-3.5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em]">Positions</h2>
            {chips}
            <p className="text-sm leading-relaxed text-text-secondary">
              Five positions up the neck, in the same regions as the Chord Compass&apos;s CAGED shapes. Click the
              neck to jump to the position under the pointer.
            </p>
          </div>
          <FocusCard
            regionLabel={text.ariaLabel}
            title={text.title}
            subtitle={text.subtitle}
            previousLabel={previous ? `Previous position: ${positionText(previous, view).shortName}` : "Previous position"}
            nextLabel={next ? `Next position: ${positionText(next, view).shortName}` : "Next position"}
            canPrevious={!!previous}
            canNext={!!next}
            count={all.length}
            index={index}
            onStep={stepPosition}
            footer={formulaLine(root, view)}
          >
            <FretDiagram
              markers={position.notes.map((n) => ({
                string: n.string,
                fret: n.fret,
                label: n.kind === "tonic" ? "" : n.label,
                kind: n.kind,
                srText: `${STRING_ORDINALS[n.string]} string, fret ${n.fret}, ${formatNote(n.note)}, ${n.label}`,
              }))}
              lowFret={position.lowFret}
              highFret={position.highFret}
              ariaLabel={`${name}, ${text.name}, ${range}`}
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
