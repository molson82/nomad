export type MarkerKind = "tonic" | "tone" | "relative" | "blue";

// Marker colours are fixed (they sit on the wood, not the page), so they read in both themes.
export const MARKER_STYLE: Record<MarkerKind, { fill: string; stroke: string; ring: number; scale: number; text: string }> = {
  tonic: { fill: "#161718", stroke: "#161718", ring: 1.5, scale: 1, text: "#FFFFFF" },
  tone: { fill: "#FFFFFF", stroke: "#161718", ring: 1.5, scale: 1, text: "#161718" },
  relative: { fill: "#FFFFFF", stroke: "#2F5BC0", ring: 3, scale: 1, text: "#161718" }, // the relative-minor root, as on the device
  blue: { fill: "#5B8DEF", stroke: "#161718", ring: 1.2, scale: 0.72, text: "#FFFFFF" },
};
