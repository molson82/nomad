import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LinkDot, LinkToggle } from "@/components/key/link-toggle";

describe("LinkToggle", () => {
  it("is a pressed-state button named for what it does", () => {
    render(<LinkToggle linked={false} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: "Link key across tools" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("asks to link when unlinked, and to unlink when linked", () => {
    const onChange = vi.fn();
    const { rerender } = render(<LinkToggle linked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<LinkToggle linked onChange={onChange} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("shows the closed chain when linked and the broken chain when not", () => {
    const { container, rerender } = render(<LinkToggle linked onChange={() => {}} />);
    expect(container.querySelector('[data-shown="true"]')).toHaveClass("lucide-link2");
    rerender(<LinkToggle linked={false} onChange={() => {}} />);
    expect(container.querySelector('[data-shown="true"]')).toHaveClass("lucide-unlink2");
  });
});

describe("LinkDot", () => {
  it("renders only when visible", () => {
    const { rerender } = render(<LinkDot visible />);
    expect(screen.getByTestId("link-dot")).toBeInTheDocument();
    rerender(<LinkDot visible={false} />);
    expect(screen.queryByTestId("link-dot")).toBeNull();
  });
});
