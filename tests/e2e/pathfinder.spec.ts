import { expect, test, type Page } from "@playwright/test";

const am7: [string, number][] = [["6th", 5], ["5th", 7], ["4th", 5], ["3rd", 5], ["2nd", 5], ["1st", 5]];

async function buildAm7(page: Page) {
  for (const [string, fret] of am7) {
    await page.getByRole("button", { name: `${string} string, fret ${fret}` }).click();
  }
}

async function goTo(page: Page, tab: string) {
  const link = page.getByRole("link", { name: tab, exact: true });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page");
}

const neckRings = (page: Page) => page.locator('section[aria-label="Whole neck"] [data-ring]');
const linkToggle = (page: Page) => page.getByRole("button", { name: "Link key across tools" });

test("from a sound to a linked key and back", async ({ page }) => {
  await page.goto("/pathfinder/");
  await expect(page.getByText("Find your sound")).toBeVisible();
  await expect(linkToggle(page)).toHaveCount(0);

  await buildAm7(page);
  await expect(page.getByTestId("chord-name")).toHaveText("Am7");
  await expect(page.getByText("C6/A")).toBeVisible();

  await page.getByRole("button", { name: "Build path" }).click();
  await expect(page.getByRole("heading", { name: "Am7 fits 3 keys" })).toBeVisible();
  await page.getByRole("button", { name: /^G major/ }).click();
  await expect(page.getByRole("button", { name: "Lock in G major" })).toBeVisible();
  await page.getByRole("button", { name: /^C major/ }).click();

  await page.getByRole("button", { name: /^G\s*V$/ }).click();
  await expect(page.getByText("Trying · in C major")).toBeVisible();
  await page.getByRole("button", { name: "Back to Am7" }).click();

  await page.getByRole("button", { name: "Lock in C major" }).click();
  await expect(page.getByText("Locked in")).toBeVisible();
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByText("Locked in")).toBeVisible();

  await goTo(page, "Chords");
  await expect(neckRings(page)).toHaveCount(6);
  await expect(page.getByText("Your chord: Am7")).toBeVisible();
  await page.getByRole("button", { name: /next root/i }).click();
  await expect(page.getByText("Your chord: Am7")).toHaveCount(0);
  await expect(neckRings(page).first()).not.toHaveAttribute("data-fret", "5");

  await linkToggle(page).click();
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(neckRings(page)).toHaveCount(6);

  await goTo(page, "Scales");
  await expect(neckRings(page)).toHaveCount(6);

  await goTo(page, "Pathfinder");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText("Find your sound")).toBeVisible();

  await goTo(page, "Chords");
  await expect(neckRings(page)).toHaveCount(0);
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("the page doesn't scroll sideways on a small phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/pathfinder/");
  await expect(page.getByText("Find your sound")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("swiping the large neck moves it without placing a note", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phones and tablets only");
  await page.goto("/pathfinder/");
  await expect(page.getByText("Find your sound")).toBeVisible();
  const scroller = page.locator('section[aria-label="Place your notes"] .overflow-x-auto');
  await scroller.evaluate((el) => {
    el.scrollLeft = 400;
  });
  await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(0);
  await expect(page.getByText("Find your sound")).toBeVisible();
});
