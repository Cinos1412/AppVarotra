"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { timeAgo, formatAriary } from "@/lib/utils";

export default function MessagesPage() {
  const { userId } = useCurrentUser();
  const conversations = useQuery(api.conversations.listForUser, userId ? { userId: userId as any } : "skip");

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour voir tes messages.</p>;
  if (conversations === undefined) return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;

  if (conversations.length === 0) {
    return <GlassPanel className="p-10 text-center text-white/60">Aucune conversation pour l'instant.</GlassPanel>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <h1 className="font-display text-2xl mb-2">Messages</h1>
      {conversations.map((conv) => (
        <Link key={conv._id} href={`/messages/${conv._id}`}>
          <GlassPanel className="p-4 flex items-center gap-3 hover:bg-white/[0.1] transition-colors">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-ink-soft shrink-0">
              {conv.otherUser?.avatarUrl && (
                <Image src={conv.otherUser.avatarUrl} alt="" width={44} height={44} className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{conv.otherUser?.displayName}</p>
              {conv.product && (
                <p className="text-xs text-white/50 truncate">
                  {conv.product.title} · {formatAriary(conv.product.price)}
                </p>
              )}
            </div>
            <span className="text-xs text-white/40 shrink-0">{timeAgo(conv.lastMessageAt)}</span>
          </GlassPanel>
        </Link>
      ))}
    </div>
  );
}
