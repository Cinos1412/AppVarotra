import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const PLANS = {
  weekly: { price: 15000, days: 7 },
  monthly: { price: 45000, days: 30 },
} as const;

/**
 * Activation du boost — dans ce scaffold, le paiement est confirmé côté UI
 * une fois la même vérification que l'escrow effectuée (référence Mobile
 * Money). En production, fais transiter ce paiement par `escrow.parseScreenshotAction`
 * avant d'appeler `activate`, exactement comme pour un achat de produit.
 */
export const activate = mutation({
  args: { userId: v.id("users"), plan: v.union(v.literal("weekly"), v.literal("monthly")) },
  handler: async (ctx, { userId, plan }) => {
    const { price, days } = PLANS[plan];
    const now = Date.now();
    const expiresAt = now + days * 24 * 60 * 60 * 1000;

    const boostId = await ctx.db.insert("boosts", {
      userId,
      plan,
      price,
      startsAt: now,
      expiresAt,
      status: "active",
    });

    await ctx.db.patch(userId, { boostActive: true, boostExpiresAt: expiresAt });

    // Les produits actifs du vendeur remontent dans le feed pendant la durée du boost.
    const products = await ctx.db.query("products").withIndex("by_seller", (q) => q.eq("sellerId", userId)).collect();
    await Promise.all(products.filter((p) => p.isActive).map((p) => ctx.db.patch(p._id, { isBoosted: true })));

    return boostId;
  },
});

export const expireOutdatedBoosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db.query("boosts").withIndex("by_status_expires", (q) => q.eq("status", "active")).collect();

    for (const boost of active) {
      if (boost.expiresAt <= now) {
        await ctx.db.patch(boost._id, { status: "expired" });
        const user = await ctx.db.get(boost.userId);
        if (user && (!user.boostExpiresAt || user.boostExpiresAt <= now)) {
          await ctx.db.patch(boost.userId, { boostActive: false });
          const products = await ctx.db.query("products").withIndex("by_seller", (q) => q.eq("sellerId", boost.userId)).collect();
          await Promise.all(products.map((p) => ctx.db.patch(p._id, { isBoosted: false })));
        }
      }
    }
  },
});

  export const myBoost = query({
  args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
    const boosts = await ctx.db.query("boosts").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").collect();
    return boosts[0] ?? null;
      },
});

