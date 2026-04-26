"use client";

import Link from "next/link";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type HeaderProps = {
  userName?: string;
  userRole?: string;
};

type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  window.localStorage.setItem("theme", theme);
}

export function Header({
  userName = "Utilisateur",
  userRole = "seller",
}: HeaderProps) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const roleLabel =
    userRole === "admin"
      ? "Administrateur"
      : userRole === "manager"
      ? "Manager"
      : "Vendeur";

  return (
    <header className="rounded-[30px] border app-border-soft app-card-strong px-6 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] app-text-faint">
            Vue générale
          </p>
          <h1 className="mt-2 text-[22px] font-semibold app-text">
            Gestion boutique
          </h1>
          <p className="mt-2 text-sm app-text-soft">
            Pilotage des ventes, du stock, des produits et des utilisateurs.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-[340px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 app-text-faint"
            />
            <input
              placeholder="Rechercher un produit, une vente..."
              className="app-search-input h-12 w-full rounded-2xl pl-11 pr-4 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft transition hover:opacity-90"
            aria-label="Changer le thème"
            title="Changer le thème"
          >
            {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-3 rounded-[22px] bg-[#112a57] px-4 py-3 text-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-base font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-white/65">{roleLabel}</p>
            </div>

            <Link
              href="/logout"
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/85 transition hover:bg-white/10"
            >
              Déconnexion
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;