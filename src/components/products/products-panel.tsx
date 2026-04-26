"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Layers3, Tag, Plus, Pencil, Power } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  createProductAction,
  toggleProductActiveAction,
  updateProductAction,
} from "@/app/produits/actions";

type ProductSummaryItem = {
  label: string;
  value: string | number;
  tone: "neutral" | "warning" | "danger" | "success";
};

type ProductOptionItem = {
  id: number;
  name: string;
};

type ProductItem = {
  id: number;
  name: string;
  sku: string;
  categoryId?: number | null;
  brandId?: number | null;
  category: string | null;
  brand: string | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  imageUrl: string | null;
  serialType: "none" | "imei" | "serial";
  phoneSimType: "none" | "sim" | "esim" | "sim_esim";
};

type ProductsPanelProps = {
  summary: ProductSummaryItem[];
  products: ProductItem[];
  categories: ProductOptionItem[];
  brands: ProductOptionItem[];
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

type FormState = {
  id?: number;
  name: string;
  categoryId: string;
  brandId: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  imageUrl: string;
  phoneSimType: "none" | "sim" | "esim" | "sim_esim";
};

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} F CFA`;
}

function summaryToneClasses(tone: ProductSummaryItem["tone"]) {
  switch (tone) {
    case "danger":
      return "border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900";
    case "warning":
      return "border-amber-200 bg-white dark:border-amber-900/30 dark:bg-slate-900";
    case "success":
      return "border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900";
    default:
      return "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
  }
}

function stockTone(stock: number) {
  if (stock <= 0) return "text-rose-600 dark:text-rose-300";
  if (stock <= 5) return "text-amber-600 dark:text-amber-300";
  return "text-emerald-600 dark:text-emerald-300";
}

function getEmptyForm(): FormState {
  return {
    name: "",
    categoryId: "",
    brandId: "",
    price: "",
    costPrice: "",
    stock: "",
    minStock: "",
    imageUrl: "",
    phoneSimType: "none",
  };
}

function getEditForm(product: ProductItem): FormState {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId ? String(product.categoryId) : "",
    brandId: product.brandId ? String(product.brandId) : "",
    price: String(product.price),
    costPrice: String(product.costPrice),
    stock: String(product.stock),
    minStock: String(product.minStock),
    imageUrl: product.imageUrl || "",
    phoneSimType: product.phoneSimType || "none",
  };
}

function isPhoneCategory(categoryName?: string | null) {
  if (!categoryName) return false;
  const normalized = categoryName.toLowerCase();
  return (
    normalized.includes("iphone") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("téléphone")
  );
}

export default function ProductsPanel({
  summary,
  products,
  categories,
  brands,
}: ProductsPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "low-stock">("all");
  const [message, setMessage] = useState<UiMessage | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(getEmptyForm());
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const selectedCategory = categories.find(
    (item) => String(item.id) === form.categoryId
  );
  const isPhone = isPhoneCategory(selectedCategory?.name);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !q ||
        [product.name, product.sku, product.category || "", product.brand || ""]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
          ? product.active
          : product.stock <= 5;

      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = product.category || "Sans catégorie";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [products]);

  const lowStockItems = useMemo(
    () => products.filter((p) => p.stock <= 5).slice(0, 4),
    [products]
  );

  function openCreateForm() {
    setForm(getEmptyForm());
    setMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(product: ProductItem) {
    setForm(getEditForm(product));
    setMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setForm(getEmptyForm());
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setMessage({
          type: "error",
          text: result.message || "Erreur pendant l'upload.",
        });
        return;
      }

      updateForm("imageUrl", result.url);
      setMessage({
        type: "success",
        text: "Image uploadée avec succès.",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({
        type: "error",
        text: "Erreur serveur pendant l'upload de l'image.",
      });
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  function handleSubmit() {
    setMessage(null);

    startTransition(async () => {
      const payload = {
        id: form.id,
        name: form.name,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        brandId: form.brandId ? Number(form.brandId) : null,
        price: Number(form.price || 0),
        costPrice: Number(form.costPrice || 0),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0),
        imageUrl: form.imageUrl || null,
        phoneSimType: isPhone ? form.phoneSimType : "none",
      };

      const result = form.id
        ? await updateProductAction(payload)
        : await createProductAction(payload);

      if (!result.success) {
        setMessage({ type: "error", text: result.message });
        return;
      }

      setMessage({ type: "success", text: result.message });
      closeForm();
      router.refresh();
    });
  }

  function handleToggle(product: ProductItem) {
    setMessage(null);

    startTransition(async () => {
      const result = await toggleProductActiveAction(product.id, !product.active);

      if (!result.success) {
        setMessage({ type: "error", text: result.message });
        return;
      }

      setMessage({ type: "success", text: result.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
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

      <GlassCard className="rounded-[24px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
              Catalogue
            </p>
            <h2 className="mt-2 text-[28px] font-semibold app-text">
              Références produits
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
                className="app-search-input h-11 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition focus:border-indigo-300"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Tous" },
                { key: "active", label: "Actifs" },
                { key: "low-stock", label: "Stock faible" },
              ].map((item) => {
                const active = filter === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      setFilter(item.key as "all" | "active" | "low-stock")
                    }
                    className={[
                      "rounded-2xl px-4 py-2 text-sm font-medium transition",
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                        : "border app-border-soft app-muted app-text-soft",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-sm"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="
                rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm
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
                      {product.category || "IMG"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {product.sku}
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium",
                        product.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {product.active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800/70">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Catégorie</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                        {product.category || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800/70">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Marque</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                        {product.brand || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Prix vente</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {formatAmount(product.price)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Stock</p>
                      <p className={`mt-1 text-sm font-semibold ${stockTone(product.stock)}`}>
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {product.phoneSimType !== "none"
                        ? `SIM : ${product.phoneSimType}`
                        : product.serialType === "imei"
                        ? "Téléphone"
                        : product.serialType === "serial"
                        ? "N° série"
                        : "Standard"}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(product)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>

                      <button
                        onClick={() => handleToggle(product)}
                        disabled={isPending}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <Power size={14} />
                        {product.active ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full rounded-2xl border app-border-soft app-muted p-8 text-center text-sm app-text-soft">
              Aucun produit trouvé.
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
        <GlassCard className="rounded-[22px] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Package size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
                Catalogue
              </p>
              <h3 className="mt-1 text-[24px] font-semibold app-text">
                Produits récents
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {products.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border app-border-soft app-muted px-4 py-3"
              >
                <p className="text-sm font-medium app-text">{item.name}</p>
                <p className="mt-1 text-xs app-text-soft">{item.sku}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="rounded-[22px] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
              <Layers3 size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
                Catégories
              </p>
              <h3 className="mt-1 text-[24px] font-semibold app-text">
                Répartition
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {categoryCounts.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl border app-border-soft app-muted px-4 py-3"
              >
                <span className="text-sm font-medium app-text">{name}</span>
                <span className="text-sm app-text-soft">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="rounded-[22px] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
              <Tag size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
                Surveillance
              </p>
              <h3 className="mt-1 text-[24px] font-semibold app-text">
                Stock faible
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {lowStockItems.length === 0 ? (
              <div className="rounded-2xl border app-border-soft app-muted px-4 py-3 text-sm app-text-soft">
                Aucun produit en stock faible.
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border app-border-soft app-muted px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium app-text">{item.name}</p>
                    <p className="mt-1 text-xs app-text-soft">{item.sku}</p>
                  </div>
                  <span className={`text-sm font-semibold ${stockTone(item.stock)}`}>
                    {item.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[28px] border app-border-soft bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] app-text-soft">
                  Produit
                </p>
                <h3 className="mt-2 text-[28px] font-semibold app-text">
                  {form.id ? "Modifier le produit" : "Ajouter un produit"}
                </h3>
              </div>

              <button
                onClick={closeForm}
                className="rounded-2xl border app-border-soft app-muted px-4 py-2 text-sm font-medium app-text"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs app-text-soft">Nom</label>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">SKU</label>
                <div className="flex h-11 items-center rounded-2xl border app-border-soft app-muted px-4 text-sm app-text-soft">
                  Généré automatiquement après enregistrement
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">Catégorie</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateForm("categoryId", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                >
                  <option value="">Aucune</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">Marque</label>
                <select
                  value={form.brandId}
                  onChange={(e) => updateForm("brandId", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                >
                  <option value="">Aucune</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">Prix de vente</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">Coût d'achat</label>
                <input
                  type="number"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => updateForm("costPrice", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">Stock initial / actuel</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => updateForm("stock", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs app-text-soft">Stock minimum</label>
                <input
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) => updateForm("minStock", e.target.value)}
                  className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs app-text-soft">Image produit</label>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => updateForm("imageUrl", e.target.value)}
                    placeholder="/uploads/products/mon-image.jpg"
                    className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                  />

                  <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border app-border-soft app-muted px-4 text-sm font-medium app-text">
                    {isUploadingImage ? "Upload..." : "Choisir une image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {form.imageUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border app-border-soft app-muted p-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={form.imageUrl}
                        alt="Preview produit"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium app-text">Aperçu image</p>
                      <p className="truncate text-xs app-text-soft">{form.imageUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              {isPhone && (
                <div>
                  <label className="mb-1 block text-xs app-text-soft">Type SIM</label>
                  <select
                    value={form.phoneSimType}
                    onChange={(e) =>
                      updateForm(
                        "phoneSimType",
                        e.target.value as "none" | "sim" | "esim" | "sim_esim"
                      )
                    }
                    className="app-input h-11 w-full rounded-2xl px-4 text-sm outline-none"
                  >
                    <option value="none">Non défini</option>
                    <option value="sim">SIM</option>
                    <option value="esim">eSIM</option>
                    <option value="sim_esim">SIM + eSIM</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex h-11 items-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {isPending
                  ? "Enregistrement..."
                  : form.id
                  ? "Mettre à jour"
                  : "Créer le produit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}