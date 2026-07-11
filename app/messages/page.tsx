"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { timeAgo, formatAriary, cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const { userId } = useCurrentUser();
  const conversations = useQuery(api.conversations.listForUser, userId ? { userId: userId as any } : "skip");

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
        <MessageCircle className="h-8 w-8 text-white/25" />
        <p className="text-white/50 text-sm">Connecte-toi pour voir tes messages.</p>
      </div>
    );
  }

  if (conversations === undefined) {
    return (
      <div className="space-y-2 px-4 md:px-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[74px] rounded-2xl bg-white/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl mb-4 px-4 md:px-0 hidden md:block">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <MessageCircle className="h-8 w-8 text-white/25" />
          <p className="text-white/50 text-sm">Aucune conversation pour l'instant.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] px-4 md:px-0 stagger-children">
          {conversations.map((conv) => (
            <Link
              key={conv._id}
              href={`/messages/${conv._id}`}
              className="flex items-center gap-3 py-3.5 active:bg-white/[0.04] -mx-4 px-4 md:mx-0 md:rounded-2xl md:hover:bg-white/[0.05] transition-colors"
            >
              <div className="rounded-full overflow-hidden bg-ink-soft shrink-0 ring-1 ring-white/10" style={{ height: 52, width: 52 }}>
                {conv.otherUser?.avatarUrl && (
                  <Image src={conv.otherUser.avatarUrl} alt="" width={52} height={52} className="object-cover h-full w-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-medium truncate">{conv.otherUser?.displayName}</p>
                  <span className="text-[11px] text-white/40 shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                </div>
                {conv.product && (
                  <p className="text-[13px] text-white/50 truncate mt-0.5">
                    {conv.product.title} · <span className="text-vanille/90">{formatAriary(conv.product.price)}</span>
                  </p>
                )}
                {conv.paymentStatus !== "none" && (
                  <span
                    className={cn(
                      "inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full",
                      conv.paymentStatus === "released" ? "bg-ravinala/15 text-ravinala" : "bg-vanille/15 text-vanille",
                    )}
                  >
                    {paymentStatusLabel(conv.paymentStatus)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case "pending_payment": return "En attente de paiement";
    case "in_escrow": return "En séquestre";
    case "released": return "Paiement finalisé";
    case "disputed": return "Litige";
    case "refunded": return "Remboursé";
    default: return status;
  }
}
