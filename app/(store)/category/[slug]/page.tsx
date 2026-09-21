import { ShopPage } from "@/views/store/ShopPage";

export default async function CategoryRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ShopPage lockedCategory={slug} />;
}
