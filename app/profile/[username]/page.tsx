"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProductCard } from "@/components/products/product-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useCurrentUser } from "@/lib/use-current-user";
import { Star } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { userId } = useCurrentUser();
  const profile = useQuery(api.users.getByUsername, { username: params.username });
  const products = useQuery(api.products.bySeller, profile ? { sellerId: profile._id } : "skip");
  const reviews = useQuery(api.reviews.bySeller, profile ? { sellerId: profile._id } : "skip");

  if (profile === undefined) return <div className="animate-pulse h-48 rounded-3xl bg-white/[0.05]" />;
  if (profile === null) return <p className="text-white/60">Profil introuvable.</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ProfileHeader profile={profile} currentUserId={userId ?? undefined} />

      <div>
        <h2 className="font-display text-lg mb-3">Articles en vente</h2>
        {products === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <GlassPanel className="p-6 text-center text-white/50 text-sm">Aucun article en vente actuellement.</GlassPanel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={{ ...p, seller: profile }} currentUserId={userId ?? undefined} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg mb-3">Avis ({reviews?.length ?? 0})</h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-2.5">
            {reviews.map((r) => (
              <GlassPanel key={r._id} className="p-4">
                <div className="flex items-center gap-1 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-vanille text-vanille" : "text-white/20"}`} />
                  ))}
                  <span className="text-xs text-white/40 ml-1.5">{timeAgo(r._creationTime)}</span>
                </div>
                {r.comment && <p className="text-sm text-white/75">{r.comment}</p>}
              </GlassPanel>
            ))}
          </div>
        ) : (
          <GlassPanel className="p-6 text-center text-white/50 text-sm">Pas encore d'avis.</GlassPanel>
        )}
      </div>
    </div>
  );
}
