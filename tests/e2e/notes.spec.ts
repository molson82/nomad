import { expect, test } from "@playwright/test";

test("Circle: the key's chords note opens in the current key and closes with Esc", async ({ page }) => {
  await page.goto("/circle/");
  const info = page.getByRole("button", { name: "About the key's chords" });
  await info.click();
  const sheet = page.getByRole("dialog", { name: "The chords of C major" });
  await expect(sheet).toContainText("I C · ii Dm · iii Em · IV F · V G · vi Am · vii° B°");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(info).toBeFocused();
  // The tap opened a note; it didn't add a chord.
  await expect(page.getByText("No chords yet")).toBeVisible();
});

test("Circle: fifths and progression notes", async ({ page }) => {
  await page.goto("/circle/");
  await page.getByRole("button", { name: "About why the circle moves in fifths" }).click();
  await expect(page.getByRole("dialog", { name: "Why the circle moves in fifths" })).toContainText("you land on G (C D E F G)");
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: /I–V–vi–IV/ }).click();
  await page.getByRole("button", { name: "About progressions" }).click();
  await expect(page.getByRole("dialog", { name: "Pop · I–V–vi–IV" })).toContainText("C – G – Am – F");
});
