"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { VideoPlaceholder } from "@/components/live/video-placeholder";
import { LiveChat } from "@/components/live/live-chat";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { formatAriary, cn } from "@/lib/utils";
import { ChevronLeft, Users, Square } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WatchLivePage() {
  const params = useParams<{ streamId: string }>();
  const router = useRouter();
  const { userId } = useCurrentUser();
  const stream = useQuery(api.liveStreams.getById, { streamId: params.streamId as any });
  const join = useMutation(api.liveStreams.join);
  const leave = useMutation(api.liveStreams.leave);
  const pinProduct = useMutation(api.liveStreams.pinProduct);
  const endStream = useMutation(api.liveStreams.end);
  const startStream = useMutation(api.liveStreams.start);

  useEffect(() => {
    if (!userId || !stream) return;
    join({ streamId: stream._id, userId: userId as any });
    return () => {
      leave({ streamId: stream._id, userId: userId as any });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, stream?._id]);

  if (!stream) return <div className="h-96 rounded-3xl bg-white/[0.05] animate-pulse" />;

  const isHost = stream.hostId === userId;

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-5">
      <div>
        <button onClick={() => router.push("/live")} className="flex items-center gap-1 text-white/60 text-sm mb-3">
          <ChevronLeft className="h-4 w-4" /> Retour aux lives
        </button>

        <VideoPlaceholder isLive={stream.status === "live"} />

        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="font-display text-xl">{stream.title}</h1>
            <p className="text-white/50 text-sm">{stream.host?.displayName}</p>
          </div>
          <span className="flex items-center gap-1.5 text-sm text-white/60">
            <Users className="h-4 w-4" /> {stream.viewerCount}
          </span>
        </div>

        {isHost && (
          <div className="flex gap-2 mt-3">
            {stream.status !== "live" ? (
              <GlassButton variant="primary" size="sm" onClick={() => startStream({ streamId: stream._id })}>
                Démarrer le direct
              </GlassButton>
            ) : (
              <GlassButton variant="danger" size="sm" onClick={() => endStream({ streamId: stream._id })}>
                <Square className="h-3.5 w-3.5" /> Terminer le live
              </GlassButton>
            )}
          </div>
        )}

        {stream.products.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-medium text-white/70 mb-2">Articles présentés</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {stream.products.map((p: any) => (
                <div
                  key={p._id}
                  className={cn(
                    "shrink-0 w-40 rounded-2xl overflow-hidden glass",
                    stream.pinnedProductId === p._id && "ring-2 ring-vanille",
                  )}
                >
                  <Link href={`/product/${p._id}`}>
                    <div className="relative aspect-square">
                      <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs truncate">{p.title}</p>
                      <p className="text-vanille text-sm font-display">{formatAriary(p.price)}</p>
                    </div>
                  </Link>
                  {isHost && (
                    <button
                      onClick={() => pinProduct({ streamId: stream._id, productId: p._id })}
                      className="w-full text-[11px] text-center py-1.5 bg-white/[0.06] text-white/60"
                    >
                      {stream.pinnedProductId === p._id ? "Épinglé ✓" : "Épingler"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <GlassPanel className="p-4 h-[420px] md:h-auto" intensity="strong">
        <h2 className="text-sm font-medium text-white/70 mb-3">Chat en direct</h2>
        <LiveChat streamId={stream._id} userId={userId} />
      </GlassPanel>
    </div>
  );
}
