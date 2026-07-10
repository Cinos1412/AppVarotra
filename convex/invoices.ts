import { v } from "convex/values";
import { query } from "./_generated/server";

export const forUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const asBuyer = await ctx.db.query("invoices").withIndex("by_buyer", (q) => q.eq("buyerId", userId)).collect();
    const asSeller = await ctx.db.query("invoices").withIndex("by_seller", (q) => q.eq("sellerId", userId)).collect();
    return [...asBuyer, ...asSeller].sort((a, b) => b.issuedAt - a.issuedAt);
  },
});
