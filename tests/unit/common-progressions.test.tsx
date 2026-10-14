import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CommonProgressions } from "@/components/circle/common-progressions";

describe("CommonProgressions", () => {
  it("marks only the active preset as pressed", () => {
    render(<CommonProgressions activeId="pop" onPick={() => {}} />);
    expect(screen.getByRole("button", { name: /I–V–vi–IV/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /ii–V–I/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("picks a preset by id", () => {
    const onPick = vi.fn();
    render(<CommonProgressions activeId={null} onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: /Jazz turnaround/ }));
    expect(onPick).toHaveBeenCalledWith("ii-v-i");
  });
});
