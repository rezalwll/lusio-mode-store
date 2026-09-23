import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers";

test("persisted cart identifiers hydrate without restoring legacy business state", async ({ page }) => {
  const signals: string[] = [];
  page.on("console", (message) => {
    if (/hydrat|did not match|content does not match|server render/i.test(message.text())) signals.push(message.text());
  });
  page.on("pageerror", (error) => signals.push(String(error)));
  await page.addInitScript(() => {
    window.localStorage.setItem("lusio-mode-store-v2", JSON.stringify({
      state: {
        cart: [{ productId: 19276, size: "40", color: "سرمه ای", quantity: 1 }],
        appliedCoupon: "",
        adminAuthenticated: true,
        products: [{ id: 1, name: "forged" }],
      },
      version: 2,
    }));
  });
  await gotoPage(page, "/cart");
  await expect(page.getByText("Vans Dior الون").first()).toBeVisible();
  expect(signals).toEqual([]);
});
