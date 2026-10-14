import { expect, test, type Page } from "@playwright/test";

const toggle = (page: Page) => page.getByRole("button", { name: "Link key across tools" });
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });
const step = async (page: Page, label: "Next root" | "Previous root", times = 1) => {
  for (let i = 0; i < times; i++) await page.getByRole("button", { name: label }).click();
};
// Waits for the navigation to land: several assertions below hold on both the
// old and new page, so without this they can pass before the route changes.
const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page");
};

test("tools keep their own key until linked", async ({ page }) => {
  await page.goto("/scales/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await step(page, "Next root");
  await expect(heading(page, "D♭ major")).toBeVisible();
  await go(page, "Chords");
  await expect(heading(page, "C major")).toBeVisible();
});

test("linking shares the key across tools", async ({ page }) => {
  await page.goto("/scales/");
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(3);
  await step(page, "Next root", 7); // C → G
  await expect(heading(page, "G major")).toBeVisible();

  await go(page, "Chords");
  await expect(heading(page, "G major")).toBeVisible();
  await step(page, "Next root");
  await expect(heading(page, "A♭ major")).toBeVisible();
  await go(page, "Scales");
  await expect(heading(page, "A♭ major")).toBeVisible();
});

test("unlinking keeps the shared key, then tools diverge", async ({ page }) => {
  await page.goto("/scales/");
  await toggle(page).click();
  await step(page, "Next root", 9); // C → A
  await toggle(page).click();
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(0);

  await go(page, "Chords");
  await expect(heading(page, "A major")).toBeVisible();
  await step(page, "Next root");
  await expect(heading(page, "B♭ major")).toBeVisible();
  await go(page, "Scales");
  await expect(heading(page, "A major")).toBeVisible();
});

test("keys and link state survive a reload", async ({ page }) => {
  await page.goto("/scales/");
  await step(page, "Previous root", 2); // C → B♭
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(heading(page, "B♭ major")).toBeVisible();
});
