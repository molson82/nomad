"use client";

import { useState } from "react";
import { usePathfinder } from "@/lib/pathfinder/hooks";
import type { TryChord } from "@/lib/pathfinder/paths";
import { canBuildPath } from "@/lib/pathfinder/state";
import type { Note } from "@/lib/theory/notes";
import { useTuning } from "@/lib/tuning/use-tuning";
import { BuildScreen } from "./build-screen";
import { KeysScreen } from "./keys-screen";
import { TryScreen } from "./try-screen";

export function PathfinderPage() {
  const [{ frets }] = usePathfinder();
  const [tuning] = useTuning();
  const [building, setBuilding] = useState(true);
  const [trying, setTrying] = useState<{ key: Note; chord: TryChord } | null>(null);
  const [lastKey, setLastKey] = useState<Note | undefined>();

  let screen;
  if (building || !canBuildPath(frets, tuning)) {
    screen = (
      <BuildScreen
        onBuild={() => {
          setLastKey(undefined);
          setBuilding(false);
        }}
      />
    );
  } else if (trying) {
    screen = (
      <TryScreen
        keyName={trying.key}
        chord={trying.chord}
        onChord={(chord) => setTrying({ key: trying.key, chord })}
        onBack={() => {
          setLastKey(trying.key);
          setTrying(null);
        }}
      />
    );
  } else {
    screen = <KeysScreen initialKey={lastKey} onEdit={() => setBuilding(true)} onTry={(key, chord) => setTrying({ key, chord })} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="sr-only font-display text-4xl font-semibold uppercase leading-none tracking-[0.04em] md:not-sr-only md:mb-6">
        Pathfinder
      </h1>
      {screen}
    </div>
  );
}
