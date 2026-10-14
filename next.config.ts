import type { NextConfig } from "next";

// Fully static: `next build` writes out/, which any static host can serve.
// trailingSlash makes every page a directory index (/chords/ → chords/index.html),
// which keeps the service worker's precache URLs one-to-one with files.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
