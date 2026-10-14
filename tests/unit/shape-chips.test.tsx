import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ShapeChips } from "@/components/chords/shape-chips";
import { cagedShapes } from "@/lib/theory/caged";

describe("ShapeChips", () => {
  it("lists shapes in neck order with their frets, the selected one pressed", () => {
    render(<ShapeChips shapes={cagedShapes("G")} selected="E" onSelect={() => {}} />);
    const chips = within(screen.getByRole("group", { name: "CAGED shapes up the neck" })).getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "G-shape, frets 0 to 3",
      "E-shape, frets 3 to 5",
      "D-shape, frets 5 to 8",
      "C-shape, frets 7 to 10",
      "A-shape, frets 10 to 12",
    ]);
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false", "false", "false"]);
    expect(chips[3]).toHaveTextContent("C7–10");
  });

  it("selects by name", () => {
    const onSelect = vi.fn();
    render(<ShapeChips shapes={cagedShapes("G")} selected="E" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "A-shape, frets 10 to 12" }));
    expect(onSelect).toHaveBeenCalledWith("A");
  });
});
