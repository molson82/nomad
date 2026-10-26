import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TuningPill } from "@/components/tuning/tuning-pill";
import { STANDARD_OFFSETS, TUNING_PRESETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

describe("TuningPill", () => {
  beforeEach(() => tuningStore.set(STANDARD_OFFSETS));

  it("stays out of the way in standard tuning", () => {
    const { container } = render(<TuningPill />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names a non-standard tuning and links to the Tuning tab", () => {
    tuningStore.set(TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets);
    render(<TuningPill />);
    const link = screen.getByRole("link", { name: "Tuning: DADGAD. Change tuning" });
    expect(link.getAttribute("href")).toMatch(/^\/tuning\/?$/);
    expect(link).toHaveTextContent("DADGAD ›");
  });
});
