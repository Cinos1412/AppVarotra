import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

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

export const flashSales = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const products = await ctx.db.query("products").withIndex("by_active_boosted", (q) => q.eq("isActive", true)).collect();
    const onSale = products.filter((p) => p.promoPrice !== undefined && p.promoEndsAt !== undefined && p.promoEndsAt > now);
    return await Promise.all(onSale.map(async (p) => ({ ...p, seller: await ctx.db.get(p.sellerId) })));
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

export const browse = query({
  args: {
    term: v.optional(v.string()),
    category: v.optional(v.string()),
    state: v.optional(v.string()),
    location: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("recent"), v.literal("price_asc"), v.literal("price_desc"), v.literal("popular"))),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.term && args.term.trim()) {
      results = await ctx.db
        .query("products")
        .withSearchIndex("search_title", (q) => q.search("title", args.term!).eq("isActive", true))
        .take(200);
    } else {
      results = await ctx.db
        .query("products")
        .withIndex("by_active_boosted", (q) => q.eq("isActive", true))
        .collect();
    }

    let filtered = results.filter((p) => {
      if (args.category && p.category !== args.category) return false;
      if (args.state && p.state !== args.state) return false;
      if (args.location && !p.location.toLowerCase().includes(args.location.toLowerCase())) return false;
      if (args.minPrice !== undefined && p.price < args.minPrice) return false;
      if (args.maxPrice !== undefined && p.price > args.maxPrice) return false;
      return true;
    });

    switch (args.sortBy) {
      case "price_asc":
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filtered = filtered.sort((a, b) => b.likesCount - a.likesCount);
        break;
      default:
        filtered = filtered.sort((a, b) => b._creationTime - a._creationTime);
    }

    return await Promise.all(filtered.slice(0, 100).map(async (p) => ({ ...p, seller: await ctx.db.get(p.sellerId) })));
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

/**
 * Insertion réelle en base — interne uniquement, appelée après le passage
 * par la modération IA (voir `createModerated` juste en dessous). Ne
 * jamais exposer ceci directement côté client : ça court-circuiterait
 * la vérification de contenu.
 */
export const insertProduct = internalMutation({
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
    attributes: v.optional(v.array(v.object({ key: v.string(), value: v.string() }))),
    promoPrice: v.optional(v.number()),
    promoEndsAt: v.optional(v.number()),
    moderationStatus: v.union(v.literal("approved"), v.literal("flagged_for_review")),
    moderationReason: v.optional(v.string()),
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

/**
 * Point d'entrée public pour créer un article : passe d'abord par la
 * modération IA (convex/moderation.ts). Rejette la publication si le
 * contenu est manifestement illégal ; publie normalement sinon (avec un
 * flag "à vérifier" en cas de doute, pour un futur tableau de bord admin).
 */
export const createModerated = action({
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
    attributes: v.optional(v.array(v.object({ key: v.string(), value: v.string() }))),
    promoPrice: v.optional(v.number()),
    promoEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const moderation = await ctx.runAction(internal.moderation.checkProductContent, {
      title: args.title,
      description: args.description,
      category: args.category,
      coverImageUrl: args.images[0],
    });

    if (moderation.verdict === "rejected") {
      throw new Error(
        moderation.reason
          ? `Publication refusée : ${moderation.reason}`
          : "Cette annonce enfreint nos règles et ne peut pas être publiée.",
      );
    }

    return await ctx.runMutation(internal.products.insertProduct, {
      ...args,
      moderationStatus: moderation.verdict,
      moderationReason: moderation.reason,
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

export const update = mutation({
  args: {
    productId: v.id("products"),
    sellerId: v.id("users"), // vérifié contre le document — un vendeur ne peut modifier que ses propres articles
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
    attributes: v.optional(v.array(v.object({ key: v.string(), value: v.string() }))),
    promoPrice: v.optional(v.number()),
    promoEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, { productId, sellerId, ...patch }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Article introuvable.");
    if (product.sellerId !== sellerId) throw new Error("Tu ne peux modifier que tes propres articles.");

    await ctx.db.patch(productId, patch);
  },
});

/**
 * Suppression "douce" : on désactive l'article plutôt que de le supprimer
 * réellement de la base, pour ne pas casser l'historique des commandes/avis
 * qui le référencent (une commande passée doit rester consultable même si
 * l'article n'est plus en vente).
 */
export const remove = mutation({
  args: { productId: v.id("products"), sellerId: v.id("users") },
  handler: async (ctx, { productId, sellerId }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Article introuvable.");
    if (product.sellerId !== sellerId) throw new Error("Tu ne peux supprimer que tes propres articles.");

    await ctx.db.patch(productId, { isActive: false, isBoosted: false });
  },
});

export const hasReacted = query({
  args: { userId: v.id("users"), productId: v.id("products") },
  handler: async (ctx, { userId, productId }) => {
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", userId).eq("targetType", "product").eq("targetId", productId),
      )
      .unique();
    return !!existing;
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
