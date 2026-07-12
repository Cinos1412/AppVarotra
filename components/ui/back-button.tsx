"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bouton retour standard. `router.back()` par défaut (respecte l'historique
 * réel de navigation) ; passe `fallbackHref` pour forcer une destination
 * fixe (utile si la page peut être ouverte sans historique, ex: lien direct).
 */
export function BackButton({
  fallbackHref,
  label,
  className,
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (fallbackHref) {
      router.push(fallbackHref);
    } else {
      router.back();
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn("flex items-center gap-1 text-white/70 hover:text-white transition-colors -ml-1.5 mb-3", className)}
    >
      <ChevronLeft className="h-5 w-5" />
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
