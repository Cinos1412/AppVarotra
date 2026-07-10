import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  intensity?: "soft" | "strong";
}

/**
 * Brique de base du design "Liquid Glass" : fond translucide + flou +
 * bordure fine simulant le verre + reflet spéculaire en haut du panneau.
 * Tous les autres composants (cartes produit, nav, modales) s'appuient dessus.
 */
export function GlassPanel({
  className,
  intensity = "soft",
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass rounded-3xl overflow-hidden",
        intensity === "strong" && "bg-white/[0.11] backdrop-blur-2xl",
        className,
      )}
      {...props}
    >
      <div className="glass-specular absolute inset-x-0 top-0 h-1/2 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}
