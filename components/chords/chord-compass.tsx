"use client";

import { nearestShape } from "@/lib/chords/shape-store";
import { useSelectedShape } from "@/lib/chords/use-selected-shape";
import { useToolKey } from "@/lib/key-state/hooks";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones, triad } from "@/lib/theory/fretboard";
import { stepNote } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { FocusCard } from "./focus-card";
import { NeckOverview } from "./neck-overview";
import { RootPicker } from "./root-picker";
import { ShapeChips } from "./shape-chips";

export function ChordCompass() {
  const [root, setRoot] = useToolKey("chords");
  const [shapeName, setShapeName] = useSelectedShape();
  const shapes = cagedShapes(root);
  const index = shapes.findIndex((s) => s.name === shapeName);
  const shape = shapes[index];
  const chordName = `${formatNote(triad(root)[0])} major`;
  const chips = <ShapeChips shapes={shapes} selected={shapeName} onSelect={setShapeName} />;

  const stepShape = (direction: 1 | -1) => {
    const next = shapes[index + direction];
    if (next) setShapeName(next.name);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Chord Compass
      </h1>
      <div className="flex flex-col gap-3 md:gap-5">
        <RootPicker root={root} quality="major" onStep={(direction) => setRoot(stepNote(root, direction))} />
        <section aria-label="Whole neck" className="flex flex-col gap-2 rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
          <NeckOverview
            tones={chordTones(root)}
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
