import type { Metadata } from "next";
import { ProductPage } from "@/views/store/ProductPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbItems, productJsonLd } from "@/lib/structured-data";
import { getCategoryBySlug, getProductBySlug, getProducts } from "@/server/catalog";
import { getStoreSettings } from "@/server/store-settings";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
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
  const [product, products, settings] = await Promise.all([getProductBySlug(slug), getProducts(), getStoreSettings()]);
  if (!product) return <ProductPage related={[]} settings={settings} />;
  const related = products.filter((item) => item.active && item.id !== product.id && item.category === product.category).slice(0, 4);
  const category = await getCategoryBySlug(product.category);
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
      <ProductPage product={product} related={related} settings={settings} />
    </>
  );
}
