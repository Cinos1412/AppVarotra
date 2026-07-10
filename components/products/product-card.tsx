"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star, Zap } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, formatAriary } from "@/lib/utils";
import { useState } from "react";

export function ProductCard({ product, currentUserId }: { product: any; currentUserId?: string }) {
  const toggleReaction = useMutation(api.products.toggleReaction);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(product.likesCount);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    setLiked((v) => !v);
    setCount((c: number) => c + (liked ? -1 : 1));
    await toggleReaction({ userId: currentUserId as any, productId: product._id, emoji: "❤️" });
  }

  return (
    <Link href={`/product/${product._id}`} className="group block">
      <div className="glass rounded-3xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-square">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {product.isBoosted && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-vanille to-corail px-2.5 py-1 text-[11px] font-semibold text-ink">
              <Zap className="h-3 w-3 fill-ink" /> Boosté
            </div>
          )}

          <button
            onClick={handleLike}
            className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full glass flex items-center justify-center"
            aria-label="Réagir"
          >
            <Heart className={cn("h-4 w-4 transition-colors", liked ? "fill-corail text-corail" : "text-white")} />
          </button>
        </div>

        <div className="p-3.5">
          <p className="text-[15px] font-medium text-white truncate">{product.title}</p>
          <p className="font-display text-lg text-vanille mt-0.5">{formatAriary(product.price)}</p>

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
