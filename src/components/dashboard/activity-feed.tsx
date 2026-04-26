import { ShoppingCart, RefreshCcw } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  amount: string;
  type: "sale" | "purchase";
};

type ActivityFeedProps = {
  items: ActivityItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <GlassCard className="rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-violet-500">
            Activité
          </p>
          <h2 className="mt-2 text-[24px] font-semibold app-text">
            Flux récent
          </h2>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft">
          <RefreshCcw size={16} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const isSale = item.type === "sale";

          return (
            <div
              key={item.id}
              className="rounded-[20px] border app-border-soft app-muted px-4 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1b2740] text-white dark:bg-[#0b1226]">
                  {isSale ? <ShoppingCart size={17} /> : <RefreshCcw size={17} />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold app-text">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm app-text-soft">{item.subtitle}</p>
                  <p className="mt-1 text-sm app-text-soft">{item.time}</p>
                </div>

                <div className="text-right text-[15px] font-semibold app-text">
                  {item.amount}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}