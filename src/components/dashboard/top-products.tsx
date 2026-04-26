import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { ImageIcon } from "lucide-react";

type TopProductItem = {
  rank: number;
  name: string;
  sku: string;
  amount: string;
  units: string;
  imageUrl?: string | null;
};

type TopProductsProps = {
  items: TopProductItem[];
};

function rankStyle(rank: number) {
  if (rank === 1) return "from-[#6D5DFB] to-[#8B5CF6]";
  if (rank === 2) return "from-[#5B4CF0] to-[#7C3AED]";
  if (rank === 3) return "from-[#4F46E5] to-[#6D28D9]";
  return "from-slate-500 to-slate-600";
}

export function TopProducts({ items }: TopProductsProps) {
  return (
    <GlassCard className="rounded-[22px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] app-text-faint">
            Classement
          </p>
          <h2 className="mt-2 text-[22px] font-semibold app-text">
            Top produits
          </h2>
        </div>

        <div className="rounded-full border app-border-soft app-muted px-4 py-2 text-sm app-text-soft">
          30 jours
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.rank}-${item.sku}`}
            className="
              rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-sm
              dark:border-slate-800 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800
            "
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-sm font-semibold text-white ${rankStyle(
                      item.rank
                    )}`}
                  >
                    <ImageIcon size={18} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                  {item.name}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {item.sku}
                  </span>

                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                    #{item.rank}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="whitespace-nowrap text-[15px] font-semibold text-slate-900 dark:text-white">
                  {item.amount}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {item.units}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default TopProducts;