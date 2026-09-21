import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers";

// PERSISTED-STATE HYDRATION REGRESSION — REMOVE/REWORK WHEN REAL AUTH
// REPLACES LOCALSTORAGE AUTH.
// Seeds a returning user's persisted Zustand payload, then proves the admin
// session restores AFTER mount with no React/Next hydration mismatch. The
// store uses skipHydration + post-mount rehydrate so the first server and
// client renders both use default state.
test.describe("persisted-state hydration", () => {
  test("returning admin session restores after mount without hydration mismatch", async ({ page }) => {
    const signals: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      if (/hydrat|did not match|content does not match|server render/i.test(text)) signals.push(text);
    });
    page.on("pageerror", (error) => signals.push(String(error)));

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "lusio-mode-store-v2",
        JSON.stringify({ state: { adminAuthenticated: true }, version: 0 }),
      );
    });

    await gotoPage(page, "/admin");
    await expect(page.getByRole("heading", { name: /سلام، روزت بخیر/ })).toBeVisible();
    expect(signals).toEqual([]);
  });
});
