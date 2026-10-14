import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MajorMinorToggle } from "@/components/fretboard/major-minor-toggle";

describe("MajorMinorToggle", () => {
  it("presses the current quality and reports a change", () => {
    const onChange = vi.fn();
    render(<MajorMinorToggle value="minor" onChange={onChange} />);
    const group = screen.getByRole("group", { name: "Major or minor" });
    expect(within(group).getByRole("button", { name: "Minor" })).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: "Major" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(within(group).getByRole("button", { name: "Major" }));
    expect(onChange).toHaveBeenCalledWith("major");
  });
});
