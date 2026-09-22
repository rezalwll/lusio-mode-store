import { expect, test } from "@playwright/test";
import { gotoPage, loginAsAdmin, settleFonts } from "./helpers";

test.describe("screenshot baseline (desktop)", () => {
  test("home", async ({ page }) => {
await gotoPage(page, "/");
    await expect(page.getByRole("heading", { name: "کالکشن تازه، استایل تازه" })).toBeVisible();
    await settleFonts(page);
    await expect(page).toHaveScreenshot("home.png", { animations: "disabled", maxDiffPixels: 500 });
  });

  test("product", async ({ page }) => {
await gotoPage(page, "/product/vans-dior");
    await expect(page.getByRole("heading", { name: "Vans Dior الون" })).toBeVisible();
    await settleFonts(page);
    await expect(page).toHaveScreenshot("product.png", { animations: "disabled", maxDiffPixels: 500 });
  });

  test("admin dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator(".recharts-wrapper").first().waitFor();
    await page.waitForTimeout(2500);
    await settleFonts(page);
    await expect(page).toHaveScreenshot("admin-dashboard.png", {
      animations: "disabled",
      maxDiffPixels: 500,
      // The dashboard eyebrow renders today's date; mask it for determinism.
      // The sales chart is JS-animated (Recharts) and never pixel-stable
      // across runs, so mask it too; layout, sidebar, and metric cards
      // remain covered.
      mask: [
        page.locator("main").getByText(/(شنبه|یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنجشنبه|جمعه)/).first(),
        page.locator(".recharts-wrapper").first(),
      ],
    });
  });
});
