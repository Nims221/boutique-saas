"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingCart,
  Boxes,
  Package,
  RefreshCcw,
  Users,
} from "lucide-react";

type SidebarProps = {
  role?: "admin" | "manager" | "seller";
};

const navItems = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutGrid,
    roles: ["admin", "manager", "seller"],
  },
  {
    href: "/ventes",
    label: "Ventes",
    icon: ShoppingCart,
    roles: ["admin", "manager", "seller"],
  },
  {
    href: "/stock",
    label: "Stock",
    icon: Boxes,
    roles: ["admin", "manager", "seller"],
  },
  {
    href: "/produits",
    label: "Produits",
    icon: Package,
    roles: ["admin", "manager", "seller"],
  },
  {
    href: "/reappro",
    label: "Réapprovisionnement",
    icon: RefreshCcw,
    roles: ["admin", "manager", "seller"],
  },
  {
    href: "/utilisateurs",
    label: "Utilisateurs",
    icon: Users,
    roles: ["admin"],
  },
] as const;

export function Sidebar({ role = "seller" }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-[280px] shrink-0">
      <div className="sticky top-5 flex h-[calc(100vh-40px)] flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white shadow-lg">
            BS
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Retail Suite
            </p>
            <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
              Boutique SaaS
            </p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                  active
                    ? "bg-gradient-to-r from-indigo-600/15 to-violet-600/15 text-indigo-700 dark:text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-2xl border transition",
                    active
                      ? "border-transparent bg-slate-950 text-white dark:bg-slate-900"
                      : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
                  ].join(" ")}
                >
                  <Icon size={18} />
                </div>

                <span className="truncate text-[15px] font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;