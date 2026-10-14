import { expect, test } from "@playwright/test";

const heading = (title: string) => ({ level: 1, name: title }) as const;

test("the whole app works offline after the first visit", async ({ page, context }) => {
  await page.goto("/circle/");
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", heading("Circle of Fifths"))).toBeVisible();

  // Clicking (not goto) exercises client-side navigation and its ?_rsc= fetches.
  await page.getByRole("link", { name: "Chords" }).click();
  await expect(page.getByRole("heading", heading("Chord Compass"))).toBeVisible();
  await page.getByRole("link", { name: "Scales" }).click();
  await expect(page.getByRole("heading", heading("Scale Compass"))).toBeVisible();

  // A URL the build never produced falls back to the Circle, not a browser error page.
  await page.goto("/nowhere/");
  await expect(page.getByRole("heading", heading("Circle of Fifths"))).toBeVisible();
});

test("the manifest is served and installable-shaped", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");
});

// black-translucent forces white status-bar text, invisible over the light cream header.
test("the iOS status bar keeps dark-on-light text", async ({ page }) => {
  await page.goto("/circle/");
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
    "content",
    "default",
  );
});
