import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MARKER_STYLE } from "@/components/fretboard/marker-style";
import { RootStepper } from "@/components/fretboard/root-stepper";

// WCAG 2 contrast ratio between two #rrggbb colors.
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themeVar = (name: string) => readFileSync("app/theme.css", "utf8").match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];

describe("contrast", () => {
  it("keeps out-of-key Circle labels readable on the soft and pale wedges", () => {
    for (const bg of ["decoder-yellow-soft", "decoder-yellow-pale"]) {
      expect(contrast(themeVar("decoder-muted"), themeVar(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps white labels readable on blue notes", () => {
    expect(contrast(MARKER_STYLE.blue.text, MARKER_STYLE.blue.fill)).toBeGreaterThanOrEqual(4.5);
  });

  it("rings the root disc in dark mode so it stands off the page", () => {
    const { container } = render(<RootStepper name="G" onStep={() => {}} />);
    const disc = container.querySelector("span")!;
    expect(disc.className).toContain("dark:bg-surface");
    expect(disc.className).toContain("dark:ring-text-secondary");
  });
});
