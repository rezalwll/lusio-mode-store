import type { Metadata } from "next";
import { ShopPage } from "@/views/store/ShopPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { initialCategories } from "@/lib/catalog";
import { breadcrumbItems } from "@/lib/structured-data";

function findCategory(slug: string) {
  return initialCategories.find((item) => item.slug === slug && item.active);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) {
    return { title: "دسته‌بندی پیدا نشد", robots: { index: false, follow: false } };
  }
  const url = `/category/${category.slug}`;
  const description = category.description || `مشاهده محصولات ${category.name} در الون استایل`;
  return {
    title: category.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: category.name, description, url },
  };
}

export default async function CategoryRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = findCategory(slug);
  const crumbs = category
    ? [
        { name: "خانه", path: "/" },
        { name: category.name, path: `/category/${category.slug}` },
      ]
    : [{ name: "خانه", path: "/" }];
  return (
    <>
      <JsonLd data={breadcrumbItems(crumbs)} />
      <ShopPage lockedCategory={slug} />
    </>
  );
}
