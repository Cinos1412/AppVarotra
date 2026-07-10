"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatAriary } from "@/lib/utils";
import { Star, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/use-current-user";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useCurrentUser();
  const product = useQuery(api.products.getById, { productId: params.id as any });
  const addToCart = useMutation(api.cart.addItem);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);

  async function handleBuyNow() {
    if (!userId || !product) return;
    const conversationId = await getOrCreateConversation({
      buyerId: userId as any,
      sellerId: product.sellerId,
      productId: product._id,
    });
    router.push(`/checkout?conversationId=${conversationId}&productId=${product._id}`);
  }

  if (product === undefined) {
    return <div className="animate-pulse h-96 rounded-3xl bg-white/[0.05]" />;
  }
  if (product === null) {
    return <p className="text-white/60">Cet article n'existe plus.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="relative aspect-square rounded-4xl overflow-hidden glass">
        <Image src={product.images[0]} alt={product.title} fill className="object-cover" priority />
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl">{product.title}</h1>
          <p className="font-display text-3xl text-vanille mt-1">{formatAriary(product.price)}</p>
        </div>

        <p className="text-white/70 text-sm leading-relaxed">{product.description}</p>

        <div className="flex items-center gap-4 text-sm text-white/55">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {product.location}</span>
          <span>{product.state}</span>
        </div>

        {product.seller && (
          <Link href={`/profile/${product.seller.username}`}>
            <GlassPanel className="p-4 flex items-center gap-3">
              <div className="ravinala-ring p-[2px] rounded-full h-11 w-11">
                <div className="h-full w-full rounded-full border border-ink overflow-hidden bg-ink-soft">
                  {product.seller.avatarUrl && (
                    <Image src={product.seller.avatarUrl} alt="" width={44} height={44} className="object-cover" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm flex items-center gap-1 truncate">
                  {product.seller.displayName}
                  {product.seller.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-ravinala shrink-0" />}
                </p>
                <p className="text-xs text-white/50 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-vanille text-vanille" /> {product.seller.ratingAvg.toFixed(1)} · {product.seller.salesCount} ventes
                </p>
              </div>
            </GlassPanel>
          </Link>
        )}

        <div className="flex gap-3 pt-2">
          <GlassButton
            variant="glass"
            size="lg"
            className="flex-1"
            disabled={!userId}
            onClick={() => userId && addToCart({ userId: userId as any, productId: product._id })}
          >
            Ajouter au panier
          </GlassButton>
          <GlassButton variant="primary" size="lg" className="flex-1" disabled={!userId} onClick={handleBuyNow}>
            Acheter maintenant
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
