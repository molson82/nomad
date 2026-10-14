import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DecoderCard } from "@/components/circle/decoder-card";

const noHandlers = {
  onPointerDown: () => {},
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerCancel: () => {},
  onKeyDown: () => {},
};

function renderG(onAddChord = vi.fn()) {
  render(
    <DecoderCard
      keyIndex={1}
      theta={-30}
      wheelHandlers={noHandlers}
      badges={new Map([[1, [1]], [5, [2]]])}
      onAddChord={onAddChord}
      onSwipe={() => {}}
    />,
  );
  return screen.getByRole("region", { name: "Key of G major, 1 sharp" });
}

describe("DecoderCard", () => {
  it("lays chords out in Decoder order: IV I V, vii°, iii vi ii", () => {
    const card = renderG();
    const names = within(card)
      .getAllByRole("button", { name: /^Add / })
      .map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual([
      "Add C major, IV, to progression",
      "Add G major, I, to progression",
      "Add D major, V, to progression",
      "Add F♯ diminished, vii°, to progression",
      "Add B minor, iii, to progression",
      "Add E minor, vi, to progression",
      "Add A minor, ii, to progression",
    ]);
  });

  it("shows key facts: key, signature, relative minor", () => {
    const card = renderG();
    expect(within(card).getByText("G major")).toBeInTheDocument();
    expect(within(card).getByText("♯ F")).toBeInTheDocument();
    expect(within(card).getByText("E minor")).toBeInTheDocument();
  });

  it("badges chords that are in the progression", () => {
    const card = renderG();
    expect(within(within(card).getByRole("button", { name: /Add G major/ })).getByTestId("step-badge")).toHaveTextContent("1");
    expect(within(within(card).getByRole("button", { name: /Add D major/ })).getByTestId("step-badge")).toHaveTextContent("2");
  });

  it("a plain click (keyboard, assistive tech) still adds a chord", () => {
    const onAddChord = vi.fn();
    const card = renderG(onAddChord);
    fireEvent.click(within(card).getByRole("button", { name: /Add E minor/ }));
    expect(onAddChord).toHaveBeenCalledWith(6);
  });

  it("writes 'none' for C major's empty signature", () => {
    render(
      <DecoderCard keyIndex={0} theta={0} wheelHandlers={noHandlers} badges={new Map()} onAddChord={() => {}} onSwipe={() => {}} />,
    );
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
