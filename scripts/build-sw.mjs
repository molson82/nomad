// Post-build: fills the two placeholders in out/sw.js (copied there untouched
// from public/sw.js by `next build`) with the list of files to precache and a
// content hash. Any change to any shipped file changes the hash, which is what
// makes the browser install a new worker.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ERROR_PAGES = /^\/(404|_not-found)\//;

// Pages are cached under their directory URL only: serve (and most static
// hosts) redirect /x/index.html to /x/, and a redirected response can't
// answer a navigation request.
function toPrecacheUrl(relPath) {
  const url = "/" + relPath.split(path.sep).join("/");
  if (url === "/sw.js") return null;
  if (url.endsWith(".html")) {
    if (!url.endsWith("/index.html") || ERROR_PAGES.test(url)) return null;
    return url.slice(0, -"index.html".length);
  }
  return url;
}

export async function buildServiceWorker(outDir) {
  const swPath = path.join(outDir, "sw.js");
  const template = await readFile(swPath, "utf8");
  if (!template.includes("self.__PRECACHE__") || !template.includes("self.__VERSION__")) {
    throw new Error(`${swPath} has no placeholders to fill (already built?)`);
  }

  const entries = await readdir(outDir, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(outDir, path.join(entry.parentPath, entry.name)))
    .sort();

  const hash = createHash("sha256");
  const urls = [];
  for (const file of files) {
    const url = toPrecacheUrl(file);
    if (url === null) continue;
    urls.push(url);
    hash.update(url);
    hash.update(await readFile(path.join(outDir, file)));
  }
  const version = hash.digest("hex").slice(0, 12);

  const sw = template
    .replace("self.__PRECACHE__", () => JSON.stringify(urls))
    .replace("self.__VERSION__", () => JSON.stringify(version));
  await writeFile(swPath, sw);
  return { urls, version };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildServiceWorker(path.resolve("out"))
    .then(({ urls, version }) => console.log(`sw.js: precaching ${urls.length} files, version ${version}`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
