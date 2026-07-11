import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * ⚠️ Aucun fournisseur de streaming n'est branché ici (pas de budget pour
 * l'instant). `playbackUrl` / `ingestUrl` restent vides — la page /live
 * affiche un lecteur vidéo en placeholder tant que ces champs sont vides.
 * Pour activer un vrai live plus tard, il suffit de : (1) créer le live
 * côté fournisseur (Mux "Direct Live Streams", LiveKit, ou Cloudflare
 * Stream Live Inputs), (2) stocker `ingestUrl` + `ingestKey` (à donner au
 * vendeur pour son logiciel de diffusion type OBS) et `playbackUrl` (à
 * donner au lecteur vidéo côté spectateurs) dans ce document, (3) brancher
 * un vrai <video>/HLS player dans app/live/[streamId]/page.tsx à la place
 * du placeholder.
 */

export const schedule = mutation({
  args: {
    hostId: v.id("users"),
    title: v.string(),
    thumbnailUrl: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("liveStreams", {
      ...args,
      status: args.scheduledFor ? "scheduled" : "live",
      startedAt: args.scheduledFor ? undefined : Date.now(),
      viewerCount: 0,
      peakViewerCount: 0,
    });
  },
});

/** À appeler quand le vendeur clique "Démarrer le live" côté app. */
export const start = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, { streamId }) => {
    const stream = await ctx.db.get(streamId);
    if (!stream) return;
    await ctx.db.patch(streamId, { status: "live", startedAt: Date.now() });

    // Notifie les abonnés du vendeur.
    const followers = await ctx.db.query("follows").withIndex("by_following", (q) => q.eq("followingId", stream.hostId)).collect();
    await Promise.all(
      followers.map((f) =>
        ctx.db.insert("notifications", {
          userId: f.followerId,
          type: "live_started",
          data: { streamId, hostId: stream.hostId },
          isRead: false,
        }),
      ),
    );
  },
});

export const end = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, { streamId }) => {
    await ctx.db.patch(streamId, { status: "ended", endedAt: Date.now() });
  },
});

export const listLive = query({
  args: {},
  handler: async (ctx) => {
    const streams = await ctx.db.query("liveStreams").withIndex("by_status", (q) => q.eq("status", "live")).collect();
    return await Promise.all(streams.map(async (s) => ({ ...s, host: await ctx.db.get(s.hostId) })));
  },
});

export const getById = query({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, { streamId }) => {
    const stream = await ctx.db.get(streamId);
    if (!stream) return null;
    const host = await ctx.db.get(stream.hostId);
    const products = await Promise.all(stream.productIds.map((id) => ctx.db.get(id)));
    const pinnedProduct = stream.pinnedProductId ? await ctx.db.get(stream.pinnedProductId) : null;
    return { ...stream, host, products: products.filter(Boolean), pinnedProduct };
  },
});

export const pinProduct = mutation({
  args: { streamId: v.id("liveStreams"), productId: v.optional(v.id("products")) },
  handler: async (ctx, { streamId, productId }) => {
    await ctx.db.patch(streamId, { pinnedProductId: productId });
  },
});

/** Incrémente le compteur de viewers à la connexion — approximatif, pas de présence temps réel fine. */
export const join = mutation({
  args: { streamId: v.id("liveStreams"), userId: v.id("users") },
  handler: async (ctx, { streamId, userId }) => {
    const existing = await ctx.db
      .query("liveViewers")
      .withIndex("by_stream_user", (q) => q.eq("streamId", streamId).eq("userId", userId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .unique();
    if (existing) return;

    await ctx.db.insert("liveViewers", { streamId, userId, joinedAt: Date.now() });
    const stream = await ctx.db.get(streamId);
    if (stream) {
      const newCount = stream.viewerCount + 1;
      await ctx.db.patch(streamId, {
        viewerCount: newCount,
        peakViewerCount: Math.max(stream.peakViewerCount, newCount),
      });
    }
  },
});

export const leave = mutation({
  args: { streamId: v.id("liveStreams"), userId: v.id("users") },
  handler: async (ctx, { streamId, userId }) => {
    const existing = await ctx.db
      .query("liveViewers")
      .withIndex("by_stream_user", (q) => q.eq("streamId", streamId).eq("userId", userId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .unique();
    if (!existing) return;

    await ctx.db.patch(existing._id, { leftAt: Date.now() });
    const stream = await ctx.db.get(streamId);
    if (stream) await ctx.db.patch(streamId, { viewerCount: Math.max(0, stream.viewerCount - 1) });
  },
});

export const sendChatMessage = mutation({
  args: { streamId: v.id("liveStreams"), userId: v.id("users"), content: v.string() },
  handler: async (ctx, { streamId, userId, content }) => {
    await ctx.db.insert("liveChatMessages", { streamId, userId, content, isPinned: false });
  },
});

export const listChatMessages = query({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, { streamId }) => {
    const messages = await ctx.db.query("liveChatMessages").withIndex("by_stream", (q) => q.eq("streamId", streamId)).order("desc").take(100);
    const withUsers = await Promise.all(messages.map(async (m) => ({ ...m, user: await ctx.db.get(m.userId) })));
    return withUsers.reverse();
  },
});
