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
