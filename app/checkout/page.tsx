"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PaymentGateway } from "@/components/checkout/payment-gateway";
import { useCurrentUser } from "@/lib/use-current-user";
import { BackButton } from "@/components/ui/back-button";
import { getActivePromo } from "@/lib/utils";
import { Suspense } from "react";

function CheckoutContent() {
  const params = useSearchParams();
  const productId = params.get("productId");
  const { userId } = useCurrentUser();
  const product = useQuery(api.products.getById, productId ? { productId: productId as any } : "skip");

  if (!productId || !product || !userId) {
    return <p className="text-white/60 text-center">Ouvre le checkout depuis la fiche d'un article.</p>;
  }

  const promo = getActivePromo(product);
  const amount = promo ? promo.promoPrice : product.price;

  return (
    <div>
      <BackButton />
      <h1 className="font-display text-2xl text-center mb-6">Finaliser la commande</h1>
      <PaymentGateway
        productId={product._id}
        buyerId={userId}
        sellerId={product.sellerId}
        amount={amount}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-white/60 text-center">Chargement du paiement...</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
