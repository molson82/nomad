import { expect, test, type Page } from "@playwright/test";

const root = (page: Page, note: string) =>
  page.getByRole("group", { name: "Root note" }).getByRole("button", { name: note, exact: true });
const toggle = (page: Page) => page.getByRole("button", { name: "Link key across tools" });
// Waits for the navigation to land: several assertions below hold on both the
// old and new page, so without this they can pass before the route changes.
const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page");
};

const chordHeading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name: `${name} major` });

test("tools keep their own key until linked", async ({ page }) => {
  await page.goto("/scales/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await root(page, "G").click();
  await go(page, "Chords");
  await expect(chordHeading(page, "C")).toBeVisible();
});

test("linking shares the key across tools", async ({ page }) => {
  await page.goto("/scales/");
  await root(page, "G").click();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(3);

  await go(page, "Chords");
  await expect(chordHeading(page, "G")).toBeVisible();
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(chordHeading(page, "A♭")).toBeVisible();
  await go(page, "Scales");
  await expect(root(page, "Ab")).toHaveAttribute("aria-pressed", "true");
});

test("unlinking keeps the shared key, then tools diverge", async ({ page }) => {
  await page.goto("/scales/");
  await toggle(page).click();
  await root(page, "A").click();
  await toggle(page).click();
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(0);

  await go(page, "Chords");
  await expect(chordHeading(page, "A")).toBeVisible();
  await page.getByRole("button", { name: "Next root" }).click();
  await expect(chordHeading(page, "B♭")).toBeVisible();
  await go(page, "Scales");
  await expect(root(page, "A")).toHaveAttribute("aria-pressed", "true");
});

test("keys and link state survive a reload", async ({ page }) => {
  await page.goto("/scales/");
  await root(page, "Bb").click();
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(root(page, "Bb")).toHaveAttribute("aria-pressed", "true");
});
