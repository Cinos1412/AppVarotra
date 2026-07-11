import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark";
}

/**
 * Contrepoint volontaire au `GlassPanel` : surface opaque, bord net, pas de
 * flou. Réservé aux zones où la lisibilité prime sur l'esthétique glass —
 * description produit, bloc vendeur, cartes de statistiques.
 */
export function PremiumCard({ className, variant = "default", children, ...props }: PremiumCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        variant === "default" ? "premium-card" : "premium-card-dark",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
