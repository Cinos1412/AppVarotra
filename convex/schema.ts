import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * App'Varotra — schéma Convex
 * -----------------------------------------------------------------------
 * Convex n'est pas relationnel : pas de SERIAL, pas de JOIN, pas de FK SQL.
 * Chaque document a un `_id` (Id<"table">) et un `_creationTime` générés
 * automatiquement. On les référence entre eux avec `v.id("table")`, et on
 * remplace les JOIN par des `.withIndex()` côté requêtes (voir convex/*.ts).
 *
 * Clerk gère toute l'authentification (mot de passe, OTP, sessions) :
 * ces champs n'existent donc plus ici. On ne stocke que le lien vers
 * l'identité Clerk (`clerkId`) + les données de profil métier.
 */

export default defineSchema({
  // ---------------------------------------------------------------------
  // Utilisateurs
  // ---------------------------------------------------------------------
  users: defineTable({
    clerkId: v.string(), // lien vers l'utilisateur Clerk (source de vérité auth)
    username: v.string(), // slug unique, ex: "alice.rakoto"
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    location: v.string(), // ville malgache, ex: "Antananarivo"

    // Numéros Mobile Money du vendeur (pour recevoir un éventuel virement direct
    // ou pour affichage sur son profil — le paiement passe par le compte central)
    phoneMvola: v.optional(v.string()),
    phoneOrange: v.optional(v.string()),
    phoneAirtel: v.optional(v.string()),

    isVerified: v.boolean(), // badge "vendeur vérifié"
    ratingAvg: v.number(), // moyenne des avis reçus (0–5)
    ratingCount: v.number(),
    salesCount: v.number(),
    followersCount: v.number(), // dénormalisé pour affichage instantané
    followingCount: v.number(),

    // Boost de visibilité (abonnement premium vendeur)
    boostActive: v.boolean(),
    boostExpiresAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),

  // ---------------------------------------------------------------------
  // Produits
  // ---------------------------------------------------------------------
  products: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(), // en Ariary (nombre entier, pas de centimes)
    category: v.union(
      v.literal("Tech"),
      v.literal("Mode"),
      v.literal("Maison"),
      v.literal("Jeux"),
      v.literal("Sport"),
      v.literal("Autre"),
    ),
    state: v.union(
      v.literal("Neuf"),
      v.literal("Très bon état"),
      v.literal("Bon état"),
      v.literal("Correct"),
    ),
    location: v.string(),
    images: v.array(v.string()), // URLs ou storageId Convex (fichiers uploadés)
    isActive: v.boolean(), // false = vendu / retiré
    isBoosted: v.boolean(), // remonté dans le feed grâce au boost du vendeur
    views: v.number(),
    likesCount: v.number(),
    ratingAvg: v.number(),
    ratingCount: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_category", ["category", "isActive"])
    .index("by_active_boosted", ["isActive", "isBoosted"])
    .searchIndex("search_title", { searchField: "title", filterFields: ["isActive"] }),

  // ---------------------------------------------------------------------
  // Réseau social : abonnements
  // ---------------------------------------------------------------------
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_pair", ["followerId", "followingId"]),

  // ---------------------------------------------------------------------
  // Réactions (likes + émojis rapides) — produits ET stories
  // ---------------------------------------------------------------------
  reactions: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("product"), v.literal("story")),
    targetId: v.string(), // id du produit ou de la story, en string
    emoji: v.string(), // "❤️", "🔥", "😍", "👏"...
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_user_target", ["userId", "targetType", "targetId"]),

  // ---------------------------------------------------------------------
  // Avis vérifiés (uniquement après achat confirmé)
  // ---------------------------------------------------------------------
  reviews: defineTable({
    escrowId: v.id("escrow"), // preuve que l'achat a bien eu lieu
    reviewerId: v.id("users"), // l'acheteur
    sellerId: v.id("users"),
    productId: v.id("products"),
    rating: v.number(), // 1 à 5
    comment: v.optional(v.string()),
  })
    .index("by_seller", ["sellerId"])
    .index("by_escrow", ["escrowId"]),

  // ---------------------------------------------------------------------
  // Stories ("Nouveautés du jour")
  // ---------------------------------------------------------------------
  stories: defineTable({
    authorId: v.id("users"),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    productId: v.optional(v.id("products")), // story liée à un article
    viewsCount: v.number(),
    expiresAt: v.number(), // timestamp — story visible 24h
  })
    .index("by_author", ["authorId"])
    .index("by_expiresAt", ["expiresAt"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    viewerId: v.id("users"),
  }).index("by_story_viewer", ["storyId", "viewerId"]),

  // ---------------------------------------------------------------------
  // Messagerie
  // ---------------------------------------------------------------------
  conversations: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    productId: v.optional(v.id("products")),
    lastMessageAt: v.number(),
    paymentStatus: v.union(
      v.literal("none"),
      v.literal("pending_payment"),
      v.literal("in_escrow"),
      v.literal("released"),
      v.literal("disputed"),
      v.literal("refunded"),
    ),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_participants", ["buyerId", "sellerId", "productId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("system"), // messages auto ("Paiement reçu", "Livré", ...)
    ),
  }).index("by_conversation", ["conversationId"]),

  // ---------------------------------------------------------------------
  // Passerelle de paiement propriétaire + séquestre (escrow)
  // ---------------------------------------------------------------------
  escrow: defineTable({
    conversationId: v.id("conversations"),
    productId: v.id("products"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),

    amount: v.number(), // prix payé par l'acheteur (Ariary)
    commissionRate: v.number(), // ex: 0.08 pour 8%
    commissionAmount: v.number(), // calculé : amount * commissionRate
    netAmountForSeller: v.number(), // amount - commissionAmount

    operator: v.union(
      v.literal("mvola"),
      v.literal("orange_money"),
      v.literal("airtel_money"),
    ),
    referenceCode: v.string(), // référence unique à insérer dans le motif du virement

    proofType: v.optional(v.union(v.literal("transaction_id"), v.literal("screenshot"))),
    proofTransactionId: v.optional(v.string()),
    proofScreenshotUrl: v.optional(v.string()),
    proofParsedAt: v.optional(v.number()), // horodatage du traitement par parseScreenshotAction

    status: v.union(
      v.literal("awaiting_payment"), // instructions affichées, en attente du virement
      v.literal("awaiting_verification"), // preuve soumise, en cours d'analyse OCR
      v.literal("in_escrow"), // fonds bloqués et confirmés
      v.literal("delivered_pending_confirmation"), // vendeur a marqué "Livré"
      v.literal("released"), // fonds versés au vendeur
      v.literal("disputed"),
      v.literal("refunded"),
    ),

    deliveredAt: v.optional(v.number()), // quand le vendeur clique "Marquer comme livré"
    autoReleaseAt: v.optional(v.number()), // deliveredAt + 24h (voir CGU §3)
    releasedAt: v.optional(v.number()),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_referenceCode", ["referenceCode"])
    .index("by_autoRelease", ["status", "autoReleaseAt"]),

  // ---------------------------------------------------------------------
  // Factures (une par vente, consultable par l'acheteur et le vendeur)
  // ---------------------------------------------------------------------
  invoices: defineTable({
    escrowId: v.id("escrow"),
    invoiceNumber: v.string(), // ex: "AV-2026-000482"
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    productTitle: v.string(), // dupliqué au moment de l'émission (traçabilité)
    amount: v.number(),
    commissionAmount: v.number(),
    netAmountForSeller: v.number(),
    issuedAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_escrow", ["escrowId"]),

  // ---------------------------------------------------------------------
  // Boost de visibilité (abonnement vendeur)
  // ---------------------------------------------------------------------
  boosts: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("weekly"), v.literal("monthly")),
    price: v.number(),
    startsAt: v.number(),
    expiresAt: v.number(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled")),
    escrowId: v.optional(v.id("escrow")), // si le boost est payé via la même passerelle
  })
    .index("by_user", ["userId"])
    .index("by_status_expires", ["status", "expiresAt"]),

  // ---------------------------------------------------------------------
  // Panier (persistant par utilisateur)
  // ---------------------------------------------------------------------
  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  }).index("by_user", ["userId"]),

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  // ---------------------------------------------------------------------
  // Live shopping — préparé mais sans fournisseur de streaming branché
  // (aucun budget pour l'instant : Mux / LiveKit / Cloudflare Stream...)
  // ---------------------------------------------------------------------
  liveStreams: defineTable({
    hostId: v.id("users"),
    title: v.string(),
    thumbnailUrl: v.optional(v.string()),
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("ended")),
    scheduledFor: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    viewerCount: v.number(), // approximatif, incrémenté à la connexion
    peakViewerCount: v.number(),
    // Provider de streaming à brancher plus tard (Mux, LiveKit, Cloudflare Stream...).
    // playbackUrl / ingestUrl restent vides tant qu'aucun service n'est connecté.
    playbackUrl: v.optional(v.string()),
    ingestUrl: v.optional(v.string()),
    ingestKey: v.optional(v.string()),
    provider: v.optional(v.union(v.literal("mux"), v.literal("livekit"), v.literal("cloudflare"))),
    productIds: v.array(v.id("products")), // articles épinglés, mis en avant pendant le live
    pinnedProductId: v.optional(v.id("products")), // article actuellement "à l'écran"
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"]),

  liveChatMessages: defineTable({
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    content: v.string(),
    isPinned: v.boolean(), // ex: question mise en avant par le vendeur
  }).index("by_stream", ["streamId"]),

  liveViewers: defineTable({
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
  })
    .index("by_stream", ["streamId"])
    .index("by_stream_user", ["streamId", "userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("new_follower"),
      v.literal("new_reaction"),
      v.literal("new_review"),
      v.literal("payment_in_escrow"),
      v.literal("order_delivered"),
      v.literal("funds_released"),
      v.literal("dispute_opened"),
      v.literal("boost_expiring"),
      v.literal("live_started"),
    ),
    data: v.any(),
    isRead: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
});
