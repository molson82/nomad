# Nomad Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Nomad's foundation: a static, offline-capable, installable Next.js app with a responsive shell, three placeholder tool routes, and a chain-link toggle that shares the root note across tools.

**Architecture:** Next 15 App Router with `output: "export"` produces a static `out/`. Everything runs client-side. Key state is a small module store (`useSyncExternalStore` + `localStorage`). A hand-written service worker gets its precache list and version from a post-build script, and new versions are applied only when the user taps an update pill.

**Tech Stack:** Next 15, React 19, TypeScript strict, Tailwind 3, ESLint 9, Vitest 2 + jsdom + Testing Library, Playwright (Chromium + WebKit), lucide-react, serve, pnpm 9, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-13-nomad-skeleton-design.md`

**Reference app:** `../journal` (sibling directory). Its shell and configs are the source of these patterns. Read them if a step's intent is unclear, but don't copy its UI or Supabase code.

## Global Constraints

- Versions match Journal: `next ^15.5.0`, `react`/`react-dom ^19.0.0`, `tailwindcss ^3.4.0`, `eslint ^9.0.0`, `eslint-config-next ^15.0.0`, `vitest ^2.1.0`, `lucide-react ^0.451.0`, `typescript ^5.6.0`. `serve` pinned at `14.2.4`.
- `packageManager: "pnpm@9.12.0"`, Node 22.
- No backend, auth, Supabase, Docker, zod, or Anthropic SDK. No new dependency beyond the ones listed in Task 1.
- `next.config.ts`: `output: "export"`, `trailingSlash: true`, `images: { unoptimized: true }`.
- Routes: `/circle/`, `/chords/`, `/scales/`. `/` redirects to the last-used tool (default `/circle/`).
- `localStorage` keys: `nomad:keys:v1` (key state) and `nomad:last-tool`. Every access is wrapped in try/catch.
- Key state default: `{ linked: false, shared: "C", tools: { circle: "C", chords: "C", scales: "C" } }`.
- Link toggle accessible name: exactly `Link key across tools`.
- Breakpoint: phone `< 768px` (tab bar + header), `≥ 768px` sidebar (Tailwind `md`).
- The service worker registers only in production builds. Updates apply only when the user taps the pill, never automatically.
- The update pill text is `Update ready · tap to refresh`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Spec deviations (decided while planning)

- `useLinked(tool)` takes the current tool, because linking adopts that tool's key. The spec wrote `useLinked()`.
- The precache lists each `index.html` only by its directory URL (`/chords/`), not also as `/chords/index.html`. `serve` redirects `…/index.html` to the clean URL, and a redirected response can't answer a navigation.
- The update-flow e2e edits the `VERSION` in a private copy of `out/sw.js` instead of rebuilding. The browser takes the same update path in seconds instead of minutes.
- Each tool sets `--accent-l` as well as `--accent-hue`. Decoder yellow needs much more lightness than teal to read as itself.

## Review Focus

1. **First-ever visit:** the first service worker install fires `controllerchange` (because of `clients.claim()`). The page must not reload and must not show the update pill. Pinned in Task 6's `sw-register.test.ts`.
2. **Corrupt or stale stored state** (old shape, unknown note like `"H"`, non-JSON): the app falls back to defaults instead of crashing. Pinned in Task 2's `parseKeyState` cases.
3. **Client-side navigation while offline:** `next/link` fetches `/chords/index.txt?_rsc=…`. The query string must still hit the cache. `ignoreSearch` is in Task 5's `sw.js`, pinned by Task 6's offline e2e clicking nav links rather than using `goto`.
4. **Unknown URL while offline:** shows the Circle, not the browser's offline error page. Pinned in Task 6's offline e2e.
5. **`build-sw` run twice on the same `out/`, or with `sw.js` missing:** fails loudly instead of shipping a broken worker. Pinned in Task 5's tests.

---

## File Map

```
package.json, pnpm-lock.yaml, .gitignore, tsconfig.json, next-env.d.ts
next.config.ts, postcss.config.js, tailwind.config.ts, eslint.config.mjs
vitest.config.ts, playwright.config.ts
app/
  layout.tsx            fonts, metadata, viewport; wraps children in AppShell (Task 4)
  globals.css           tailwind layers, body behavior, link-icon animation
  theme.css             color tokens; per-tool accent; dark via prefers-color-scheme
  page.tsx              redirect to last tool
  circle|chords|scales/page.tsx
  error.tsx, not-found.tsx
  manifest.ts, icon.svg
components/
  layout/nav-items.ts   tool → href, label, title, icon
  layout/app-shell.tsx  data-tool, link state wiring, last-tool write
  layout/sidebar.tsx, tab-bar.tsx, mobile-header.tsx, update-pill.tsx
  key/link-toggle.tsx   LinkToggle + LinkDot
  key/key-picker.tsx    12-note picker
  key/tool-placeholder.tsx
lib/
  theory/notes.ts       NOTES, Note, isNote
  tools.ts              TOOLS, Tool, isTool, toolFromPath, LAST_TOOL_KEY
  key-state/store.ts    pure transitions + persisted module store
  key-state/hooks.ts    useToolKey, useLinked
  sw/register.ts        registration + update flow
public/sw.js            service worker template
public/icons/*.png      generated by scripts/make-icons.mjs
scripts/build-sw.mjs, scripts/make-icons.mjs
tests/unit/*.test.ts(x), tests/e2e/*.spec.ts
.github/workflows/ci.yml, CLAUDE.md
```

---

### Task 1: Project scaffold, tooling, and theme tokens

**Files:**
- Create: `package.json`, `.gitignore`, `tsconfig.json`, `next.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `tests/unit/setup.ts`, `app/theme.css`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- Commit: `nomad.md` (the product vision doc, same convention as Journal's `journal.md`)

**Interfaces:**
- Produces: Tailwind color utilities `bg-bg`, `bg-surface`, `bg-fretboard`, `border-border`, `bg-hover`, `text-ink`, `bg-ink`, `text-text-{primary,secondary,tertiary}`, `bg-accent`, `text-accent-ink`, `bg-accent-tint`, `text-accent-on`, `rounded-card`, `font-sans`, `font-display`. The CSS attribute `[data-tool="circle|chords|scales"]` recolors every accent token inside it. The `@/*` path alias.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "nomad",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "serve out -l 3000",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "icons": "node scripts/make-icons.mjs"
  },
  "dependencies": {
    "lucide-react": "^0.451.0",
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.1.0",
    "@playwright/test": "^1.47.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.0",
    "serve": "14.2.4",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

(Task 5 adds the service-worker step to `build`.)

- [ ] **Step 2: Write the config files**

`.gitignore`:
```
node_modules
.next
out
*.tsbuildinfo
test-results
playwright-report
blob-report
playwright/.cache
.DS_Store
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.mjs", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

`next.config.ts`:
```ts
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
```

`postcss.config.js`:
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`eslint.config.mjs`:
```js
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "playwright-report/**", "test-results/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

`tests/unit/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3: Write the theme tokens**

`app/theme.css`:
```css
/*
 * Same idea as Journal's theme.css: accent colors are derived once from a
 * hue, so a tool switch is one attribute change. Two differences:
 *  - each tool sets --accent-l too, since Decoder yellow needs far more
 *    lightness than teal to read as itself;
 *  - the derived colors are declared on `:root, [data-tool]`, because a
 *    custom property's var() resolves where it is declared -- declaring them
 *    only on :root would freeze them at the root's hue.
 * Dark mode follows the system; there is no manual toggle.
 */

:root {
  color-scheme: light dark;

  --accent-hue: 95;
  --accent-l: 86%;

  --color-bg: oklch(96.5% 0.014 85);
  --color-surface: oklch(99.5% 0.004 85);
  --color-fretboard: oklch(85% 0.05 75);
  --color-border: oklch(87% 0.018 80);
  --color-hover-bg: oklch(93% 0.018 85);
  --color-ink: oklch(19% 0.006 260);
  --color-text-primary: var(--color-ink);
  --color-text-secondary: oklch(43% 0.012 260);
  --color-text-tertiary: oklch(57% 0.012 260);
  --color-on-accent: var(--color-ink);
}

[data-tool="circle"] { --accent-hue: 95; --accent-l: 86%; }  /* Decoder yellow */
[data-tool="chords"] { --accent-hue: 38; --accent-l: 66%; }  /* compass orange-red */
[data-tool="scales"] { --accent-hue: 185; --accent-l: 72%; } /* teal */

:root,
[data-tool] {
  --color-accent: oklch(var(--accent-l) 0.17 var(--accent-hue));
  --color-accent-ink: oklch(46% 0.13 var(--accent-hue));
  --color-accent-tint: oklch(93% 0.05 var(--accent-hue));
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(18% 0.008 260);
    --color-surface: oklch(23% 0.01 260);
    --color-fretboard: oklch(42% 0.045 70);
    --color-border: oklch(100% 0 0 / 0.1);
    --color-hover-bg: oklch(29% 0.012 260);
    --color-text-primary: oklch(94% 0.006 85);
    --color-text-secondary: oklch(74% 0.012 260);
    --color-text-tertiary: oklch(60% 0.012 260);
  }

  :root,
  [data-tool] {
    --color-accent-ink: oklch(82% 0.14 var(--accent-hue));
    --color-accent-tint: oklch(31% 0.06 var(--accent-hue));
  }
}
```

`app/globals.css`:
```css
@import "./theme.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  /* No 300ms double-tap-zoom wait when tapping notes quickly. */
  touch-action: manipulation;
  /* The shell is fixed chrome; rubber-banding it reads as broken on iOS. */
  overscroll-behavior: none;
}
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        fretboard: "var(--color-fretboard)",
        border: "var(--color-border)",
        hover: "var(--color-hover-bg)",
        ink: "var(--color-ink)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          ink: "var(--color-accent-ink)",
          tint: "var(--color-accent-tint)",
          on: "var(--color-on-accent)",
        },
      },
      borderRadius: {
        card: "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Write the root layout and a temporary home page**

`app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import "./globals.css";

// next/font self-hosts both families in out/, so type renders offline too.
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Nomad", template: "%s · Nomad" },
  description: "Guitar theory decoders, on the go.",
  applicationName: "Nomad",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the app draw under the notch/home indicator; the shell pads with
  // env(safe-area-inset-*) so content stays clear of them.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#121418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${oswald.variable}`}>
      <body className="bg-bg font-sans text-text-primary antialiased">{children}</body>
    </html>
  );
}
```

`app/page.tsx` (temporary; Task 4 replaces it):
```tsx
export default function Home() {
  return <main className="p-4 font-display text-3xl uppercase">Nomad</main>;
}
```

- [ ] **Step 5: Install and verify the toolchain**

Run: `pnpm install`
Expected: lockfile written, no errors.

Run: `pnpm build && ls out`
Expected: build succeeds. `out/` contains `index.html`, `404.html` and `_next/`. `next-env.d.ts` is created.

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0 with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore tsconfig.json next-env.d.ts next.config.ts postcss.config.js tailwind.config.ts eslint.config.mjs vitest.config.ts tests/unit/setup.ts app nomad.md
git commit -m "Scaffold Nomad: Next static export, Tailwind tokens, lint/test tooling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Notes, tools, and the key-state store

**Files:**
- Create: `lib/theory/notes.ts`, `lib/tools.ts`, `lib/key-state/store.ts`, `lib/key-state/hooks.ts`
- Test: `tests/unit/tools.test.ts`, `tests/unit/key-state.test.ts`

**Interfaces:**
- Produces:
  - `lib/theory/notes.ts`: `NOTES: readonly ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"]`, `type Note`, `isNote(value: unknown): value is Note`
  - `lib/tools.ts`: `TOOLS: readonly ["circle","chords","scales"]`, `type Tool`, `isTool(value: unknown): value is Tool`, `toolFromPath(pathname: string): Tool | null`, `LAST_TOOL_KEY = "nomad:last-tool"`
  - `lib/key-state/store.ts`: `type KeyState`, `STORAGE_KEY`, `DEFAULT_STATE`, `parseKeyState(raw: string | null): KeyState`, `withRoot(state, tool, note): KeyState`, `withLinked(state, tool, linked): KeyState`, `getKeyState()`, `getServerKeyState()`, `updateKeyState(next)`, `subscribeKeyState(listener): () => void`
  - `lib/key-state/hooks.ts`: `useToolKey(tool: Tool): [Note, (note: Note) => void]`, `useLinked(tool: Tool): [boolean, (linked: boolean) => void]`

- [ ] **Step 1: Write the failing tests**

`tests/unit/tools.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { isTool, toolFromPath } from "@/lib/tools";

describe("toolFromPath", () => {
  it.each([
    ["/circle/", "circle"],
    ["/chords", "chords"],
    ["/scales/", "scales"],
  ])("%s → %s", (path, tool) => {
    expect(toolFromPath(path)).toBe(tool);
  });

  it.each(["/", "/chordsx/", "/nowhere/", ""])("%s → null", (path) => {
    expect(toolFromPath(path)).toBeNull();
  });
});

describe("isTool", () => {
  it("accepts only the three tools", () => {
    expect(isTool("circle")).toBe(true);
    expect(isTool("Circle")).toBe(false);
    expect(isTool(null)).toBe(false);
  });
});
```

`tests/unit/key-state.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_STATE,
  STORAGE_KEY,
  parseKeyState,
  withLinked,
  withRoot,
  type KeyState,
} from "@/lib/key-state/store";

const state = (over: Partial<KeyState> = {}): KeyState => ({ ...DEFAULT_STATE, ...over });
const next: KeyState = { linked: true, shared: "G", tools: { circle: "D", chords: "A", scales: "E" } };

describe("withRoot", () => {
  it("unlinked: changes only that tool's key", () => {
    expect(withRoot(DEFAULT_STATE, "chords", "G")).toEqual({
      linked: false,
      shared: "C",
      tools: { circle: "C", chords: "G", scales: "C" },
    });
  });

  it("linked: changes the shared key and leaves per-tool keys alone", () => {
    const s = state({ linked: true });
    expect(withRoot(s, "chords", "G")).toEqual({ ...s, shared: "G" });
  });
});

describe("withLinked", () => {
  it("linking adopts the current tool's key as the shared key", () => {
    const s = state({ tools: { circle: "D", chords: "A", scales: "E" } });
    expect(withLinked(s, "chords", true)).toEqual({ ...s, linked: true, shared: "A" });
  });

  it("unlinking copies the shared key into every tool so nothing jumps", () => {
    const s = state({ linked: true, shared: "Bb", tools: { circle: "D", chords: "A", scales: "E" } });
    expect(withLinked(s, "circle", false)).toEqual({
      linked: false,
      shared: "Bb",
      tools: { circle: "Bb", chords: "Bb", scales: "Bb" },
    });
  });

  it("is a no-op when already in that state", () => {
    const s = state({ linked: true });
    expect(withLinked(s, "circle", true)).toBe(s);
  });
});

describe("parseKeyState", () => {
  it("returns the default for missing data", () => {
    expect(parseKeyState(null)).toEqual(DEFAULT_STATE);
  });

  it("round-trips a valid state", () => {
    expect(parseKeyState(JSON.stringify(next))).toEqual(next);
  });

  it.each([
    ["not json", "{oops"],
    ["null", "null"],
    ["an array", "[]"],
    ["a non-boolean linked", JSON.stringify({ ...next, linked: "yes" })],
    ["an unknown note", JSON.stringify({ ...next, shared: "H" })],
    ["a missing tool", JSON.stringify({ ...next, tools: { circle: "C", chords: "C" } })],
  ])("falls back to the default for %s", (_label, raw) => {
    expect(parseKeyState(raw)).toEqual(DEFAULT_STATE);
  });

  it("drops unexpected extra fields", () => {
    expect(parseKeyState(JSON.stringify({ ...next, extra: 1 }))).toEqual(next);
  });
});

describe("persisted store", () => {
  // The store caches state at module level; a fresh import per test gives a clean cache.
  async function loadStore() {
    vi.resetModules();
    return import("@/lib/key-state/store");
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts from the default when nothing is saved", async () => {
    const store = await loadStore();
    expect(store.getKeyState()).toEqual(DEFAULT_STATE);
  });

  it("loads saved state", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    const store = await loadStore();
    expect(store.getKeyState()).toEqual(next);
  });

  it("returns a stable snapshot between updates", async () => {
    const store = await loadStore();
    expect(store.getKeyState()).toBe(store.getKeyState());
  });

  it("persists updates and notifies subscribers", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeKeyState(listener);
    store.updateKeyState(next);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getKeyState()).toBe(next);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(next);
    unsubscribe();
    store.updateKeyState(DEFAULT_STATE);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working in memory when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const store = await loadStore();
    expect(store.getKeyState()).toEqual(DEFAULT_STATE);
    store.updateKeyState(next);
    expect(store.getKeyState()).toEqual(next);
  });

  it("picks up changes made in another tab", async () => {
    const store = await loadStore();
    store.getKeyState();
    const listener = vi.fn();
    store.subscribeKeyState(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(next) }));
    expect(listener).toHaveBeenCalled();
    expect(store.getKeyState()).toEqual(next);
  });

  it("ignores storage events for other keys", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribeKeyState(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: "something-else", newValue: "x" }));
    expect(listener).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:unit`
Expected: FAIL. Cannot resolve `@/lib/tools` and `@/lib/key-state/store`.

- [ ] **Step 3: Implement**

`lib/theory/notes.ts`:
```ts
// One fixed spelling per pitch class. Key-aware spelling (F# vs Gb) belongs
// to the tool specs; the skeleton only needs a stable set of 12 names.
export const NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

export type Note = (typeof NOTES)[number];

export function isNote(value: unknown): value is Note {
  return typeof value === "string" && (NOTES as readonly string[]).includes(value);
}
```

`lib/tools.ts`:
```ts
export const TOOLS = ["circle", "chords", "scales"] as const;

export type Tool = (typeof TOOLS)[number];

export const LAST_TOOL_KEY = "nomad:last-tool";

export function isTool(value: unknown): value is Tool {
  return typeof value === "string" && (TOOLS as readonly string[]).includes(value);
}

export function toolFromPath(pathname: string): Tool | null {
  const segment = pathname.split("/")[1];
  return isTool(segment) ? segment : null;
}
```

`lib/key-state/store.ts`:
```ts
import { isNote, type Note } from "@/lib/theory/notes";
import { TOOLS, type Tool } from "@/lib/tools";

export type KeyState = { linked: boolean; shared: Note; tools: Record<Tool, Note> };

export const STORAGE_KEY = "nomad:keys:v1";

export const DEFAULT_STATE: KeyState = {
  linked: false,
  shared: "C",
  tools: { circle: "C", chords: "C", scales: "C" },
};

export function parseKeyState(raw: string | null): KeyState {
  if (!raw) return DEFAULT_STATE;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value?.linked === "boolean" &&
      isNote(value.shared) &&
      TOOLS.every((tool) => isNote(value.tools?.[tool]))
    ) {
      return {
        linked: value.linked,
        shared: value.shared,
        tools: { circle: value.tools.circle, chords: value.tools.chords, scales: value.tools.scales },
      };
    }
  } catch {
    // Corrupt JSON: fall through to the default.
  }
  return DEFAULT_STATE;
}

export function withRoot(state: KeyState, tool: Tool, note: Note): KeyState {
  return state.linked
    ? { ...state, shared: note }
    : { ...state, tools: { ...state.tools, [tool]: note } };
}

// Linking adopts the key on screen; unlinking hands every tool the shared key,
// so neither direction makes any tool's key jump.
export function withLinked(state: KeyState, tool: Tool, linked: boolean): KeyState {
  if (linked === state.linked) return state;
  if (linked) return { ...state, linked: true, shared: state.tools[tool] };
  const { shared } = state;
  return { linked: false, shared, tools: { circle: shared, chords: shared, scales: shared } };
}

// Module-level store read through useSyncExternalStore. Loaded lazily so the
// server render (no localStorage) never touches it.
let state: KeyState | null = null;
const listeners = new Set<() => void>();

function load(): KeyState {
  try {
    return parseKeyState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_STATE; // storage blocked (e.g. Safari private mode): run in memory
  }
}

export function getKeyState(): KeyState {
  return (state ??= load());
}

export function getServerKeyState(): KeyState {
  return DEFAULT_STATE;
}

export function updateKeyState(next: KeyState): void {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the change still applies for this session.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeKeyState(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = parseKeyState(event.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
```

`lib/key-state/hooks.ts`:
```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Note } from "@/lib/theory/notes";
import type { Tool } from "@/lib/tools";
import {
  getKeyState,
  getServerKeyState,
  subscribeKeyState,
  updateKeyState,
  withLinked,
  withRoot,
} from "./store";

function useKeyState() {
  return useSyncExternalStore(subscribeKeyState, getKeyState, getServerKeyState);
}

export function useToolKey(tool: Tool): [Note, (note: Note) => void] {
  const state = useKeyState();
  const setRoot = useCallback(
    (note: Note) => updateKeyState(withRoot(getKeyState(), tool, note)),
    [tool],
  );
  return [state.linked ? state.shared : state.tools[tool], setRoot];
}

export function useLinked(tool: Tool): [boolean, (linked: boolean) => void] {
  const state = useKeyState();
  const setLinked = useCallback(
    (linked: boolean) => updateKeyState(withLinked(getKeyState(), tool, linked)),
    [tool],
  );
  return [state.linked, setLinked];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all tests PASS. Typecheck and lint are clean.

- [ ] **Step 5: Commit**

```bash
git add lib tests/unit/tools.test.ts tests/unit/key-state.test.ts
git commit -m "Key state: per-tool and linked root note, persisted with in-memory fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: LinkToggle and KeyPicker components

**Files:**
- Create: `components/key/link-toggle.tsx`, `components/key/key-picker.tsx`
- Modify: `app/globals.css` (append the link-icon animation)
- Test: `tests/unit/link-toggle.test.tsx`, `tests/unit/key-picker.test.tsx`

**Interfaces:**
- Consumes: `NOTES`, `Note` from `@/lib/theory/notes`
- Produces:
  - `LinkToggle({ linked: boolean; onChange: (linked: boolean) => void })`: button with `aria-pressed` and the accessible name `Link key across tools`
  - `LinkDot({ visible: boolean })`: small accent dot, `data-testid="link-dot"`, absolutely positioned (the parent must be `relative`)
  - `KeyPicker({ value: Note; onChange: (note: Note) => void })`: `role="group"` named `Root note`, 12 buttons with `aria-pressed`

- [ ] **Step 1: Write the failing tests**

`tests/unit/link-toggle.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LinkDot, LinkToggle } from "@/components/key/link-toggle";

describe("LinkToggle", () => {
  it("is a pressed-state button named for what it does", () => {
    render(<LinkToggle linked={false} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: "Link key across tools" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("asks to link when unlinked, and to unlink when linked", () => {
    const onChange = vi.fn();
    const { rerender } = render(<LinkToggle linked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<LinkToggle linked onChange={onChange} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("shows the closed chain when linked and the broken chain when not", () => {
    const { container, rerender } = render(<LinkToggle linked onChange={() => {}} />);
    expect(container.querySelector('[data-shown="true"]')).toHaveClass("lucide-link-2");
    rerender(<LinkToggle linked={false} onChange={() => {}} />);
    expect(container.querySelector('[data-shown="true"]')).toHaveClass("lucide-unlink-2");
  });
});

describe("LinkDot", () => {
  it("renders only when visible", () => {
    const { rerender } = render(<LinkDot visible />);
    expect(screen.getByTestId("link-dot")).toBeInTheDocument();
    rerender(<LinkDot visible={false} />);
    expect(screen.queryByTestId("link-dot")).toBeNull();
  });
});
```

`tests/unit/key-picker.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { KeyPicker } from "@/components/key/key-picker";
import { NOTES } from "@/lib/theory/notes";

describe("KeyPicker", () => {
  it("offers all 12 notes and marks only the current one", () => {
    render(<KeyPicker value="G" onChange={() => {}} />);
    const buttons = within(screen.getByRole("group", { name: "Root note" })).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([...NOTES]);
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent)).toEqual(["G"]);
  });

  it("reports the tapped note", () => {
    const onChange = vi.fn();
    render(<KeyPicker value="C" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "F#" }));
    expect(onChange).toHaveBeenCalledWith("F#");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:unit tests/unit/link-toggle.test.tsx tests/unit/key-picker.test.tsx`
Expected: FAIL. Cannot resolve `@/components/key/...`.

- [ ] **Step 3: Implement**

`components/key/link-toggle.tsx`:
```tsx
import { Link2, Unlink2 } from "lucide-react";

interface LinkToggleProps {
  linked: boolean;
  onChange: (linked: boolean) => void;
}

// Both chain icons share one grid cell; globals.css animates the swap.
export function LinkToggle({ linked, onChange }: LinkToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={linked}
      aria-label="Link key across tools"
      title={linked ? "Key linked across tools" : "Each tool keeps its own key"}
      onClick={() => onChange(!linked)}
      className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full transition-colors ${
        linked ? "bg-accent text-accent-on" : "text-text-tertiary hover:bg-hover"
      }`}
    >
      <Link2 aria-hidden data-shown={linked} className="link-icon col-start-1 row-start-1" size={22} strokeWidth={2.25} />
      <Unlink2 aria-hidden data-shown={!linked} className="link-icon col-start-1 row-start-1" size={22} strokeWidth={2.25} />
    </button>
  );
}

// Marks nav items while linked so the state is visible from any screen.
export function LinkDot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span
      aria-hidden
      data-testid="link-dot"
      className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-surface"
    />
  );
}
```

`components/key/key-picker.tsx`:
```tsx
import { NOTES, type Note } from "@/lib/theory/notes";

interface KeyPickerProps {
  value: Note;
  onChange: (note: Note) => void;
}

export function KeyPicker({ value, onChange }: KeyPickerProps) {
  return (
    <div role="group" aria-label="Root note" className="grid select-none grid-cols-6 gap-2 sm:grid-cols-12">
      {NOTES.map((note) => {
        const active = note === value;
        return (
          <button
            key={note}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(note)}
            className={`h-11 rounded-full text-base font-semibold transition-colors ${
              active ? "bg-accent text-accent-on" : "bg-bg text-text-primary hover:bg-hover"
            }`}
          >
            {note}
          </button>
        );
      })}
    </div>
  );
}
```

Append to `app/globals.css`:
```css
/* LinkToggle: the hidden chain shrinks and twists away, so toggling reads as
   the links snapping together or apart. */
.link-icon {
  transition: opacity 160ms ease, transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.link-icon[data-shown="false"] {
  opacity: 0;
  transform: scale(0.5) rotate(-60deg);
}
@media (prefers-reduced-motion: reduce) {
  .link-icon {
    transition: none;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add components/key app/globals.css tests/unit/link-toggle.test.tsx tests/unit/key-picker.test.tsx
git commit -m "LinkToggle and KeyPicker components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: App shell, tool routes, and the first e2e suite

**Files:**
- Create: `components/layout/nav-items.ts`, `components/layout/tab-bar.tsx`, `components/layout/sidebar.tsx`, `components/layout/mobile-header.tsx`, `components/layout/app-shell.tsx`, `components/key/tool-placeholder.tsx`, `app/circle/page.tsx`, `app/chords/page.tsx`, `app/scales/page.tsx`, `app/error.tsx`, `app/not-found.tsx`, `playwright.config.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/key-link.spec.ts`, `tests/e2e/layout.spec.ts`
- Modify: `app/layout.tsx` (wrap in AppShell), `app/page.tsx` (replace with redirect)

**Interfaces:**
- Consumes: `useToolKey`, `useLinked` (Task 2); `toolFromPath`, `isTool`, `LAST_TOOL_KEY`, `Tool` (Task 2); `LinkToggle`, `LinkDot`, `KeyPicker` (Task 3)
- Produces:
  - `NAV_ITEMS: { tool: Tool; href: string; label: string; title: string; icon: LucideIcon }[]`, with labels `Circle`/`Chords`/`Scales` and titles `Circle of Fifths`/`Chord Compass`/`Scale Compass`
  - `AppShell({ children })`: Task 6 adds `<UpdatePill />` inside it
  - Navigation landmarks named `Tool tabs` (phone) and `Tool sidebar` (desktop)
  - Each tool page has an `h1` with the tool's title
  - `playwright.config.ts` with projects `iphone` (WebKit) and `desktop` (Chromium), serving `pnpm build && pnpm preview` on port 3000

- [ ] **Step 1: Install the Playwright browsers and write the config**

Run: `pnpm exec playwright install chromium webkit`

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // GitHub's standard runner has 2 vCPUs; Playwright's own default resolves to 1 worker there.
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    // The service worker only registers in a production build, so e2e always
    // runs against the real static output.
    command: "pnpm build && pnpm preview",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 14"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

- [ ] **Step 2: Write the failing e2e specs**

`tests/e2e/navigation.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

const TOOLS = [
  { label: "Chords", title: "Chord Compass", url: /\/chords\/$/ },
  { label: "Scales", title: "Scale Compass", url: /\/scales\/$/ },
  { label: "Circle", title: "Circle of Fifths", url: /\/circle\/$/ },
] as const;

test("phones get the tab bar, wider screens get the sidebar", async ({ page, isMobile }) => {
  await page.goto("/circle/");
  const tabs = page.getByRole("navigation", { name: "Tool tabs" });
  const sidebar = page.getByRole("navigation", { name: "Tool sidebar" });
  if (isMobile) {
    await expect(tabs).toBeVisible();
    await expect(sidebar).toBeHidden();
  } else {
    await expect(sidebar).toBeVisible();
    await expect(tabs).toBeHidden();
  }
});

test("every tool is one tap away and marked as current", async ({ page }) => {
  await page.goto("/circle/");
  for (const tool of TOOLS) {
    await page.getByRole("link", { name: tool.label }).click();
    await expect(page).toHaveURL(tool.url);
    await expect(page.getByRole("heading", { level: 1, name: tool.title })).toBeVisible();
    await expect(page.getByRole("link", { name: tool.label })).toHaveAttribute("aria-current", "page");
  }
});

test("/ opens the last tool used", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/circle\/$/);
  await page.getByRole("link", { name: "Scales" }).click();
  await expect(page).toHaveURL(/\/scales\/$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/scales\/$/);
});

test("unknown pages offer a way back", async ({ page }) => {
  await page.goto("/nowhere/");
  await page.getByRole("link", { name: "Back to the Circle" }).click();
  await expect(page).toHaveURL(/\/circle\/$/);
});
```

`tests/e2e/key-link.spec.ts`:
```ts
import { expect, test, type Page } from "@playwright/test";

const root = (page: Page, note: string) =>
  page.getByRole("group", { name: "Root note" }).getByRole("button", { name: note, exact: true });
const toggle = (page: Page) => page.getByRole("button", { name: "Link key across tools" });
const go = (page: Page, label: string) => page.getByRole("link", { name: label }).click();

test("tools keep their own key until linked", async ({ page }) => {
  await page.goto("/circle/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await root(page, "G").click();
  await go(page, "Chords");
  await expect(root(page, "C")).toHaveAttribute("aria-pressed", "true");
});

test("linking shares the key across all three tools", async ({ page }) => {
  await page.goto("/circle/");
  await root(page, "G").click();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(3);

  await go(page, "Chords");
  await expect(root(page, "G")).toHaveAttribute("aria-pressed", "true");
  await root(page, "D").click();
  await go(page, "Scales");
  await expect(root(page, "D")).toHaveAttribute("aria-pressed", "true");
});

test("unlinking keeps the shared key, then tools diverge", async ({ page }) => {
  await page.goto("/circle/");
  await toggle(page).click();
  await root(page, "A").click();
  await toggle(page).click();
  await expect(page.getByTestId("link-dot").filter({ visible: true })).toHaveCount(0);

  await go(page, "Chords");
  await expect(root(page, "A")).toHaveAttribute("aria-pressed", "true");
  await root(page, "E").click();
  await go(page, "Circle");
  await expect(root(page, "A")).toHaveAttribute("aria-pressed", "true");
});

test("keys and link state survive a reload", async ({ page }) => {
  await page.goto("/chords/");
  await root(page, "Bb").click();
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(root(page, "Bb")).toHaveAttribute("aria-pressed", "true");
});
```

`tests/e2e/layout.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/circle/", "/chords/", "/scales/"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm test:e2e`
Expected: FAIL. The links, headings and toggle don't exist yet.

- [ ] **Step 4: Implement the nav config and shell**

`components/layout/nav-items.ts`:
```ts
import type { LucideIcon } from "lucide-react";
import { Disc3, Guitar, Music } from "lucide-react";
import type { Tool } from "@/lib/tools";

export interface NavItemConfig {
  tool: Tool;
  href: string;
  label: string; // short: tab bar and sidebar
  title: string; // full: page heading and phone header
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { tool: "circle", href: "/circle/", label: "Circle", title: "Circle of Fifths", icon: Disc3 },
  { tool: "chords", href: "/chords/", label: "Chords", title: "Chord Compass", icon: Guitar },
  { tool: "scales", href: "/scales/", label: "Scales", title: "Scale Compass", icon: Music },
];
```

`components/layout/tab-bar.tsx`:
```tsx
import Link from "next/link";
import { LinkDot } from "@/components/key/link-toggle";
import type { Tool } from "@/lib/tools";
import { NAV_ITEMS } from "./nav-items";

export function TabBar({ tool, linked }: { tool: Tool | null; linked: boolean }) {
  return (
    <nav
      aria-label="Tool tabs"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-surface px-2 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] pt-1.5 md:hidden"
    >
      {NAV_ITEMS.map(({ tool: itemTool, href, label, icon: Icon }) => {
        const active = itemTool === tool;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-0.5 ${
              active ? "text-accent-ink" : "text-text-tertiary"
            }`}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={1.9} />
              <LinkDot visible={linked} />
            </span>
            <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

`components/layout/sidebar.tsx`:
```tsx
import Link from "next/link";
import { LinkDot, LinkToggle } from "@/components/key/link-toggle";
import type { Tool } from "@/lib/tools";
import { NAV_ITEMS } from "./nav-items";

interface SidebarProps {
  tool: Tool | null;
  linked: boolean;
  onLinkedChange: (linked: boolean) => void;
}

export function Sidebar({ tool, linked, onLinkedChange }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[88px] flex-shrink-0 flex-col items-center gap-5 border-r border-border bg-surface px-3 py-6 md:flex xl:w-[220px] xl:items-stretch xl:px-4">
      <div className="flex flex-col items-center gap-4 xl:flex-row xl:justify-between xl:px-2">
        <span className="font-display text-2xl font-semibold uppercase tracking-wider">
          <span className="xl:hidden">N</span>
          <span className="hidden xl:inline">Nomad</span>
        </span>
        <LinkToggle linked={linked} onChange={onLinkedChange} />
      </div>
      <nav aria-label="Tool sidebar" className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map(({ tool: itemTool, href, label, icon: Icon }) => {
          const active = itemTool === tool;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm transition-colors xl:justify-start ${
                active ? "bg-accent-tint font-semibold text-accent-ink" : "font-medium text-text-secondary hover:bg-hover"
              }`}
            >
              <span className="relative flex-shrink-0">
                <Icon size={20} strokeWidth={1.9} />
                <LinkDot visible={linked} />
              </span>
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

`components/layout/mobile-header.tsx`:
```tsx
import { LinkToggle } from "@/components/key/link-toggle";

interface MobileHeaderProps {
  title: string;
  linked: boolean;
  onLinkedChange: (linked: boolean) => void;
}

// Not a heading: each page owns its h1, this only labels the chrome.
export function MobileHeader({ title, linked, onLinkedChange }: MobileHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border bg-bg px-4 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)] md:hidden">
      <p className="font-display text-xl font-semibold uppercase tracking-wider">{title}</p>
      <LinkToggle linked={linked} onChange={onLinkedChange} />
    </header>
  );
}
```

`components/layout/app-shell.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLinked } from "@/lib/key-state/hooks";
import { LAST_TOOL_KEY, toolFromPath } from "@/lib/tools";
import { MobileHeader } from "./mobile-header";
import { NAV_ITEMS } from "./nav-items";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const tool = toolFromPath(usePathname());
  // Off a tool route ("/" redirect, 404) linking still works; it adopts the Circle's key.
  const [linked, setLinked] = useLinked(tool ?? "circle");
  const title = NAV_ITEMS.find((item) => item.tool === tool)?.title ?? "Nomad";

  useEffect(() => {
    if (!tool) return;
    try {
      localStorage.setItem(LAST_TOOL_KEY, tool);
    } catch {
      // Storage blocked: "/" just opens the Circle.
    }
  }, [tool]);

  return (
    <div data-tool={tool ?? "circle"} className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <Sidebar tool={tool} linked={linked} onLinkedChange={setLinked} />
        <MobileHeader title={title} linked={linked} onLinkedChange={setLinked} />
        <main className="min-w-0 flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+4.5rem)] md:px-8 md:pb-10 md:pt-10">
          {children}
        </main>
      </div>
      <TabBar tool={tool} linked={linked} />
    </div>
  );
}
```

Modify the `app/layout.tsx` body to:
```tsx
      <body className="bg-bg font-sans text-text-primary antialiased">
        <AppShell>{children}</AppShell>
      </body>
```
and add `import { AppShell } from "@/components/layout/app-shell";`.

- [ ] **Step 5: Implement the pages**

`components/key/tool-placeholder.tsx`:
```tsx
"use client";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { useToolKey } from "@/lib/key-state/hooks";
import type { Tool } from "@/lib/tools";
import { KeyPicker } from "./key-picker";

// Stand-in until each tool's own spec lands: enough to make linking real.
export function ToolPlaceholder({ tool, blurb }: { tool: Tool; blurb: string }) {
  const [root, setRoot] = useToolKey(tool);
  const { title } = NAV_ITEMS.find((item) => item.tool === tool)!;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide md:text-4xl">{title}</h1>
      <p className="mt-1 text-text-secondary">{blurb}</p>
      <section className="mt-8 rounded-card border border-border bg-surface p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-text-tertiary">Root</span>
          <span className="font-display text-5xl font-semibold">{root}</span>
        </div>
        <div className="mt-5">
          <KeyPicker value={root} onChange={setRoot} />
        </div>
      </section>
    </div>
  );
}
```

`app/circle/page.tsx`:
```tsx
import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/key/tool-placeholder";

export const metadata: Metadata = { title: "Circle of Fifths" };

export default function CirclePage() {
  return <ToolPlaceholder tool="circle" blurb="Keys, chords and progressions around the wheel." />;
}
```

`app/chords/page.tsx`:
```tsx
import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/key/tool-placeholder";

export const metadata: Metadata = { title: "Chord Compass" };

export default function ChordsPage() {
  return <ToolPlaceholder tool="chords" blurb="Chord shapes and CAGED positions across the neck." />;
}
```

`app/scales/page.tsx`:
```tsx
import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/key/tool-placeholder";

export const metadata: Metadata = { title: "Scale Compass" };

export default function ScalesPage() {
  return <ToolPlaceholder tool="scales" blurb="Scale patterns, intervals and relative minors." />;
}
```

`app/page.tsx` (replace):
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LAST_TOOL_KEY, isTool, type Tool } from "@/lib/tools";

// Static export has no server redirects; pick the last tool on the client.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let tool: Tool = "circle";
    try {
      const saved = localStorage.getItem(LAST_TOOL_KEY);
      if (isTool(saved)) tool = saved;
    } catch {
      // Storage blocked: default to the Circle.
    }
    router.replace(`/${tool}/`);
  }, [router]);

  return null;
}
```

`app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-display text-3xl font-semibold uppercase">Nothing here</h1>
      <p className="mt-2 text-text-secondary">That page isn&apos;t part of Nomad.</p>
      <Link
        href="/circle/"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-on"
      >
        Back to the Circle
      </Link>
    </div>
  );
}
```

`app/error.tsx`:
```tsx
"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-display text-3xl font-semibold uppercase">Something went wrong</h1>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-on"
        >
          Try again
        </button>
        <Link
          href="/circle/"
          className="inline-flex min-h-11 items-center rounded-full border border-border px-5 font-semibold"
        >
          Back to the Circle
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all PASS, with each e2e test running in both the `iphone` and `desktop` projects.

Then open `pnpm dev` at a phone width and a desktop width and check by eye: header, tab bar, sidebar, toggle animation, and the accent changing per tool (yellow/orange-red/teal). Check dark mode by switching the OS appearance.

- [ ] **Step 7: Commit**

```bash
git add components app playwright.config.ts tests/e2e
git commit -m "App shell: tab bar, sidebar, link toggle wiring, three tool routes, e2e

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Service worker template and precache build step

**Files:**
- Create: `public/sw.js`, `scripts/build-sw.mjs`
- Modify: `package.json` (`build` script)
- Test: `tests/unit/build-sw.test.ts`

**Interfaces:**
- Produces:
  - `buildServiceWorker(outDir: string): Promise<{ urls: string[]; version: string }>` exported from `scripts/build-sw.mjs`
  - After a build, `out/sw.js` contains `const VERSION = "<12 hex chars>";` (Task 6's update e2e edits this exact line) and the cache name is `nomad-<VERSION>`
  - The SW handles the message `{ type: "SKIP_WAITING" }`

- [ ] **Step 1: Write the failing test**

`tests/unit/build-sw.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/build-sw.test.ts`
Expected: FAIL. Cannot resolve `@/scripts/build-sw.mjs`.

- [ ] **Step 3: Implement**

`scripts/build-sw.mjs`:
```js
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
```

`public/sw.js`:
```js
// Template: scripts/build-sw.mjs replaces both placeholders in out/sw.js after
// `next build`. Never registered in dev (see lib/sw/register.ts callers).
const PRECACHE = self.__PRECACHE__;
const VERSION = self.__VERSION__;
const CACHE = `nomad-${VERSION}`;

self.addEventListener("install", (event) => {
  // No skipWaiting here: a new version waits until the user taps "refresh".
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("nomad-") && key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // ignoreSearch: client-side navigation fetches /x/index.txt?_rsc=<id>.
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch (error) {
        if (request.mode === "navigate") {
          const fallback = await cache.match("/circle/");
          if (fallback) return fallback;
        }
        throw error;
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
```

In `package.json`, change `build` to:
```json
    "build": "next build && node scripts/build-sw.mjs",
```

- [ ] **Step 4: Run tests and a real build**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: all PASS, clean.

Run: `pnpm build && grep -E "^const (VERSION|PRECACHE)" out/sw.js | cut -c1-160`
Expected: the build logs `sw.js: precaching N files, version <hash>`. `PRECACHE` lists `"/"`, `"/circle/"`, `"/chords/"`, `"/scales/"` and `_next/static/...` entries, and no `index.html` paths.

- [ ] **Step 5: Commit**

```bash
git add public/sw.js scripts/build-sw.mjs package.json tests/unit/build-sw.test.ts
git commit -m "Service worker: precache-everything template filled by a post-build script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Registration, update pill, manifest, icons, offline e2e

**Files:**
- Create: `lib/sw/register.ts`, `components/layout/update-pill.tsx`, `app/manifest.ts`, `app/icon.svg`, `scripts/make-icons.mjs`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `public/icons/apple-touch-icon.png` (the PNGs are generated)
- Modify: `components/layout/app-shell.tsx` (render `<UpdatePill />`), `app/layout.tsx` (metadata: appleWebApp, apple icon)
- Test: `tests/unit/sw-register.test.ts`, `tests/e2e/offline.spec.ts`, `tests/e2e/update.spec.ts`

**Interfaces:**
- Consumes: the `out/sw.js` contract from Task 5 (`SKIP_WAITING` message, `const VERSION = "<hex>";` line, `nomad-<VERSION>` cache name)
- Produces: `registerServiceWorker(onUpdateReady: (apply: () => void) => void, reload?: () => void): Promise<void>`

- [ ] **Step 1: Write the failing unit test**

`tests/unit/sw-register.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "@/lib/sw/register";

type FakeWorker = EventTarget & { state: string; postMessage: ReturnType<typeof vi.fn> };
type FakeRegistration = EventTarget & { waiting: FakeWorker | null; installing: FakeWorker | null };

function setup({ controller }: { controller: boolean }) {
  const registration: FakeRegistration = Object.assign(new EventTarget(), { waiting: null, installing: null });
  const container = Object.assign(new EventTarget(), {
    controller: controller ? {} : null,
    register: vi.fn().mockResolvedValue(registration),
  });
  Object.defineProperty(navigator, "serviceWorker", { value: container, configurable: true });
  return { registration, container };
}

function newWorker(): FakeWorker {
  return Object.assign(new EventTarget(), { state: "installing", postMessage: vi.fn() });
}

function finishInstall(registration: FakeRegistration, worker: FakeWorker) {
  registration.installing = worker;
  registration.dispatchEvent(new Event("updatefound"));
  worker.state = "installed";
  worker.dispatchEvent(new Event("statechange"));
}

afterEach(() => {
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  vi.restoreAllMocks();
});

describe("registerServiceWorker", () => {
  it("first install: no update pill and no reload, even though the controller changes", async () => {
    const { registration, container } = setup({ controller: false });
    const onUpdateReady = vi.fn();
    const reload = vi.fn();
    await registerServiceWorker(onUpdateReady, reload);

    finishInstall(registration, newWorker());
    container.dispatchEvent(new Event("controllerchange")); // clients.claim()

    expect(container.register).toHaveBeenCalledWith("/sw.js");
    expect(onUpdateReady).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("a new version is offered, and only applied when the user taps", async () => {
    const { registration, container } = setup({ controller: true });
    const onUpdateReady = vi.fn();
    const reload = vi.fn();
    await registerServiceWorker(onUpdateReady, reload);

    const worker = newWorker();
    finishInstall(registration, worker);
    expect(onUpdateReady).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).not.toHaveBeenCalled();

    const apply = onUpdateReady.mock.calls[0][0] as () => void;
    apply();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });

    container.dispatchEvent(new Event("controllerchange"));
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("offers a worker that was already waiting at startup", async () => {
    const { registration } = setup({ controller: true });
    const waiting = newWorker();
    registration.waiting = waiting;
    const onUpdateReady = vi.fn();
    await registerServiceWorker(onUpdateReady, vi.fn());
    expect(onUpdateReady).toHaveBeenCalledTimes(1);
  });

  it("logs and carries on when registration fails", async () => {
    const { container } = setup({ controller: false });
    container.register.mockRejectedValue(new Error("nope"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(registerServiceWorker(vi.fn(), vi.fn())).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });

  it("does nothing where service workers are unsupported", async () => {
    await expect(registerServiceWorker(vi.fn(), vi.fn())).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit tests/unit/sw-register.test.ts`
Expected: FAIL. Cannot resolve `@/lib/sw/register`.

- [ ] **Step 3: Implement registration and the pill**

`lib/sw/register.ts`:
```ts
// Offers the update pill only for a *replacement* worker (one installed while
// another already controls the page). The very first install also fires
// controllerchange, because sw.js calls clients.claim(), so reloading is gated
// on the user having tapped "refresh".
export async function registerServiceWorker(
  onUpdateReady: (apply: () => void) => void,
  reload: () => void = () => window.location.reload(),
): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const container = navigator.serviceWorker;

  let applying = false;
  container.addEventListener("controllerchange", () => {
    if (!applying) return;
    applying = false;
    reload();
  });

  const offer = (worker: ServiceWorker) =>
    onUpdateReady(() => {
      applying = true;
      worker.postMessage({ type: "SKIP_WAITING" });
    });

  try {
    const registration = await container.register("/sw.js");
    if (registration.waiting && container.controller) offer(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && container.controller) offer(worker);
      });
    });
  } catch (error) {
    console.error("Service worker registration failed; running online-only.", error);
  }
}
```

`components/layout/update-pill.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { registerServiceWorker } from "@/lib/sw/register";

export function UpdatePill() {
  const [apply, setApply] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Dev never registers: a cached dev bundle would shadow every edit.
    if (process.env.NODE_ENV !== "production") return;
    registerServiceWorker((applyUpdate) => setApply(() => applyUpdate));
  }, []);

  if (!apply) return null;
  return (
    <button
      type="button"
      onClick={apply}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 z-30 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-on shadow-lg md:bottom-6"
    >
      <RefreshCw aria-hidden size={16} strokeWidth={2.25} />
      Update ready · tap to refresh
    </button>
  );
}
```

In `components/layout/app-shell.tsx`, add `import { UpdatePill } from "./update-pill";` and render `<UpdatePill />` right after `<TabBar … />`.

- [ ] **Step 4: Run the unit tests**

Run: `pnpm test:unit`
Expected: all PASS.

- [ ] **Step 5: Icons and manifest**

`app/icon.svg` (favicon; Next serves `app/icon.svg` automatically):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#FFD21F"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#141414" stroke-width="44"/>
  <circle cx="256" cy="106" r="58" fill="#141414"/>
  <circle cx="256" cy="106" r="24" fill="#FFD21F"/>
</svg>
```

`scripts/make-icons.mjs`:
```js
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
```

Run: `pnpm icons`
Expected: prints four paths. View `public/icons/icon-512.png` and `public/icons/icon-maskable-512.png` to confirm a yellow square with a black ring and a dot at the top (the maskable one has a smaller mark).

`app/manifest.ts`:
```ts
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// standalone is safe here (Journal used "browser" to keep its auth cookies;
// Nomad has none), so the home-screen app opens full-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nomad",
    short_name: "Nomad",
    description: "Guitar theory decoders, on the go.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#f6f1e7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

In `app/layout.tsx`, extend `metadata`:
```ts
export const metadata: Metadata = {
  title: { default: "Nomad", template: "%s · Nomad" },
  description: "Guitar theory decoders, on the go.",
  applicationName: "Nomad",
  appleWebApp: { capable: true, title: "Nomad", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};
```

- [ ] **Step 6: Write the e2e specs**

`tests/e2e/offline.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

const heading = (title: string) => ({ level: 1, name: title }) as const;

test("the whole app works offline after the first visit", async ({ page, context }) => {
  await page.goto("/circle/");
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", heading("Circle of Fifths"))).toBeVisible();

  // Clicking (not goto) exercises client-side navigation and its ?_rsc= fetches.
  await page.getByRole("link", { name: "Chords" }).click();
  await expect(page.getByRole("heading", heading("Chord Compass"))).toBeVisible();
  await page.getByRole("link", { name: "Scales" }).click();
  await expect(page.getByRole("heading", heading("Scale Compass"))).toBeVisible();

  // A URL the build never produced falls back to the Circle, not a browser error page.
  await page.goto("/nowhere/");
  await expect(page.getByRole("heading", heading("Circle of Fifths"))).toBeVisible();
});

test("the manifest is served and installable-shaped", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");
});
```

`tests/e2e/update.spec.ts`:
```ts
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
    await rm(dir, { recursive: true, force: true });
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

    await pill.click();
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(["nomad-e2e000000000"]);
    await expect(pill).toHaveCount(0);
  });
});
```

- [ ] **Step 7: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`
Expected: all PASS. The offline spec passes in both `iphone` and `desktop`. The update spec passes in `desktop` and is skipped in `iphone`.

If the offline spec fails only in the `iphone` (WebKit) project because Playwright's WebKit can't run service workers on this platform, don't weaken the test. Add `test.skip(({ browserName }) => browserName === "webkit", "<the exact error seen>")` to that spec only, and report it in the task summary so it gets checked on a real iPhone.

- [ ] **Step 8: Commit**

```bash
git add lib/sw components/layout app tests public/icons scripts/make-icons.mjs tests/unit/sw-register.test.ts tests/e2e/offline.spec.ts tests/e2e/update.spec.ts
git commit -m "Offline PWA: SW registration, tap-to-update pill, manifest, icons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: CI and CLAUDE.md

**Files:**
- Create: `.github/workflows/ci.yml`, `CLAUDE.md`

**Interfaces:**
- Consumes: the `lint`, `typecheck`, `test:unit` and `test:e2e` scripts; the `iphone` and `desktop` Playwright projects

- [ ] **Step 1: Write the workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

# Nothing here writes to the repo; keep the token read-only.
permissions:
  contents: read

jobs:
  lint-typecheck-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit

  # Independent of the job above: they share nothing, and gating just serializes them.
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # Next's documented build-cache recipe; the build runs inside Playwright's webServer.
      - uses: actions/cache@v4
        with:
          path: ${{ github.workspace }}/.next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('**/*.js', '**/*.mjs', '**/*.ts', '**/*.tsx', '**/*.css') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-
      - run: pnpm exec playwright install --with-deps chromium webkit
      - run: pnpm test:e2e
```

- [ ] **Step 2: Write `CLAUDE.md`**

````markdown
# CLAUDE.md

## Project

Nomad: a personal, mobile-first guitar theory app that digitizes three Noisy Clan "Decoder" tools
(Circle of Fifths, Chord Compass, Scale Compass). `nomad.md` has the product vision. It is a
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
- **Offline (`public/sw.js` + `scripts/build-sw.mjs` + `lib/sw/register.ts`):** after `next build`,
  the script lists every file in `out/` (pages by directory URL) and a content hash into `out/sw.js`.
  The SW precaches everything on install and serves cache-first. A new version waits until the user
  taps the update pill (`SKIP_WAITING` → reload); the app never reloads on its own.
  Registration only happens in production builds.

## Design docs

Features are specced and planned before implementation under `docs/superpowers/specs/` and
`docs/superpowers/plans/`. Each Decoder tool gets its own spec → plan → build cycle.
````

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit`
Expected: clean. (CI itself runs once the repo is pushed to GitHub.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml CLAUDE.md
git commit -m "CI workflow and CLAUDE.md

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
