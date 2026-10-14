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

## Deployment

Hosted on **Vercel** through its GitHub integration — there is no `vercel.json`; project settings live in
the Vercel dashboard.

- Every commit on a PR gets a **Preview** deployment (the PR's "Vercel" and "Vercel Preview Comments"
  checks); every merge to `main` deploys **Production**. CI (`.github/workflows/ci.yml`) still only tests —
  it doesn't deploy.
- Deployment URLs are behind Vercel Authentication, so open them while signed in to Vercel.
- Offline support depends on the full `pnpm build` (it runs `scripts/build-sw.mjs` after `next build`). To
  confirm a deployment ran it, open `/sw.js` on it: it should start with `const PRECACHE = [` and contain
  `const VERSION = "<hash>"`, not `self.__PRECACHE__`. If it doesn't, set the Vercel project's Build Command
  to `pnpm build`.
- iOS snapshots the home-screen icon when the app is added; after an icon change, remove and re-add Nomad.

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
  major and minor chords (Minor is the key's relative minor, as in Scale Compass; stored per tool in
  `nomad:chords:quality:v1`), frets 0–15 (one past the device so every shape is complete). CAGED shapes are
  five templates per quality slid to the root (`cagedShapes`), sorted up the neck. The selected shape is
  stored by *name* (`nomad:chords:shape:v1`) so it survives root changes; switching Major ↔ Minor picks the
  shape nearest the current window. The overview is one SVG `viewBox` from
  `neck-geometry.ts` that scales to every screen size.
- **Scale Compass (`components/scales/`, `lib/scales/`, `lib/theory/scales.ts`):** the root is always the
  major tonic; Minor is the relative minor (⑥), re-numbered from its own root. Six views (Major/Minor ×
  Scale/Pentatonic/Blues) come from one major scale. Positions are ten fixed templates — five CAGED
  full-scale positions (letters) and five pentatonic boxes (Box 1–5; Box N ↔ letter G E D C A) — and the
  selection is stored as the letter (`nomad:scales:view:v1`) so scale ↔ pentatonic stays in the same region.
- **Shared fretboard (`components/fretboard/`):** the SVG neck, diagram, position chips, focus card and root
  stepper used by both compasses; the Chord Compass's components are thin adapters over them.
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
