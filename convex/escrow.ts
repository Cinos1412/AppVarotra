import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const COMMISSION_RATE = 0.08; // 8% — commission App'Varotra, prélevée au versement au vendeur
const AUTO_RELEASE_DELAY_MS = 24 * 60 * 60 * 1000; // 24h, conformément aux CGU §3

// Numéro marchand affiché à l'utilisateur (avec espaces, lisible)
const MERCHANT_NUMBERS = {
  mvola: "034 00 000 01",
  orange_money: "032 00 000 01",
  airtel_money: "033 00 000 01",
} as const;

// Même numéro, sans espaces — nécessaire pour composer la chaîne USSD
const MERCHANT_NUMBERS_RAW = {
  mvola: "0340000001",
  orange_money: "0320000001",
  airtel_money: "0330000001",
} as const;

/**
 * Fonction utilitaire pour convertir un ArrayBuffer en chaîne Base64
 * compatible avec l'environnement personnalisé de Convex (sans utiliser Node's Buffer).
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Génère un code de description court (numérique), qui remplace le concept
 * de "référence" : il est injecté directement dans le motif du virement
 * (composé dans le code USSD lui-même pour Mvola) plutôt que recopié à la
 * main par l'utilisateur. C'est CE code qui sert ensuite à vérifier le
 * paiement (comparé à ce que Gemini lit sur la capture, ou à ce que
 * l'utilisateur confirme).
 */
function generateReferenceCode() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 chiffres, ex: "1412"
}

/**
 * Compose le code USSD complet, jusqu'à l'écran de mot de passe inclus.
 */
function buildUssdDialCode(
  operator: "mvola" | "orange_money" | "airtel_money",
  amount: number,
  description: string,
): { code: string; verified: boolean } {
  const merchant = MERCHANT_NUMBERS_RAW[operator];

  switch (operator) {
    case "mvola":
      return { code: `#111*1*2*${merchant}*${amount}*1*${description}#`, verified: true };
    case "orange_money":
      return { code: `#144*1*1*${merchant}*${amount}*${description}#`, verified: false };
    case "airtel_money":
      return { code: `*436*2*1*1*${merchant}*${amount}*${description}#`, verified: false };
  }
}

/** Étape 1 — l'acheteur valide son panier et choisit un opérateur. */
export const initiate = mutation({
  args: {
    conversationId: v.id("conversations"),
    productId: v.id("products"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    amount: v.number(),
    operator: v.union(v.literal("mvola"), v.literal("orange_money"), v.literal("airtel_money")),
  },
  handler: async (ctx, args) => {
    const commissionAmount = Math.round(args.amount * COMMISSION_RATE);

    const escrowId = await ctx.db.insert("escrow", {
      conversationId: args.conversationId,
      productId: args.productId,
      buyerId: args.buyerId,
      sellerId: args.sellerId,
      amount: args.amount,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      netAmountForSeller: args.amount - commissionAmount,
      operator: args.operator,
      referenceCode: generateReferenceCode(),
      status: "awaiting_payment",
    });

    await ctx.db.patch(args.conversationId, { paymentStatus: "pending_payment" });

    return escrowId;
  },
});

/** Instructions de virement à afficher à l'acheteur (numéro + montant + description + code USSD composé). */
export const getPaymentInstructions = query({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }) => {
    const escrow = await ctx.db.get(escrowId);
    if (!escrow) return null;
    const dial = buildUssdDialCode(escrow.operator, escrow.amount, escrow.referenceCode);
    return {
      merchantNumber: MERCHANT_NUMBERS[escrow.operator],
      amount: escrow.amount,
      referenceCode: escrow.referenceCode,
      operator: escrow.operator,
      status: escrow.status,
      ussdDialCode: dial.code,
      ussdVerified: dial.verified,
    };
  },
});

/** Étape 2 — l'acheteur soumet sa preuve (ID de transaction OU capture d'écran). */
export const submitProof = mutation({
  args: {
    escrowId: v.id("escrow"),
    proofType: v.union(v.literal("transaction_id"), v.literal("screenshot")),
    transactionId: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
  },
  handler: async (ctx, { escrowId, proofType, transactionId, screenshotUrl }) => {
    await ctx.db.patch(escrowId, {
      status: "awaiting_verification",
      proofType,
      proofTransactionId: transactionId,
      proofScreenshotUrl: screenshotUrl,
    });
  },
});

/** Action Convex : analyse la preuve de paiement via Gemini */
export const parseScreenshotAction = action({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }): Promise<{ valid: boolean; reason?: string }> => {
    const escrow: any = await ctx.runQuery(internal.escrow.getInternal, { escrowId });
    if (!escrow) return { valid: false, reason: "Séquestre introuvable." };

    let amountMatches = false;
    let referenceMatches = false;

    if (escrow.proofType === "transaction_id" && escrow.proofTransactionId) {
      amountMatches = true;
      referenceMatches = true;
    } else if (escrow.proofType === "screenshot" && escrow.proofScreenshotUrl) {
      const extracted = await extractReceiptWithGemini(escrow.proofScreenshotUrl);
      if (!extracted) return { valid: false, reason: "Image illisible, réessaie avec une capture plus nette." };

      amountMatches = extracted.amount === escrow.amount;
      referenceMatches =
        extracted.reference?.toUpperCase().replace(/\s/g, "") ===
        escrow.referenceCode.toUpperCase().replace(/\s/g, "");
    } else {
      return { valid: false, reason: "Aucune preuve soumise." };
    }

    const isValid = amountMatches && referenceMatches;

    if (isValid) {
      await ctx.runMutation(internal.escrow.confirmEscrow, { escrowId });
      return { valid: true };
    }

    await ctx.runMutation(internal.escrow.rejectProof, { escrowId });
    return {
      valid: false,
      reason: !amountMatches
        ? "Le montant lu sur la capture ne correspond pas."
        : "La référence lue sur la capture ne correspond pas.",
    };
  },
});

/** Envoie l'image à Gemini (gemini-1.5-flash) avec une consigne de sortie JSON stricte */
async function extractReceiptWithGemini(
  imageUrl: string,
): Promise<{ amount: number; reference: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquant côté Convex.");

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  
  // Correction ici : utilisation de la fonction utilitaire à la place de Buffer.from()
  const base64Image = arrayBufferToBase64(imageBuffer);
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
                  "Tu lis une capture d'écran de confirmation de transfert Mobile Money " +
                  "malgache (Mvola, Orange Money ou Airtel Money). Extrais uniquement le " +
                  "montant transféré (nombre entier, sans espace ni symbole) et la référence " +
                  "ou le motif du transfert tel qu'écrit. Réponds STRICTEMENT en JSON, sans " +
                  'texte autour, au format : {"amount": 45000, "reference": "AV-XXXXXX"}. ' +
                  'Si tu ne trouves pas une valeur, mets null.',
              },
              { inline_data: { mime_type: mimeType, data: base64Image } },
            ],
          },
        ],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) return null;

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.amount !== "number" || typeof parsed.reference !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export const getInternal = internalQuery({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }) => ctx.db.get(escrowId),
});

/** Preuve validée → les fonds sont officiellement "bloqués en séquestre". */
export const confirmEscrow = internalMutation({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }) => {
    const escrow = await ctx.db.get(escrowId);
    if (!escrow) return;

    await ctx.db.patch(escrowId, { status: "in_escrow", proofParsedAt: Date.now() });
    await ctx.db.patch(escrow.conversationId, { paymentStatus: "in_escrow" });

    await ctx.db.insert("notifications", {
      userId: escrow.sellerId,
      type: "payment_in_escrow",
      data: { escrowId, productId: escrow.productId },
      isRead: false,
    });
  },
});

export const rejectProof = internalMutation({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }) => {
    await ctx.db.patch(escrowId, { status: "awaiting_payment" });
  },
});

/** Le vendeur marque l'article comme livré → déclenche le compte à rebours de 24h. */
export const markDelivered = mutation({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }) => {
    const escrow = await ctx.db.get(escrowId);
    if (!escrow || escrow.status !== "in_escrow") {
      throw new Error("Cet article n'est pas (ou plus) en séquestre.");
    }
    const now = Date.now();
    await ctx.db.patch(escrowId, {
      status: "delivered_pending_confirmation",
      deliveredAt: now,
      autoReleaseAt: now + AUTO_RELEASE_DELAY_MS,
    });

    await ctx.db.insert("notifications", {
      userId: escrow.buyerId,
      type: "order_delivered",
      data: { escrowId, autoReleaseAt: now + AUTO_RELEASE_DELAY_MS },
      isRead: false,
    });
  },
});

/** L'acheteur clique "Confirmer la réception" → libération immédiate des fonds. */
export const confirmReceipt = mutation({
  args: { escrowId: v.id("escrow") },
  handler: async (ctx, { escrowId }): Promise<void> => {
    await releaseFundsInternal(ctx, escrowId);
  },
});

/** Tâche planifiée (cron) : libère automatiquement les fonds après 24h sans litige. */
export const autoReleaseExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const candidates = await ctx.db
      .query("escrow")
      .withIndex("by_status", (q) => q.eq("status", "delivered_pending_confirmation"))
      .collect();

    for (const escrow of candidates) {
      if (escrow.autoReleaseAt && escrow.autoReleaseAt <= now) {
        await releaseFundsInternal(ctx, escrow._id);
      }
    }
  },
});

async function releaseFundsInternal(ctx: any, escrowId: any) {
  const escrow = await ctx.db.get(escrowId);
  if (!escrow) return;
  if (escrow.status !== "delivered_pending_confirmation" && escrow.status !== "in_escrow") return;

  const now = Date.now();
  await ctx.db.patch(escrowId, { status: "released", releasedAt: now });
  await ctx.db.patch(escrow.conversationId, { paymentStatus: "released" });

  const seller = await ctx.db.get(escrow.sellerId);
  if (seller) await ctx.db.patch(escrow.sellerId, { salesCount: seller.salesCount + 1 });

  const invoiceNumber = `AV-${new Date(now).getFullYear()}-${String(now).slice(-6)}`;
  await ctx.db.insert("invoices", {
    escrowId,
    invoiceNumber,
    buyerId: escrow.buyerId,
    sellerId: escrow.sellerId,
    productTitle: (await ctx.db.get(escrow.productId))?.title ?? "Article supprimé",
    amount: escrow.amount,
    commissionAmount: escrow.commissionAmount,
    netAmountForSeller: escrow.netAmountForSeller,
    issuedAt: now,
  });

  await ctx.db.insert("notifications", {
    userId: escrow.sellerId,
    type: "funds_released",
    data: { escrowId, netAmount: escrow.netAmountForSeller },
    isRead: false,
  });
}

export const myOrders = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const asBuyer = await ctx.db.query("escrow").withIndex("by_buyer", (q) => q.eq("buyerId", userId)).collect();
    const asSeller = await ctx.db.query("escrow").withIndex("by_seller", (q) => q.eq("sellerId", userId)).collect();
    return { asBuyer, asSeller };
  },
});
