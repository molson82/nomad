import { expect, test, type Page } from "@playwright/test";

const focus = (page: Page, name: string) => page.getByRole("region", { name });
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name: `${name} major` });
const chip = (page: Page, name: string) => page.getByRole("button", { name });

test.beforeEach(async ({ page }) => {
  await page.goto("/chords/");
  await expect(heading(page, "C")).toBeVisible();
});

test("opens on C with the E-shape", async ({ page }) => {
  await expect(focus(page, "E-shape, frets 8 to 10")).toBeVisible();
  await expect(page.getByText("C · E · G", { exact: true })).toBeVisible();
});

test("the selected shape follows the root", async ({ page }) => {
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭")).toBeVisible();
  await expect(focus(page, "E-shape, frets 9 to 11")).toBeVisible();

  // D♭ → C → B → B♭ → A → A♭ → G → F♯
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Previous root" }).click();
  await expect(heading(page, "F♯")).toBeVisible();
  await chip(page, "G-shape, frets 11 to 14").click();
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "G")).toBeVisible();
  await expect(focus(page, "G-shape, frets 0 to 3")).toBeVisible(); // jumped from the top of the neck to the nut
});

test("chips and arrows move between shapes, stopping at the ends", async ({ page }) => {
  await chip(page, "D-shape, frets 10 to 13").click();
  await expect(focus(page, "D-shape, frets 10 to 13")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next shape" })).toBeDisabled();

  await page.getByRole("button", { name: "Previous shape: E-shape" }).click();
  await expect(focus(page, "E-shape, frets 8 to 10")).toBeVisible();

  await chip(page, "C-shape, frets 0 to 3").click();
  await expect(page.getByRole("button", { name: "Previous shape" })).toBeDisabled();
});

test("swiping the focus card steps up and down the neck", async ({ page }) => {
  const card = focus(page, "E-shape, frets 8 to 10");
  const box = (await card.boundingBox())!;
  const y = box.y + box.height * 0.6;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8 - 140, y, { steps: 6 });
  await page.mouse.up();
  await expect(focus(page, "D-shape, frets 10 to 13")).toBeVisible();
});

test("tapping the neck picks the shape under the finger", async ({ page }) => {
  const neck = page.getByRole("img", { name: /across the neck/ });
  const box = (await neck.boundingBox())!;
  // Fret 4 sits at x = 30 + 3.5 × 43 in the 680-wide viewBox; A-shape (3–5) is centred nearest.
  await neck.click({ position: { x: ((30 + 3.5 * 43) / 680) * box.width, y: box.height / 2 } });
  await expect(focus(page, "A-shape, frets 3 to 5")).toBeVisible();
});

test("the selected shape survives a reload", async ({ page }) => {
  await chip(page, "A-shape, frets 3 to 5").click();
  await page.reload();
  await expect(focus(page, "A-shape, frets 3 to 5")).toBeVisible();
});

test("Minor shows the relative minor in the same region, and survives a reload", async ({ page }) => {
  await focus(page, "E-shape, frets 8 to 10").waitFor(); // C major, E-shape
  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Minor" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "A minor" })).toBeVisible();
  await expect(page.getByText("Relative of C major (⑥)")).toBeVisible();
  await expect(focus(page, "Dm-shape, frets 7 to 10")).toBeVisible();
  await expect(chip(page, "Am-shape, frets 0 to 2")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: "A minor" })).toBeVisible();
  await expect(focus(page, "Dm-shape, frets 7 to 10")).toBeVisible();

  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Major" }).click();
  await expect(heading(page, "C")).toBeVisible();
  await expect(focus(page, "E-shape, frets 8 to 10")).toBeVisible();
});
