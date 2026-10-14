# CLAUDE.md

## Project

Nomad: a personal, mobile-first guitar theory app that digitizes three Noisy Clan "Decoder" tools
(Circle of Fifths, Chord Compass, Scale Compass). `nomad.md` (local only, gitignored) has the product vision. It is a
fully client-side, offline-capable PWA: Next.js (App Router) static export + TypeScript + Tailwind 3.
There is no backend, auth or database. Structure and tooling follow the sibling `journal` app.

## Commands

```bash
pnpm dev            # dev server; the service worker is NOT registered in dev
pnpm build          # next build → out/, then scripts/build-sw.mjs fills out/sw.js
pnpm preview        # serve out/ on :3000 (`next start` doesn't work with static export)
pnpm lint
pnpm typecheck
pnpm test:unit                               # Vitest + jsdom, tests/unit/**
pnpm test:unit tests/unit/key-state.test.ts  # single file
pnpm test:e2e                                # Playwright: builds + previews, projects iphone (WebKit) + desktop (Chromium)
pnpm exec playwright test tests/e2e/offline.spec.ts --project=iphone
pnpm icons                                   # re-render public/icons/*.png from the mark in scripts/make-icons.mjs
```

To test offline behavior by hand, use `pnpm build && pnpm preview`, never `pnpm dev`.

## Architecture

- **Routes:** `/circle/`, `/chords/`, `/scales/` (`trailingSlash: true`). `/` redirects on the client to
  the last tool (`nomad:last-tool`). `components/layout/nav-items.ts` is the single list of tools.
- **Shell:** `AppShell` sets `data-tool` from the route. `theme.css` derives every accent color
  from that tool's `--accent-hue`/`--accent-l`. Phones (< md) get `MobileHeader` + `TabBar`;
  md and up get `Sidebar`. Dark mode follows the system.
- **Key state (`lib/key-state/`):** one `localStorage` entry `nomad:keys:v1`
  (`{ linked, shared, tools }`), read via `useSyncExternalStore`. Use `useToolKey(tool)` for a tool's
  root and `useLinked(tool)` for the chain toggle. Linking adopts the current tool's key; unlinking
  copies the shared key into every tool. Storage failures fall back to in-memory state. Only the
  root note is shared; tool-specific choices stay in each tool.
- **Theory (`lib/theory/`):** plain TypeScript, no React — `spelling.ts` (letter-walked spelled notes),
  `circle.ts` (the 12 major keys in fifths order, signatures, mapping to/from the shared pitch-class root),
  `chords.ts` (diatonic chords with Decoder degree triples, `DECODER_LAYOUT`, `COMMON_PROGRESSIONS`).
  Chords and Scales should build on these rather than re-deriving theory.
- **Circle of Fifths (`components/circle/`, `lib/circle/`):** the wheel is one angle θ driven by
  `useWheelRotation` (drag with flick, swipe ±1 step, ←/→; spring snap; commits through `setRoot` only once
  settled; reduced motion jumps). The progression is degrees in `nomad:circle:progression:v1`, so turning
  the wheel transposes it. Both stores use `lib/storage/persisted-store.ts`.
- **Chord Compass (`components/chords/`, `lib/chords/`, `lib/theory/fretboard.ts`, `lib/theory/caged.ts`):**
  major chords only, frets 0–15 (one past the device so every shape is complete). CAGED shapes are five
  templates slid to the root (`cagedShapes`), sorted up the neck. The selected shape is stored by *name*
  (`nomad:chords:shape:v1`) so it survives root changes. The overview is one SVG `viewBox` from
  `neck-geometry.ts` that scales to every screen size.
- **Offline (`public/sw.js` + `scripts/build-sw.mjs` + `lib/sw/register.ts`):** after `next build`,
  the script lists every file in `out/` (pages by directory URL) and a content hash into `out/sw.js`.
  The SW precaches everything on install and serves cache-first. A new version waits until the user
  taps the update pill (`SKIP_WAITING` → reload); the app never reloads on its own.
  Registration only happens in production builds.
- **E2E gotcha:** many key-state assertions hold on more than one page; wait for navigation to land
  (e.g. `aria-current="page"` on the target tab) before asserting.

## Design docs

Features are specced and planned before implementation under `docs/superpowers/specs/` and
`docs/superpowers/plans/`. Each Decoder tool gets its own spec → plan → build cycle.
