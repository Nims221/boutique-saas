import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StockItem } from "@/lib/data";

export function StockGrid({ items }: { items: StockItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => (
        <GlassCard key={item.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-white">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">{item.sku} • {item.category}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-500">Stock</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.stock}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-500">Seuil</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.threshold}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Prix vente : <span className="font-medium text-white">{item.price}</span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
