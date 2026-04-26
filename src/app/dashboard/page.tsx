import { MobileNav } from "@/components/layout/mobile-nav";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import * as dashboardService from "@/services/dashboard.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardDataShape = {
  metrics?: Array<{
    label: string;
    value: number;
    delta: number;
    suffix?: string;
  }>;
  salesTrend?: Array<{
    day: string;
    amount: number;
  }>;
  salesSummary?: {
    total?: string;
    average?: string;
  };
  topProducts?: Array<{
    rank: number;
    name: string;
    sku: string;
    amount: string;
    units: string;
  }>;
};

function formatMetricValue(value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat("fr-FR").format(Number(value || 0));
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function toTrend(delta: number) {
  if (delta > 0) return `▲ ${delta}%`;
  if (delta < 0) return `▼ ${Math.abs(delta)}%`;
  return "0%";
}

function toTone(
  label: string,
  delta: number
): "default" | "danger" | "warning" | "success" {
  if (label.toLowerCase().includes("stock")) {
    return Number(delta) < 0 ? "warning" : "success";
  }

  if (delta < 0) return "danger";
  if (delta > 0) return "success";
  return "default";
}

function toProgress(value: number, label: string) {
  if (label.toLowerCase().includes("stock")) {
    return Math.max(10, Math.min(100, Number(value || 0)));
  }

  const normalized = Number(value || 0);
  if (normalized <= 0) return 18;
  if (normalized >= 1000000) return 82;
  if (normalized >= 100000) return 68;
  if (normalized >= 10000) return 54;
  return 36;
}

function getSafeDashboardData(raw: DashboardDataShape | undefined) {
  const metrics = Array.isArray(raw?.metrics)
    ? raw!.metrics.map((item) => ({
        label: item.label,
        value: formatMetricValue(item.value, item.suffix),
        trend: toTrend(Number(item.delta || 0)),
        tone: toTone(item.label, Number(item.delta || 0)),
        progress: toProgress(Number(item.value || 0), item.label),
      }))
    : [];

  const salesTrend = Array.isArray(raw?.salesTrend)
    ? raw!.salesTrend.map((item) => ({
        day: item?.day ?? "",
        amount: Number(item?.amount ?? 0),
      }))
    : [];

  const salesSummary = {
    total: raw?.salesSummary?.total || "0 F CFA",
    average: raw?.salesSummary?.average || "0 F CFA",
  };

  const topProducts = Array.isArray(raw?.topProducts) ? raw!.topProducts : [];

  return {
    metrics,
    salesTrend,
    salesSummary,
    topProducts,
  };
}

export default async function DashboardPage() {
  const rawData =
    (await dashboardService.getDashboardPageData?.()) ||
    (await dashboardService.getDashboardData?.()) ||
    (await dashboardService.getDashboard?.());

  const data = getSafeDashboardData(rawData);

  return (
    <div className="space-y-5">
      <MobileNav />

      <KpiGrid items={data.metrics} />

      <div className="grid gap-5 xl:grid-cols-[1.8fr_1.1fr]">
        <SalesChart
          data={data.salesTrend}
          total={data.salesSummary.total}
          average={data.salesSummary.average}
        />

        <TopProducts items={data.topProducts} />
      </div>
    </div>
  );
}