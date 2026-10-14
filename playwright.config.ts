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
