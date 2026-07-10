"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/products/product-card";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const results = useQuery(api.products.search, { term });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full h-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] pl-11 pr-4 text-sm focus:outline-none focus:border-ravinala/60"
        />
      </div>

      {term && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {(results ?? []).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {results?.length === 0 && (
            <p className="col-span-full text-center text-white/50 py-10">Aucun résultat pour « {term} ».</p>
          )}
        </div>
      )}
    </div>
  );
}
