// Renders the app icon to the PNGs the manifest and iOS need. Run `pnpm icons`
// after changing the art; the PNGs are committed. Same mark as app/icon.svg,
// on a full-bleed square (iOS and Android round the corners themselves).
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

// "Compass of three": a ring in the three tools' colours (Circle yellow, Chords
// orange-red, Scales teal) around a compass needle. Design: the "App Icon" page
// of the Nomad App Design canvas.
const BACKGROUND = "#161718";
const MARK = `
  <circle cx="256" cy="256" r="168" fill="none" stroke="#FFD21F" stroke-width="48" stroke-dasharray="338 718" transform="rotate(-86 256 256)"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="#E4572E" stroke-width="48" stroke-dasharray="338 718" transform="rotate(34 256 256)"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="#15A69A" stroke-width="48" stroke-dasharray="338 718" transform="rotate(154 256 256)"/>
  <polygon points="256,124 288,256 224,256" fill="#F6F1E7"/>
  <polygon points="224,256 288,256 256,388" fill="#6B7079"/>
  <circle cx="256" cy="256" r="18" fill="#161718" stroke="#F6F1E7" stroke-width="6"/>`;

// scale < 1 keeps the mark inside the maskable safe zone (a centered circle, 80% of the width).
const svg = (size, scale) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${BACKGROUND}"/>
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
