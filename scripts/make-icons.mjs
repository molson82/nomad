// Renders the app icon to the PNGs the manifest and iOS need. Run `pnpm icons`
// after changing the art; the PNGs are committed. Same mark as app/icon.svg,
// on a full-bleed square (iOS and Android round the corners themselves).
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const MARK = `
  <circle cx="256" cy="256" r="150" fill="none" stroke="#141414" stroke-width="44"/>
  <circle cx="256" cy="106" r="58" fill="#141414"/>
  <circle cx="256" cy="106" r="24" fill="#FFD21F"/>`;

// scale < 1 keeps the mark inside the maskable safe zone (a centered circle, 80% of the width).
const svg = (size, scale) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#FFD21F"/>
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${MARK}</g>
  </svg>`;

const TARGETS = [
  ["public/icons/icon-192.png", 192, 1],
  ["public/icons/icon-512.png", 512, 1],
  ["public/icons/icon-maskable-512.png", 512, 0.8],
  ["public/icons/apple-touch-icon.png", 180, 1],
];

await mkdir("public/icons", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, scale] of TARGETS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}</style>${svg(size, scale)}`);
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
