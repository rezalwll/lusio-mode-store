import type { Metadata } from "next";
import { ProductPage } from "@/views/store/ProductPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { initialProducts } from "@/lib/catalog";
import { breadcrumbItems, productJsonLd } from "@/lib/structured-data";
import { initialCategories } from "@/lib/catalog";

function findProduct(slug: string) {
  return initialProducts.find((item) => item.slug === slug && item.active);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) {
    return { title: "محصول پیدا نشد", robots: { index: false, follow: false } };
  }
  const url = `/product/${product.slug}`;
  const description = product.description || `${product.name} | الون استایل`;
  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return <ProductPage slug={slug} />;
  const category = initialCategories.find((item) => item.slug === product.category);
  const crumbs = category
    ? [
        { name: "خانه", path: "/" },
        { name: category.name, path: `/category/${category.slug}` },
        { name: product.name, path: `/product/${product.slug}` },
      ]
    : [
        { name: "خانه", path: "/" },
        { name: product.name, path: `/product/${product.slug}` },
      ];
  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbItems(crumbs)} />
      <ProductPage slug={slug} />
    </>
  );
}
