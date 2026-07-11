"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StreamCard } from "@/components/live/stream-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import Link from "next/link";
import { Radio } from "lucide-react";

export default function LivePage() {
  const streams = useQuery(api.liveStreams.listLive);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl flex items-center gap-2">
            <Radio className="h-5 w-5 text-corail" /> Live shopping
          </h1>
          <p className="text-white/50 text-sm mt-0.5">Achète en direct, pose tes questions au vendeur en live.</p>
        </div>
        <Link href="/live/create">
          <GlassButton variant="primary" size="sm">Démarrer un live</GlassButton>
        </Link>
      </div>

      {streams === undefined ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-3xl bg-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <GlassPanel className="p-10 text-center text-white/60">
          Aucun live en cours pour l'instant. Reviens plus tard, ou lance le tien 🎥
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream._id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}
