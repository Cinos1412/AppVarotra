"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star, Zap, Eye } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, formatAriary, getActivePromo, formatCountdown } from "@/lib/utils";
import { useState } from "react";

export function ProductCard({ product, currentUserId }: { product: any; currentUserId?: string }) {
  const toggleReaction = useMutation(api.products.toggleReaction);
  const alreadyReacted = useQuery(
    api.products.hasReacted,
    currentUserId ? { userId: currentUserId as any, productId: product._id } : "skip",
  );
  const [liked, setLiked] = useState<boolean | null>(null);
  const [count, setCount] = useState(product.likesCount);
  const isLiked = liked ?? alreadyReacted ?? false;
  const promo = getActivePromo(product);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    setLiked(!isLiked);
    setCount((c: number) => c + (isLiked ? -1 : 1));
    await toggleReaction({ userId: currentUserId as any, productId: product._id, emoji: "❤️" });
  }

  return (
    <Link href={`/product/${product._id}`} className="group block">
      <div className="glass rounded-xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_0_1px_rgba(10,132,255,0.4),0_12px_32px_-8px_rgba(10,132,255,0.25)]">
        <div className="relative aspect-square">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges empilés en haut à gauche — jamais plus de 2 à la fois */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            {promo && (
              <div className="flex items-center gap-1 rounded-md bg-corail px-2 py-1 text-[10px] font-semibold text-white tracking-wide">
                <Zap className="h-3 w-3 fill-white" /> -{promo.discountPercent}%
              </div>
            )}
            {product.isBoosted && (
              <div className="flex items-center gap-1 rounded-md bg-gradient-to-r from-vanille to-corail px-2 py-1 text-[10px] font-semibold text-ink tracking-wide">
                BOOSTÉ
              </div>
            )}
          </div>

          <button
            onClick={handleLike}
            className="absolute top-2.5 right-2.5 h-8 w-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center"
            aria-label="Réagir"
          >
            <Heart className={cn("h-4 w-4 transition-colors", isLiked ? "fill-corail text-corail" : "text-white")} />
          </button>

          {promo && (
            <div className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] text-white">
              {formatCountdown(promo.endsAt)}
            </div>
          )}
        </div>

        {/* Pied de carte opaque — contraste net façon Studio Premium, pas de flou sur le texte */}
        <div className="p-3.5 bg-ink-soft">
          <p className="text-[15px] font-medium text-white truncate">{product.title}</p>

          {promo ? (
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="font-display text-lg text-corail">{formatAriary(promo.promoPrice)}</p>
              <p className="text-xs text-white/40 line-through">{formatAriary(product.price)}</p>
            </div>
          ) : (
            <p className="font-display text-lg text-vanille mt-0.5">{formatAriary(product.price)}</p>
          )}

          <div className="flex items-center justify-between mt-2 text-xs text-white/55">
            <span className="truncate">{product.location}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-vanille text-vanille" />
                {product.seller?.ratingAvg?.toFixed(1) ?? "—"}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart className="h-3 w-3" /> {count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
