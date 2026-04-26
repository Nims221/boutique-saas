type MetricItem = {
  label: string;
  value: string | number;
  trend?: string;
  tone?: "default" | "danger" | "warning" | "success";
  progress?: number;
};

type KpiGridProps = {
  items: MetricItem[];
};

function trendClasses(tone?: MetricItem["tone"]) {
  switch (tone) {
    case "danger":
      return "bg-rose-100 text-rose-500 dark:bg-rose-950/30 dark:text-rose-300";
    case "warning":
      return "bg-amber-100 text-amber-500 dark:bg-amber-950/30 dark:text-amber-300";
    case "success":
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300";
    default:
      return "bg-violet-100 text-violet-500 dark:bg-violet-950/30 dark:text-violet-300";
  }
}

function progressClasses(tone?: MetricItem["tone"]) {
  switch (tone) {
    case "danger":
      return "from-rose-500 to-pink-500";
    case "warning":
      return "from-amber-500 to-orange-500";
    case "success":
      return "from-emerald-500 to-teal-500";
    default:
      return "from-[#5B4CF0] to-[#D946EF]";
  }
}

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="app-card rounded-[22px] px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm app-text-soft">{item.label}</p>

            {item.trend ? (
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  trendClasses(item.tone),
                ].join(" ")}
              >
                {item.trend}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-[20px] font-semibold app-text xl:text-[22px]">
            {item.value}
          </h3>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={[
                "h-full rounded-full bg-gradient-to-r",
                progressClasses(item.tone),
              ].join(" ")}
              style={{ width: `${item.progress ?? 65}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}