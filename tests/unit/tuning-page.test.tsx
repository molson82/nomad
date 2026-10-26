import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TuningPage } from "@/components/tuning/tuning-page";
import { STANDARD_OFFSETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

describe("TuningPage", () => {
  beforeEach(() => tuningStore.set(STANDARD_OFFSETS));

  it("tunes a string and shows the change", () => {
    render(<TuningPage />);
    fireEvent.click(screen.getByRole("button", { name: "Tune 6th string down" }));
    fireEvent.click(screen.getByRole("button", { name: "Tune 6th string down" }));
    expect(screen.getByRole("heading", { level: 2, name: "Drop D" })).toBeInTheDocument();
    expect(screen.getByText("−2 semitones")).toBeInTheDocument();
  });

  it("picks a preset and resets to standard", () => {
    render(<TuningPage />);
    fireEvent.click(screen.getByRole("button", { name: /^DADGAD/ }));
    expect(screen.getByRole("button", { name: /^DADGAD/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Reset to standard" }));
    expect(screen.getByRole("heading", { level: 2, name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset to standard" })).toBeDisabled();
  });

  it("stops a string at its limit", () => {
    render(<TuningPage />);
    const up = screen.getByRole("button", { name: "Tune 1st string up" });
    for (let i = 0; i < 4; i++) fireEvent.click(up);
    expect(up).toBeDisabled();
  });
});
