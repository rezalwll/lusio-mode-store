import { expect, test } from "@playwright/test";
import { gotoPage, loginAsAdmin } from "./helpers";

// DEMO-ONLY ADMIN AUTH BASELINE: the current login is a client-side demo
// password check. These tests pin the existing behavior for migration safety
// and must not be read as production authentication coverage.
test.describe("admin smoke (demo auth baseline)", () => {
  test("login screen renders with the demo hint", async ({ page }) => {
    await gotoPage(page, "/admin");
    await expect(page.getByRole("heading", { name: "ورود به پنل مدیریت" })).toBeVisible();
    await expect(page.getByText("eleven1405")).toBeVisible();
  });

  test("wrong password shows an error and stays logged out", async ({ page }) => {
    await gotoPage(page, "/admin");
    await page.locator('form input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: "ورود به مدیریت" }).click();
    await expect(page.getByText("رمز عبور صحیح نیست.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ورود به پنل مدیریت" })).toBeVisible();
  });

  test("demo login opens the dashboard", async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("products page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await gotoPage(page, "/admin/products");
    await expect(page.getByRole("heading", { name: "مدیریت محصولات" })).toBeVisible();
  });

  test("orders page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await gotoPage(page, "/admin/orders");
    await expect(page.getByRole("heading", { name: "مدیریت سفارش‌ها" })).toBeVisible();
  });

  test("customers page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await gotoPage(page, "/admin/customers");
    await expect(page.getByRole("heading", { name: "مدیریت مشتریان" })).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await gotoPage(page, "/admin/settings");
    await expect(page.getByRole("heading", { name: "تنظیمات و محتوا" })).toBeVisible();
  });
});
