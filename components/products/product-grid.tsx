"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "./product-card";

export function ProductGrid({ category, currentUserId }: { category?: string; currentUserId?: string }) {
  const products = useQuery(api.products.feed, { category });

  if (products === undefined) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-3xl bg-white/[0.05] animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-white/60 animate-fade-in">
        <div className="text-4xl mb-3">🌿</div>
        <p>Aucun article ici pour l'instant.</p>
        <p className="text-sm text-white/40 mt-1">Reviens un peu plus tard pour découvrir de nouvelles offres</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
      {products.map((product, index) => (
        <div
          key={product._id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProductCard product={product} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
}
