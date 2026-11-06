import type { Metadata } from "next";
import { PathfinderPage } from "@/components/pathfinder/pathfinder-page";

export const metadata: Metadata = { title: "Pathfinder" };

export default function Pathfinder() {
  return <PathfinderPage />;
}
