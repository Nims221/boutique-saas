"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

type StockSummaryItem = {
  label: string;
  value: number | string;
  tone: "neutral" | "warning" | "danger" | "success";
};

type StockProductItem = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  stock: number;
  minStock: number;
  status: "available" | "low" | "critical";
};

type StockMovementItem = {
  id: number;
  productName: string;
  sku: string;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  referenceType: string | null;
  note: string | null;
  createdAt: string;
};

type StockPanelProps = {
  summary?: StockSummaryItem[];
  products?: StockProductItem[];
  movements?: StockMovementItem[];
};

function summaryToneClasses(tone: StockSummaryItem["tone"]) {
  switch (tone) {
    case "danger":
      return "from-rose-50 to-white border-rose-100 dark:from-rose-950/20 dark:to-slate-900 dark:border-rose-900/30";
    case "warning":
      return "from-amber-50 to-white border-amber-100 dark:from-amber-950/20 dark:to-slate-900 dark:border-amber-900/30";
    case "success":
      return "from-emerald-50 to-white border-emerald-100 dark:from-emerald-950/20 dark:to-slate-900 dark:border-emerald-900/30";
    default:
      return "from-slate-50 to-white border-slate-200 dark:from-slate-900 dark:to-slate-900 dark:border-slate-800";
  }
}

function statusBadge(status: StockProductItem["status"]) {
  switch (status) {
    case "critical":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
    case "low":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
    default:
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
}

function statusLabel(status: StockProductItem["status"]) {
  switch (status) {
    case "critical":
      return "Critique";
    case "low":
      return "Faible";
    default:
      return "Disponible";
  }
}

function movementBadge(type: StockMovementItem["movementType"]) {
  switch (type) {
    case "in":
      return {
        label: "Entrée",
        className:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
      };
    case "out":
      return {
        label: "Sortie",
        className:
          "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
      };
    default:
      return {
        label: "Ajustement",
        className:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      };
  }
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR");
}

export default function StockPanel({
  summary = [],
  products = [],
  movements = [],
}: StockPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "critical">("all");

  const safeSummary = Array.isArray(summary) ? summary : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeMovements = Array.isArray(movements) ? movements : [];

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return safeProducts.filter((product) => {
      const matchesQuery =
        !q ||
        [product.name, product.sku, product.category || ""]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "low"
          ? product.status === "low"
          : product.status === "critical";

      return matchesQuery && matchesFilter;
    });
  }, [safeProducts, query, filter]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {safeSummary.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={[
              "rounded-[22px] border p-4 shadow-sm",
              item.tone === "danger"
                ? "border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900"
                : item.tone === "warning"
                ? "border-amber-200 bg-white dark:border-amber-900/30 dark:bg-slate-900"
                : item.tone === "success"
                ? "border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            ].join(" ")}
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <h3 className="mt-3 text-[24px] font-semibold text-slate-900 dark:text-white">
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <GlassCard className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
                Inventaire
              </p>
              <h2 className="mt-2 text-[28px] font-semibold app-text">
                État du stock
              </h2>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[320px]">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 app-text-soft"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="h-11 w-full rounded-2xl border app-border-soft app-muted pl-11 pr-4 text-sm app-text outline-none transition focus:border-indigo-200 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-medium transition",
                    filter === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "border app-border-soft app-muted app-text-soft",
                  ].join(" ")}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilter("low")}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-medium transition",
                    filter === "low"
                      ? "bg-amber-500 text-white"
                      : "border app-border-soft app-muted app-text-soft",
                  ].join(" ")}
                >
                  Faible
                </button>
                <button
                  onClick={() => setFilter("critical")}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-medium transition",
                    filter === "critical"
                      ? "bg-rose-500 text-white"
                      : "border app-border-soft app-muted app-text-soft",
                  ].join(" ")}
                >
                  Critique
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border app-border-soft">
            <div className="hidden grid-cols-[1.6fr_0.9fr_0.7fr_0.7fr_0.8fr] gap-3 app-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] app-text-soft lg:grid">
              <div>Produit</div>
              <div>Catégorie</div>
              <div>Stock</div>
              <div>Seuil</div>
              <div>Statut</div>
            </div>

            <div className="divide-y app-border-soft">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid gap-3 px-4 py-4 lg:grid-cols-[1.6fr_0.9fr_0.7fr_0.7fr_0.8fr] lg:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold app-text">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs app-text-soft">{product.sku}</p>
                  </div>

                  <div className="text-sm app-text-soft">
                    {product.category || "—"}
                  </div>

                  <div className="text-sm font-semibold app-text">
                    {product.stock}
                  </div>

                  <div className="text-sm app-text-soft">{product.minStock}</div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(
                        product.status
                      )}`}
                    >
                      {statusLabel(product.status)}
                    </span>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="px-4 py-8 text-center text-sm app-text-soft">
                  Aucun produit trouvé.
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
                Journal
              </p>
              <h2 className="mt-2 text-[28px] font-semibold app-text">
                Mouvements récents
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl app-muted">
              <SlidersHorizontal size={18} className="app-text-soft" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {safeMovements.map((movement) => {
              const badge = movementBadge(movement.movementType);

              return (
                <div
                  key={movement.id}
                  className="rounded-2xl border app-border-soft app-muted p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold app-text">
                        {movement.productName}
                      </p>
                      <p className="mt-1 text-xs app-text-soft">
                        {movement.sku}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          movement.movementType === "in"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : movement.movementType === "out"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        ].join(" ")}
                      >
                        {movement.movementType === "in" ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium app-text">
                          Quantité : {movement.quantity}
                        </p>
                        <p className="text-xs app-text-soft">
                          {movement.referenceType || "manuel"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs app-text-soft">
                        {formatDate(movement.createdAt)}
                      </p>
                      {movement.note && (
                        <p className="mt-1 max-w-[180px] truncate text-xs app-text-soft">
                          {movement.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {safeMovements.length === 0 && (
              <div className="rounded-2xl border app-border-soft app-muted p-4 text-sm app-text-soft">
                Aucun mouvement récent.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}