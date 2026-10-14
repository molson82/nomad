import type { LucideIcon } from "lucide-react";
import { Disc3, Guitar, Music } from "lucide-react";
import type { Tool } from "@/lib/tools";

export interface NavItemConfig {
  tool: Tool;
  href: string;
  label: string; // short: tab bar and sidebar
  title: string; // full: page heading and phone header
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { tool: "circle", href: "/circle/", label: "Circle", title: "Circle of Fifths", icon: Disc3 },
  { tool: "chords", href: "/chords/", label: "Chords", title: "Chord Compass", icon: Guitar },
  { tool: "scales", href: "/scales/", label: "Scales", title: "Scale Compass", icon: Music },
];
