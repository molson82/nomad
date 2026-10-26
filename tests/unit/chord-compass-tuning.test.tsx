import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChordCompass } from "@/components/chords/chord-compass";
import { STANDARD_OFFSETS, TUNING_PRESETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

vi.mock("next/navigation", () => ({ usePathname: () => "/chords/" }));

describe("ChordCompass in other tunings", () => {
  afterEach(() => tuningStore.set(STANDARD_OFFSETS));

  it("shows triad controls instead of CAGED shapes in DADGAD", () => {
    tuningStore.set(TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets);
    render(<ChordCompass />);
    expect(screen.getAllByRole("group", { name: "Triads on three strings" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "About CAGED shapes" })).toBeNull();
  });

  it("keeps CAGED shapes for half step down", () => {
    tuningStore.set(TUNING_PRESETS.find((p) => p.id === "half-down")!.offsets);
    render(<ChordCompass />);
    expect(screen.getAllByRole("group", { name: "CAGED shapes up the neck" }).length).toBeGreaterThan(0);
  });
});
