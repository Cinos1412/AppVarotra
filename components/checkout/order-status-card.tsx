"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { ReviewForm } from "@/components/products/review-form";
import { Package, PackageCheck, Clock, Star, Check, AlertTriangle } from "lucide-react";

export function OrderStatusCard({ escrow, isSeller, currentUserId }: { escrow: any; isSeller: boolean; currentUserId?: string }) {
  const markDelivered = useMutation(api.escrow.markDelivered);
  const confirmReceipt = useMutation(api.escrow.confirmReceipt);
  const openDispute = useMutation(api.escrow.openDispute);
  const canReview = useQuery(
    api.reviews.canReview,
    !isSeller && currentUserId && escrow.status === "released"
      ? { escrowId: escrow._id, userId: currentUserId as any }
      : "skip",
  );
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (escrow.status !== "delivered_pending_confirmation" || !escrow.autoReleaseAt) return;
    const interval = setInterval(() => {
      const remaining = escrow.autoReleaseAt - Date.now();
      if (remaining <= 0) {
        setCountdown("Versement en cours...");
        return;
      }
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      setCountdown(`${h} h ${m} min avant versement automatique`);
    }, 30_000);
    return () => clearInterval(interval);
  }, [escrow]);

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
          {escrow.status === "released" ? (
            <PackageCheck className="h-5 w-5 text-ravinala" />
          ) : (
            <Package className="h-5 w-5 text-vanille" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{statusLabel(escrow.status)}</p>
          {countdown && (
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" /> {countdown}
            </p>
          )}
        </div>
      </div>

      {isSeller && escrow.status === "in_escrow" && (
        <GlassButton
          variant="primary"
          size="sm"
          className="w-full mt-4"
          onClick={() => markDelivered({ escrowId: escrow._id })}
        >
          Marquer comme livré
        </GlassButton>
      )}

      {!isSeller && escrow.status === "delivered_pending_confirmation" && (
        <GlassButton
          variant="primary"
          size="sm"
          className="w-full mt-4"
          onClick={() => confirmReceipt({ escrowId: escrow._id })}
        >
          Confirmer la réception
        </GlassButton>
      )}

      {!isSeller && canReview && !reviewSent && !showReviewForm && (
        <GlassButton variant="glass" size="sm" className="w-full mt-4" onClick={() => setShowReviewForm(true)}>
          <Star className="h-3.5 w-3.5" /> Laisser un avis
        </GlassButton>
      )}

      {currentUserId && !["released", "refunded", "disputed"].includes(escrow.status) && (
        <button
          onClick={async () => {
            const reason = prompt("Décris le problème rencontré :");
            if (reason && reason.trim()) {
              await openDispute({ escrowId: escrow._id, userId: currentUserId as any, reason: reason.trim() });
            }
          }}
          className="flex items-center gap-1.5 justify-center text-xs text-white/40 hover:text-corail transition-colors mt-3 w-full"
        >
          <AlertTriangle className="h-3 w-3" /> Signaler un problème
        </button>
      )}

      {reviewSent && (
        <p className="flex items-center gap-1.5 justify-center text-xs text-ravinala mt-4">
          <Check className="h-3.5 w-3.5" /> Avis envoyé, merci !
        </p>
      )}

      {showReviewForm && currentUserId && (
        <div className="mt-4">
          <ReviewForm
            escrowId={escrow._id}
            reviewerId={currentUserId}
            onDone={() => {
              setShowReviewForm(false);
              setReviewSent(true);
            }}
          />
        </div>
      )}
    </GlassPanel>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "awaiting_payment":
      return "En attente du virement";
    case "awaiting_verification":
      return "Vérification du paiement...";
    case "in_escrow":
      return "Paiement bloqué en séquestre";
    case "delivered_pending_confirmation":
      return "Marqué comme livré";
    case "released":
      return "Fonds versés au vendeur";
    case "disputed":
      return "Litige en cours";
    case "refunded":
      return "Remboursé";
    default:
      return status;
  }
}
