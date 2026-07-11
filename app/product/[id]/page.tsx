"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/use-current-user";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ProductDetails } from "@/components/products/product-details";
import { ProductActionButtons } from "@/components/products/product-action-buttons";

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

  async function handleAddToCart() {
    if (!userId || !product) return;
    await addToCart({ userId: userId as any, productId: product._id });
  }

  if (product === undefined) {
    return (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-4xl bg-white/[0.05] animate-pulse" />
        <div className="space-y-4">
          <div className="h-12 bg-white/[0.05] rounded-2xl animate-pulse" />
          <div className="h-20 bg-white/[0.05] rounded-2xl animate-pulse" />
          <div className="h-32 bg-white/[0.05] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="text-white/60 text-lg">Cet article n'existe plus.</p>
        <p className="text-white/40 text-sm mt-2">Il a peut-être déjà été vendu ou supprimé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Main Product Section */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery */}
        <div className="animate-slide-in-left">
          <ProductImageGallery images={product.images} title={product.title} />
        </div>

        {/* Product Details and Actions */}
        <div className="animate-slide-in-right">
          <div className="sticky top-24 space-y-6">
            <ProductDetails product={product} />

            <div className="h-px bg-gradient-to-r from-white/10 via-white/30 to-white/10" />

            <ProductActionButtons
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              disabled={!userId}
              isLoading={false}
            />
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="grid md:grid-cols-3 gap-4 pt-8">
        <div className="glass rounded-3xl p-6 text-center hover:bg-white/[0.08] transition-all duration-300">
          <div className="text-2xl mb-2">🚚</div>
          <p className="text-sm font-medium text-white">Livraison rapide</p>
          <p className="text-xs text-white/50 mt-1">Partout à Madagascar</p>
        </div>
        <div className="glass rounded-3xl p-6 text-center hover:bg-white/[0.08] transition-all duration-300">
          <div className="text-2xl mb-2">🛡️</div>
          <p className="text-sm font-medium text-white">Paiement sécurisé</p>
          <p className="text-xs text-white/50 mt-1">Protection garantie</p>
        </div>
        <div className="glass rounded-3xl p-6 text-center hover:bg-white/[0.08] transition-all duration-300">
          <div className="text-2xl mb-2">📞</div>
          <p className="text-sm font-medium text-white">Support 24/7</p>
          <p className="text-xs text-white/50 mt-1">Nous sommes là pour vous</p>
        </div>
      </div>
    </div>
  );
}
