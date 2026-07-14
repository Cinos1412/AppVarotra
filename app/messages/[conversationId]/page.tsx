"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { ChevronLeft, Send } from "lucide-react";
import { cn, timeAgo, formatAriary } from "@/lib/utils";
import { OrderStatusCard } from "@/components/checkout/order-status-card";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const { userId } = useCurrentUser();
  const conversation = useQuery(api.conversations.getById, { conversationId: params.conversationId as any });
  const messages = useQuery(api.conversations.listMessages, { conversationId: params.conversationId as any });
  const orders = useQuery(api.escrow.myOrders, userId ? { userId: userId as any } : "skip");
  const sendMessage = useMutation(api.conversations.sendMessage);

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation || !messages || !userId) {
    return (
      <div className="space-y-3">
        <div className="h-16 rounded-2xl bg-white/[0.05] animate-pulse" />
        <div className="h-96 rounded-2xl bg-white/[0.05] animate-pulse" />
      </div>
    );
  }

  const other = conversation.buyerId === userId ? conversation.seller : conversation.buyer;
  const relatedEscrow = [...(orders?.asBuyer ?? []), ...(orders?.asSeller ?? [])].find(
    (e) => e.conversationId === conversation._id,
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ conversationId: conversation._id, senderId: userId as any, content: text });
    setText("");
  }

  // Regroupe les messages consécutifs du même expéditeur pour éviter de
  // répéter l'espacement/heure à chaque bulle (rendu plus "app native").
  const groupedMessages = messages.map((msg, i) => ({
    ...msg,
    isFirstOfGroup: i === 0 || messages[i - 1].senderId !== msg.senderId,
    isLastOfGroup: i === messages.length - 1 || messages[i + 1].senderId !== msg.senderId,
  }));

  return (
    <div className="flex flex-col h-[calc(100dvh-160px)] md:h-[calc(100vh-160px)] max-w-2xl mx-auto -mx-4 md:mx-auto">
      {/* En-tête sticky — retour + avatar + contexte produit */}
      <div className="sticky top-0 z-10 glass rounded-none md:rounded-2xl px-3 py-2.5 flex items-center gap-3 mx-4 md:mx-0">
        <button onClick={() => router.back()} className="h-9 w-9 flex items-center justify-center -ml-1 shrink-0">
          <ChevronLeft className="h-5 w-5 text-white/80" />
        </button>
        <div className="h-9 w-9 rounded-full overflow-hidden bg-ink-soft shrink-0">
          {other?.avatarUrl && <Image src={other.avatarUrl} alt="" width={36} height={36} className="object-cover h-full w-full" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{other?.displayName}</p>
          {conversation.product && (
            <p className="text-[11px] text-white/50 truncate">
              {conversation.product.title} · {formatAriary(conversation.product.price)}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {relatedEscrow && (
          <div className="mb-3">
            <OrderStatusCard escrow={relatedEscrow} isSeller={relatedEscrow.sellerId === userId} currentUserId={userId} />
          </div>
        )}

        {groupedMessages.map((msg) => {
          const isMine = msg.senderId === userId;
          return (
            <div key={msg._id} className={cn("flex", isMine ? "justify-end" : "justify-start", msg.isFirstOfGroup ? "mt-3" : "mt-0.5")}>
              <div
                className={cn(
                  "max-w-[75%] px-4 py-2.5 text-[14.5px] leading-snug",
                  isMine ? "bg-ravinala text-white" : "bg-white/[0.09] text-white/90",
                  // Coins arrondis "en groupe" façon iMessage
                  isMine
                    ? cn("rounded-2xl", msg.isFirstOfGroup && "rounded-tr-md", msg.isLastOfGroup && "rounded-br-md")
                    : cn("rounded-2xl", msg.isFirstOfGroup && "rounded-tl-md", msg.isLastOfGroup && "rounded-bl-md"),
                )}
              >
                {msg.content}
                {msg.isLastOfGroup && (
                  <p className={cn("text-[10px] mt-1", isMine ? "text-white/60" : "text-white/40")}>
                    {timeAgo(msg._creationTime)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 px-4 pt-2 pb-1 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 h-12 rounded-full bg-white/[0.07] border border-white/[0.12] px-4 text-sm focus:outline-none focus:border-ravinala/60"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-12 w-12 rounded-full bg-ravinala flex items-center justify-center shrink-0 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
