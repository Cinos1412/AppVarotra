import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const hasActive = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, { authorId }) => {
    const now = Date.now();
    const stories = await ctx.db.query("stories").withIndex("by_author", (q) => q.eq("authorId", authorId)).collect();
    return stories.some((s) => s.expiresAt > now);
  },
});

export const create = mutation({
  args: {
    authorId: v.id("users"),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stories", {
      ...args,
      viewsCount: 0,
      expiresAt: Date.now() + STORY_LIFETIME_MS,
    });
  },
});

/** Bandeau horizontal — uniquement les stories encore actives, groupées par auteur. */
export const activeFeed = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("stories").withIndex("by_expiresAt").collect();
    const active = all.filter((s) => s.expiresAt > now);

    const byAuthor = new Map<string, typeof active>();
    for (const story of active) {
      const key = story.authorId as unknown as string;
      if (!byAuthor.has(key)) byAuthor.set(key, []);
      byAuthor.get(key)!.push(story);
    }

    const groups = await Promise.all(
      Array.from(byAuthor.entries()).map(async ([authorId, stories]) => ({
        author: await ctx.db.get(authorId as any),
        stories: stories.sort((a, b) => a._creationTime - b._creationTime),
      })),
    );

    return groups;
  },
});

export const recordView = mutation({
  args: { storyId: v.id("stories"), viewerId: v.id("users") },
  handler: async (ctx, { storyId, viewerId }) => {
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story_viewer", (q) => q.eq("storyId", storyId).eq("viewerId", viewerId))
      .unique();
    if (existing) return;

    await ctx.db.insert("storyViews", { storyId, viewerId });
    const story = await ctx.db.get(storyId);
    if (story) await ctx.db.patch(storyId, { viewsCount: story.viewsCount + 1 });
  },
});

/**
 * Réagit à une story (pas de dédoublonnage volontaire : chaque tap ajoute
 * une réaction, pour permettre les "rafales" de cœurs comme sur
 * Instagram/TikTok Live). Visible en direct par tous les viewers connectés
 * (acheteur ET vendeur) grâce à la réactivité native de Convex.
 */
export const react = mutation({
  args: { storyId: v.id("stories"), userId: v.id("users"), emoji: v.string() },
  handler: async (ctx, { storyId, userId, emoji }) => {
    await ctx.db.insert("reactions", { userId, targetType: "story", targetId: storyId, emoji });
  },
});

export const listReactions = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, { storyId }) => {
    return await ctx.db
      .query("reactions")
      .withIndex("by_target", (q) => q.eq("targetType", "story").eq("targetId", storyId))
      .order("desc")
      .take(50);
  },
});
