import { expect, test } from "@playwright/test";
import { gotoPage, settleFonts } from "./helpers";

test.describe("screenshot baseline (mobile)", () => {
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

  test("cart", async ({ page }) => {
await gotoPage(page, "/cart");
    await expect(page.getByRole("heading", { name: "سبد خریدت خالی است" })).toBeVisible();
    await settleFonts(page);
    await expect(page).toHaveScreenshot("cart.png", { animations: "disabled", maxDiffPixels: 500 });
  });
});
