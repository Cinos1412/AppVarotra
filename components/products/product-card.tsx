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
  const [isAnimating, setIsAnimating] = useState(false);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (!currentUserId || isAnimating) return;

    setIsAnimating(true);
    setLiked((v) => !v);
    setCount((c: number) => c + (liked ? -1 : 1));

    await toggleReaction({ userId: currentUserId as any, productId: product._id, emoji: "❤️" });
    setTimeout(() => setIsAnimating(false), 300);
  }

  return (
    <Link href={`/product/${product._id}`} className="group block h-full">
      <div className="glass rounded-3xl overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-premium-sm h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-white/5 flex-shrink-0">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Boost Badge */}
          {product.isBoosted && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-vanille to-corail px-2.5 py-1 text-[11px] font-semibold text-ink animate-pulse-glow shadow-premium-sm">
              <Zap className="h-3 w-3 fill-ink" /> Boosté
            </div>
          )}

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isAnimating}
            className={cn(
              "absolute top-2.5 right-2.5 h-8 w-8 rounded-full glass flex items-center justify-center transition-all duration-300 hover:bg-white/20 active:scale-90",
              isAnimating && "animate-zoom-in"
            )}
            aria-label="Réagir"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-300",
                liked ? "fill-corail text-corail scale-125" : "text-white"
              )}
            />
          </button>

          {/* Overlay Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content Container */}
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          {/* Title and Price */}
          <div className="space-y-2">
            <p className="text-[15px] font-medium text-white truncate group-hover:text-vanille transition-colors">
              {product.title}
            </p>
            <p className="font-display text-lg text-vanille">{formatAriary(product.price)}</p>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/55">
            <span className="truncate">{product.location}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5 hover:text-vanille transition-colors">
                <Star className="h-3 w-3 fill-vanille text-vanille" />
                {product.seller?.ratingAvg?.toFixed(1) ?? "—"}
              </span>
              <span className="flex items-center gap-0.5 hover:text-corail transition-colors">
                <Heart className="h-3 w-3" /> {count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
