"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Send } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { OrderStatusCard } from "@/components/checkout/order-status-card";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
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
    return <div className="animate-pulse h-96 rounded-3xl bg-white/[0.05]" />;
  }

  const relatedEscrow = [...(orders?.asBuyer ?? []), ...(orders?.asSeller ?? [])].find(
    (e) => e.conversationId === conversation._id,
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ conversationId: conversation._id, senderId: userId as any, content: text });
    setText("");
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-160px)]">
      <div className="mb-3">
        <h1 className="font-display text-lg">
          {conversation.buyerId === userId ? conversation.seller?.displayName : conversation.buyer?.displayName}
        </h1>
        {conversation.product && <p className="text-xs text-white/50">{conversation.product.title}</p>}
      </div>

      {relatedEscrow && (
        <div className="mb-3">
          <OrderStatusCard escrow={relatedEscrow} isSeller={relatedEscrow.sellerId === userId} />
        </div>
      )}

      <GlassPanel className="flex-1 overflow-y-auto p-4 space-y-3" intensity="strong">
        {messages.map((msg) => (
          <div key={msg._id} className={cn("flex", msg.senderId === userId ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                msg.senderId === userId ? "bg-malachite text-white" : "bg-white/[0.08] text-white/90",
              )}
            >
              {msg.content}
              <p className="text-[10px] opacity-50 mt-1">{timeAgo(msg._creationTime)}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </GlassPanel>

      <form onSubmit={handleSend} className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] px-4 text-sm focus:outline-none focus:border-ravinala/60"
        />
        <button type="submit" className="h-12 w-12 rounded-2xl bg-malachite flex items-center justify-center shrink-0">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
