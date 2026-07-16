"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/products/product-card";
import { BackButton } from "@/components/ui/back-button";
import { GlassButton } from "@/components/ui/glass-button";
import { PremiumCard } from "@/components/ui/premium-card";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = ["Tech", "Mode", "Maison", "Jeux", "Sport", "Autre"];
const STATES = ["Neuf", "Très bon état", "Bon état", "Correct"];
const SORTS = [
  { id: "recent", label: "Plus récent" },
  { id: "price_asc", label: "Prix croissant" },
  { id: "price_desc", label: "Prix décroissant" },
  { id: "popular", label: "Plus aimés" },
] as const;

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [state, setState] = useState<string | undefined>();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<(typeof SORTS)[number]["id"]>("recent");

  const activeFilterCount = [category, state, minPrice, maxPrice].filter(Boolean).length;
  const hasQuery = term.trim().length > 0 || activeFilterCount > 0;

  const results = useQuery(
    api.products.browse,
    hasQuery
      ? {
          term: term.trim() || undefined,
          category,
          state,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sortBy,
        }
      : "skip",
  );

  function resetFilters() {
    setCategory(undefined);
    setState(undefined);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recent");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <BackButton />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full h-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] pl-11 pr-4 text-sm focus:outline-none focus:border-ravinala/60"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "relative h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
            showFilters || activeFilterCount > 0 ? "bg-ravinala text-white" : "glass text-white/70",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-corail text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <PremiumCard className="p-5 mb-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-sm">Filtres</h2>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-corail">
                <X className="h-3 w-3" /> Réinitialiser
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-white/50 mb-2 block">Catégorie</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? undefined : c)}
                    className={cn("rounded-full px-3 py-1.5 text-xs", category === c ? "bg-white text-ink" : "bg-white/[0.06] text-white/70")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-white/50 mb-2 block">État</span>
              <div className="flex flex-wrap gap-2">
                {STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setState(state === s ? undefined : s)}
                    className={cn("rounded-full px-3 py-1.5 text-xs", state === s ? "bg-white text-ink" : "bg-white/[0.06] text-white/70")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-white/50 mb-2 block">Prix (Ar)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full h-10 rounded-xl bg-white/[0.06] border border-white/[0.12] px-3 text-sm"
                />
                <span className="text-white/30">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full h-10 rounded-xl bg-white/[0.06] border border-white/[0.12] px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <span className="text-xs text-white/50 mb-2 block">Trier par</span>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id)}
                    className={cn("rounded-full px-3 py-1.5 text-xs", sortBy === s.id ? "bg-ravinala text-white" : "bg-white/[0.06] text-white/70")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PremiumCard>
      )}

      {hasQuery && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 stagger-children">
          {(results ?? []).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {results?.length === 0 && (
            <p className="col-span-full text-center text-white/50 py-10">Aucun résultat.</p>
          )}
        </div>
      )}
    </div>
  );
}
