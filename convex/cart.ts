import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCart = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db.query("cartItems").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const withProducts = await Promise.all(
      items.map(async (item) => ({ ...item, product: await ctx.db.get(item.productId) })),
    );
    return withProducts.filter((i) => i.product && i.product.isActive);
  },
});

export const addItem = mutation({
  args: { userId: v.id("users"), productId: v.id("products"), quantity: v.optional(v.number()) },
  handler: async (ctx, { userId, productId, quantity = 1 }) => {
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("productId"), productId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + quantity });
      return existing._id;
    }
    return await ctx.db.insert("cartItems", { userId, productId, quantity });
  },
});

export const updateQuantity = mutation({
  args: { itemId: v.id("cartItems"), quantity: v.number() },
  handler: async (ctx, { itemId, quantity }) => {
    if (quantity <= 0) {
      await ctx.db.delete(itemId);
      return;
    }
    await ctx.db.patch(itemId, { quantity });
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, { itemId }) => {
    await ctx.db.delete(itemId);
  },
});
