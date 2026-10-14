import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolJumps } from "@/components/circle/tool-jumps";
import { stepStore } from "@/lib/chords/step-store";
import { openChordsAt, openScalesIn } from "@/lib/circle/jumps";
import { getKeyState, updateKeyState } from "@/lib/key-state/store";

const fresh = (linked: boolean) =>
  updateKeyState({ linked, shared: "C", tools: { circle: "C", chords: "D", scales: "A" } });

describe("jumps", () => {
  beforeEach(() => fresh(false));

  it("sets only the target tool's key when the tools are unlinked", () => {
    openScalesIn("G");
    expect(getKeyState().tools).toEqual({ circle: "C", chords: "D", scales: "G" });
  });

  it("opens the Chord Compass on a step in the Circle's key", () => {
    openChordsAt("G", 1);
    expect(getKeyState().tools.chords).toBe("G");
    expect(stepStore.get()).toBe(1);
  });

  it("leaves a linked key as it is", () => {
    fresh(true);
    openChordsAt("C", 0);
    expect(getKeyState()).toMatchObject({ linked: true, shared: "C" });
  });
});

describe("ToolJumps", () => {
  it("links to the neck with the progression's chords and to the key's scale", () => {
    render(<ToolJumps root="G" degrees={[1, 5, 6, 4]} />);
    const neck = screen.getByRole("link", { name: /See on the neck/ });
    expect(neck.getAttribute("href")).toMatch(/^\/chords\/?$/); // next/link drops the slash outside a Next build
    expect(neck).toHaveTextContent("Chord Compass · G · D · Em · C");
    expect(screen.getByRole("link", { name: /Scale for G major/ }).getAttribute("href")).toMatch(/^\/scales\/?$/);
  });

  it("hides the neck link when there is nothing to show", () => {
    const { rerender } = render(<ToolJumps root="G" degrees={[]} />);
    expect(screen.queryByRole("link", { name: /See on the neck/ })).toBeNull();
    rerender(<ToolJumps root="G" degrees={[7]} />);
    expect(screen.queryByRole("link", { name: /See on the neck/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Scale for G major/ })).toBeInTheDocument();
  });
});
