// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { buildServiceWorker } from "@/scripts/build-sw.mjs";

const TEMPLATE = "const PRECACHE = self.__PRECACHE__;\nconst VERSION = self.__VERSION__;\n";
let out: string;

async function put(rel: string, content: string) {
  const file = path.join(out, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

beforeEach(async () => {
  out = await mkdtemp(path.join(os.tmpdir(), "nomad-out-"));
  await put("index.html", "<html>home</html>");
  await put("circle/index.html", "<html>circle</html>");
  await put("circle/index.txt", "rsc payload");
  await put("404.html", "<html>404</html>");
  await put("_not-found/index.html", "<html>not found</html>");
  await put("_next/static/chunks/app.js", "console.log(1)");
  await put("manifest.webmanifest", "{}");
  await put("sw.js", TEMPLATE);
});

afterEach(() => rm(out, { recursive: true, force: true }));

it("precaches pages by directory URL and every asset, skipping sw.js and error pages", async () => {
  const { urls } = await buildServiceWorker(out);
  expect([...urls].sort()).toEqual(
    ["/", "/_next/static/chunks/app.js", "/circle/", "/circle/index.txt", "/manifest.webmanifest"].sort(),
  );
});

it("writes the list and version into sw.js", async () => {
  const { urls, version } = await buildServiceWorker(out);
  const sw = await readFile(path.join(out, "sw.js"), "utf8");
  expect(version).toMatch(/^[0-9a-f]{12}$/);
  expect(sw).toContain(`const PRECACHE = ${JSON.stringify(urls)};`);
  expect(sw).toContain(`const VERSION = "${version}";`);
});

it("gives the same version for the same files and a new one when any file changes", async () => {
  const { version: first } = await buildServiceWorker(out);
  await put("sw.js", TEMPLATE);
  expect((await buildServiceWorker(out)).version).toBe(first);

  await put("sw.js", TEMPLATE);
  await put("_next/static/chunks/app.js", "console.log(2)");
  expect((await buildServiceWorker(out)).version).not.toBe(first);
});

it("refuses to run twice on the same build", async () => {
  await buildServiceWorker(out);
  await expect(buildServiceWorker(out)).rejects.toThrow(/placeholders/);
});

it("fails when out/sw.js is missing", async () => {
  await rm(path.join(out, "sw.js"));
  await expect(buildServiceWorker(out)).rejects.toThrow();
});
