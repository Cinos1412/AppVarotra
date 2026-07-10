"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PaymentGateway } from "@/components/checkout/payment-gateway";
import { useCurrentUser } from "@/lib/use-current-user";

export default function CheckoutPage() {
  const params = useSearchParams();
  const productId = params.get("productId");
  const conversationId = params.get("conversationId");
  const { userId } = useCurrentUser();
  const product = useQuery(api.products.getById, productId ? { productId: productId as any } : "skip");

  if (!productId || !conversationId || !product || !userId) {
    return <p className="text-white/60 text-center">Ouvre le checkout depuis la fiche d'un article.</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-center mb-6">Finaliser la commande</h1>
      <PaymentGateway
        conversationId={conversationId}
        productId={product._id}
        buyerId={userId}
        sellerId={product.sellerId}
        amount={product.price}
      />
    </div>
  );
}
