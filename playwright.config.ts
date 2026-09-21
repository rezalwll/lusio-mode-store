import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
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
  // Serves the production build: `dist/` contains only the React app, so
  // extensionless routes (e.g. /cart) always resolve to the SPA fallback.
  // (Against `vite dev`, repo-root legacy *.html files shadow same-name
  // routes: /cart would serve legacy cart.html instead of the React page.)
  webServer: {
    command: "npm run build --silent && npx vite preview --host 127.0.0.1 --port 4173",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
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
      // Platform-independent baseline names so the same committed images
      // verify on any OS (pixel tolerance below absorbs AA differences).
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
