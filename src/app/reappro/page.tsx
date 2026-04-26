import { MobileNav } from "@/components/layout/mobile-nav";
import ReapproPanel from "@/components/reappro/reappro-panel";
import { getReapproPageData } from "@/services/reappro.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReapproPage() {
  const data = await getReapproPageData(1);

  return (
    <div className="space-y-5">
      <MobileNav />
      <ReapproPanel
        summary={data.summary}
        products={data.products}
        movements={data.movements}
      />
    </div>
  );
}