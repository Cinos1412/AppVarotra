"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
import { PremiumCard } from "@/components/ui/premium-card";
import { formatAriary, cn, getActivePromo } from "@/lib/utils";
import { ProductGallery } from "@/components/products/product-gallery";
import { SimilarProducts } from "@/components/products/similar-products";
import { ProductReviews } from "@/components/products/product-reviews";
import { Star, MapPin, ShieldCheck, Heart, Share2, Flag, MessageCircle, ChevronDown, Eye, Pencil, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/lib/use-current-user";
import { BackButton } from "@/components/ui/back-button";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isLoading: isUserLoading } = useCurrentUser();
  const product = useQuery(api.products.getById, { productId: params.id as any });
  const addToCart = useMutation(api.cart.addItem);
  const toggleReaction = useMutation(api.products.toggleReaction);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);
  const incrementViews = useMutation(api.products.incrementViews);
  const removeProduct = useMutation(api.products.remove);
  const submitReport = useMutation(api.reports.submit);
  const hasCountedView = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [reported, setReported] = useState(false);

  async function handleReport() {
    if (!userId || !product || reported) return;
    const reason = prompt("Pourquoi signales-tu cette annonce ?");
    if (!reason || !reason.trim()) return;
    await submitReport({ targetType: "product", targetId: product._id, reporterId: userId as any, reason: reason.trim() });
    setReported(true);
  }

  async function handleDelete() {
    if (!userId || !product) return;
    if (!confirm("Retirer définitivement cet article de la vente ?")) return;
    setDeleting(true);
    await removeProduct({ productId: product._id, sellerId: userId as any });
    router.push(`/profile/me`);
  }

  const alreadyReacted = useQuery(
    api.products.hasReacted,
    userId && product ? { userId: userId as any, productId: product._id } : "skip",
  );

  const isOwnProduct = !!product && !!userId && product.sellerId === userId;
  const promo = product ? getActivePromo(product) : null;

  const [liked, setLiked] = useState<boolean | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLiked = liked ?? alreadyReacted ?? false;

  // Une seule fois par visite, pas à chaque re-render / changement de state
  // local — et jamais si c'est le vendeur qui consulte son propre article.
  useEffect(() => {
    if (product && !hasCountedView.current && !isUserLoading && !isOwnProduct) {
      hasCountedView.current = true;
      incrementViews({ productId: product._id });
    }
  }, [product, incrementViews, isOwnProduct, isUserLoading]);

  function handleBuyNow() {
    if (!userId || !product) return;
    router.push(`/checkout?productId=${product._id}`);
  }

  async function handleContactSeller() {
    if (!userId || !product) return;
    const conversationId = await getOrCreateConversation({
      buyerId: userId as any,
      sellerId: product.sellerId,
      productId: product._id,
    });
    router.push(`/messages/${conversationId}`);
  }

  async function handleLike() {
    if (!userId || !product) return;
    setLiked(!isLiked);
    await toggleReaction({ userId: userId as any, productId: product._id, emoji: "❤️" });
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, url });
      } catch {
        /* annulé par l'utilisateur, rien à faire */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (product === undefined) {
    return (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl shimmer-bg" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded-xl shimmer-bg" />
          <div className="h-24 rounded-2xl shimmer-bg" />
          <div className="h-32 rounded-2xl shimmer-bg" />
        </div>
      </div>
    );
  }
  if (product === null) {
    return <p className="text-white/60">Cet article n'existe plus.</p>;
  }

  const isLongDescription = product.description.length > 180;
  const displayedDescription =
    descExpanded || !isLongDescription ? product.description : product.description.slice(0, 180) + "…";

  return (
    <div className="max-w-5xl mx-auto">
      <BackButton />
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="animate-fade-in-up">
          <ProductGallery images={product.images} title={product.title} />
        </div>

        <div className="space-y-4 animate-fade-in-up">
          {/* Titre, prix, actions rapides */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl leading-tight">{product.title}</h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleLike}
                  className="h-10 w-10 rounded-full glass flex items-center justify-center glow-on-hover"
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className={cn("h-4 w-4 transition-colors", isLiked ? "fill-corail text-corail" : "text-white")} />
                </button>
                <button
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full glass flex items-center justify-center glow-on-hover relative"
                  aria-label="Partager"
                >
                  <Share2 className="h-4 w-4 text-white" />
                  {copied && (
                    <span className="absolute -top-8 right-0 text-[10px] bg-ink-soft px-2 py-1 rounded-lg whitespace-nowrap animate-fade-in">
                      Lien copié !
                    </span>
                  )}
                </button>
              </div>
            </div>

            {promo ? (
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <p className="font-display text-3xl text-corail">{formatAriary(promo.promoPrice)}</p>
                <p className="text-base text-white/40 line-through">{formatAriary(product.price)}</p>
                <span className="text-xs bg-corail/15 text-corail rounded-full px-2 py-0.5 font-medium">-{promo.discountPercent}%</span>
              </div>
            ) : (
              <p className="font-display text-3xl text-vanille mt-1.5">{formatAriary(product.price)}</p>
            )}

            {/* Stats compactes — directement liées à l'identité de l'annonce, donc juste sous le prix */}
            <div className="flex items-center gap-4 mt-2.5 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> {product.views}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" /> {product.likesCount}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-vanille text-vanille" /> {product.ratingAvg.toFixed(1)} ({product.ratingCount})
              </span>
            </div>
          </div>

          {/* Chips d'attributs — état, lieu, catégorie */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs bg-white/[0.06] rounded-full px-3 py-1.5 text-white/70">
              <MapPin className="h-3 w-3" /> {product.location}
            </span>
            <span className="text-xs bg-white/[0.06] rounded-full px-3 py-1.5 text-white/70">{product.state}</span>
            <span className="text-xs bg-white/[0.06] rounded-full px-3 py-1.5 text-white/70">{product.category}</span>
          </div>

          {/* Caractéristiques personnalisées — Taille/RAM/etc. selon la catégorie */}
          {product.attributes && product.attributes.length > 0 && (
            <PremiumCard className="p-5">
              <h2 className="text-sm font-medium text-white/60 mb-3">Caractéristiques</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {product.attributes.map((attr: { key: string; value: string }, i: number) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[11px] text-white/40">{attr.key}</span>
                    <span className="text-sm text-white/85">{attr.value}</span>
                  </div>
                ))}
              </div>
            </PremiumCard>
          )}

          {/* Description — carte premium solide, pas de glass */}
          <PremiumCard className="p-5">
            <h2 className="text-sm font-medium text-white/60 mb-2">Description</h2>
            <p className="text-[15px] text-white/90 leading-relaxed whitespace-pre-line">{displayedDescription}</p>
            {isLongDescription && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="flex items-center gap-1 text-ravinala text-sm mt-2 font-medium"
              >
                {descExpanded ? "Voir moins" : "Voir plus"}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", descExpanded && "rotate-180")} />
              </button>
            )}
          </PremiumCard>

          {/* Bloc vendeur — carte premium solide */}
          {product.seller && (
            <PremiumCard className="p-5">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${product.seller.username}`} className="shrink-0">
                  <div className="ravinala-ring p-[2px] rounded-full" style={{ height: 52, width: 52 }}>
                    <div className="h-full w-full rounded-full border border-ink overflow-hidden bg-ink-soft">
                      {product.seller.avatarUrl && (
                        <Image src={product.seller.avatarUrl} alt="" width={52} height={52} className="object-cover h-full w-full" />
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${product.seller.username}`}>
                    <p className="font-medium text-[15px] flex items-center gap-1 truncate">
                      {product.seller.displayName}
                      {product.seller.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-ravinala shrink-0" />}
                    </p>
                  </Link>
                  <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 fill-vanille text-vanille" /> {product.seller.ratingAvg.toFixed(1)}
                    <span className="text-white/30">·</span> {product.seller.salesCount} ventes
                    <span className="text-white/30">·</span> {product.seller.followersCount} abonnés
                  </p>
                </div>
                {!isOwnProduct && (
                  <GlassButton variant="glass" size="sm" onClick={handleContactSeller} disabled={!userId}>
                    <MessageCircle className="h-3.5 w-3.5" /> Contacter
                  </GlassButton>
                )}
              </div>
            </PremiumCard>
          )}

          {/* Actions principales */}
          {isOwnProduct ? (
            <div className="flex gap-3 pt-1">
              <Link href={`/sell?edit=${product._id}`} className="flex-1">
                <GlassButton variant="glass" size="lg" className="w-full">
                  <Pencil className="h-4 w-4" /> Modifier
                </GlassButton>
              </Link>
              <GlassButton
                variant="danger"
                size="lg"
                className="flex-1"
                isLoading={deleting}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" /> Supprimer
              </GlassButton>
            </div>
          ) : (
            <div className="flex gap-3 pt-1">
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
          )}

          <button
            onClick={handleReport}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors mx-auto pt-1"
          >
            <Flag className="h-3 w-3" /> {reported ? "Signalé, merci" : "Signaler cette annonce"}
          </button>
        </div>
      </div>

      <ProductReviews productId={product._id} />
      <SimilarProducts category={product.category} excludeId={product._id} currentUserId={userId ?? undefined} />
    </div>
  );
}
