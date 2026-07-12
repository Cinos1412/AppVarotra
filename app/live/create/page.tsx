"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { formatAriary } from "@/lib/utils";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

export default function CreateLivePage() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const myProducts = useQuery(api.products.bySeller, userId ? { sellerId: userId as any } : "skip");
  const scheduleStream = useMutation(api.liveStreams.schedule);

  const [title, setTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleStart() {
    if (!userId || !title.trim()) return;
    setStarting(true);
    const streamId = await scheduleStream({
      hostId: userId as any,
      title,
      productIds: selectedProducts as any,
    });
    router.push(`/live/${streamId}`);
  }

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour démarrer un live.</p>;

  return (
    <div className="max-w-lg mx-auto">
      <BackButton />
      <h1 className="font-display text-2xl mb-1">Démarrer un live</h1>
      <p className="text-white/50 text-sm mb-6">
        Choisis les articles à mettre en avant pendant ta diffusion.
      </p>

      <GlassPanel className="p-6 space-y-5" intensity="strong">
        <label className="block">
          <span className="text-sm text-white/70 mb-1.5 block">Titre du live</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Déstockage vêtements d'hiver 🔥"
            className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] px-4 text-sm focus:outline-none focus:border-ravinala/60"
          />
        </label>

        <div>
          <span className="text-sm text-white/70 mb-2 block">Articles à présenter</span>
          {myProducts === undefined ? (
            <div className="h-24 rounded-2xl bg-white/[0.05] animate-pulse" />
          ) : myProducts.length === 0 ? (
            <p className="text-xs text-white/40">Tu n'as aucun article en vente actuellement.</p>
          ) : (
            <div className="space-y-2">
              {myProducts.map((p) => (
                <button
                  key={p._id}
                  onClick={() => toggleProduct(p._id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-2xl px-4 py-2.5 border transition-colors",
                    selectedProducts.includes(p._id)
                      ? "border-ravinala/60 bg-ravinala/10"
                      : "border-white/10 bg-white/[0.04]",
                  )}
                >
                  <span className="text-sm truncate">{p.title}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-vanille">{formatAriary(p.price)}</span>
                    {selectedProducts.includes(p._id) && <Check className="h-4 w-4 text-ravinala" />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <GlassButton
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!title.trim()}
          isLoading={starting}
          onClick={handleStart}
        >
          Passer en direct
        </GlassButton>

        <p className="text-[11px] text-white/35 text-center leading-relaxed">
          Le lecteur vidéo n'est pas encore branché à un service de streaming — cette page prépare
          uniquement la structure (titre, articles épinglés, chat). Le flux vidéo lui-même sera
          ajouté plus tard.
        </p>
      </GlassPanel>
    </div>
  );
}
