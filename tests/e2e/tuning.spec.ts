import { expect, test } from "@playwright/test";

test("DADGAD: the Scale Compass shows the key's notes in fret windows", async ({ page }) => {
  await page.goto("/tuning/");
  await page.getByRole("button", { name: /^DADGAD/ }).click();
  await page.getByRole("link", { name: "Scales", exact: true }).click();
  await expect(page.getByRole("link", { name: "Tuning: DADGAD. Change tuning" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Frets up the neck" })).toBeVisible();
  await expect(page.getByRole("region", { name: /Frets 0–4/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("group", { name: "Frets up the neck" })).toBeVisible();
  await page.getByRole("link", { name: "Tuning: DADGAD. Change tuning" }).click();
  await page.getByRole("button", { name: "Reset to standard" }).click();
  await page.getByRole("link", { name: "Scales", exact: true }).click();
  await expect(page.getByRole("group", { name: "Positions up the neck" })).toBeVisible();
});

test("DADGAD: the Chord Compass shows D major triads and inversions", async ({ page }) => {
  await page.goto("/tuning/");
  await page.getByRole("button", { name: /^DADGAD/ }).click();
  await page.getByRole("link", { name: "Chords", exact: true }).click();
  // Default key C: C major on strings 4–3–2, root position.
  await expect(page.getByRole("group", { name: "Triads on three strings" })).toBeVisible();
  await expect(page.getByRole("button", { name: /About CAGED shapes/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^6–5–4/ }).click();
  await page.getByRole("button", { name: /^1st inv/ }).click();
  await expect(page.getByRole("region", { name: /1st inversion/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("region", { name: /1st inversion/ })).toBeVisible();
});
