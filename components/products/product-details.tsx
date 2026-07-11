"use client";

import { MapPin, ShieldCheck, Star, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatAriary } from "@/lib/utils";

interface ProductDetailsProps {
  product: any;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Price and Title Section */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl md:text-4xl text-white leading-tight">{product.title}</h1>
          <div className="flex items-center gap-2 text-white/60">
            <span className="text-xs">État: {product.state}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <p className="font-display text-4xl text-vanille">{formatAriary(product.price)}</p>
          <div className="flex items-center gap-1 text-xs text-white/50 px-3 py-1 rounded-full bg-white/5">
            <TrendingUp className="h-3 w-3" />
            Demande actuelle
          </div>
        </div>
      </div>

      {/* Location and Description */}
      <div className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-white/70">
          <MapPin className="h-4 w-4 text-ravinala flex-shrink-0 mt-0.5" />
          <span>{product.location}</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Description</h3>
          <p className="text-sm text-white/70 leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Seller Card */}
      {product.seller && (
        <Link href={`/profile/${product.seller.username}`}>
          <GlassPanel className="p-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/[0.08] active:scale-95 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-vanille to-ravinala opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="ravinala-ring p-[2px] rounded-full h-12 w-12">
                <div className="h-full w-full rounded-full border border-ink overflow-hidden bg-ink-soft">
                  {product.seller.avatarUrl && (
                    <Image
                      src={product.seller.avatarUrl}
                      alt={product.seller.displayName}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm flex items-center gap-1.5 truncate text-white group-hover:text-vanille transition-colors">
                {product.seller.displayName}
                {product.seller.isVerified && (
                  <ShieldCheck className="h-4 w-4 text-ravinala flex-shrink-0" />
                )}
              </p>

              <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-vanille text-vanille" />
                  <span>{product.seller.ratingAvg.toFixed(1)}</span>
                </div>
                <span className="text-white/40">•</span>
                <span>{product.seller.salesCount} ventes</span>
              </div>
            </div>

            <div className="text-right text-xs text-white/50 group-hover:text-ravinala transition-colors">
              Voir le profil →
            </div>
          </GlassPanel>
        </Link>
      )}

      {/* Product Info Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="glass rounded-3xl p-4 text-center">
          <p className="text-xs text-white/60 mb-2">État du produit</p>
          <p className="font-semibold text-white capitalize">{product.state}</p>
        </div>
        <div className="glass rounded-3xl p-4 text-center">
          <p className="text-xs text-white/60 mb-2">Localisation</p>
          <p className="font-semibold text-white truncate">{product.location}</p>
        </div>
      </div>
    </div>
  );
}
