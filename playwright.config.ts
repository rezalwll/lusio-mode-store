import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  // Serves a fresh Next production build: `next start` serves only the App
  // Router (no legacy *.html shadowing) on a deterministic test port.
  // Functional E2E must run against `next start`, never `next dev`.
  webServer: {
    command: "npm run build --silent && npx next start --hostname 127.0.0.1 --port 4173",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /screenshots-(desktop|mobile)/,
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      testIgnore: /screenshots-(desktop|mobile)/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "screenshots-desktop",
      testMatch: /screenshots-desktop/,
      // Organized snapshot path. The committed PNGs were generated on
      // Windows and are a LOCAL visual reference only: OS fonts and rendering
      // stacks differ, so these comparisons do not run in CI (see
      // docs/testing.md). Pixel tolerance absorbs antialiasing noise only.
      snapshotPathTemplate: "./tests/e2e/screenshots/{projectName}/{arg}{ext}",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "screenshots-mobile",
      testMatch: /screenshots-mobile/,
      snapshotPathTemplate: "./tests/e2e/screenshots/{projectName}/{arg}{ext}",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
