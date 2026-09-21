import { ProductPage } from "@/views/store/ProductPage";

export default async function ProductRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductPage slug={slug} />;
}
