import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers";

test.describe("storefront smoke", () => {
  test("home renders the hero", async ({ page }) => {
    await gotoPage(page, "/");
    await expect(page.getByRole("heading", { name: "کالکشن تازه، استایل تازه" })).toBeVisible();
  });

  test("shop renders the catalog", async ({ page }) => {
    await gotoPage(page, "/shop");
    await expect(page.getByRole("heading", { name: "همه محصولات" })).toBeVisible();
  });

  test("category page renders a real category", async ({ page }) => {
    await gotoPage(page, "/category/men-shirt");
    await expect(page.getByRole("heading", { name: "پیراهن مردانه" })).toBeVisible();
  });

  test("product page renders a real product", async ({ page }) => {
    await gotoPage(page, "/product/vans-dior");
    await expect(page.getByRole("heading", { name: "Vans Dior الون" })).toBeVisible();
    await expect(page.getByRole("button", { name: "افزودن به سبد خرید" })).toBeVisible();
  });

  test("cart renders the empty state", async ({ page }) => {
    await gotoPage(page, "/cart");
    await expect(page.getByRole("heading", { name: "سبد خریدت خالی است" })).toBeVisible();
  });

  test("checkout renders the empty-cart state", async ({ page }) => {
    await gotoPage(page, "/checkout");
    await expect(page.getByRole("heading", { name: "سبد خرید خالی است" })).toBeVisible();
  });

  test("account renders the login prompt", async ({ page }) => {
    await gotoPage(page, "/account");
    await expect(page.getByRole("heading", { name: "ورود امن به حساب" })).toBeVisible();
  });

  test("tracking renders the lookup form", async ({ page }) => {
    await gotoPage(page, "/tracking");
    await expect(page.getByRole("heading", { name: "پیگیری امن سفارش" })).toBeVisible();
  });
});
