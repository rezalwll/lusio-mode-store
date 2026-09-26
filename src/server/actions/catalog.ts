"use server";

import { and, eq, inArray, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { adminAuditLogs, categories, productCategories, productImages, products, productVariants } from "@/db/schema";
import { adminAuditValues, createAdminAuditContext } from "@/server/audit/admin-audit";
import { tomanToRial } from "@/lib/structured-data";
import { requireAdmin } from "@/server/auth/admin-session";
import { assertSameOrigin } from "@/server/security/origin";
import { bulkProductStatusSchema, categoryInputSchema, inventoryInputSchema, productInputSchema, type CategoryInput, type InventoryInput, type ProductInput } from "@/server/validation/catalog";

type MutationResult = { ok: true; id?: number } | { ok: false; message: string };

function mutationError(error: unknown): MutationResult {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "23505") return { ok: false, message: "نامک یا شناسه واردشده تکراری است" };
  if (code === "23503") return { ok: false, message: "این مورد به اطلاعات دیگری وابسته است و قابل تغییر نیست" };
  console.error("catalog mutation failed", error);
  return { ok: false, message: "ذخیره اطلاعات انجام نشد؛ دوباره تلاش کنید" };
}

function refreshCatalog() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/inventory");
}

export async function updateInventoryAction(input: InventoryInput): Promise<MutationResult> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = inventoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "موجودی معتبر نیست" };

  try {
    await getDb().transaction(async (tx) => {
      const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.id, parsed.data.productId)).for("update").limit(1);
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      const existingVariants = await tx.select({ id: productVariants.id }).from(productVariants)
        .where(and(eq(productVariants.productId, product.id), eq(productVariants.active, true)))
        .for("update");

      if (existingVariants.length) {
        const submittedIds = new Set(parsed.data.variants.map((variant) => variant.id));
        if (submittedIds.size !== existingVariants.length || existingVariants.some((variant) => !submittedIds.has(variant.id))) {
          throw new Error("STALE_VARIANTS");
        }
        for (const variant of parsed.data.variants) {
          await tx.update(productVariants).set({ stock: variant.stock, updatedAt: new Date() })
            .where(and(eq(productVariants.id, variant.id), eq(productVariants.productId, product.id)));
        }
        const totalStock = parsed.data.variants.reduce((sum, variant) => sum + variant.stock, 0);
        await tx.update(products).set({ stock: totalStock, updatedAt: new Date() }).where(eq(products.id, product.id));
      } else {
        if (parsed.data.variants.length) throw new Error("STALE_VARIANTS");
        await tx.update(products).set({ stock: parsed.data.stock, updatedAt: new Date() }).where(eq(products.id, product.id));
      }
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "inventory.update", entityType: "product", entityId: product.id, metadata: { variantCount: parsed.data.variants.length } }));
    });
    refreshCatalog();
    return { ok: true, id: parsed.data.productId };
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return { ok: false, message: "محصول پیدا نشد" };
    if (error instanceof Error && error.message === "STALE_VARIANTS") return { ok: false, message: "واریانت‌ها تغییر کرده‌اند؛ صفحه را تازه کنید" };
    return mutationError(error);
  }
}

export async function saveProductAction(input: ProductInput): Promise<MutationResult> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات محصول معتبر نیست" };

  try {
    const id = await getDb().transaction(async (tx) => {
      const categoryRows = await tx.select().from(categories).where(eq(categories.slug, parsed.data.category)).limit(1);
      const category = categoryRows[0];
      if (!category) throw new Error("selected category does not exist");

      let productId = parsed.data.id;
      if (productId) {
        const existing = await tx.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
        if (!existing[0]) throw new Error("product does not exist");
      } else {
        await tx.execute(sql`select pg_advisory_xact_lock(73012001)`);
        const [{ maxId }] = await tx.select({ maxId: max(products.id) }).from(products);
        productId = (maxId ?? 0) + 1;
      }

      const stock = parsed.data.variants.length
        ? parsed.data.variants.reduce((sum, variant) => sum + variant.stock, 0)
        : parsed.data.stock;
      const values = {
        slug: parsed.data.slug,
        name: parsed.data.name,
        sku: parsed.data.sku,
        categorySlug: category.slug,
        categoryName: category.name,
        priceRial: BigInt(tomanToRial(parsed.data.price)),
        regularPriceRial: BigInt(tomanToRial(parsed.data.regularPrice)),
        onSale: parsed.data.regularPrice > parsed.data.price,
        colors: parsed.data.colors,
        sizes: parsed.data.sizes,
        stock,
        active: parsed.data.status === "published",
        featured: parsed.data.featured,
        description: parsed.data.description,
        status: parsed.data.status,
        metaTitle: parsed.data.metaTitle || null,
        metaDescription: parsed.data.metaDescription || null,
        updatedAt: new Date(),
      };

      if (parsed.data.id) await tx.update(products).set(values).where(eq(products.id, productId));
      else await tx.insert(products).values({ id: productId, ...values });

      await tx.delete(productCategories).where(eq(productCategories.productId, productId));
      await tx.insert(productCategories).values({ productId, categoryId: category.id });

      await tx.delete(productImages).where(eq(productImages.productId, productId));
      await tx.insert(productImages).values(parsed.data.images.map((url, position) => ({ productId, url, position })));

      await tx.delete(productVariants).where(eq(productVariants.productId, productId));
      if (parsed.data.variants.length) {
        await tx.insert(productVariants).values(parsed.data.variants.map((variant) => ({
          productId,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        })));
      }
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: parsed.data.id ? "product.update" : "product.create", entityType: "product", entityId: productId, metadata: { status: parsed.data.status } }));
      return productId;
    });
    refreshCatalog();
    return { ok: true, id };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveProductAction(id: number): Promise<MutationResult> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, message: "محصول معتبر نیست" };
  try {
    await getDb().transaction(async (tx) => {
      await tx.update(products).set({ status: "archived", active: false, updatedAt: new Date() }).where(eq(products.id, id));
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "product.archive", entityType: "product", entityId: id }));
    });
    refreshCatalog();
    return { ok: true, id };
  } catch (error) {
    return mutationError(error);
  }
}

export async function bulkProductStatusAction(input: { ids: number[]; status: "published" | "draft" | "archived" }): Promise<MutationResult> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = bulkProductStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "انتخاب محصولات معتبر نیست" };
  try {
    await getDb().transaction(async (tx) => {
      await tx.update(products).set({ status: parsed.data.status, active: parsed.data.status === "published", updatedAt: new Date() }).where(inArray(products.id, parsed.data.ids));
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "product.bulk_status", entityType: "product", metadata: { ids: parsed.data.ids, status: parsed.data.status } }));
    });
    refreshCatalog();
    return { ok: true };
  } catch (error) {
    return mutationError(error);
  }
}

export async function saveCategoryAction(input: CategoryInput): Promise<MutationResult> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات دسته‌بندی معتبر نیست" };
  if (parsed.data.id && parsed.data.parent === parsed.data.id) return { ok: false, message: "دسته‌بندی نمی‌تواند والد خودش باشد" };

  try {
    const id = await getDb().transaction(async (tx) => {
      if (parsed.data.parent > 0) {
        const parent = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.parent)).limit(1);
        if (!parent[0]) throw new Error("parent category does not exist");
      }
      let categoryId = parsed.data.id;
      let previousSlug: string | undefined;
      if (categoryId) {
        const existing = await tx.select({ id: categories.id, slug: categories.slug }).from(categories).where(eq(categories.id, categoryId)).limit(1);
        if (!existing[0]) throw new Error("category does not exist");
        previousSlug = existing[0].slug;
      } else {
        await tx.execute(sql`select pg_advisory_xact_lock(73012002)`);
        const [{ maxId }] = await tx.select({ maxId: max(categories.id) }).from(categories);
        categoryId = (maxId ?? 0) + 1;
      }
      const values = {
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description,
        parentId: parsed.data.parent || null,
        imageUrl: parsed.data.image,
        active: parsed.data.active,
        updatedAt: new Date(),
      };
      if (parsed.data.id) {
        const categoryRows = await tx.select({ id: categories.id, parentId: categories.parentId }).from(categories);
        const parentById = new Map(categoryRows.map((row) => [row.id, row.parentId]));
        let ancestorId: number | null = parsed.data.parent || null;
        while (ancestorId !== null) {
          if (ancestorId === categoryId) return Promise.reject(new Error("category cycle"));
          ancestorId = parentById.get(ancestorId) ?? null;
        }
        await tx.update(categories).set(values).where(eq(categories.id, categoryId));
        await tx.update(products).set({ categorySlug: parsed.data.slug, categoryName: parsed.data.name, updatedAt: new Date() }).where(eq(products.categorySlug, previousSlug!));
      } else {
        await tx.insert(categories).values({ id: categoryId, ...values });
      }
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: parsed.data.id ? "category.update" : "category.create", entityType: "category", entityId: categoryId }));
      return categoryId;
    });
    refreshCatalog();
    return { ok: true, id };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveCategoryAction(id: number): Promise<MutationResult> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, message: "دسته‌بندی معتبر نیست" };
  try {
    const [linked] = await getDb().select({ count: sql<number>`count(*)::int` }).from(productCategories).where(eq(productCategories.categoryId, id));
    if ((linked?.count ?? 0) > 0) return { ok: false, message: `این دسته‌بندی ${linked.count} محصول دارد و قابل بایگانی نیست` };
    await getDb().transaction(async (tx) => {
      await tx.update(categories).set({ active: false, updatedAt: new Date() }).where(eq(categories.id, id));
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "category.archive", entityType: "category", entityId: id }));
    });
    refreshCatalog();
    return { ok: true, id };
  } catch (error) {
    return mutationError(error);
  }
}
