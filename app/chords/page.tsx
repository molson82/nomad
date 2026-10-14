import type { Metadata } from "next";
import { ChordCompass } from "@/components/chords/chord-compass";

export const metadata: Metadata = { title: "Chord Compass" };

export default function ChordsPage() {
  return <ChordCompass />;
}
