import { MobileNav } from "@/components/layout/mobile-nav";
import { SalesPanel } from "@/components/sales/sales-panel";
import { getProductsForSales } from "@/services/product.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VentesPage() {
  const products = await getProductsForSales(1);

  return (
    <div className="space-y-5">
      <MobileNav />
      <SalesPanel products={products} />
    </div>
  );
}