import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Feed principal : produits boostés en premier, puis les plus récents. */
export const feed = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active_boosted", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    const filtered = category ? products.filter((p) => p.category === category) : products;

    // Les articles boostés remontent en tête, en conservant l'ordre chronologique
    // au sein de chaque groupe.
    const boosted = filtered.filter((p) => p.isBoosted);
    const regular = filtered.filter((p) => !p.isBoosted);

    const withSellers = await Promise.all(
      [...boosted, ...regular].map(async (product) => ({
        ...product,
        seller: await ctx.db.get(product.sellerId),
      })),
    );

    return withSellers;
  },
});

export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const product = await ctx.db.get(productId);
    if (!product) return null;
    const seller = await ctx.db.get(product.sellerId);
    return { ...product, seller };
  },
});

export const bySeller = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, { sellerId }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .order("desc")
      .collect();
    return products.filter((p) => p.isActive);
  },
});

export const search = query({
  args: { term: v.string() },
  handler: async (ctx, { term }) => {
    if (!term.trim()) return [];
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_title", (q) => q.search("title", term).eq("isActive", true))
      .take(30);

    return await Promise.all(
      results.map(async (product) => ({ ...product, seller: await ctx.db.get(product.sellerId) })),
    );
  },
});

export const create = mutation({
  args: {
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.union(
      v.literal("Tech"),
      v.literal("Mode"),
      v.literal("Maison"),
      v.literal("Jeux"),
      v.literal("Sport"),
      v.literal("Autre"),
    ),
    state: v.union(
      v.literal("Neuf"),
      v.literal("Très bon état"),
      v.literal("Bon état"),
      v.literal("Correct"),
    ),
    location: v.string(),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
      isBoosted: false,
      views: 0,
      likesCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    });
  },
});

export const incrementViews = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const product = await ctx.db.get(productId);
    if (!product) return;
    await ctx.db.patch(productId, { views: product.views + 1 });
  },
});

/** Réagir à un produit (like / emoji rapide) — bascule si déjà réagi. */
export const toggleReaction = mutation({
  args: { userId: v.id("users"), productId: v.id("products"), emoji: v.string() },
  handler: async (ctx, { userId, productId, emoji }) => {
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", userId).eq("targetType", "product").eq("targetId", productId),
      )
      .unique();

    const product = await ctx.db.get(productId);
    if (!product) return;

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(productId, { likesCount: Math.max(0, product.likesCount - 1) });
      return { reacted: false };
    }

    await ctx.db.insert("reactions", { userId, targetType: "product", targetId: productId, emoji });
    await ctx.db.patch(productId, { likesCount: product.likesCount + 1 });
    return { reacted: true };
  },
});
