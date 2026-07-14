"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PremiumCard } from "@/components/ui/premium-card";
import { Star } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useState } from "react";

export function ProductReviews({ productId }: { productId: string }) {
  const reviews = useQuery(api.reviews.byProduct, { productId: productId as any });
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (reviews === undefined) {
    return <div className="h-24 rounded-2xl shimmer-bg mt-10" />;
  }

  return (
    <div className="mt-10">
      <h2 className="font-display text-lg mb-3">Avis clients ({reviews.length})</h2>

      {reviews.length === 0 ? (
        <PremiumCard className="p-6 text-center text-white/50 text-sm">
          Pas encore d'avis pour cet article.
        </PremiumCard>
      ) : (
        <div className="space-y-3 stagger-children">
          {reviews.map((r) => (
            <PremiumCard key={r._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-ink-soft shrink-0">
                  {r.reviewer?.avatarUrl && (
                    <Image src={r.reviewer.avatarUrl} alt="" width={36} height={36} className="object-cover h-full w-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{r.reviewer?.displayName ?? "Acheteur"}</p>
                    <span className="text-[11px] text-white/40 shrink-0">{timeAgo(r._creationTime)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-vanille text-vanille" : "text-white/20"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-white/75 mt-2">{r.comment}</p>}

                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {r.images.map((url: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setLightbox(url)}
                          className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0"
                        >
                          <Image src={url} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-lg aspect-square">
            <Image src={lightbox} alt="" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
