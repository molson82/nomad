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

const lockedState = (over = {}) =>
  JSON.stringify({
    frets: [5, 7, 5, 5, 5, 5],
    lock: { frets: [5, 7, 5, 5, 5, 5], key: "C", tuning: [0, 0, 0, 0, 0, 0], createdLink: true, ...over },
  });
const seed = (page: Page, entries: Record<string, string>) =>
  page.addInitScript((data) => {
    // Only once, so a reload shows what the app itself saved.
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
  }, entries);
const KEYS = "nomad:keys:v1";
const PATH = "nomad:pathfinder:v1";
const linkedC = JSON.stringify({ linked: true, shared: "C", tools: { circle: "C", chords: "C", scales: "C" } });

test("the whole flow logs no errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pathfinder/");
  await buildAm7(page);
  await page.getByRole("button", { name: "Build path" }).click();
  for (const mode of ["Scale", "Triads", "Pentatonic"]) await page.getByRole("button", { name: mode, exact: true }).click();
  await page.getByRole("button", { name: /^F major/ }).click();
  await page.getByRole("button", { name: "Lock in F major" }).click();
  await goTo(page, "Chords");
  await goTo(page, "Scales");
  await goTo(page, "Circle");
  expect(errors).toEqual([]);
});

test("the triad preview leaves nothing behind", async ({ page }) => {
  await page.goto("/pathfinder/");
  await buildAm7(page);
  await page.getByRole("button", { name: "Build path" }).click();
  const notes = page.locator('section[aria-label="Preview on the neck"] [data-tone]');
  const pentatonic = await notes.count();
  await page.getByRole("button", { name: "Triads", exact: true }).click();
  await expect(notes).toHaveCount(4);
  await page.getByRole("button", { name: "Pentatonic", exact: true }).click();
  await expect(notes).toHaveCount(pentatonic);
});

test("a chord being built survives a reload", async ({ page }) => {
  await page.goto("/pathfinder/");
  await buildAm7(page);
  await expect(page.getByTestId("chord-name")).toHaveText("Am7");
  await page.reload();
  await expect(page.getByTestId("chord-name")).toHaveText("Am7");
  await expect(page.getByRole("button", { name: "6th string, fret 5" })).toHaveAttribute("aria-pressed", "true");
});

test("a chord in no key can still be locked in", async ({ page }) => {
  await seed(page, { [PATH]: JSON.stringify({ frets: [null, 3, 2, 3, 4, null], lock: null }) });
  await page.goto("/pathfinder/");
  await expect(page.getByTestId("chord-name")).toHaveText("C7♯9");
  await page.getByRole("button", { name: "Build path" }).click();
  await expect(page.getByRole("heading", { name: "C7♯9 fits no key: closest keys" })).toBeVisible();
  await page.getByRole("button", { name: /^F major/ }).click();
  await expect(page.getByRole("button", { name: /^F major/ })).toContainText("Your D♯ falls outside this key");
  await page.getByRole("button", { name: "Lock in F major" }).click();
  await expect(page.getByText("V in F major · all tools linked")).toBeVisible();
});

for (const [name, value] of [
  ["junk", "not json"],
  ["the wrong shape", '{"frets":[1,2]}'],
  ["an empty lock", lockedState({ frets: [null, null, null, null, null, null] })],
  ["an impossible tuning", lockedState({ tuning: [99, 0, 0, 0, 0, 0] })],
] as const) {
  test(`${name} in storage takes nothing down`, async ({ page }) => {
    await seed(page, { [PATH]: value });
    for (const [path, title] of [["/pathfinder/", "Pathfinder"], ["/chords/", "Chord Compass"], ["/scales/", "Scale Compass"]]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeAttached();
      await expect(page.getByText("Something went wrong")).toHaveCount(0);
    }
  });
}

test("Reset leaves a link you made yourself", async ({ page }) => {
  await seed(page, { [PATH]: lockedState({ createdLink: false }), [KEYS]: linkedC });
  await page.goto("/pathfinder/");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText("Find your sound")).toBeVisible();
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("Reset leaves a link you re-made by hand", async ({ page }) => {
  await seed(page, { [PATH]: lockedState(), [KEYS]: linkedC });
  await page.goto("/chords/");
  await linkToggle(page).click();
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "false");
  await linkToggle(page).click();
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "true");
  await goTo(page, "Pathfinder");
  await page.getByRole("button", { name: "Reset" }).click();
  await goTo(page, "Chords");
  await expect(linkToggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(neckRings(page)).toHaveCount(0);
});

test("a locked chord keeps its notes when the tuning changes", async ({ page }) => {
  await seed(page, { [PATH]: lockedState(), [KEYS]: linkedC });
  await page.goto("/chords/");
  const lowString = page.locator('section[aria-label="Whole neck"] [data-ring][data-string="0"]');
  await expect(lowString).toHaveAttribute("data-fret", "5");
  await goTo(page, "Tuning");
  await page.getByRole("button", { name: /^Drop D/ }).click();
  await goTo(page, "Chords");
  await expect(lowString).toHaveAttribute("data-fret", "7");
  await expect(page.getByText("Your chord: Am7")).toBeVisible();
  await goTo(page, "Pathfinder");
  await expect(page.getByText("Am7", { exact: true })).toBeVisible();
});

test("rings keep their color in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await seed(page, { [PATH]: lockedState(), [KEYS]: linkedC });
  await page.goto("/chords/");
  await expect(neckRings(page).first()).toHaveCSS("stroke", "rgb(218, 72, 144)");
});

test("several names don't crowd a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, { [PATH]: JSON.stringify({ frets: [null, 3, 4, 2, 4, null], lock: null }) });
  await page.goto("/pathfinder/");
  await expect(page.getByTestId("chord-name")).toHaveText("Cdim7");
  const notes = page.getByText("C · E♭ · G♭ · A", { exact: true });
  expect((await notes.boundingBox())!.height).toBeLessThan(24);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("every Pathfinder screen fits a small phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const fits = async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  };
  await page.goto("/pathfinder/");
  await buildAm7(page);
  await fits();
  await page.getByRole("button", { name: "Build path" }).click();
  await fits();
  await page.getByRole("button", { name: /^G\s*V$/ }).click();
  await fits();
  await page.getByRole("button", { name: "Back to Am7" }).click();
  await page.getByRole("button", { name: "Lock in C major" }).click();
  await fits();
  await goTo(page, "Chords");
  await fits();
});

test("a large screen shows the whole neck to tap, with no overview", async ({ page, isMobile }) => {
  test.skip(isMobile, "large screens only");
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/pathfinder/");
  await expect(page.getByRole("region", { name: "Where you are on the neck" })).toBeHidden();
  await expect(page.getByRole("button", { name: "1st string, fret 15" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "6th string, open" })).toBeInViewport();
});

test("a tap places a note on a touch screen", async ({ page, hasTouch }) => {
  test.skip(!hasTouch, "touch screens only");
  await page.goto("/pathfinder/");
  await page.getByRole("button", { name: "5th string, fret 3" }).tap();
  await expect(page.getByTestId("chord-name")).toHaveText("C");
});

test("a real touch swipe moves the neck without placing a note", async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== "chromium", "touch gestures are only scriptable in Chromium");
  const context = await browser.newContext({ baseURL, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/pathfinder/");
  await expect(page.getByText("Find your sound")).toBeVisible();
  const scroller = page.locator('section[aria-label="Place your notes"] .overflow-x-auto');
  const box = (await scroller.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  // Real touch events: Chromium's synthesizeScrollGesture does nothing on CI's Linux runners.
  const x = box.x + box.width * 0.8;
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 25, y }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(0);
  await expect(page.getByText("Find your sound")).toBeVisible();
  await context.close();
});

test("/ never opens Pathfinder", async ({ page }) => {
  await page.goto("/scales/");
  await expect(page).toHaveURL(/\/scales\/$/);
  await goTo(page, "Pathfinder");
  await page.goto("/");
  await expect(page).toHaveURL(/\/scales\/$/);
});
