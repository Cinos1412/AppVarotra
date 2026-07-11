"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "./product-card";

export function SimilarProducts({
  category,
  excludeId,
  currentUserId,
}: {
  category: string;
  excludeId: string;
  currentUserId?: string;
}) {
  const products = useQuery(api.products.feed, { category });
  const similar = (products ?? []).filter((p) => p._id !== excludeId).slice(0, 8);

  if (similar.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-display text-lg mb-3">Articles similaires</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {similar.map((p) => (
          <div key={p._id} className="w-40 shrink-0">
            <ProductCard product={p} currentUserId={currentUserId} />
          </div>
        ))}
      </div>
    </div>
  );
}
