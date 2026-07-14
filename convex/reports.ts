import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const submit = mutation({
  args: {
    targetType: v.union(v.literal("product"), v.literal("user")),
    targetId: v.string(),
    reporterId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reports", { ...args, status: "pending" });
  },
});
