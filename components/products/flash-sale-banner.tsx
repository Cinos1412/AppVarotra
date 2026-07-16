"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "./product-card";
import { formatCountdown } from "@/lib/utils";
import { Zap } from "lucide-react";

export function FlashSaleBanner({ currentUserId }: { currentUserId?: string }) {
  const flashSales = useQuery(api.products.flashSales);
  const [, forceTick] = useState(0);

  // Force un re-render chaque seconde pour que les décomptes restent à jour.
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!flashSales || flashSales.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-4 md:px-0">
        <Zap className="h-4 w-4 text-corail fill-corail" />
        <h2 className="font-display text-lg">Ventes flash</h2>
        <span className="text-xs text-white/50 ml-auto">
          {formatCountdown(Math.min(...flashSales.map((p) => p.promoEndsAt!)))} restant
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-0 pb-1">
        {flashSales.map((p) => (
          <div key={p._id} className="w-44 shrink-0">
            <ProductCard product={p} currentUserId={currentUserId} />
          </div>
        ))}
      </div>
    </div>
  );
}
