import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/circle/" }));

// A landscape iPhone is wider than md, so it gets the sidebar; with
// viewport-fit=cover the notch sits over whatever isn't padded by the side insets.
// env() resolves to 0 in every emulator, so this pins the classes instead.
describe("AppShell", () => {
  it("keeps the sidebar and content clear of the landscape notch", () => {
    const { container } = render(<AppShell>content</AppShell>);
    const shell = container.querySelector("[data-tool]")!;
    expect(shell.className).toContain("pl-[env(safe-area-inset-left)]");
    expect(shell.className).toContain("pr-[env(safe-area-inset-right)]");
  });
});
