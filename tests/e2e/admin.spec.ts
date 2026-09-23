import { expect, test } from "@playwright/test";
import { gotoPage, loginAsAdmin } from "./helpers";

test.describe("authenticated admin smoke", () => {
  test("protected route redirects to the server login", async ({ page }) => {
    await gotoPage(page, "/admin");
    await expect(page.getByRole("heading", { name: "ورود به پنل مدیریت" })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password shows an error and stays logged out", async ({ page }) => {
    await gotoPage(page, "/admin");
    await page.getByLabel("ایمیل مدیر").fill("owner@example.com");
    await page.locator('form input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: "ورود امن به مدیریت" }).click();
    await expect(page.getByText("ایمیل یا رمز عبور صحیح نیست.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ورود به پنل مدیریت" })).toBeVisible();
  });

  test("database user login opens the dashboard", async ({ page }) => {
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

  test("inventory page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await gotoPage(page, "/admin/inventory");
    await expect(page.getByRole("heading", { name: "انبار فروشگاه" })).toBeVisible();
  });
});
