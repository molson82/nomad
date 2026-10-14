# Nomad skeleton — design

Date: 2026-10-13
Status: approved in conversation, awaiting spec review

## Purpose

Nomad is a personal, mobile-first web app for learning guitar theory on the go. It digitizes three
physical Noisy Clan "Decoder" tools the owner uses:

- **Circle of Fifths** — a rotating wheel: the selected key sits at the top with IV and V beside it,
  key signature, diminished vii°, and the relative minors (ii, iii, vi) below. Each chord shows
  "quick chord" degree numbers (e.g. ⑤⑦② = G–B–D).
- **Chord Compass** — a slider over a fretboard window: pick a root and every root/3rd/5th of that
  chord lights up from fret 0–13, with the five CAGED shape diagrams below.
- **Scale Compass** — the same slider idea for scales: scale degrees across the neck, interval
  formula, relative minor.

This spec covers **only the skeleton**: project setup, app shell, routing, shared key state with a
link toggle, offline/PWA, visual tokens, testing and CI. Each tool gets its own spec → plan → build
cycle afterwards.

### Success criteria

- Installable to the iPhone home screen, opens full-screen, works fully offline after first load.
- Clean on every width from 320px phones to 1440px+ desktops — no horizontal scroll.
- Three tool routes reachable from a bottom tab bar (phone) or sidebar (tablet/desktop).
- A chain-link toggle links/unlinks the root note across tools; choices persist across reloads.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e` all pass locally and in CI.

### Non-goals (this spec)

- The wheel, fretboard and scale visuals, and any theory beyond the 12 note names.
- Backend, auth, accounts, sync. The app is fully client-side.
- Deployment. The host is undecided; the build produces a static `out/` that any static host can serve.
  *(Update 2026-10-14: hosted on Vercel via its GitHub integration — see Deployment in `CLAUDE.md`.)*
- Key in the URL / shareable links. Add later if wanted.
- A settings page or manual theme toggle. Dark mode follows the system.

## Relationship to Journal

Journal (`../journal`) is the reference implementation for structure, tooling and responsive
behavior. Nomad reuses its patterns, not its UI (no colors, copy or components carried over as-is).

| Journal | Nomad |
|---|---|
| Next 15 App Router, React 19, TS strict | same |
| Tailwind 3 + `tailwind.config.ts` mapping CSS-variable tokens | same |
| `theme.css` oklch tokens, light block + `[data-theme="dark"]` override, single `--accent-hue` | same mechanism; dark from `prefers-color-scheme`; accent hue set per tool |
| ESLint 9 flat config (`next/core-web-vitals`, `next/typescript`) | same |
| Vitest + jsdom + Testing Library (`tests/unit`) | same |
| Playwright (`tests/e2e`) | same, plus WebKit iPhone project |
| Responsive shell: sidebar on desktop, tab bar + header on mobile | same split, new visuals |
| Two-tier page container widths, asserted by e2e | same idea |
| `app/manifest.ts`, apple-touch-icon | static manifest, `display: "standalone"` |
| GitHub Actions: independent lint/unit and e2e jobs, read-only token, Next build cache | same, minus Supabase |
| Supabase, middleware, zod, Anthropic SDK, Docker, Render, integration tests | **dropped** |

## Stack

- Next 15 (App Router) with `output: "export"`, `trailingSlash: true`, `images: { unoptimized: true }`
- React 19, TypeScript strict, `@/*` path alias
- Tailwind 3, PostCSS, autoprefixer
- ESLint 9 flat config
- Vitest 2 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`
- Playwright
- `lucide-react` for icons (already a Journal dependency)
- `serve` (devDependency, pinned) for previewing `out/`
- pnpm 9, Node 22

## Structure

```
app/
  layout.tsx          next/font (DM Sans + Oswald), viewport, theme-color, SW registration, AppShell
  manifest.ts         static PWA manifest
  page.tsx            client redirect to last-used tool (default /circle/)
  circle/page.tsx     placeholder: tool title + KeyPicker
  chords/page.tsx     placeholder: tool title + KeyPicker
  scales/page.tsx     placeholder: tool title + KeyPicker
  error.tsx, not-found.tsx
  globals.css, theme.css
components/
  layout/             app-shell, tab-bar, sidebar, nav-items, update-pill
  key/                key-picker, link-toggle
lib/
  theory/notes.ts     NOTES (12 names), Note type
  key-state/          store + useToolKey / useLinked hooks
  sw/register.ts      registration + update flow
scripts/build-sw.mjs  post-build precache generator
public/sw.js          service worker template; icons
tests/unit/, tests/e2e/
docs/superpowers/specs/, docs/superpowers/plans/
CLAUDE.md
```

## Routing and shell

- Routes: `/circle/`, `/chords/`, `/scales/`. `/` redirects client-side to the last-visited tool
  (stored in `localStorage` as `nomad:last-tool`), defaulting to `/circle/`.
- **Phone (< 768px):** header with the tool name and the link toggle; fixed bottom tab bar with
  three items (Circle · Chords · Scales).
- **Tablet/desktop (≥ 768px):** slim left sidebar with the link toggle at the top and the same
  three items; no tab bar.
- The shell sets `data-tool="circle|chords|scales"` from the current route, which drives the accent,
  and writes that tool to `nomad:last-tool` (try/catch, same as key state).

## Key state and link toggle

**What is shared:** only the root note, one of 12 names from `NOTES` (a fixed list; enharmonic
spelling per key is left to the tool specs). Tool-specific choices (scale type, chord quality) stay
local to each tool.

**Persisted shape**, one `localStorage` entry `nomad:keys:v1`:

```ts
type Tool = "circle" | "chords" | "scales";
type KeyState = { linked: boolean; shared: Note; tools: Record<Tool, Note> };
// default: { linked: false, shared: "C", tools: { circle: "C", chords: "C", scales: "C" } }
```

**API** — a small module store read through `useSyncExternalStore` (no state library):

```ts
const [root, setRoot] = useToolKey(tool); // linked → reads/writes `shared`; unlinked → `tools[tool]`
const [linked, setLinked] = useLinked();
```

Rules:

- **Link** (from tool T): `shared = tools[T]`. The key on screen becomes the shared key.
- **Unlink**: every `tools[t] = shared`. No tool's key jumps.
- Every `localStorage` read/write is wrapped in try/catch. On failure the store keeps working
  in memory for the session.
- Invalid or unknown stored data falls back to the default.
- The subscription also listens to the `storage` event so two open tabs stay in sync.
- Server snapshot is the default state. The static HTML renders "C" and switches to the saved
  key on hydration (a one-frame flash, accepted for the skeleton).

**Link toggle (`components/key/link-toggle.tsx`):**

- Button in the phone header and at the top of the sidebar.
- Linked: closed chain icon in the accent color. Unlinked: broken chain, muted.
- Toggling animates the links snapping together/apart in CSS. `prefers-reduced-motion` makes
  it an instant swap.
- While linked, each tab-bar/sidebar item shows a small accent dot.
- `aria-pressed={linked}`, accessible name "Link key across tools".

**KeyPicker (`components/key/key-picker.tsx`):** 12 note buttons, the current one marked with
`aria-pressed`. The placeholder pages use it so linking is usable and testable before the real tools exist.

## Offline / PWA

**Build:** `"build": "next build && node scripts/build-sw.mjs"`.

`scripts/build-sw.mjs`:

1. Walks `out/` recursively and collects every file path as a root-relative URL, excluding `sw.js`.
   Directory index files are listed by their directory URL (e.g. `/chords/`) as well as the
   `index.html` path.
2. Computes `VERSION` as a short SHA-256 over all collected files' contents.
3. Reads `out/sw.js` (copied from `public/sw.js` by Next), replaces the `self.__PRECACHE__` and
   `self.__VERSION__` placeholders, and writes it back.
4. Exits non-zero if `out/` or the placeholders are missing.

**Service worker (`public/sw.js`):**

- `install`: open `nomad-<VERSION>`, `addAll(PRECACHE)`. No `skipWaiting` here.
- `activate`: delete every cache starting with `nomad-` that isn't the current one; `clients.claim()`.
- `fetch`: same-origin GET only. Cache-first, then network. A navigation miss falls back to the
  cached `/circle/`.
- `message`: `{ type: "SKIP_WAITING" }` → `self.skipWaiting()`.

**Registration (`lib/sw/register.ts`):** production builds only (`process.env.NODE_ENV === "production"`).
When a new worker reaches `installed` while a controller exists, the app shows the
`UpdatePill` ("Update ready · tap to refresh"). Tapping posts `SKIP_WAITING`, and the page reloads
once on `controllerchange`. The app never reloads on its own. A registration failure is logged and
the app keeps running online-only.

**Manifest (`app/manifest.ts`):** name/short_name "Nomad", `start_url: "/"`,
`display: "standalone"`, theme/background colors from the neutral tokens, icons 192/512 PNG plus a
512 maskable. `layout.tsx` metadata sets `apple-touch-icon` and
`appleWebApp: { capable: true, title: "Nomad", statusBarStyle: "black-translucent" }`.

**Local preview:** `"preview": "serve out"`. `next start` does not work with static export.

## Mobile and responsive details

- Viewport `viewport-fit=cover`. Header and tab bar pad with `env(safe-area-inset-*)`.
- App height uses `100dvh`. Tab bar items are at least 44×44pt.
- `touch-action: manipulation` on the body (no double-tap-zoom delay). `overscroll-behavior: none` on the shell.
- `user-select: none` on interactive tool surfaces (key picker, future wheel/slider).
- `next/font` self-hosts the fonts, so typography works offline.
- Container tiers: tool pages up to `max-w-5xl`, text pages up to `max-w-3xl`, full width on phones
  with a 16px gutter.
- Journal's iOS 16px input font fix is deferred until the first text input exists.

## Visual foundation

Tokens only. The finished tool visuals belong to the tool specs (via a frontend-design pass).

- `theme.css`: light tokens in `:root`, dark overrides under `@media (prefers-color-scheme: dark)`.
  Neutrals take cues from the products: warm cream surface (fretboard), near-black ink, white and
  black degree-circle fills.
- Accent per tool through `--accent-hue`, set by `[data-tool]`: circle = Decoder yellow,
  chords = compass orange-red, scales = teal. Accent, hover and tint colors are derived from the
  hue with oklch, as in Journal.
- `tailwind.config.ts` maps tokens to utilities in the same way as Journal (`bg`, `surface`, `text.*`, `accent.*`).
- Fonts: DM Sans (body), Oswald (condensed display headings).

## Error handling

- `app/error.tsx`, `app/not-found.tsx`: short message plus a link to `/circle/`.
- Storage unavailable → in-memory state (see Key state).
- SW unsupported or registration fails → online-only. Logged, not shown to the user.

## Testing

**Unit (Vitest, jsdom, `tests/unit/**`):**

- key-state: default state; link takes the current tool's key; unlink copies `shared` into all
  tools; per-tool independence while unlinked; `localStorage` throwing on read/write; corrupt stored
  JSON; external `storage` event updates subscribers.
- build-sw: run against a temp `out/` fixture. Lists files, excludes `sw.js`, includes directory
  URLs, VERSION changes when any file's content changes, exits non-zero without placeholders.
- `LinkToggle`: `aria-pressed` reflects state, accessible name, click toggles.
- `KeyPicker`: renders 12 notes, marks the current one, calls `setRoot`.
- nav items: three tools with the correct hrefs.

**E2E (Playwright, against `pnpm build && pnpm preview`):**

- Projects: `iphone` (`devices["iPhone 14"]`, WebKit) and `desktop` (Desktop Chrome).
- Navigation: tab bar visible on phone and sidebar hidden; the reverse on desktop. Each item routes correctly.
- Linking: link → set G on Circle → Chords and Scales show G. Unlink → change Chords → Circle unchanged.
- Persistence: choices and link state survive a reload. `/` redirects to the last tool.
- Offline: load, wait for `navigator.serviceWorker.ready` and a controller, `context.setOffline(true)`,
  reload, visit all three tabs successfully.
- Update flow: serve build A, load it, swap in build B with a changed file, reload, the update pill
  appears, tap it, the page shows build B.
- Layout: no horizontal scroll (`scrollWidth <= clientWidth`) at 320, 390, 768 and 1440px.
  (Safe-area padding is not asserted: `env()` resolves to 0 under emulation; check it on a real iPhone.)

## CI

`.github/workflows/ci.yml`, `permissions: contents: read`, on pull requests and pushes to main:

- `lint-typecheck-unit`: install, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`.
- `e2e`: install, restore the `.next/cache` cache, `pnpm exec playwright install --with-deps chromium webkit`,
  `pnpm test:e2e`.
- No deploy job until a host is chosen. *(Update 2026-10-14: Vercel deploys PR previews and `main` itself;
  CI still only tests.)*

## Docs

`CLAUDE.md` covering commands, architecture (link-state rules, the SW build step, "SW is production-only;
test offline with `pnpm build && pnpm preview`") and the spec/plan convention under `docs/superpowers/`.
