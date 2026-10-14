import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/key/tool-placeholder";

export const metadata: Metadata = { title: "Scale Compass" };

export default function ScalesPage() {
  return <ToolPlaceholder tool="scales" blurb="Scale patterns, intervals and relative minors." />;
}
