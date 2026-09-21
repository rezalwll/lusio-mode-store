import { expect, type Page } from "@playwright/test";

// DEMO-ONLY ADMIN AUTH BASELINE: logs in with the current client-side demo
// password. Do not treat this as production authentication coverage.
// NOTE: the login form's <label> is not associated with its <input>, so the
// password field is located by form + type instead of by accessible label.
export async function loginAsAdmin(page: Page) {
  await gotoPage(page, "/admin");
  await page.locator('form input[type="password"]').fill("eleven1405");
  await page.getByRole("button", { name: "ورود به مدیریت" }).click();
  await expect(page.getByRole("heading", { name: /سلام، روزت بخیر/ })).toBeVisible();
}

// Central navigation: DOM-ready (not full load) plus blocked external requests.
// Remote catalog imagery and webfonts otherwise stall DOMContentLoaded (a
// pending stylesheet delays module-script execution) and made every navigation
// take ~30s in sandboxed/offline networks. Nothing asserted by the suite
// depends on remote assets or webfonts (local bundled assets still load).
export async function gotoPage(page: Page, path: string) {
  await blockExternalRequests(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

// Settles webfonts/layout before deterministic assertions or screenshots.
export async function settleFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

// Blocks remote catalog imagery and webfonts so tests and screenshots are
// deterministic on any network (local bundled assets still load).
export async function blockExternalRequests(page: Page) {
  await page.route("https://elevenstyle.ir/**", (route) => route.abort());
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
}
