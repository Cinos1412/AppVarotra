"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Send } from "lucide-react";

export function LiveChat({ streamId, userId }: { streamId: string; userId: string | null }) {
  const messages = useQuery(api.liveStreams.listChatMessages, { streamId: streamId as any }) ?? [];
  const sendMessage = useMutation(api.liveStreams.sendChatMessage);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    await sendMessage({ streamId: streamId as any, userId: userId as any, content: text });
    setText("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {messages.map((m) => (
          <p key={m._id} className="text-sm">
            <span className="font-medium text-vanille">{m.user?.displayName ?? "Utilisateur"}</span>{" "}
            <span className="text-white/80">{m.content}</span>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {userId && (
        <form onSubmit={handleSend} className="flex gap-2 mt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Envoyer un message..."
            className="flex-1 h-10 rounded-full bg-white/[0.08] border border-white/[0.12] px-4 text-sm focus:outline-none focus:border-ravinala/60"
          />
          <button type="submit" className="h-10 w-10 rounded-full bg-malachite flex items-center justify-center shrink-0">
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
