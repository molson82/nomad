import { expect, test, type Page } from "@playwright/test";

const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label, exact: true });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page"); // see CLAUDE.md
};
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });

test("See on the neck walks the Circle's progression in the Circle's key", async ({ page }) => {
  // Unlinked tools: give the Chord Compass a different key first.
  await page.goto("/chords/");
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();

  await go(page, "Circle");
  await page.getByRole("button", { name: /I–V–vi–IV/ }).click();
  await page.getByRole("link", { name: /See on the neck/ }).click();

  await expect(page.getByText("I in C major")).toBeVisible();
  await expect(page.getByRole("button", { name: "I, C major" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next chord" }).click();
  await expect(heading(page, "G major")).toBeVisible();
  await expect(page.getByText("V in C major")).toBeVisible();
  await page.getByRole("button", { name: "Next chord" }).click();
  await expect(heading(page, "A minor")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Am-shape/ }).first()).toBeVisible();

  // Changing the key keeps the step and transposes it.
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "B♭ minor")).toBeVisible();
  await expect(page.getByText("vi in D♭ major")).toBeVisible();

  // Major on the switch returns to the key view.
  await page.getByRole("group", { name: "Major or minor" }).getByRole("button", { name: "Major" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();
  await expect(page.getByText("Relative minor: B♭ (⑥)")).toBeVisible();

  await go(page, "Circle");
  await expect(page.getByRole("slider", { name: "Key" })).toHaveAttribute("aria-valuetext", "C major, no sharps or flats");
});

test("Scale for C major opens the Scale Compass on the Circle's key", async ({ page }) => {
  await page.goto("/scales/");
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(heading(page, "D♭ major")).toBeVisible();

  await go(page, "Circle");
  await page.getByRole("link", { name: /Scale for C major/ }).click();
  await expect(heading(page, "C major")).toBeVisible();
});
