"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { BarChart3 } from "lucide-react";

type SalesTrendItem = {
  day: string;
  amount: number;
};

type SalesChartProps = {
  data: SalesTrendItem[];
  total: string;
  average: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function SalesChart({ data, total, average }: SalesChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  const hasRealData = safeData.some((item) => Number(item.amount || 0) > 0);

  return (
    <GlassCard className="rounded-[22px] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] app-text-faint">
            Activité commerciale
          </p>
          <h2 className="mt-2 text-[22px] font-semibold app-text">
            Ventes sur 7 jours
          </h2>
          <p className="mt-2 text-sm app-text-soft">
            Évolution récente du chiffre d’affaires.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-[16px] border app-border-soft app-muted px-4 py-3">
            <p className="text-xs app-text-soft">Total période</p>
            <p className="mt-1 text-[15px] font-semibold app-text">{total}</p>
          </div>

          <div className="rounded-[16px] border app-border-soft app-muted px-4 py-3">
            <p className="text-xs app-text-soft">Moyenne / jour</p>
            <p className="mt-1 text-[15px] font-semibold app-text">{average}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-[240px] rounded-[22px] border app-border-soft app-muted p-4">
        {hasRealData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={safeData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradientCompact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C061FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5B4CF0" stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 6" strokeOpacity={0.14} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) => formatNumber(Number(value))}
              />
              <Tooltip
                formatter={(value) => [
                  `${formatNumber(Number(value))} F CFA`,
                  "Montant",
                ]}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.16)",
                  background: "rgba(15,23,42,0.96)",
                  color: "#fff",
                }}
                labelStyle={{ color: "#cbd5e1" }}
              />

              <Area
                type="monotone"
                dataKey="amount"
                connectNulls
                stroke="#C061FF"
                strokeWidth={3}
                fill="url(#salesGradientCompact)"
                dot={false}
                activeDot={{ r: 5, fill: "#C061FF", stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-[18px] bg-[#081a3a] text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-violet-300">
              <BarChart3 size={24} />
            </div>

            <h3 className="mt-4 text-[18px] font-semibold text-white">
              Aucune vente sur la période
            </h3>

            <p className="mt-2 max-w-[360px] text-sm text-slate-400">
              Les données apparaîtront ici dès que des ventes seront enregistrées.
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}