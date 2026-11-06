import { expect, test } from "@playwright/test";
test("swipe probe", async ({ browser, baseURL, browserName }) => {
  test.skip(browserName !== "chromium");
  const context = await browser.newContext({ baseURL, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto("/pathfinder/");
  await expect(page.getByText("Find your sound")).toBeVisible();
  await page.waitForTimeout(1500);
  const scroller = page.locator('section[aria-label="Place your notes"] .overflow-x-auto');
  const box = (await scroller.boundingBox())!;
  const left = () => scroller.evaluate((el) => el.scrollLeft);
  const x = box.x + box.width * 0.8, y = box.y + box.height / 2;
  console.log("PROBE", JSON.stringify({ box, ua: await page.evaluate(() => navigator.userAgent), widths: await scroller.evaluate((el) => [el.clientWidth, el.scrollWidth]), hit: await page.evaluate(([a, b]) => document.elementFromPoint(a, b)?.getAttribute("aria-label"), [x, y]), start: await left() }));
  await cdp.send("Input.synthesizeScrollGesture", { x, y, xDistance: -300, yDistance: 0, gestureSourceType: "touch" }).catch((e) => console.log("PROBE gesture error", e.message));
  await page.waitForTimeout(500);
  console.log("PROBE afterGesture", await left());
  await scroller.evaluate((el) => { el.scrollLeft = 0; });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 25, y }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
  console.log("PROBE afterTouchEvents", await left(), "pressed", await page.getByRole("button", { pressed: true }).count());
  await context.close();
});
