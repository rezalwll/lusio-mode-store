import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers";

test.describe("seo smoke", () => {
  test("home has server title and absolute canonical", async ({ page }) => {
    await gotoPage(page, "/");
    await expect(page).toHaveTitle(/الون استایل/);
    const canonical = page.locator('link[rel="canonical"]');
    // Next normalizes the root "/" canonical to the bare origin.
    await expect(canonical).toHaveAttribute("href", "https://elevenstyle.ir");
  });

  test("product has specific title, canonical, and consistent JSON-LD offer", async ({ page }) => {
    await gotoPage(page, "/product/vans-dior");
    const visibleName = await page.getByRole("heading", { name: "Vans Dior الون" }).textContent();
    await expect(page).toHaveTitle(/Vans Dior الون/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://elevenstyle.ir/product/vans-dior",
    );

    const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ldJson?.length).toBeGreaterThan(0);
    const products = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "{}")));
    const product = products.find((item) => item["@type"] === "Product");
    expect(product.name).toBe(visibleName?.trim());
    expect(product.offers.priceCurrency).toBe("IRR");
    // Internal catalog prices are Toman; IRR output must be exactly x10.
    expect(product.offers.price).toBe(2_498_000 * 10);
  });

  test("category has specific title and canonical", async ({ page }) => {
    await gotoPage(page, "/category/men-shirt");
    await expect(page.getByRole("heading", { name: "پیراهن مردانه" })).toBeVisible();
    await expect(page).toHaveTitle(/پیراهن مردانه/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://elevenstyle.ir/category/men-shirt",
    );
  });

  test("admin is noindex", async ({ page }) => {
    await gotoPage(page, "/admin");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("robots.txt allows storefront, blocks admin, and names the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("Sitemap: https://elevenstyle.ir/sitemap.xml");
    expect(body).toContain("/admin/");
    expect(body).not.toContain("/product/");
  });

  test("sitemap lists catalog URLs and excludes private routes", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("https://elevenstyle.ir/product/vans-dior");
    expect(body).toContain("https://elevenstyle.ir/category/men-shirt");
    expect(body).toContain("https://elevenstyle.ir/shop");
    expect(body).not.toContain("/admin");
    expect(body).not.toContain("/checkout");
    expect(body).not.toContain("/cart");
  });

  test("product SEO payload is server-rendered HTML, not client-injected", async ({ request }) => {
    const html = await (await request.get("/product/vans-dior")).text();
    expect(html).toContain("<title>");
    expect(html).toContain("Vans Dior الون");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("https://elevenstyle.ir/product/vans-dior");
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"priceCurrency":"IRR"');
  });

  test("pages make no Google Fonts requests", async ({ page }) => {
    const fontRequests: string[] = [];
    page.on("request", (req) => {
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(req.url())) fontRequests.push(req.url());
    });
    await gotoPage(page, "/");
    await gotoPage(page, "/product/vans-dior");
    expect(fontRequests).toEqual([]);
  });
});
