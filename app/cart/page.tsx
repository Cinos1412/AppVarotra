"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatAriary } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";

export default function CartPage() {
  const { userId } = useCurrentUser();
  const items = useQuery(api.cart.getCart, userId ? { userId: userId as any } : "skip");
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour voir ton panier.</p>;
  if (items === undefined) return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;

  const total = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);

  if (items.length === 0) {
    return (
      <GlassPanel className="p-10 text-center">
        <p className="text-white/60">Ton panier est vide pour l'instant.</p>
        <Link href="/"><GlassButton variant="primary" className="mt-4">Découvrir des articles</GlassButton></Link>
      </GlassPanel>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="font-display text-2xl mb-2">Mon panier</h1>

      {items.map((item) => (
        <GlassPanel key={item._id} className="p-4 flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shrink-0">
            {item.product?.images[0] && (
              <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.product?.title}</p>
            <p className="text-vanille font-display">{formatAriary(item.product?.price ?? 0)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity({ itemId: item._id, quantity: item.quantity - 1 })}
              className="h-8 w-8 rounded-full glass flex items-center justify-center"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity({ itemId: item._id, quantity: item.quantity + 1 })}
              className="h-8 w-8 rounded-full glass flex items-center justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => removeItem({ itemId: item._id })} className="text-white/40 hover:text-corail">
            <Trash2 className="h-4 w-4" />
          </button>
        </GlassPanel>
      ))}

      <GlassPanel className="p-5 flex items-center justify-between" intensity="strong">
        <span className="text-white/70">Total</span>
        <span className="font-display text-2xl text-vanille">{formatAriary(total)}</span>
      </GlassPanel>

      <Link href="/checkout">
        <GlassButton variant="primary" size="lg" className="w-full">Passer la commande</GlassButton>
      </Link>
    </div>
  );
}
