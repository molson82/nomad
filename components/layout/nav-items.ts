import type { LucideIcon } from "lucide-react";
import { Disc3, Guitar, Music, SlidersVertical } from "lucide-react";
import type { Page } from "@/lib/tools";

export interface NavItemConfig {
  page: Page;
  href: string;
  label: string; // short: tab bar and sidebar
  title: string; // full: page heading and phone header
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { page: "circle", href: "/circle/", label: "Circle", title: "Circle of Fifths", icon: Disc3 },
  { page: "chords", href: "/chords/", label: "Chords", title: "Chord Compass", icon: Guitar },
  { page: "scales", href: "/scales/", label: "Scales", title: "Scale Compass", icon: Music },
  { page: "tuning", href: "/tuning/", label: "Tuning", title: "Tuning", icon: SlidersVertical },
];
