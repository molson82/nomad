import { expect, test } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Serves a private copy of out/ on its own port, so editing its sw.js can't
// disturb the other specs, which share the main preview server.
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;

async function waitForServer(url: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`server at ${url} did not start`);
}

test.describe("service worker updates", () => {
  // The update logic is browser-agnostic and unit-tested; one browser is enough here.
  test.skip(({ browserName }) => browserName !== "chromium", "runs once, in Chromium");

  let dir: string;
  let server: ChildProcess;

  test.beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "nomad-sw-"));
    await cp("out", dir, { recursive: true });
    server = spawn("pnpm", ["exec", "serve", dir, "-l", String(PORT)], { stdio: "ignore" });
    await waitForServer(`${BASE}/`);
  });

  test.afterAll(async () => {
    server?.kill();
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  test("a new version waits for a tap, then takes over", async ({ page }) => {
    const pill = page.getByRole("button", { name: /update ready/i });

    await page.goto(`${BASE}/circle/`);
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null);
    await expect(pill).toHaveCount(0);

    const swPath = path.join(dir, "sw.js");
    const sw = await readFile(swPath, "utf8");
    const oldVersion = sw.match(/const VERSION = "([0-9a-f]+)";/)![1];
    await writeFile(swPath, sw.replace(`"${oldVersion}"`, '"e2e000000000"'));

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    await expect(pill).toBeVisible();
    await expect.poll(() => page.evaluate(() => caches.keys())).toContain(`nomad-${oldVersion}`);

    // Tapping reloads the page once the new worker takes control.
    const reloaded = page.waitForEvent("load");
    await pill.click();
    await reloaded;
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(["nomad-e2e000000000"]);
    await expect(pill).toHaveCount(0);
  });
});
