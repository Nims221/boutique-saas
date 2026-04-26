import { GlassCard } from "@/components/ui/glass-card";

type StockAlertItem = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  status: "low" | "critical";
};

type StockAlertsProps = {
  items?: StockAlertItem[];
};

function badgeClass(status: StockAlertItem["status"]) {
  return status === "critical"
    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
}

function badgeLabel(status: StockAlertItem["status"]) {
  return status === "critical" ? "Critique" : "Faible";
}

export function StockAlerts({ items = [] }: StockAlertsProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-500">
            Alertes
          </p>
          <h3 className="mt-2 text-[28px] font-semibold app-text">
            Produits à surveiller
          </h3>
        </div>
        <div className="text-sm app-text-soft">{items.length} articles</div>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border app-border-soft app-muted p-4 text-sm app-text-soft">
            Aucun produit critique pour le moment.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border app-border-soft app-muted px-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium app-text">
                  {item.sku} • {item.name}
                </p>
                <p className="mt-1 text-xs app-text-soft">
                  Stock: {item.stock} • Seuil: {item.threshold}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(
                  item.status
                )}`}
              >
                {badgeLabel(item.status)}
              </span>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}