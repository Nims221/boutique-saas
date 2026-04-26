"use client";

import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function MobileNav() {
  return (
    <div className="xl:hidden">
      <div className="mb-4 rounded-[22px] border app-surface p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] app-text-soft">
              Boutique
            </p>
            <h2 className="mt-1 text-lg font-semibold app-text">
              Boutique SaaS
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft">
              <Search size={16} />
            </button>
            <ThemeToggle />
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft">
              <Bell size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}