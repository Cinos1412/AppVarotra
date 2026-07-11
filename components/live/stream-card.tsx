"use client";

import Link from "next/link";
import Image from "next/image";
import { Radio, Users } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";

export function StreamCard({ stream }: { stream: any }) {
  return (
    <Link href={`/live/${stream._id}`}>
      <GlassPanel className="overflow-hidden">
        <div className="relative aspect-[3/4] bg-ink-soft">
          {stream.thumbnailUrl ? (
            <Image src={stream.thumbnailUrl} alt={stream.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-white/20">
              <Radio className="h-8 w-8" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-corail px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse-glow-corail">
            <Radio className="h-2.5 w-2.5" /> LIVE
          </div>
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full text-[10px]">
            <Users className="h-2.5 w-2.5" /> {stream.viewerCount}
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium truncate">{stream.title}</p>
          <p className="text-xs text-white/50 truncate mt-0.5">{stream.host?.displayName}</p>
        </div>
      </GlassPanel>
    </Link>
  );
}
