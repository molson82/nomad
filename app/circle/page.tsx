import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/key/tool-placeholder";

export const metadata: Metadata = { title: "Circle of Fifths" };

export default function CirclePage() {
  return <ToolPlaceholder tool="circle" blurb="Keys, chords and progressions around the wheel." />;
}
