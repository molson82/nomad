import type { Metadata } from "next";
import { CircleOfFifths } from "@/components/circle/circle-of-fifths";

export const metadata: Metadata = { title: "Circle of Fifths" };

export default function CirclePage() {
  return <CircleOfFifths />;
}
