# App'Varotra

Marché social malgache (C2C/B2C) — Next.js 14 (App Router) · Tailwind + shadcn ·
Convex (backend temps réel) · Clerk (authentification).

## Installation (sans erreurs npm)

Les versions dans `package.json` sont **figées** (pas de `^` ni `latest`) et
testées ensemble — Next 14.2.15 + React 18.3.1 + Convex 1.16.4 + Clerk 5.7.5.
Ne fais pas de `npm install <lib>@latest` sans vérifier la compatibilité React 18.

```bash
# 1. Installer les dépendances exactement comme verrouillées
npm ci   # ou npm install si tu n'as pas encore de package-lock.json

# 2. Copier le fichier d'environnement et renseigner tes clés
cp .env.local.example .env.local

# 3. Lancer Convex (génère convex/_generated/* nécessaires aux imports)
npx convex dev

# 4. Dans un second terminal, lancer Next.js
npm run dev
```

⚠️ **Important :** les imports `@/convex/_generated/api` ne résolvent qu'après
avoir lancé `npx convex dev` au moins une fois (Convex génère les types à partir
de `convex/schema.ts` et des fonctions dans `convex/*.ts`). Si tu vois une erreur
`Cannot find module 'convex/_generated/api'`, c'est presque toujours ça.

## Structure

```
convex/           schéma + fonctions backend (mutations, queries, actions, cron)
  schema.ts        modèle de données complet
  users.ts         profils, follow/unfollow
  products.ts      feed, création, recherche full-text, réactions
  conversations.ts messagerie (liste, thread, envoi)
  escrow.ts        passerelle de paiement + séquestre (le cœur métier)
  reviews.ts       avis vérifiés post-achat
  invoices.ts      factures
  boosts.ts        abonnement de visibilité
  stories.ts       stories 24h
  cart.ts          panier persistant
  notifications.ts notifications
  files.ts         upload (avatars, photos produit, reçus)
  crons.ts         libération auto du séquestre (24h) + expiration des boosts
  seed.ts          jeu de données de démo (dev uniquement)
app/               pages (App Router) : accueil, produit, panier, checkout,
                   profil, messages, notifications, recherche, factures, boost,
                   vente, onboarding, CGU, sign-in/sign-up, webhook Clerk
components/
  ui/              primitives du design system (GlassPanel, GlassButton, ImageUploader)
  layout/          Topbar (desktop) + BottomNav (mobile)
  stories/         bandeau + lecteur de stories
  products/        carte produit + grille
  checkout/        passerelle de paiement + suivi de commande (escrow)
  profile/         en-tête de profil (follow, étoiles)
lib/               utilitaires (cn, formatage Ariary, dates, useCurrentUser)
```

## Démarrer avec des données de démo

Une fois `npx convex dev` lancé, ouvre le dashboard Convex → onglet
**Functions** → `seed:run` → **Run**. Ça crée un vendeur, un acheteur, quatre
articles et une story, pour voir l'UI sans passer par l'inscription complète.

## Ce qui reste à brancher (intentionnellement laissé en TODO)

- **Codes USSD composés** (`convex/escrow.ts` → `buildUssdDialCode`) : le format
  Mvola (`#111*1*2*destinataire*montant*1*motif#`) suit le raccourci officiel
  confirmé (`#111*1*2#` = "Transférer argent"). Les formats Orange Money et
  Airtel Money sont des **estimations non vérifiées** — teste-les toi-même
  avec un petit montant réel avant de les activer, sinon laisse `ussdVerified`
  à `false` pour ces opérateurs (comportement par défaut) et garde le menu
  manuel affiché à l'utilisateur.
- **OCR réel** dans `convex/escrow.ts` → `parseScreenshotAction` : branché sur
  Gemini 1.5 Flash. Nécessite `GEMINI_API_KEY` côté Convex
  (`npx convex env set GEMINI_API_KEY xxx` — pas dans `.env.local`).
- **Webhook Clerk** (`app/api/webhooks/clerk/route.ts`) : fonctionnel, mais il
  faut l'enregistrer côté Clerk Dashboard (événement `user.created`) et
  définir `CLERK_WEBHOOK_SECRET`. Ajoute `svix` à `package.json` si ce n'est
  pas déjà fait (`npm install svix`).
- **Paiement du boost** : `convex/boosts.ts` → `activate` active directement
  l'abonnement pour simplifier le scaffold. En production, fais-le transiter
  par la même vérification OCR que l'escrow avant d'appeler `activate`.
- **Icônes PWA** : `public/manifest.json` référence `icon-192.png` et
  `icon-512.png` à fournir toi-même.
