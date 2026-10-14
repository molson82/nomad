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

test("Chord Compass: CAGED note lists the key chord's shapes", async ({ page }) => {
  await page.goto("/chords/");
  await page.getByRole("button", { name: "About CAGED shapes" }).click();
  const sheet = page.getByRole("dialog", { name: "CAGED: five shapes, one chord" });
  await expect(sheet).toContainText("in C the C-shape (frets 0–3) hands its root to the A-shape (3–5)");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
});

test("Scale Compass: building and pentatonic notes follow the view", async ({ page }) => {
  await page.goto("/scales/");
  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Minor" }).click();
  await page.getByRole("button", { name: "About how the scale is built" }).click();
  await expect(page.getByRole("dialog", { name: "Building A minor" })).toContainText("♭3 ♭6 ♭7");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "About pentatonic and blues" }).click();
  await expect(page.getByRole("dialog", { name: "Pentatonic and blues" })).toContainText("A C D E G");
});
