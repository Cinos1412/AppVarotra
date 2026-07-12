import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Récupère la conversation liée à ce produit entre cet acheteur et ce vendeur, ou la crée. */
export const getOrCreate = mutation({
  args: { buyerId: v.id("users"), sellerId: v.id("users"), productId: v.optional(v.id("products")) },
  handler: async (ctx, { buyerId, sellerId, productId }) => {
    if (buyerId === sellerId) throw new Error("Impossible de démarrer une conversation avec toi-même.");

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("buyerId", buyerId).eq("sellerId", sellerId).eq("productId", productId),
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      buyerId,
      sellerId,
      productId,
      lastMessageAt: Date.now(),
      paymentStatus: "none",
    });
  },
});

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const asBuyer = await ctx.db.query("conversations").withIndex("by_buyer", (q) => q.eq("buyerId", userId)).collect();
    const asSeller = await ctx.db.query("conversations").withIndex("by_seller", (q) => q.eq("sellerId", userId)).collect();

    const all = [...asBuyer, ...asSeller].sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return await Promise.all(
      all.map(async (conv) => {
        const otherId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
        return {
          ...conv,
          otherUser: await ctx.db.get(otherId),
          product: conv.productId ? await ctx.db.get(conv.productId) : null,
        };
      }),
    );
  },
});

export const getById = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const conv = await ctx.db.get(conversationId);
    if (!conv) return null;
    return {
      ...conv,
      buyer: await ctx.db.get(conv.buyerId),
      seller: await ctx.db.get(conv.sellerId),
      product: conv.productId ? await ctx.db.get(conv.productId) : null,
    };
  },
});

export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { conversationId, senderId, content, imageUrl }) => {
    await ctx.db.insert("messages", {
      conversationId,
      senderId,
      content,
      imageUrl,
      type: imageUrl ? "image" : "text",
    });
    await ctx.db.patch(conversationId, { lastMessageAt: Date.now() });
  },
});
