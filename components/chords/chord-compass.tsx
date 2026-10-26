"use client";

import { useRef } from "react";
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";
import { InfoButton } from "@/components/notes/info-button";
import { cagedNote } from "@/lib/notes/chord-notes";
import { useProgression } from "@/lib/circle/use-progression";
import { progressionSteps } from "@/lib/chords/progression-chords";
import { switchQualityShape, type SwitchMemo } from "@/lib/chords/quality-store";
import { nearestShape, shapeNear } from "@/lib/chords/shape-store";
import { useChordQuality } from "@/lib/chords/use-chord-quality";
import { useProgressionStep } from "@/lib/chords/use-progression-step";
import { useSelectedShape } from "@/lib/chords/use-selected-shape";
import { useToolKey } from "@/lib/key-state/hooks";
import { cagedShapesFor } from "@/lib/theory/caged";
import { TUNING, chordTonesFor, triad, type Quality } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { FocusCard } from "./focus-card";
import { NeckOverview } from "./neck-overview";
import { TriadControls } from "./triad-controls";
import { TriadFocusCard, triadTitle } from "./triad-focus-card";
import { resolveTriad, selectionFor } from "@/lib/chords/triad-store";
import { useTriadSelection } from "@/lib/chords/use-triad-selection";
import { nearestByCentre } from "@/lib/chords/neck-geometry";
import { INVERSIONS, STRING_SETS, countTriads, triadsOn, type StringSet } from "@/lib/theory/triads";
import { isUniform, openPitches, pitchName } from "@/lib/theory/tuning";
import { useTuning } from "@/lib/tuning/use-tuning";
import { TuningPill } from "@/components/tuning/tuning-pill";
import { ProgressionStrip } from "./progression-strip";
import { RootPicker } from "./root-picker";
import { ShapeChips } from "./shape-chips";

export function ChordCompass() {
  const [root, setRoot] = useToolKey("chords");
  const [quality, setQuality] = useChordQuality();
  const lastSwitch = useRef<SwitchMemo>(null);
  const [progression] = useProgression();
  const steps = progressionSteps(root, progression.degrees);
  const [step, setStep] = useProgressionStep(steps);
  const current = step === null ? null : steps[step];
  // A progression chord (always major or minor here) replaces the key chord.
  const chord = current ? current.notes : triad(root, quality);
  const chordQuality: Quality = current?.quality ?? quality;
  const [tuning] = useTuning();
  const open = openPitches(tuning);
  // CAGED shapes only hold when every string moved by the same amount; otherwise show triads.
  const byShape = isUniform(tuning);
  const strings = open.map((pitch, s) => ({ name: pitchName(pitch), changed: tuning[s] !== 0 }));
  const [shapeName, setShapeName] = useSelectedShape();
  // In other tunings the CAGED templates don't land on chord tones, so they stay on standard (unshown) there.
  const shapeOpen = byShape ? open : TUNING;
  const shapes = cagedShapesFor(chord, chordQuality, shapeOpen);
  const index = shapes.findIndex((s) => s.name === shapeName);
  const shape = shapes[index];
  const chordName = `${formatNote(chord[0])} ${chordQuality}`;
  const [triadSelection, setTriadSelection] = useTriadSelection();
  const counts = countTriads(chord, chordQuality, open);
  const playable = (set: StringSet) => INVERSIONS.some((i) => counts[set][i] > 0);
  // A stored set with nothing playable (an odd custom tuning) falls back to the first that has triads.
  const triadSet = playable(triadSelection.set) ? triadSelection.set : (STRING_SETS.find(playable) ?? triadSelection.set);
  const triads = byShape ? [] : triadsOn(chord, chordQuality, open, triadSet);
  const triadNow = resolveTriad(triads, { ...triadSelection, set: triadSet });
  const triadIndex = triadNow ? triads.indexOf(triadNow) : -1;
  const pickTriadSet = (set: StringSet) =>
    setTriadSelection({ set, inversion: triadSelection.inversion, centre: triadNow ? selectionFor(triadNow).centre : null });
  const pickInversion = (inversion: (typeof INVERSIONS)[number]) => {
    const lowest = triads.find((t) => t.inversion === inversion);
    setTriadSelection(lowest ? selectionFor(lowest) : { set: triadSet, inversion, centre: null });
  };
  const stepTriad = (direction: 1 | -1) => {
    const target = triads[triadIndex + direction];
    if (target) setTriadSelection(selectionFor(target));
  };
  const triadTones = [...new Map(triads.flatMap((t) => t.tones).map((t) => [`${t.string}:${t.fret}`, t])).values()];

  const chips = byShape ? (
    <ShapeChips shapes={shapes} selected={shapeName} onSelect={setShapeName} />
  ) : (
    <TriadControls
      set={triadSet}
      inversion={triadNow?.inversion ?? triadSelection.inversion}
      quality={chordQuality}
      available={counts}
      strings={strings.map((s) => s.name)}
      onSet={pickTriadSet}
      onInversion={pickInversion}
    />
  );

  const stepShape = (direction: 1 | -1) => {
    const next = shapes[index + direction];
    if (next) setShapeName(next.name);
  };

  // Moving to another chord keeps the window in the same region of the neck.
  const goTo = (next: number | null, keyQuality: Quality = quality) => {
    const target = next === null ? cagedShapesFor(triad(root, keyQuality), keyQuality, shapeOpen) : cagedShapesFor(steps[next].notes, steps[next].quality!, shapeOpen);
    lastSwitch.current = null;
    setShapeName(shapeNear(target, shape));
    setStep(next);
  };

  const switchQuality = (next: Quality) => {
    if (current) {
      setQuality(next);
      goTo(null, next);
      return;
    }
    if (next === quality) return;
    const result = switchQualityShape(root, quality, shape.name, next, lastSwitch.current);
    lastSwitch.current = result.memo;
    setShapeName(result.name);
    setQuality(next);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Chord Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <RootPicker root={root} quality={quality} step={current} onStep={(direction) => setRoot(stepNote(root, direction))} />
        <div className="flex">
          <MajorMinorToggle value={current ? null : quality} onChange={switchQuality} />
        </div>
        {steps.length > 0 && <ProgressionStrip steps={steps} selected={step} onSelect={(next) => goTo(next)} />}
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <TuningPill />
          {byShape ? (
            <NeckOverview
              tones={chordTonesFor(chord, chordQuality, open)}
              window={{ ...shape, label: `${shape.label}-shape` }}
              chordName={chordName}
              onPickFret={(fret) => setShapeName(nearestShape(shapes, fret))}
              strings={strings}
            />
          ) : (
            <NeckOverview
              tones={triadTones}
              window={triadNow ? { ...triadNow, label: triadTitle(triadNow) } : { tones: [], lowFret: 0, highFret: 0, label: "no triad" }}
              chordName={chordName}
              onPickFret={(fret) => triads.length > 0 && setTriadSelection(selectionFor(nearestByCentre(triads, fret)))}
              strings={strings}
            />
          )}
          <div className="xl:hidden">{chips}</div>
        </section>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="hidden xl:flex xl:w-[400px] xl:shrink-0 xl:flex-col xl:gap-3.5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em]">{byShape ? "CAGED shapes" : "Triads"}</h2>
            {chips}
            <p className="text-sm leading-relaxed text-text-secondary">
              {byShape
                ? "Shapes run up the neck in CAGED order, each sharing a root with the next. Click the neck to jump to the shape under the pointer."
                : "This tuning moves the strings apart unevenly, so CAGED shapes don't apply. Pick three strings and an inversion; every playable triad is on the neck."}
            </p>
          </div>
          {byShape ? (
            <FocusCard
              shape={shape}
              shapes={shapes}
              chordName={chordName}
              onStep={stepShape}
              info={<InfoButton label="About CAGED shapes" note={cagedNote(chord, chordQuality, shapes)} />}
            />
          ) : triadNow ? (
            <TriadFocusCard triad={triadNow} triads={triads} chordName={chordName} onStep={stepTriad} />
          ) : (
            <p className="rounded-[22px] border border-border bg-surface p-4 text-sm text-text-secondary">
              No triad of {chordName} fits within four frets on any three strings in this tuning.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
