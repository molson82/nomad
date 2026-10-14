import { expect, test } from "@playwright/test";

const TOOLS = [
  { label: "Chords", title: "Chord Compass", url: /\/chords\/$/ },
  { label: "Scales", title: "Scale Compass", url: /\/scales\/$/ },
  { label: "Circle", title: "Circle of Fifths", url: /\/circle\/$/ },
] as const;

test("phones get the tab bar, wider screens get the sidebar", async ({ page, isMobile }) => {
  await page.goto("/circle/");
  const tabs = page.getByRole("navigation", { name: "Tool tabs" });
  const sidebar = page.getByRole("navigation", { name: "Tool sidebar" });
  if (isMobile) {
    await expect(tabs).toBeVisible();
    await expect(sidebar).toBeHidden();
  } else {
    await expect(sidebar).toBeVisible();
    await expect(tabs).toBeHidden();
  }
});

test("every tool is one tap away and marked as current", async ({ page }) => {
  await page.goto("/circle/");
  for (const tool of TOOLS) {
    await page.getByRole("link", { name: tool.label }).click();
    await expect(page).toHaveURL(tool.url);
    await expect(page.getByRole("heading", { level: 1, name: tool.title })).toBeVisible();
    await expect(page.getByRole("link", { name: tool.label })).toHaveAttribute("aria-current", "page");
  }
});

test("/ opens the last tool used", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/circle\/$/);
  await page.getByRole("link", { name: "Scales" }).click();
  await expect(page).toHaveURL(/\/scales\/$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/scales\/$/);
});

test("unknown pages offer a way back", async ({ page }) => {
  await page.goto("/nowhere/");
  await page.getByRole("link", { name: "Back to the Circle" }).click();
  await expect(page).toHaveURL(/\/circle\/$/);
});
