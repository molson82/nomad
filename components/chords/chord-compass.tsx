"use client";

import { useRef } from "react";
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";
import { useProgression } from "@/lib/circle/use-progression";
import { progressionSteps } from "@/lib/chords/progression-chords";
import { switchQualityShape, type SwitchMemo } from "@/lib/chords/quality-store";
import { nearestShape, shapeNear } from "@/lib/chords/shape-store";
import { useChordQuality } from "@/lib/chords/use-chord-quality";
import { useProgressionStep } from "@/lib/chords/use-progression-step";
import { useSelectedShape } from "@/lib/chords/use-selected-shape";
import { useToolKey } from "@/lib/key-state/hooks";
import { cagedShapesFor } from "@/lib/theory/caged";
import { chordTonesFor, triad, type Quality } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { FocusCard } from "./focus-card";
import { NeckOverview } from "./neck-overview";
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
  const [shapeName, setShapeName] = useSelectedShape();
  const shapes = cagedShapesFor(chord, chordQuality);
  const index = shapes.findIndex((s) => s.name === shapeName);
  const shape = shapes[index];
  const chordName = `${formatNote(chord[0])} ${chordQuality}`;
  const chips = <ShapeChips shapes={shapes} selected={shapeName} onSelect={setShapeName} />;

  const stepShape = (direction: 1 | -1) => {
    const next = shapes[index + direction];
    if (next) setShapeName(next.name);
  };

  // Moving to another chord keeps the window in the same region of the neck.
  const goTo = (next: number | null, keyQuality: Quality = quality) => {
    const target = next === null ? cagedShapesFor(triad(root, keyQuality), keyQuality) : cagedShapesFor(steps[next].notes, steps[next].quality!);
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
          <NeckOverview
            tones={chordTonesFor(chord, chordQuality)}
            shape={shape}
            chordName={chordName}
            onPickFret={(fret) => setShapeName(nearestShape(shapes, fret))}
          />
          <div className="xl:hidden">{chips}</div>
        </section>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="hidden xl:flex xl:w-[400px] xl:shrink-0 xl:flex-col xl:gap-3.5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em]">CAGED shapes</h2>
            {chips}
            <p className="text-sm leading-relaxed text-text-secondary">
              Shapes run up the neck in CAGED order, each sharing a root with the next. Click the neck to jump
              to the shape under the pointer.
            </p>
          </div>
          <FocusCard shape={shape} shapes={shapes} chordName={chordName} onStep={stepShape} />
        </div>
      </div>
    </div>
  );
}
