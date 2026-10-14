import { expect, test, type Page } from "@playwright/test";

// Fresh storage: root C. C major positions C 0–3 · A 2–6 · G 5–9 · E 7–10 · D 9–13;
// A-minor boxes 5 2–5 · 1 5–8 · 2 7–10 · 3 9–13 · 4 12–15.
const focus = (page: Page, name: string) => page.getByRole("region", { name });
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });
const press = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.goto("/scales/");
  await expect(heading(page, "C major")).toBeVisible();
});

test("opens on C major at the E-shape position", async ({ page }) => {
  await expect(focus(page, "E-shape position, frets 7 to 10")).toBeVisible();
  await expect(page.getByText("C D E F G A B", { exact: true })).toBeVisible();
  await expect(page.getByText("Relative minor: A (⑥)", { exact: true })).toBeVisible();
});

test("minor re-centres on the relative minor", async ({ page }) => {
  await press(page, "Minor");
  await expect(heading(page, "A minor")).toBeVisible();
  await expect(page.getByText("Relative of C major (⑥)", { exact: true })).toBeVisible();
  await expect(focus(page, "E-shape position, frets 7 to 10")).toBeVisible();
});

test("pentatonic keeps the same region and switches to boxes", async ({ page }) => {
  await press(page, "Minor");
  await press(page, "Pentatonic");
  await expect(heading(page, "A minor pentatonic")).toBeVisible();
  await expect(focus(page, "Box 2, frets 7 to 10")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Box 2 · E-shape" })).toBeVisible();
});

test("blues adds the blue note inside the box", async ({ page }) => {
  await press(page, "Minor");
  await press(page, "Blues");
  await page.getByRole("button", { name: "Box 1, frets 5 to 8" }).click();
  await expect(focus(page, "Box 1, frets 5 to 8")).toBeVisible();
  await expect(page.getByText("5th string, fret 6, E♭, ♭5", { exact: true })).toBeAttached();
  await expect(page.getByText("3rd string, fret 8, E♭, ♭5", { exact: true })).toBeAttached();
});

test("arrows, swipe and a neck tap move between positions", async ({ page }) => {
  await page.getByRole("button", { name: "Previous position: G-shape" }).click();
  await expect(focus(page, "G-shape position, frets 5 to 9")).toBeVisible();

  const card = focus(page, "G-shape position, frets 5 to 9");
  // The card is taller than a phone screen: swipe across its title area, which is in view.
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  const y = box.y + 70;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8 - 140, y, { steps: 6 });
  await page.mouse.up();
  await expect(focus(page, "E-shape position, frets 7 to 10")).toBeVisible();

  const neck = page.getByRole("img", { name: /across the neck/ });
  const neckBox = (await neck.boundingBox())!;
  await neck.click({ position: { x: ((30 + 0.5 * 43) / 680) * neckBox.width, y: neckBox.height / 2 } }); // fret 1
  await expect(focus(page, "C-shape position, frets 0 to 3")).toBeVisible();
});

test("changing the root keeps the position letter", async ({ page }) => {
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();
  await expect(focus(page, "E-shape position, frets 8 to 11")).toBeVisible();
});

test("the view survives a reload", async ({ page }) => {
  await press(page, "Minor");
  await press(page, "Pentatonic");
  await page.reload();
  await expect(focus(page, "Box 2, frets 7 to 10")).toBeVisible();
  await expect(page.getByRole("button", { name: "Minor", exact: true })).toHaveAttribute("aria-pressed", "true");
});
