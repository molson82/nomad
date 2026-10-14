import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChordButton, DimChordButton } from "@/components/circle/chord-circle";
import { CIRCLE } from "@/lib/theory/circle";
import { diatonicChords } from "@/lib/theory/chords";

const g = diatonicChords(CIRCLE[1]);

describe("ChordButton", () => {
  it("is named for adding the chord and adds its degree", () => {
    const onAdd = vi.fn();
    render(<ChordButton chord={g[3]} size="major" label="IV" labelPosition="top" steps={[]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add C major, IV, to progression" }));
    expect(onAdd).toHaveBeenCalledWith(4);
  });

  it("shows notes and degree numbers with the first one filled", () => {
    const { container } = render(
      <ChordButton chord={g[4]} size="major" label="V" labelPosition="top" steps={[]} onAdd={() => {}} />,
    );
    expect(screen.getByText("D F♯ A")).toBeInTheDocument();
    const dots = container.querySelectorAll("[data-degree]");
    expect([...dots].map((d) => d.textContent)).toEqual(["5", "7", "2"]);
    expect([...dots].map((d) => d.getAttribute("data-filled"))).toEqual(["true", "false", "false"]);
  });

  it("badges every step the chord is used in", () => {
    render(<ChordButton chord={g[0]} size="key" label="I · KEY" labelPosition="top" steps={[1, 3]} onAdd={() => {}} />);
    expect(screen.getByTestId("step-badge")).toHaveTextContent("1·3");
  });

  it("keeps the badge white in every theme (the card stays yellow in dark mode)", () => {
    render(<ChordButton chord={g[0]} size="key" label="I · KEY" labelPosition="top" steps={[1]} onAdd={() => {}} />);
    const badge = screen.getByTestId("step-badge");
    expect(badge).toHaveClass("bg-white");
    expect(badge).not.toHaveClass("bg-surface");
  });

  it("has no badge when unused", () => {
    render(<ChordButton chord={g[5]} size="relative" label="vi" labelPosition="bottom" steps={[]} onAdd={() => {}} />);
    expect(screen.queryByTestId("step-badge")).toBeNull();
  });
});

describe("DimChordButton", () => {
  it("adds vii° and fills its first degree too", () => {
    const onAdd = vi.fn();
    const { container } = render(<DimChordButton chord={g[6]} steps={[]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add F♯ diminished, vii°, to progression" }));
    expect(onAdd).toHaveBeenCalledWith(7);
    expect(container.querySelector('[data-degree][data-filled="true"]')).toHaveTextContent("7");
  });
});
