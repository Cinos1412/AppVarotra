"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProductCard } from "@/components/products/product-card";
import { PremiumCard } from "@/components/ui/premium-card";
import { useCurrentUser } from "@/lib/use-current-user";
import { Star } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { userId } = useCurrentUser();
  const profile = useQuery(api.users.getByUsername, { username: params.username });
  const products = useQuery(api.products.bySeller, profile ? { sellerId: profile._id } : "skip");
  const reviews = useQuery(api.reviews.bySeller, profile ? { sellerId: profile._id } : "skip");
  const [tab, setTab] = useState<"products" | "reviews">("products");

  if (profile === undefined) return <div className="animate-pulse h-48 rounded-3xl bg-white/[0.05]" />;
  if (profile === null) return <p className="text-white/60">Profil introuvable.</p>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {userId !== profile._id && <BackButton />}
      <ProfileHeader profile={profile} currentUserId={userId ?? undefined} />

      {/* Onglets — structure claire au lieu d'empiler toutes les sections */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setTab("products")}
          className={cn(
            "flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors",
            tab === "products" ? "bg-white text-ink" : "glass text-white/60",
          )}
        >
          Articles ({products?.length ?? 0})
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={cn(
            "flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors",
            tab === "reviews" ? "bg-white text-ink" : "glass text-white/60",
          )}
        >
          Avis ({reviews?.length ?? 0})
        </button>
      </div>

      {tab === "products" && (
        <div className="animate-fade-in-up">
          {products === undefined ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl shimmer-bg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <PremiumCard className="p-6 text-center text-white/50 text-sm">Aucun article en vente actuellement.</PremiumCard>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
              {products.map((p) => (
                <ProductCard key={p._id} product={{ ...p, seller: profile }} currentUserId={userId ?? undefined} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="animate-fade-in-up">
          {reviews && reviews.length > 0 ? (
            <div className="space-y-2.5 stagger-children">
              {reviews.map((r) => (
                <PremiumCard key={r._id} className="p-4">
                  <div className="flex items-center gap-1 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-vanille text-vanille" : "text-white/20"}`} />
                    ))}
                    <span className="text-xs text-white/40 ml-1.5">{timeAgo(r._creationTime)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-white/75">{r.comment}</p>}
                </PremiumCard>
              ))}
            </div>
          ) : (
            <PremiumCard className="p-6 text-center text-white/50 text-sm">Pas encore d'avis.</PremiumCard>
          )}
        </div>
      )}
    </div>
  );
}
