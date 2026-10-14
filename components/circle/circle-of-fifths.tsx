"use client";

import { stepBadges } from "@/lib/circle/progression";
import { useProgression } from "@/lib/circle/use-progression";
import { useWheelRotation } from "@/lib/circle/use-wheel-rotation";
import { useToolKey } from "@/lib/key-state/hooks";
import { CIRCLE, circleKeyFor, describeKey, rootNoteFor } from "@/lib/theory/circle";
import { diatonicChords } from "@/lib/theory/chords";
import { CommonProgressions } from "./common-progressions";
import { DecoderCard } from "./decoder-card";
import { ProgressionTray } from "./progression-tray";

export function CircleOfFifths() {
  const [root, setRoot] = useToolKey("circle");
  const committedIndex = circleKeyFor(root).index;
  const { theta, displayIndex, step, wheelHandlers } = useWheelRotation({
    committedIndex,
    onCommit: (index) => setRoot(rootNoteFor(CIRCLE[index])),
  });
  const [progression, actions] = useProgression();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Phones already show the title in the header. */}
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Circle of Fifths
      </h1>
      <p aria-live="polite" className="sr-only">
        {describeKey(CIRCLE[committedIndex])}
      </p>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
        <DecoderCard
          keyIndex={displayIndex}
          theta={theta}
          wheelHandlers={wheelHandlers}
          badges={stepBadges(progression.degrees)}
          onAddChord={actions.add}
          onSwipe={step}
        />
        <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start xl:flex xl:min-w-0 xl:flex-1 xl:flex-col">
          <ProgressionTray
            keyChords={diatonicChords(CIRCLE[displayIndex])}
            degrees={progression.degrees}
            onRemove={actions.remove}
            onClear={actions.clear}
          />
          <CommonProgressions activeId={progression.presetId} onPick={actions.pick} />
        </div>
      </div>
    </div>
  );
}
