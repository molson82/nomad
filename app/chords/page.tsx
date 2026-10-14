import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/key/tool-placeholder";

export const metadata: Metadata = { title: "Chord Compass" };

export default function ChordsPage() {
  return <ToolPlaceholder tool="chords" blurb="Chord shapes and CAGED positions across the neck." />;
}
