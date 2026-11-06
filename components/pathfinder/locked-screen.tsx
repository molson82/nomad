"use client";

import Link from "next/link";
import { Neck } from "@/components/fretboard/neck";
import { useLinked, useToolKey } from "@/lib/key-state/hooks";
import { keysFor } from "@/lib/pathfinder/paths";
import { highlightFrets, lockedVoicing, type Lock } from "@/lib/pathfinder/state";
import { chordNames, noteList } from "@/lib/theory/chord-names";
import { circleKeyFor } from "@/lib/theory/circle";
import { useTuning } from "@/lib/tuning/use-tuning";
import { keyTitle } from "./key-card";

const LINKS = [
  { href: "/chords/", title: "Chord Compass", line: (name: string, key: string) => `${name} among the ${key} shapes`, ink: "text-[#A8341A] dark:text-[#ffb59e]" },
  { href: "/scales/", title: "Scale Compass", line: (name: string, key: string) => `${name} inside the ${key} scale`, ink: "text-[#0B6E66] dark:text-[#7fe0d6]" },
];

export function LockedScreen({ lock, onReset }: { lock: Lock; onReset: () => void }) {
  const [linked] = useLinked("circle");
  const [sharedKey] = useToolKey("circle");
  const [tuning] = useTuning();
  const key = linked ? sharedKey : lock.key;
  const voicing = lockedVoicing(lock, key);
  const circleKey = circleKeyFor(key);
  const names = chordNames(voicing, circleKey);
  const name = names[0]?.text ?? noteList(voicing, null, circleKey).join(" · ");
  const role = keysFor(voicing, names[0] ?? null).find((k) => k.key === key)?.role;
  const title = keyTitle(key);
  const notes = highlightFrets(lock, key, tuning).flatMap((fret, string) => (fret === null ? [] : [{ string, fret }]));

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Locked in" className="flex items-center justify-between gap-3 rounded-3xl bg-accent px-4 py-3.5 text-accent-on">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-bold uppercase tracking-[0.08em]">Locked in</p>
          <p className="font-display text-4xl font-semibold leading-tight">{name}</p>
          <p className="text-sm font-semibold">
            {role ? `${role} in ${title}` : `In ${title}`}
            {linked ? " · all tools linked" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 flex-shrink-0 rounded-full border-[1.5px] border-accent-on px-[18px] font-display text-base font-semibold"
        >
          Reset
        </button>
      </section>

      <section aria-label="Your chord on the neck" className="rounded-[20px] border-2 border-accent bg-surface p-2 md:p-3">
        <Neck
          markers={notes.map((n) => ({ ...n, label: "", kind: "chosen", inWindow: true }))}
          ariaLabel={`${name} on the neck`}
        />
      </section>

      <section aria-labelledby="where-next" className="flex flex-col gap-2">
        <h2 id="where-next" className="mt-1 font-display text-lg font-semibold uppercase tracking-[0.06em]">
          See where it lives
        </h2>
        {LINKS.map(({ href, title: tool, line, ink }) => (
          <Link key={href} href={href} className="flex min-h-16 items-center justify-between rounded-[18px] border border-border bg-surface px-3.5 py-2.5">
            <span className="flex flex-col">
              <span className="font-display text-lg font-semibold">{tool}</span>
              <span className="text-[13px] text-text-secondary">{line(name, title)}</span>
            </span>
            <span aria-hidden className={`text-[22px] ${ink}`}>
              →
            </span>
          </Link>
        ))}
      </section>

      <p className="text-[13px] leading-relaxed text-text-secondary">
        Reset clears your chord and its highlight, and removes the link lock-in created. Tools stay in their current key.
      </p>
    </div>
  );
}
