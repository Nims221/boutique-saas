"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { createSaleAction } from "@/app/ventes/actions";

type SaleProduct = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  brand?: string | null;
  price: number;
  stock: number;
  active?: boolean;
  imageUrl?: string | null;
  serialType: "none" | "imei" | "serial";
  phoneSimType?: "none" | "sim" | "esim" | "sim_esim";
};

type CartItem = SaleProduct & {
  quantity: number;
  unitPrice: number;
  serialNumbers: string[];
};

type SalesPanelProps = {
  products: SaleProduct[];
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} F CFA`;
}

function getPlaceholderLabel(product: SaleProduct) {
  return product.category || product.name.charAt(0).toUpperCase();
}

function getTrackingLabel(item: SaleProduct) {
  if (item.serialType === "imei") return "IMEI";
  if (item.serialType === "serial") return "Numéro de série";
  return "";
}

function ensureArrayLength(values: string[], length: number) {
  const next = [...values];
  while (next.length < length) next.push("");
  return next.slice(0, length);
}

function getSimLabel(value?: SaleProduct["phoneSimType"]) {
  if (value === "sim") return "SIM";
  if (value === "esim") return "eSIM";
  if (value === "sim_esim") return "SIM + eSIM";
  return null;
}

export function SalesPanel({ products }: SalesPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<UiMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.category || "", product.brand || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const tax = 0;
  const total = subtotal;

  function addToCart(product: SaleProduct) {
    setMessage(null);

    if (product.stock <= 0) {
      setMessage({
        type: "error",
        text: "Produit en rupture.",
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= existing.stock) return prev;

        const nextQuantity = existing.quantity + 1;
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: nextQuantity,
                serialNumbers:
                  item.serialType !== "none"
                    ? ensureArrayLength(item.serialNumbers, nextQuantity)
                    : [],
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          unitPrice: product.price,
          serialNumbers: product.serialType !== "none" ? [""] : [],
        },
      ];
    });
  }

  function increase(id: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.quantity >= item.stock) return item;

        const nextQuantity = item.quantity + 1;

        return {
          ...item,
          quantity: nextQuantity,
          serialNumbers:
            item.serialType !== "none"
              ? ensureArrayLength(item.serialNumbers, nextQuantity)
              : [],
        };
      })
    );
  }

  function decrease(id: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;

          const nextQuantity = Math.max(item.quantity - 1, 0);

          return {
            ...item,
            quantity: nextQuantity,
            serialNumbers:
              item.serialType !== "none"
                ? ensureArrayLength(item.serialNumbers, nextQuantity)
                : [],
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
    setMessage(null);
  }

  function updateUnitPrice(id: number, value: string) {
    const parsed = Number(value || 0);

    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              unitPrice: Number.isFinite(parsed) ? parsed : item.unitPrice,
            }
          : item
      )
    );
  }

  function updateSerialNumber(id: number, index: number, value: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const serialNumbers = [...item.serialNumbers];
        serialNumbers[index] = value;

        return {
          ...item,
          serialNumbers,
        };
      })
    );
  }

  function handleCheckout() {
    if (!cart.length) {
      setMessage({
        type: "error",
        text: "Le panier est vide.",
      });
      return;
    }

    for (const item of cart) {
      if (item.unitPrice <= 0) {
        setMessage({
          type: "error",
          text: `Prix de vente invalide pour ${item.name}.`,
        });
        return;
      }

      if (item.serialType !== "none") {
        const filled = item.serialNumbers.map((v) => v.trim()).filter(Boolean);

        if (filled.length !== item.quantity) {
          setMessage({
            type: "error",
            text: `${item.name} nécessite ${item.quantity} ${getTrackingLabel(item)}.`,
          });
          return;
        }

        const unique = new Set(filled.map((v) => v.toLowerCase()));
        if (unique.size !== filled.length) {
          setMessage({
            type: "error",
            text: `${item.name} contient des ${getTrackingLabel(item)} en double.`,
          });
          return;
        }
      }
    }

    setMessage(null);

    startTransition(async () => {
      const result = await createSaleAction({
        customer_name: customerName || null,
        payment_method: paymentMethod as
          | "cash"
          | "mobile_money"
          | "card"
          | "bank_transfer"
          | "mixed",
        notes: notes || null,
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          serialNumbers: item.serialType !== "none" ? item.serialNumbers : [],
        })),
      });

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.message || "Erreur enregistrement",
        });
        return;
      }

      setCart([]);
      setCustomerName("");
      setPaymentMethod("cash");
      setNotes("");
      setMessage({
        type: "success",
        text: result.message || "Vente enregistrée avec succès.",
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
              Encaissement
            </p>
            <h2 className="mt-2 text-[28px] font-semibold app-text">
              Catalogue produits
            </h2>
          </div>

          <div className="relative w-full lg:w-[340px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 app-text-soft"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="app-search-input h-11 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const inCart = cart.find((item) => item.id === product.id);
            const remaining = product.stock - (inCart?.quantity || 0);
            const simLabel = getSimLabel(product.phoneSimType);

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="
                  rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300
                  hover:-translate-y-1 hover:shadow-md
                  dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800
                "
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                        {getPlaceholderLabel(product)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {product.sku}
                        </p>
                      </div>

                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                        {product.category || "Produit"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {simLabel ? (
                        <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {simLabel}
                        </span>
                      ) : null}

                      {product.serialType !== "none" ? (
                        <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {getTrackingLabel(product)}
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          Standard
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Prix</p>
                       <p className="mt-1 whitespace-nowrap leading-none text-base font-semibold text-slate-900 dark:text-white xl:text-[15px]">
                        {formatAmount(product.price)}
                      </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Stock</p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                          {product.stock}
                        </p>
                        {inCart ? (
                          <p className="mt-1 text-[11px] text-amber-500">
                            Restant : {remaining}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
              Panier
            </p>
            <h2 className="mt-2 text-[28px] font-semibold app-text">
              Vente en cours
            </h2>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white shadow-sm">
            <ShoppingCart size={18} />
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nom du client"
            className="app-input h-11 rounded-2xl px-4 text-sm outline-none"
          />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="app-input h-11 rounded-2xl px-4 text-sm outline-none"
          >
            <option value="cash">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Carte</option>
            <option value="bank_transfer">Virement</option>
            <option value="mixed">Mixte</option>
          </select>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note"
            className="app-input min-h-[84px] rounded-2xl px-4 py-3 text-sm outline-none"
          />
        </div>

        {message && (
          <div
            className={[
              "mt-4 rounded-2xl px-4 py-3 text-sm font-medium",
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {cart.length === 0 ? (
            <div className="rounded-2xl border app-border-soft app-muted p-5 text-sm app-text-soft">
              Aucun produit sélectionné pour le moment.
            </div>
          ) : (
            cart.map((item) => {
              const simLabel = getSimLabel(item.phoneSimType);
              const cannotIncrease = item.quantity >= item.stock;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border app-border-soft app-muted p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                            {getPlaceholderLabel(item)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold app-text">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs app-text-soft">{item.sku}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] app-text-soft">
                          {simLabel ? (
                            <span className="rounded-full border app-border-soft px-2 py-1">
                              {simLabel}
                            </span>
                          ) : null}

                          {item.serialType !== "none" ? (
                            <span className="rounded-full border app-border-soft px-2 py-1">
                              {getTrackingLabel(item)}
                            </span>
                          ) : (
                            <span className="rounded-full border app-border-soft px-2 py-1">
                              Standard
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrease(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border app-border-soft bg-white text-slate-700 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Minus size={15} />
                        </button>

                        <div className="min-w-[48px] text-center text-sm font-semibold app-text">
                          {item.quantity}
                        </div>

                        <button
                          onClick={() => increase(item.id)}
                          disabled={cannotIncrease}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border app-border-soft bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div className="w-[140px]">
                        <label className="mb-1 block text-xs app-text-soft">
                          Prix de vente
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                          className="app-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-xs app-text-soft">
                      Stock dispo : {item.stock}
                      {cannotIncrease ? " • maximum atteint" : ""}
                    </div>

                    {item.serialType !== "none" && (
                      <div className="grid gap-2">
                        <label className="block text-xs app-text-soft">
                          {getTrackingLabel(item)} à renseigner : {item.quantity}
                        </label>

                        {item.serialNumbers.map((serial, index) => (
                          <input
                            key={`${item.id}-${index}`}
                            value={serial}
                            onChange={(e) =>
                              updateSerialNumber(item.id, index, e.target.value)
                            }
                            placeholder={
                              item.serialType === "imei"
                                ? `IMEI ${index + 1}`
                                : `Numéro de série ${index + 1}`
                            }
                            className="app-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                          />
                        ))}
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-xs app-text-soft">Montant</p>
                      <p className="mt-1 whitespace-nowrap leading-none text-sm font-semibold app-text">
                        {formatAmount(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between app-text-soft">
              <span>Sous-total</span>
              <span className="whitespace-nowrap">{formatAmount(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between app-text-soft">
              <span>TVA indicative</span>
              <span className="whitespace-nowrap">{formatAmount(tax)}</span>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center justify-between text-base font-semibold app-text">
              <span>Total</span>
              <span className="whitespace-nowrap">{formatAmount(total)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <button
              onClick={handleCheckout}
              disabled={isPending}
              className="h-11 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {isPending ? "Enregistrement..." : "Encaisser la vente"}
            </button>

            <button
              onClick={clearCart}
              disabled={isPending}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 disabled:opacity-60"
            >
              Vider le panier
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}