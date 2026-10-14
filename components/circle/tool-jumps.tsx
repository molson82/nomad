import Link from "next/link";
import { nextPlayable, progressionSteps } from "@/lib/chords/progression-chords";
import { openChordsAt, openScalesIn } from "@/lib/circle/jumps";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

const JUMP = "flex min-h-[52px] items-center justify-between rounded-2xl px-4";

export function ToolJumps({ root, degrees }: { root: Note; degrees: readonly number[] }) {
  const steps = progressionSteps(root, degrees);
  const first = nextPlayable(steps, null, 1);
  const keyName = formatNote(majorScale(circleKeyFor(root))[0]);
  return (
    <nav aria-label="Open in another tool" className="flex flex-col gap-2">
      {first !== null && (
        <Link href="/chords/" onClick={() => openChordsAt(root, first)} className={`${JUMP} bg-ink text-white`}>
          <span className="flex flex-col">
            <span className="font-display text-lg font-semibold">See on the neck</span>
            <span className="text-xs font-semibold text-decoder">
              Chord Compass · {steps.map((s) => s.name).join(" · ")}
            </span>
          </span>
          <span aria-hidden className="text-[22px] text-decoder">→</span>
        </Link>
      )}
      <Link href="/scales/" onClick={() => openScalesIn(root)} className={`${JUMP} border-[1.5px] border-text-primary text-text-primary`}>
        <span className="flex flex-col">
          <span className="font-display text-lg font-semibold">Scale for {keyName} major</span>
          <span className="text-xs font-semibold text-text-secondary">Scale Compass</span>
        </span>
        <span aria-hidden className="text-[22px]">→</span>
      </Link>
    </nav>
  );
}
