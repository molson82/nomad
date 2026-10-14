import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InfoButton } from "@/components/notes/info-button";
import type { TheoryNote } from "@/lib/notes/types";

const note: TheoryNote = { title: "CAGED", paragraphs: [["Five ", { strong: "shapes" }, "."], ["Second."]] };

describe("InfoButton", () => {
  it("is a labelled dialog trigger and renders nothing until tapped", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    expect(screen.getByRole("button", { name: "About CAGED shapes" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the note titled by its heading, with live values strong", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    fireEvent.click(screen.getByRole("button", { name: "About CAGED shapes" }));
    const dialog = screen.getByRole("dialog", { name: "CAGED" });
    expect(within(dialog).getByText("shapes").tagName).toBe("STRONG");
    expect(within(dialog).getByText("Second.")).toBeInTheDocument();
  });

  it("closes with ✕ and gives focus back to the ⓘ", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    const button = screen.getByRole("button", { name: "About CAGED shapes" });
    fireEvent.click(button);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("closes on a backdrop tap and on a downward swipe of the header", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    const button = screen.getByRole("button", { name: "About CAGED shapes" });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(button);
    const header = within(screen.getByRole("dialog")).getByRole("heading", { name: "CAGED" });
    // jsdom has no PointerEvent; a MouseEvent of the same type carries clientY to React.
    fireEvent(header, new MouseEvent("pointerdown", { bubbles: true, clientY: 100 }));
    fireEvent(header, new MouseEvent("pointerup", { bubbles: true, clientY: 180 }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps drags inside the sheet away from the tool behind it", () => {
    const behind = vi.fn();
    render(
      <div onPointerDown={behind} onPointerUp={behind}>
        <InfoButton label="About CAGED shapes" note={note} />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "About CAGED shapes" }));
    const text = within(screen.getByRole("dialog")).getByText("Second.");
    fireEvent(text, new MouseEvent("pointerdown", { bubbles: true, clientX: 0 }));
    fireEvent(text, new MouseEvent("pointerup", { bubbles: true, clientX: 120 }));
    expect(behind).not.toHaveBeenCalled();
  });

  it("lets the header own vertical drags and forgets a cancelled one", () => {
    render(<InfoButton label="About CAGED shapes" note={note} />);
    fireEvent.click(screen.getByRole("button", { name: "About CAGED shapes" }));
    const header = within(screen.getByRole("dialog")).getByRole("heading", { name: "CAGED" });
    expect(header.closest(".touch-none")).not.toBeNull();
    fireEvent(header, new MouseEvent("pointerdown", { bubbles: true, clientY: 100 }));
    fireEvent(header, new MouseEvent("pointercancel", { bubbles: true }));
    fireEvent(header, new MouseEvent("pointerup", { bubbles: true, clientY: 180 }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
