"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("theme");

    if (saved === "dark") {
      root.classList.add("dark");
      setTheme("dark");
    } else {
      root.classList.remove("dark");
      setTheme("light");
    }

    setMounted(true);
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = theme === "dark" ? "light" : "dark";

    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", next);
    setTheme(next);
  }

  if (!mounted) {
    return (
      <button className="flex h-11 w-11 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft">
        <Moon size={17} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border app-border-soft app-muted app-text-soft transition hover:app-muted-2"
      aria-label="Basculer le thème"
      title="Basculer le thème"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}