"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GlassButton } from "@/components/ui/glass-button";
import { PremiumCard } from "@/components/ui/premium-card";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewForm({ escrowId, reviewerId, onDone }: { escrowId: string; reviewerId: string; onDone?: () => void }) {
  const createReview = useMutation(api.reviews.create);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createReview({
        escrowId: escrowId as any,
        reviewerId: reviewerId as any,
        rating,
        comment: comment.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      });
      onDone?.();
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? "Impossible d'envoyer l'avis.");
      setSubmitting(false);
    }
  }

  return (
    <PremiumCard className="p-5">
      <h3 className="font-display text-lg mb-3">Laisser un avis</h3>

      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onClick={() => setRating(i + 1)}>
            <Star className={cn("h-7 w-7 transition-colors", i < rating ? "fill-vanille text-vanille" : "text-white/20")} />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Qualité, conformité à l'annonce, délai... (optionnel)"
        className="w-full rounded-2xl bg-white/[0.06] border border-white/[0.12] px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-ravinala/60"
      />

      <div className="mt-3">
        <span className="text-xs text-white/50 mb-2 block">Photos du produit reçu (optionnel)</span>
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="aspect-square object-cover rounded-lg" />
          ))}
          {images.length < 4 && <ImageUploader onUploaded={(url) => setImages((imgs) => [...imgs, url])} />}
        </div>
      </div>

      {error && <p className="text-corail text-xs mt-3">{error}</p>}

      <GlassButton variant="primary" className="w-full mt-4" isLoading={submitting} onClick={handleSubmit}>
        Envoyer mon avis
      </GlassButton>
    </PremiumCard>
  );
}
