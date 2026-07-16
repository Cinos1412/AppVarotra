import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Vérifie que l'appelant est bien un admin, à partir de sa vraie session
 * Clerk (ctx.auth) — PAS d'un `adminId` passé en argument par le client,
 * qui pourrait être falsifié. C'est plus strict que le reste du projet
 * (où userId est souvent passé en argument), volontairement, parce que
 * ces actions déplacent de l'argent et suspendent des comptes.
 */
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Non authentifié.");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user || !user.isAdmin) throw new Error("Accès refusé — réservé aux administrateurs.");
  return user;
}

async function logAction(
  ctx: MutationCtx,
  adminId: any,
  action: string,
  targetType: string,
  targetId: string,
  note?: string,
) {
  await ctx.db.insert("adminActions", { adminId, action, targetType, targetId, note });
}

/** Utilisé côté front pour savoir si on affiche le lien vers /admin. */
export const amIAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    return user?.isAdmin ?? false;
  },
});

// -------------------------------------------------------------------------
// Dashboard — vue d'ensemble
// -------------------------------------------------------------------------
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [users, products, escrows, reportsPending, disputesOpen, boosts] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("escrow").collect(),
      ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
      ctx.db.query("escrow").withIndex("by_status", (q) => q.eq("status", "disputed")).collect(),
      ctx.db.query("boosts").collect(),
    ]);

    const boostRevenue = boosts
      .filter((b) => b.status === "active" || b.status === "expired")
      .reduce((sum, b) => sum + b.price, 0);

    const releasedEscrows = escrows.filter((e) => e.status === "released");
    const gmv = releasedEscrows.reduce((sum, e) => sum + e.amount, 0);
    const commissionEarned = releasedEscrows.reduce((sum, e) => sum + e.commissionAmount, 0);
    const flaggedProducts = products.filter((p) => p.moderationStatus === "flagged_for_review" && p.isActive);
    const suspendedUsers = users.filter((u) => u.accountStatus === "suspended");

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const salesByDay: { date: string; amount: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = now - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const daySales = releasedEscrows.filter((e) => e.releasedAt && e.releasedAt >= dayStart && e.releasedAt < dayEnd);
      salesByDay.push({
        date: new Date(dayStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        amount: daySales.reduce((s, e) => s + e.amount, 0),
        count: daySales.length,
      });
    }

    return {
      totalUsers: users.length,
      totalSellers: users.filter((u) => u.salesCount > 0).length,
      totalProducts: products.filter((p) => p.isActive).length,
      gmv,
      commissionEarned,
      boostRevenue,
      pendingModeration: flaggedProducts.length,
      pendingReports: reportsPending.length,
      openDisputes: disputesOpen.length,
      suspendedUsers: suspendedUsers.length,
      salesByDay,
    };
  },
});

// -------------------------------------------------------------------------
// Modération — annonces flaggées par l'IA
// -------------------------------------------------------------------------
export const flaggedProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("by_moderation", (q) => q.eq("moderationStatus", "flagged_for_review"))
      .collect();
    return await Promise.all(products.map(async (p) => ({ ...p, seller: await ctx.db.get(p.sellerId) })));
  },
});

export const approveProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(productId, { moderationStatus: "approved" });
    await logAction(ctx, admin._id, "approve_product", "product", productId);
  },
});

export const rejectProduct = mutation({
  args: { productId: v.id("products"), reason: v.optional(v.string()) },
  handler: async (ctx, { productId, reason }) => {
    const admin = await requireAdmin(ctx);
    const product = await ctx.db.get(productId);
    if (!product) return;

    await ctx.db.patch(productId, { moderationStatus: "rejected", isActive: false, moderationReason: reason });
    await ctx.db.insert("notifications", {
      userId: product.sellerId,
      type: "listing_rejected",
      data: { productId, reason },
      isRead: false,
    });
    await logAction(ctx, admin._id, "reject_product", "product", productId, reason);
  },
});

// -------------------------------------------------------------------------
// Signalements
// -------------------------------------------------------------------------
export const pendingReports = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reports = await ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").collect();
    return await Promise.all(
      reports.map(async (r) => ({
        ...r,
        reporter: await ctx.db.get(r.reporterId),
        target: r.targetType === "product" ? await ctx.db.get(r.targetId as any) : await ctx.db.get(r.targetId as any),
      })),
    );
  },
});

export const resolveReport = mutation({
  args: { reportId: v.id("reports"), resolution: v.union(v.literal("dismissed"), v.literal("action_taken")) },
  handler: async (ctx, { reportId, resolution }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(reportId, { status: resolution, reviewedBy: admin._id, reviewedAt: Date.now() });
    await logAction(ctx, admin._id, "resolve_report", "report", reportId, resolution);
  },
});

// -------------------------------------------------------------------------
// Litiges (escrow en statut "disputed")
// -------------------------------------------------------------------------
export const openDisputes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const disputes = await ctx.db.query("escrow").withIndex("by_status", (q) => q.eq("status", "disputed")).collect();
    return await Promise.all(
      disputes.map(async (d) => ({
        ...d,
        buyer: await ctx.db.get(d.buyerId),
        seller: await ctx.db.get(d.sellerId),
        product: await ctx.db.get(d.productId),
      })),
    );
  },
});

export const resolveDispute = mutation({
  args: {
    escrowId: v.id("escrow"),
    resolution: v.union(v.literal("released_to_seller"), v.literal("refunded_to_buyer")),
  },
  handler: async (ctx, { escrowId, resolution }) => {
    const admin = await requireAdmin(ctx);
    const escrow = await ctx.db.get(escrowId);
    if (!escrow) throw new Error("Séquestre introuvable.");

    const now = Date.now();
    await ctx.db.patch(escrowId, {
      status: resolution === "released_to_seller" ? "released" : "refunded",
      disputeResolution: resolution,
      disputeResolvedAt: now,
      disputeResolvedBy: admin._id,
      releasedAt: resolution === "released_to_seller" ? now : undefined,
    });

    const notifiedUserId = resolution === "released_to_seller" ? escrow.sellerId : escrow.buyerId;
    await ctx.db.insert("notifications", {
      userId: notifiedUserId,
      type: "dispute_resolved",
      data: { escrowId, resolution },
      isRead: false,
    });

    await logAction(ctx, admin._id, "resolve_dispute", "escrow", escrowId, resolution);
  },
});

// -------------------------------------------------------------------------
// Utilisateurs
// -------------------------------------------------------------------------
export const listUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").order("desc").take(200);
    if (!search) return users;
    const term = search.toLowerCase();
    return users.filter((u) => u.username.toLowerCase().includes(term) || u.displayName.toLowerCase().includes(term));
  },
});

export const setAccountStatus = mutation({
  args: { userId: v.id("users"), status: v.union(v.literal("active"), v.literal("suspended")) },
  handler: async (ctx, { userId, status }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(userId, { accountStatus: status });
    if (status === "suspended") {
      await ctx.db.insert("notifications", { userId, type: "account_suspended", data: {}, isRead: false });
    }
    await logAction(ctx, admin._id, status === "suspended" ? "suspend_user" : "reactivate_user", "user", userId);
  },
});

export const setVerified = mutation({
  args: { userId: v.id("users"), isVerified: v.boolean() },
  handler: async (ctx, { userId, isVerified }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(userId, { isVerified });
    await logAction(ctx, admin._id, isVerified ? "verify_user" : "unverify_user", "user", userId);
  },
});

export const setAdmin = mutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, { userId, isAdmin }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(userId, { isAdmin });
    await logAction(ctx, admin._id, isAdmin ? "grant_admin" : "revoke_admin", "user", userId);
  },
});

// -------------------------------------------------------------------------
// Produits — vue complète admin (pas juste les flaggés)
// -------------------------------------------------------------------------
export const actionLog = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const actions = await ctx.db.query("adminActions").order("desc").take(100);
    return await Promise.all(actions.map(async (a) => ({ ...a, admin: await ctx.db.get(a.adminId) })));
  },
});

export const allProducts = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").order("desc").take(200);
    const withSeller = await Promise.all(products.map(async (p) => ({ ...p, seller: await ctx.db.get(p.sellerId) })));
    if (!search) return withSeller;
    const term = search.toLowerCase();
    return withSeller.filter((p) => p.title.toLowerCase().includes(term));
  },
});

export const toggleProductActive = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const admin = await requireAdmin(ctx);
    const product = await ctx.db.get(productId);
    if (!product) return;
    await ctx.db.patch(productId, { isActive: !product.isActive });
    await logAction(ctx, admin._id, product.isActive ? "deactivate_product" : "reactivate_product", "product", productId);
  },
});
