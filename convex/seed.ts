import { mutation } from "./_generated/server";

/**
 * Peuple la base avec des données de démo, pour visualiser l'UI sans avoir
 * à créer manuellement des comptes. À lancer une seule fois depuis le
 * dashboard Convex (onglet "Functions" → `seed:run` → Run), en développement
 * uniquement — ne jamais exposer ceci en production.
 */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").take(1);
    if (existing.length > 0) return "Des données existent déjà — seed ignoré.";

    const sellerId = await ctx.db.insert("users", {
      clerkId: "demo_seller",
      username: "voromahery",
      displayName: "Voromahery Boutique",
      bio: "Vêtements et accessoires vintage, envoi rapide dans toute l'île 🌿",
      avatarUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200",
      location: "Antananarivo",
      isVerified: true,
      ratingAvg: 4.8,
      ratingCount: 23,
      salesCount: 41,
      followersCount: 128,
      followingCount: 12,
      boostActive: true,
      boostExpiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
      isAdmin: true, // pratique pour tester le dashboard admin tout de suite après le seed
      accountStatus: "active",
    });

    const buyerId = await ctx.db.insert("users", {
      clerkId: "demo_buyer",
      username: "hery.rakoto",
      displayName: "Hery Rakoto",
      avatarUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200",
      location: "Antananarivo",
      isVerified: false,
      ratingAvg: 0,
      ratingCount: 0,
      salesCount: 0,
      followersCount: 4,
      followingCount: 9,
      boostActive: false,
      isAdmin: false,
      accountStatus: "active",
    });

    const sampleProducts = [
      { title: "Veste en jean vintage", price: 45000, category: "Mode" as const, img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600" },
      { title: "iPhone 12 – 128Go", price: 780000, category: "Tech" as const, img: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=600" },
      { title: "Lampe artisanale en raphia", price: 32000, category: "Maison" as const, img: "https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=600" },
      { title: "Ballon de foot officiel", price: 28000, category: "Sport" as const, img: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=600" },
    ];

    for (const p of sampleProducts) {
      await ctx.db.insert("products", {
        sellerId,
        title: p.title,
        description: "Article de démonstration — modifie ou supprime via le dashboard Convex.",
        price: p.price,
        category: p.category,
        state: "Très bon état",
        location: "Antananarivo",
        images: [p.img],
        isActive: true,
        moderationStatus: "approved",
        isBoosted: true,
        views: 12,
        likesCount: 3,
        ratingAvg: 4.5,
        ratingCount: 2,
      });
    }

    await ctx.db.insert("stories", {
      authorId: sellerId,
      mediaUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
      mediaType: "image",
      caption: "Nouvelle collection disponible ✨",
      viewsCount: 0,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return { sellerId, buyerId, message: "Données de démo créées." };
  },
});
