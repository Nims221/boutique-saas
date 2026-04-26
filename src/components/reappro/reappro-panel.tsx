"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { createStockEntryAction } from "@/app/reappro/actions";

type ReapproSummaryItem = {
  label: string;
  value: number | string;
  tone: "neutral" | "warning" | "danger" | "success";
};

type ReapproProductItem = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  stock: number;
  minStock: number;
  costPrice: number;
  imageUrl: string | null;
};

type ReapproMovementItem = {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  note: string | null;
  createdAt: string;
};

type ReapproPanelProps = {
  summary: ReapproSummaryItem[];
  products: ReapproProductItem[];
  movements: ReapproMovementItem[];
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

function summaryToneClasses(tone: ReapproSummaryItem["tone"]) {
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

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR");
}

export default function ReapproPanel({
  summary,
  products,
  movements,
}: ReapproPanelProps) {
  const router = useRouter();
  const [productId, setProductId] = useState<number>(products[0]?.id || 0);
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<UiMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === Number(productId)),
    [products, productId]
  );

  function handleSubmit() {
    const qty = Number(quantity || 0);
    const cost = costPrice ? Number(costPrice) : null;

    if (!productId) {
      setMessage({ type: "error", text: "Sélectionne un produit." });
      return;
    }

    if (qty <= 0) {
      setMessage({ type: "error", text: "Quantité invalide." });
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await createStockEntryAction({
        productId: Number(productId),
        quantity: qty,
        costPrice: cost,
        note: note || null,
      });

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.message || "Erreur pendant l'entrée de stock.",
        });
        return;
      }

      setQuantity("");
      setCostPrice("");
      setNote("");
      setMessage({
        type: "success",
        text: result.message || "Entrée de stock enregistrée.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  {summary.map((item, index) => (
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

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.2fr]">
        <GlassCard className="p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
              Réapprovisionnement
            </p>
            <h2 className="mt-2 text-[28px] font-semibold app-text">
              Entrée de stock
            </h2>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="mb-1 block text-xs app-text-soft">Produit</label>
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="flex items-center gap-3 rounded-2xl border app-border-soft app-muted p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                  {selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold app-text-soft">
                      {selectedProduct.category || "IMG"}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold app-text">
                    {selectedProduct.name}
                  </p>
                  <p className="mt-1 text-xs app-text-soft">
                    Stock actuel : {selectedProduct.stock} • Seuil : {selectedProduct.minStock}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs app-text-soft">Quantité reçue</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs app-text-soft">
                Coût d'achat (optionnel)
              </label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs app-text-soft">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: livraison Apple du matin"
                className="app-input min-h-[90px] w-full rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>

            {message && (
              <div
                className={[
                  "rounded-2xl px-4 py-3 text-sm font-medium",
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
                ].join(" ")}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {isPending ? "Enregistrement..." : "Valider l'entrée de stock"}
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
              Historique
            </p>
            <h2 className="mt-2 text-[28px] font-semibold app-text">
              Dernières réceptions
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {movements.length === 0 ? (
              <div className="rounded-2xl border app-border-soft app-muted p-4 text-sm app-text-soft">
                Aucune entrée récente.
              </div>
            ) : (
              movements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border app-border-soft app-muted p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold app-text">
                        {movement.productName}
                      </p>
                      <p className="mt-1 text-xs app-text-soft">
                        {movement.sku}
                      </p>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      +{movement.quantity}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs app-text-soft">
                      {movement.note || "Entrée manuelle"}
                    </p>
                    <p className="text-xs app-text-soft">
                      {formatDate(movement.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}