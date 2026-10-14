import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniWheel } from "@/components/circle/mini-wheel";

const noHandlers = {
  onPointerDown: () => {},
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerCancel: () => {},
  onKeyDown: () => {},
};

describe("MiniWheel", () => {
  it("is a slider that announces the key", () => {
    render(<MiniWheel theta={-30} keyIndex={1} handlers={noHandlers} />);
    const wheel = screen.getByRole("slider", { name: "Key" });
    expect(wheel).toHaveAttribute("aria-valuenow", "1");
    expect(wheel).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
    expect(wheel).toHaveAttribute("tabindex", "0");
  });

  it("highlights only IV, I and V and their relative minors", () => {
    const { container } = render(<MiniWheel theta={-30} keyIndex={1} handlers={noHandlers} />);
    const inKey = [...container.querySelectorAll('[data-in-key="true"]')].map((g) => g.getAttribute("data-key"));
    expect(inKey).toEqual(["C", "G", "D"]);
  });

  it("shows G♭ beneath F♯", () => {
    render(<MiniWheel theta={0} keyIndex={0} handlers={noHandlers} />);
    expect(screen.getByText("G♭")).toBeInTheDocument();
  });
});
