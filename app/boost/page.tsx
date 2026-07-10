"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { formatAriary, cn } from "@/lib/utils";
import { Zap, Check } from "lucide-react";

const PLANS = [
  { id: "weekly" as const, label: "1 semaine", price: 15000, tagline: "Pour tester une remontée ponctuelle" },
  { id: "monthly" as const, label: "1 mois", price: 45000, tagline: "Le meilleur rapport visibilité / prix" },
];

export default function BoostPage() {
  const { userId, profile } = useCurrentUser();
  const activate = useMutation(api.boosts.activate);
  const currentBoost = useQuery(api.boosts.myBoost, userId ? { userId: userId as any } : "skip");
  const [activating, setActivating] = useState<string | null>(null);

  async function handleActivate(plan: "weekly" | "monthly") {
    if (!userId) return;
    setActivating(plan);
    await activate({ userId: userId as any, plan });
    setActivating(null);
  }

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour booster tes articles.</p>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-vanille to-corail flex items-center justify-center mx-auto mb-3">
          <Zap className="h-7 w-7 text-ink" />
        </div>
        <h1 className="font-display text-2xl">Boost de visibilité</h1>
        <p className="text-white/55 text-sm mt-1">
          Fais remonter tous tes articles actifs en tête du fil pendant la durée choisie.
        </p>
      </div>

      {profile?.boostActive && (
        <GlassPanel className="p-4 mb-5 text-center text-sm text-ravinala">
          Boost actif jusqu'au {new Date(profile.boostExpiresAt!).toLocaleDateString("fr-FR")}
        </GlassPanel>
      )}

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <GlassPanel key={plan.id} className="p-5 flex items-center justify-between" intensity="strong">
            <div>
              <p className="font-medium">{plan.label}</p>
              <p className="text-xs text-white/50 mt-0.5">{plan.tagline}</p>
              <p className="font-display text-lg text-vanille mt-1">{formatAriary(plan.price)}</p>
            </div>
            <GlassButton
              variant="primary"
              size="sm"
              isLoading={activating === plan.id}
              onClick={() => handleActivate(plan.id)}
            >
              <Check className="h-4 w-4" /> Activer
            </GlassButton>
          </GlassPanel>
        ))}
      </div>

      <p className="text-xs text-white/40 text-center mt-5">
        Le paiement passe par la même passerelle Mobile Money sécurisée que tes ventes.
      </p>
    </div>
  );
}
