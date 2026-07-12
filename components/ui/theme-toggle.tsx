"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Évite le mismatch d'hydratation (le thème réel n'est connu qu'au montage)
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn("h-9 w-9", className)} />;

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={cn("h-9 w-9 rounded-full glass flex items-center justify-center", className)}
      aria-label="Changer de thème"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
