import { expect, test, type Page } from "@playwright/test";

const wheel = (page: Page) => page.getByRole("slider", { name: "Key" });
const card = (page: Page) => page.getByRole("region", { name: /^Key of / });
const trayChips = (page: Page) => page.getByRole("list", { name: "Progression chords" }).getByRole("button");
const go = async (page: Page, label: string) => {
  const link = page.getByRole("link", { name: label });
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page"); // see CLAUDE.md
};

// A horizontal drag across the lower card (below the wheel).
async function swipe(page: Page, direction: "left" | "right") {
  // On a phone the page may have scrolled (e.g. after tapping a preset); a
  // person scrolls back to the card first, and the fixed header would
  // otherwise sit over the swipe point.
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = (await card(page).boundingBox())!;
  const y = box.y + box.height * 0.62;
  const from = direction === "left" ? box.x + box.width * 0.8 : box.x + box.width * 0.2;
  const to = direction === "left" ? from - 140 : from + 140;
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move(to, y, { steps: 6 });
  await page.mouse.up();
}

async function labels(page: Page) {
  return trayChips(page).evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/circle/");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "C major, no sharps or flats");
});

test("G major reads in Decoder order with its signature", async ({ page }) => {
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  const names = await card(page)
    .getByRole("button", { name: /^Add / })
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
  expect(names).toEqual([
    "Add C major, IV, to progression",
    "Add G major, I, to progression",
    "Add D major, V, to progression",
    "Add F♯ diminished, vii°, to progression",
    "Add B minor, iii, to progression",
    "Add E minor, vi, to progression",
    "Add A minor, ii, to progression",
  ]);
  await expect(card(page).getByText("♯ F", { exact: true })).toBeVisible();
});

test("swiping turns one key at a time", async ({ page }) => {
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "D major, 2 sharps");
  await swipe(page, "right");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
});

test("dragging the wheel turns it and commits on release", async ({ page }) => {
  const box = (await wheel(page).boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width * 0.42;
  const at = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)] as const;
  await page.mouse.move(...at(-90));
  await page.mouse.down();
  for (let deg = -80; deg <= -30; deg += 10) await page.mouse.move(...at(deg));
  await page.waitForTimeout(150); // hold still: no flick
  await page.mouse.up();
  // Turning the wheel 60° clockwise brings B♭ (two steps counter-clockwise) to the top.
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "B♭ major, 2 flats");
});

test("arrow keys turn the focused wheel", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard is a desktop path");
  await wheel(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  await page.keyboard.press("ArrowLeft");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "C major, no sharps or flats");
});

test("with the chain linked, the Circle's key reaches Chords", async ({ page }) => {
  await page.getByRole("button", { name: "Link key across tools" }).click();
  await swipe(page, "left");
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp");
  await go(page, "Chords");
  await expect(
    page.getByRole("group", { name: "Root note" }).getByRole("button", { name: "G", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("a preset fills the tray, transposes with the wheel and survives reload", async ({ page }) => {
  const pop = page.getByRole("button", { name: /I–V–vi–IV/ });
  await pop.click();
  await expect(pop).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => labels(page)).toEqual([
    "Remove C major, step 1",
    "Remove G major, step 2",
    "Remove A minor, step 3",
    "Remove F major, step 4",
  ]);

  await swipe(page, "left");
  await expect.poll(() => labels(page)).toEqual([
    "Remove G major, step 1",
    "Remove D major, step 2",
    "Remove E minor, step 3",
    "Remove C major, step 4",
  ]);

  await trayChips(page).first().click();
  await expect(trayChips(page)).toHaveCount(3);
  await expect(pop).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await expect(trayChips(page)).toHaveCount(3);
});

test("tapping a chord adds it; a swipe over a chord does not", async ({ page }) => {
  await card(page).getByRole("button", { name: /Add G major/ }).click();
  await expect(trayChips(page)).toHaveCount(1);

  const chord = (await card(page).getByRole("button", { name: /Add A minor/ }).boundingBox())!;
  await page.mouse.move(chord.x + chord.width / 2, chord.y + chord.height / 2);
  await page.mouse.down();
  await page.mouse.move(chord.x + chord.width / 2 - 120, chord.y + chord.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(trayChips(page)).toHaveCount(1);
});

test("the card lets vertical drags scroll; the wheel keeps them", async ({ page }) => {
  expect(await card(page).evaluate((el) => getComputedStyle(el).touchAction)).toBe("pan-y");
  expect(await wheel(page).evaluate((el) => getComputedStyle(el).touchAction)).toBe("none");
});

test("with reduced motion the key changes without animating", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await swipe(page, "left");
  // The spring takes ~300ms; reduced motion commits straight away.
  await expect(wheel(page)).toHaveAttribute("aria-valuetext", "G major, 1 sharp", { timeout: 100 });
});
