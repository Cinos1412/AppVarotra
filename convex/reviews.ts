import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Un avis ne peut être laissé que si l'achat est bien passé par le séquestre. */
export const create = mutation({
  args: {
    escrowId: v.id("escrow"),
    reviewerId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    images: v.optional(v.array(v.string())), // photos réelles du produit reçu
  },
  handler: async (ctx, { escrowId, reviewerId, rating, comment, images }) => {
    const escrow = await ctx.db.get(escrowId);
    if (!escrow) throw new Error("Commande introuvable.");
    if (escrow.buyerId !== reviewerId) throw new Error("Seul l'acheteur peut laisser un avis.");
    if (escrow.status !== "released") throw new Error("L'avis n'est possible qu'après paiement finalisé.");

    const already = await ctx.db
      .query("reviews")
      .withIndex("by_escrow", (q) => q.eq("escrowId", escrowId))
      .unique();
    if (already) throw new Error("Un avis a déjà été laissé pour cette commande.");

    await ctx.db.insert("reviews", {
      escrowId,
      reviewerId,
      sellerId: escrow.sellerId,
      productId: escrow.productId,
      rating,
      comment,
      images,
    });

    const seller = await ctx.db.get(escrow.sellerId);
    if (seller) {
      const newCount = seller.ratingCount + 1;
      const newAvg = (seller.ratingAvg * seller.ratingCount + rating) / newCount;
      await ctx.db.patch(escrow.sellerId, { ratingAvg: newAvg, ratingCount: newCount });
    }

    const product = await ctx.db.get(escrow.productId);
    if (product) {
      const newCount = product.ratingCount + 1;
      const newAvg = (product.ratingAvg * product.ratingCount + rating) / newCount;
      await ctx.db.patch(escrow.productId, { ratingAvg: newAvg, ratingCount: newCount });
    }

    await ctx.db.insert("notifications", {
      userId: escrow.sellerId,
      type: "new_review",
      data: { rating, productId: escrow.productId },
      isRead: false,
    });
  },
});

export const bySeller = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, { sellerId }) => {
    return await ctx.db.query("reviews").withIndex("by_seller", (q) => q.eq("sellerId", sellerId)).order("desc").collect();
  },
});

/** Avis affichés directement sur la fiche produit (pas juste sur le profil vendeur). */
export const byProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const reviews = await ctx.db.query("reviews").withIndex("by_product", (q) => q.eq("productId", productId)).order("desc").collect();
    return await Promise.all(reviews.map(async (r) => ({ ...r, reviewer: await ctx.db.get(r.reviewerId) })));
  },
});

/**
 * Commandes livrées et payées, pour lesquelles l'acheteur n'a pas encore
 * laissé d'avis — sert à afficher le bouton "Laisser un avis" au bon
 * endroit (ex: dans la conversation, une fois la commande finalisée).
 */
export const canReview = query({
  args: { escrowId: v.id("escrow"), userId: v.id("users") },
  handler: async (ctx, { escrowId, userId }) => {
    const escrow = await ctx.db.get(escrowId);
    if (!escrow || escrow.buyerId !== userId || escrow.status !== "released") return false;
    const existing = await ctx.db.query("reviews").withIndex("by_escrow", (q) => q.eq("escrowId", escrowId)).unique();
    return !existing;
  },
});
