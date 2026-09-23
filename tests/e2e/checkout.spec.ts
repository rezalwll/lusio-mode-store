import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers";

test.describe("server-owned checkout", () => {
  test("product → cart → checkout → confirmation", async ({ page }) => {
    await gotoPage(page, "/product/vans-dior");
    await expect(page.getByRole("heading", { name: "Vans Dior الون" })).toBeVisible();
    await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();

    await gotoPage(page, "/cart");
    await expect(page.getByRole("heading", { name: /سبد خرید/ }).first()).toBeVisible();
    await page.getByRole("link", { name: "ادامه و تسویه حساب" }).click();

    await expect(page.getByRole("heading", { name: "تکمیل و ثبت سفارش" })).toBeVisible();
    await page.getByLabel("نام", { exact: true }).fill("تست");
    await page.getByLabel("نام خانوادگی").fill("کاربر");
    await page.getByLabel("شماره موبایل").fill("09123456789");
    await page.getByLabel("استان").fill("تهران");
    await page.getByLabel("شهر").fill("تهران");
    await page.getByLabel("کد پستی").fill("1234567890");
    await page.getByLabel("نشانی کامل").fill("خیابان ولیعصر، کوچه یاس، پلاک ۱۰");

    await page.getByRole("button", { name: "ثبت سفارش" }).click();

    await expect(page.getByRole("heading", { name: "سفارش شما ثبت شد" })).toBeVisible();
    await expect(page.getByText("شماره سفارش:")).toBeVisible();
    await expect(page.getByText("در انتظار پرداخت", { exact: true })).toBeVisible();
    await expect(page.getByText(/هیچ پرداخت موفقی شبیه‌سازی نشده است/)).toBeVisible();
  });
});
