"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { PremiumCard } from "@/components/ui/premium-card";
import { formatAriary, cn } from "@/lib/utils";
import { Search, Eye, EyeOff } from "lucide-react";

function ProductsContent() {
  const [search, setSearch] = useState("");
  const products = useQuery(api.admin.allProducts, { search: search || undefined });
  const toggleActive = useMutation(api.admin.toggleProductActive);

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] pl-11 pr-4 text-sm focus:outline-none focus:border-ravinala/60"
        />
      </div>

      {products === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer-bg" />)}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {products.map((p) => (
            <PremiumCard key={p._id} className={cn("p-3.5 flex items-center gap-3", !p.isActive && "opacity-50")}>
              <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0">
                <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${p._id}`} className="text-sm font-medium truncate hover:underline block">{p.title}</Link>
                <p className="text-xs text-white/45">
                  {p.seller?.displayName} · {formatAriary(p.price)}
                  {p.moderationStatus === "flagged_for_review" && <span className="text-vanille ml-1">· à vérifier</span>}
                </p>
              </div>
              <button
                onClick={() => toggleActive({ productId: p._id })}
                title={p.isActive ? "Désactiver" : "Réactiver"}
                className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", p.isActive ? "bg-white/[0.06] text-white/50" : "bg-ravinala/20 text-ravinala")}
              >
                {p.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <ProductsContent />
    </AdminGuard>
  );
}
