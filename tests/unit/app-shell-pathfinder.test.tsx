import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";
import { DEFAULT_STATE, getKeyState, updateKeyState } from "@/lib/key-state/store";
import { LAST_TOOL_KEY } from "@/lib/tools";

vi.mock("next/navigation", () => ({ usePathname: () => "/pathfinder/" }));

describe("AppShell on Pathfinder", () => {
  afterEach(() => act(() => updateKeyState(DEFAULT_STATE)));

  it("uses Pathfinder's theme and isn't remembered as the last tool", () => {
    localStorage.removeItem(LAST_TOOL_KEY);
    const { container } = render(<AppShell>content</AppShell>);
    expect(container.querySelector("[data-tool]")!.getAttribute("data-tool")).toBe("pathfinder");
    expect(localStorage.getItem(LAST_TOOL_KEY)).toBeNull();
  });

  it("hides the link toggle until the tools are linked", () => {
    render(<AppShell>content</AppShell>);
    expect(screen.queryAllByRole("button", { name: "Link key across tools" })).toHaveLength(0);
    act(() => updateKeyState({ ...getKeyState(), linked: true }));
    expect(screen.getAllByRole("button", { name: "Link key across tools" }).length).toBeGreaterThan(0);
  });

  it("lists Pathfinder between Scales and Tuning", () => {
    render(<AppShell>content</AppShell>);
    const labels = screen.getAllByRole("navigation")[1].textContent;
    expect(labels).toMatch(/Scales.*Pathfinder.*Tuning/);
  });
});
