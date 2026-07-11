"use client";

import { GlassButton } from "@/components/ui/glass-button";
import { Heart, Share2 } from "lucide-react";
import { useState } from "react";

interface ProductActionButtonsProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  onLike?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ProductActionButtons({
  onAddToCart,
  onBuyNow,
  onLike,
  onShare,
  isLiked = false,
  isLoading = false,
  disabled = false,
}: ProductActionButtonsProps) {
  const [liked, setLiked] = useState(isLiked);

  const handleLike = () => {
    setLiked(!liked);
    onLike?.();
  };

  return (
    <div className="space-y-3 pt-4">
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <GlassButton
          variant="glass"
          size="lg"
          disabled={disabled || isLoading}
          onClick={onAddToCart}
          className="w-full transition-all duration-300"
        >
          Ajouter au panier
        </GlassButton>
        <GlassButton
          variant="primary"
          size="lg"
          disabled={disabled || isLoading}
          onClick={onBuyNow}
          className="w-full transition-all duration-300"
        >
          Acheter maintenant
        </GlassButton>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3">
        {onLike && (
          <button
            onClick={handleLike}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl glass transition-all duration-300 hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
            disabled={disabled}
            aria-label="Aimer ce produit"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${liked ? "fill-corail text-corail" : "text-white"}`}
            />
            <span className="text-sm font-medium text-white">{liked ? "Aimé" : "Aimer"}</span>
          </button>
        )}

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl glass transition-all duration-300 hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
            disabled={disabled}
            aria-label="Partager ce produit"
          >
            <Share2 className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Partager</span>
          </button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-white/50 text-center py-2">
        Livraison sécurisée • Paiement protégé
      </p>
    </div>
  );
}
