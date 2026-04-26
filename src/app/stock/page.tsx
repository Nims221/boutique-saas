import StockPanel from "@/components/stock/stock-panel";
import { getStockPageData } from "@/services/stock.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StockPage() {
  const data = await getStockPageData();

  return <StockPanel summary={data.summary} products={data.products} movements={data.movements} />;
}