import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Récupère (ou crée) le profil App'Varotra lié à l'utilisateur Clerk connecté. */
export const getOrCreateProfile = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      location: args.location,
      isVerified: false,
      ratingAvg: 0,
      ratingCount: 0,
      salesCount: 0,
      followersCount: 0,
      followingCount: 0,
      boostActive: false,
      isAdmin: false,
      accountStatus: "active",
    });
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    phoneMvola: v.optional(v.string()),
    phoneOrange: v.optional(v.string()),
    phoneAirtel: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...patch }) => {
    await ctx.db.patch(userId, patch);
  },
});

/** Suivre un utilisateur — met à jour les deux compteurs de façon atomique. */
export const follow = mutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, { followerId, followingId }) => {
    if (followerId === followingId) throw new Error("Impossible de se suivre soi-même.");

    const already = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) => q.eq("followerId", followerId).eq("followingId", followingId))
      .unique();
    if (already) return;

    await ctx.db.insert("follows", { followerId, followingId });

    const follower = await ctx.db.get(followerId);
    const following = await ctx.db.get(followingId);
    if (follower) await ctx.db.patch(followerId, { followingCount: follower.followingCount + 1 });
    if (following) await ctx.db.patch(followingId, { followersCount: following.followersCount + 1 });

    await ctx.db.insert("notifications", {
      userId: followingId,
      type: "new_follower",
      data: { followerId },
      isRead: false,
    });
  },
});

export const unfollow = mutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, { followerId, followingId }) => {
    const link = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) => q.eq("followerId", followerId).eq("followingId", followingId))
      .unique();
    if (!link) return;

    await ctx.db.delete(link._id);

    const follower = await ctx.db.get(followerId);
    const following = await ctx.db.get(followingId);
    if (follower) await ctx.db.patch(followerId, { followingCount: Math.max(0, follower.followingCount - 1) });
    if (following) await ctx.db.patch(followingId, { followersCount: Math.max(0, following.followersCount - 1) });
  },
});

export const isFollowing = query({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, { followerId, followingId }) => {
    const link = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) => q.eq("followerId", followerId).eq("followingId", followingId))
      .unique();
    return !!link;
  },
});
