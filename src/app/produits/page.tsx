import { MobileNav } from "@/components/layout/mobile-nav";
import ProductsPanel from "@/components/products/products-panel";
import { getProductsPageData } from "@/services/product.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProduitsPage() {
  const data = await getProductsPageData(1);

  return (
    <div className="space-y-5">
      <MobileNav />
      <ProductsPanel
        summary={data.summary}
        products={data.products}
        categories={data.categories}
        brands={data.brands}
      />
    </div>
  );
}