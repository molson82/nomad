import type { Metadata } from "next";
import { ScaleCompass } from "@/components/scales/scale-compass";

export const metadata: Metadata = { title: "Scale Compass" };

export default function ScalesPage() {
  return <ScaleCompass />;
}
