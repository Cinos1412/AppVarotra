import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const PLANS = {
  weekly: { price: 15000, days: 7 },
  monthly: { price: 45000, days: 30 },
} as const;

const MERCHANT_NUMBERS = {
  mvola: "034 00 000 01",
  orange_money: "032 00 000 01",
  airtel_money: "033 00 000 01",
} as const;

function generateReferenceCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Étape 1 — le vendeur choisit un plan et un opérateur, la référence est générée. */
export const initiate = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("weekly"), v.literal("monthly")),
    operator: v.union(v.literal("mvola"), v.literal("orange_money"), v.literal("airtel_money")),
  },
  handler: async (ctx, { userId, plan, operator }) => {
    const { price } = PLANS[plan];
    return await ctx.db.insert("boosts", {
      userId,
      plan,
      price,
      status: "awaiting_payment",
      operator,
      referenceCode: generateReferenceCode(),
    });
  },
});

export const getPaymentInstructions = query({
  args: { boostId: v.id("boosts") },
  handler: async (ctx, { boostId }) => {
    const boost = await ctx.db.get(boostId);
    if (!boost || !boost.operator || !boost.referenceCode) return null;
    return {
      merchantNumber: MERCHANT_NUMBERS[boost.operator],
      amount: boost.price,
      referenceCode: boost.referenceCode,
      operator: boost.operator,
      status: boost.status,
    };
  },
});

export const submitProof = mutation({
  args: {
    boostId: v.id("boosts"),
    transactionId: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
  },
  handler: async (ctx, { boostId, transactionId, screenshotUrl }) => {
    await ctx.db.patch(boostId, {
      status: "awaiting_verification",
      proofTransactionId: transactionId,
      proofScreenshotUrl: screenshotUrl,
    });
  },
});

export const getInternal = internalQuery({
  args: { boostId: v.id("boosts") },
  handler: async (ctx, { boostId }) => ctx.db.get(boostId),
});

/** Vérifie la preuve (Gemini, même principe que convex/escrow.ts) et active le boost si valide. */
export const verifyPayment = action({
  args: { boostId: v.id("boosts") },
  handler: async (ctx, { boostId }): Promise<{ valid: boolean; reason?: string }> => {
    const boost: any = await ctx.runQuery(internal.boosts.getInternal, { boostId });
    if (!boost) return { valid: false, reason: "Boost introuvable." };

    let valid = false;
    if (boost.proofTransactionId) {
      valid = true; // pas d'OCR à faire pour un simple ID saisi
    } else if (boost.proofScreenshotUrl) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { valid: false, reason: "Vérification indisponible, réessaie plus tard." };

      const imageResponse = await fetch(boost.proofScreenshotUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const mimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Lis cette capture d'écran de confirmation de transfert Mobile Money malgache. " +
                      `Le montant attendu est ${boost.price} Ar et la référence attendue est "${boost.referenceCode}". ` +
                      'Réponds STRICTEMENT en JSON : {"amountMatches": true|false, "referenceMatches": true|false}.',
                  },
                  { inline_data: { mime_type: mimeType, data: arrayBufferToBase64(imageBuffer) } },
                ],
              },
            ],
            generationConfig: { temperature: 0, responseMimeType: "application/json" },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        try {
          const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
          valid = !!parsed.amountMatches && !!parsed.referenceMatches;
        } catch {
          valid = false;
        }
      }
    }

    if (valid) {
      await ctx.runMutation(internal.boosts.activate, { boostId });
      return { valid: true };
    }
    await ctx.runMutation(internal.boosts.rejectProof, { boostId });
    return { valid: false, reason: "Le montant ou la référence ne correspond pas." };
  },
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const rejectProof = internalMutation({
  args: { boostId: v.id("boosts") },
  handler: async (ctx, { boostId }) => {
    await ctx.db.patch(boostId, { status: "awaiting_payment" });
  },
});

export const activate = internalMutation({
  args: { boostId: v.id("boosts") },
  handler: async (ctx, { boostId }) => {
    const boost = await ctx.db.get(boostId);
    if (!boost) return;

    const { days } = PLANS[boost.plan];
    const now = Date.now();
    const expiresAt = now + days * 24 * 60 * 60 * 1000;

    await ctx.db.patch(boostId, { status: "active", startsAt: now, expiresAt });
    await ctx.db.patch(boost.userId, { boostActive: true, boostExpiresAt: expiresAt });

    const products = await ctx.db.query("products").withIndex("by_seller", (q) => q.eq("sellerId", boost.userId)).collect();
    await Promise.all(products.filter((p) => p.isActive).map((p) => ctx.db.patch(p._id, { isBoosted: true })));
  },
});

export const myBoost = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const boosts = await ctx.db.query("boosts").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").collect();
    return boosts[0] ?? null;
  },
});

export const expireOutdatedBoosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db.query("boosts").withIndex("by_status_expires", (q) => q.eq("status", "active")).collect();

    for (const boost of active) {
      if (boost.expiresAt && boost.expiresAt <= now) {
        await ctx.db.patch(boost._id, { status: "expired" });
        const user = await ctx.db.get(boost.userId);
        if (user && (!user.boostExpiresAt || user.boostExpiresAt <= now)) {
          await ctx.db.patch(boost.userId, { boostActive: false });
          const products = await ctx.db.query("products").withIndex("by_seller", (q) => q.eq("sellerId", boost.userId)).collect();
          await Promise.all(products.map((p) => ctx.db.patch(p._id, { isBoosted: false })));
        }
      }
    }
  },
});
