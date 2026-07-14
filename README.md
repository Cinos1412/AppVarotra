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

## Migration Next.js 16 / React 19 / Clerk v7 (13 juillet 2026)

**Pourquoi maintenant :** Next.js 14 est EOL depuis octobre 2025 (plus de patch de
sécurité), et une faille critique (CVE-2025-66478, RCE potentiel, CVSS 10.0)
touchant les React Server Components n'était donc jamais corrigée dans ce
projet. Cette mise à jour n'est pas cosmétique.

**Versions :** `next` 14.2.15 → 16.2.10 (LTS), `react`/`react-dom` 18.3.1 → 19.1.1,
`@clerk/nextjs` 5.7.5 → 7.5.17, `@types/react(-dom)` alignés sur React 19,
`eslint-config-next` aligné sur Next 16. Tailwind reste volontairement en v3
(voir plus bas — migration séparée, non urgente).

**Changements de code appliqués** (les deux seuls endroits du projet qui
touchaient des API devenues asynchrones — le reste de l'app est en
composants client avec `useParams()`/`useSearchParams()`, donc épargné par
le changement `params`/`searchParams` asynchrones de Next 15+) :
- `middleware.ts` : `auth().protect()` (pattern Clerk v5) → `await auth.protect()`
  avec le callback `clerkMiddleware` marqué `async` (pattern Clerk v6+/v7 —
  `authMiddleware` est totalement supprimé depuis v6, on l'évitait déjà).
- `app/api/webhooks/clerk/route.ts` : `headers()` → `await headers()`
  (asynchrone depuis Next.js 15).

**⚠️ Important — je n'ai pas pu tester ces changements.** Mon environnement
n'a pas d'accès réseau pour lancer `npm install`/`next build`/`next dev`. Le
code a été audité et corrigé à partir de la documentation officielle des
breaking changes, mais **teste en local avant de déployer en prod** :

```bash
git commit -am "checkpoint avant migration Next 16 / React 19 / Clerk v7"
npm install
npx next build   # doit passer sans erreur de types ni de build
npm run dev       # tester : connexion, création de produit, paiement, stories
```

**À vérifier toi-même après `npm install`, dans l'ordre :**
1. **Node.js ≥ 20 requis par Next 16** — vérifie avec `node -v` dans ton
   Codespace ; si c'est plus vieux, `nvm install 20 && nvm use 20`.
2. Si `next build` remonte des erreurs de types côté Clerk (`clerkClient()`
   par exemple), c'est probablement un appel synchrone qui doit devenir
   `await clerkClient()` — on n'en utilise pas dans ce projet actuellement,
   mais vérifie si tu en as ajouté depuis.
3. Turbopack est désormais le bundler par défaut (dev **et** build) sous
   Next 16 — notre `next.config.mjs` n'a pas de config webpack custom donc
   ça devrait être transparent, mais surveille la sortie de build.
4. `convex/react-clerk` (le pont Convex↔Clerk) n'a pas de contrainte de
   version connue bloquante avec Clerk v7, mais je n'ai pas de confirmation
   ferme — si `ConvexProviderWithClerk` remonte une erreur de types après
   `npm install`, dis-le moi.

## Tailwind CSS v4 — migration séparée, pas urgente

Tailwind v4 (actuellement 4.3.x) est une réécriture complète du moteur
(config CSS-first via `@theme`, nouveau pipeline PostCSS/Vite). Contrairement
à Next.js, il n'y a pas d'enjeu de sécurité à rester en v3.4 — c'est un
outil de build, pas du code qui tourne en prod. Je préfère la traiter comme
un chantier à part, surtout parce que nos surcharges `.light .bg-white\/\[0.06\]`
du thème clair (basées sur le moteur PostCSS actuel) devront être revérifiées
sous le nouveau moteur CSS (Lightning CSS) avant de basculer.

**Fichiers remplacés par tes versions corrigées :**
- `next.config.mjs` — ajout d'`img.clerk.com` (avatars Clerk)
- `middleware.ts` — `clerkMiddleware`/`createRouteMatcher` (l'ancien `authMiddleware` est déprécié)
- `convex/escrow.ts` — `btoa` au lieu de `Buffer` (indisponible dans le runtime V8 par défaut de Convex)

**Bugs de comptage :**
- Les vues produit n'étaient jamais incrémentées (`incrementViews` n'était appelé nulle part) — corrigé, une fois par visite.
- Le bouton like démarrait toujours "non-liké" même si l'utilisateur avait déjà réagi — ajout de `products.hasReacted` pour initialiser le vrai état.
- Un vendeur ne peut plus acheter son propre article (bloqué côté UI **et** côté serveur dans `escrow.initiate`/`conversations.getOrCreate`).

**Stories — refonte :**
- Bulles rondes → cartes rectangulaires avec aperçu visible de l'image (`components/stories/story-bar.tsx`).
- Proportions d'image corrigées dans le lecteur : fond flouté + image en `object-contain` (ne recadre plus jamais, quel que soit le ratio d'origine).
- Appui maintenu = pause (comme Instagram/Facebook), swipe vers le bas = fermer.
- Réactions emoji en direct, visibles par tous les viewers connectés en temps réel grâce à la réactivité Convex (`stories.react`/`stories.listReactions`).
- Bouton "Acheter"/lien article directement dans la story, avec une étape de confirmation à la publication pour lier un article (optionnel).

**Profil mobile :**
- Bouton de déconnexion ajouté (`useClerk().signOut()`).
- L'anneau autour de la photo de profil ne s'affiche plus que si l'utilisateur a une story active (`stories.hasActive`), et n'est plus multicolore — une seule couleur de marque (ravinala).

**Navigation :**
- `components/ui/back-button.tsx` ajouté sur toutes les pages secondaires qui n'en avaient pas (produit, panier, checkout, vente, boost, factures, notifications, recherche, live/create, profil d'un autre utilisateur).

## Thème clair/sombre

Toggle fonctionnel (`next-themes`, bouton dans la topbar/header mobile). **Choix pragmatique assumé** : plutôt que de réécrire les ~40 fichiers de composants avec des variantes `dark:`/`light:`, le thème clair est appliqué par surcharge CSS ciblée dans `app/globals.css` (`.light .text-white\/70 { ... }` etc.) sur le petit ensemble de classes Tailwind réellement réutilisées partout (opacités de blanc, fonds `ink`, bordures `white/[0.xx]`). Ça couvre large (nav, cartes glass/premium, texte) sans toucher chaque fichier, mais certains détails page par page peuvent manquer de contraste — à me signaler si tu en repères, je corrige au cas par cas plutôt que de deviner.

Deux langages visuels cohabitent volontairement :
- **Liquid glass** (`GlassPanel`, `.glass`) : chrome de l'app — nav, CTA,
  anneaux de story, badges. Flouté, translucide.
- **Premium** (`PremiumCard`, `.premium-card`) : contenu dense où la
  lisibilité prime — description produit, bloc vendeur, avis. Surface
  opaque, bord net, pas de flou. `StatChip` (chiffre en gras + libellé,
  fond plat coloré) et `AvatarStack` complètent ce langage.

La page produit (`app/product/[id]/page.tsx`) a été refaite avec une vraie
galerie cliquable/swipeable (`components/products/product-gallery.tsx` —
miniatures, indicateurs, plein écran tactile), une description dépliable,
un bloc vendeur avec bouton "Contacter" direct, un bouton de partage
(`navigator.share` avec repli presse-papier), et un carrousel "articles
similaires". Le profil a les mêmes ajouts : onglets Articles/Avis, partage,
message direct, édition rapide pour soi-même.

`lib/compress-image.ts` redimensionne et ré-encode en JPEG côté client avant
tout upload (canvas, aucune dépendance externe) :
- Photos produit / avatar : 1600px max, qualité 0.82
- Stories (vues plein écran) : 1920px max, qualité 0.8
- Captures d'écran de reçu : 2000px max, qualité 0.9 (plus légère exprès —
  le texte du montant/référence doit rester net pour que Gemini le lise
  correctement)

Si la compression échoue (format exotique, HEIC mal supporté par certains
navigateurs) ou si le résultat est plus gros que l'original, le fichier
d'origine est envoyé tel quel — l'upload n'est jamais bloqué par ça.

`tailwind.config.ts` + `app/globals.css` ajoutent un vocabulaire d'animation
cohérent (repris du même esprit que les références fournies, adapté à la
palette sombre liquid glass) :
- `animate-fade-in-up`, `.stagger-children` — entrée en cascade des grilles/listes
- `animate-pulse-glow` / `animate-pulse-glow-corail` — halo respirant (CTA, badges LIVE)
- `animate-float-subtle` — flottement discret (bulle "Ta story +")
- `.glow-on-hover` — lift + halo au survol (boutons primaires)
- `.shimmer-bg` — skeletons de chargement
- `accordion-down/up`, `caret-blink` — vocabulaire shadcn standard, prêts si tu ajoutes des composants Radix

## USSD — ce qui est réellement possible (important)

Une web app / PWA **ne peut pas exécuter une session USSD ni superposer sa
propre interface par-dessus l'écran de saisie du code secret** — c'est une
frontière de sécurité du système d'exploitation, pas une limite technique
contournable. `PaymentGateway` fait le maximum possible : un lien `tel:`
avec le code USSD composé pré-rempli (`convex/escrow.ts` → `buildUssdDialCode`),
et une détection de retour dans l'app (`document.visibilitychange`) qui
enchaîne automatiquement sur l'étape de preuve avec une transition animée —
mais l'app ne saura jamais si le virement a réellement réussi tant que la
preuve n'est pas soumise.

Si tu veux un jour une vraie automatisation (sans USSD manuel) : c'est
l'API marchande officielle de chaque opérateur (Mvola/Orange/Airtel
"collection", façon STK-push) qu'il faut viser — eux seuls peuvent pousser
la demande de PIN et te renvoyer un webhook de confirmation.

`convex/liveStreams.ts` + `app/live/*` + `components/live/*` couvrent tout le
flux (planifier/démarrer/terminer un live, produits épinglés, chat en
direct, compteur de viewers) — **sauf le flux vidéo lui-même**, qui nécessite
un fournisseur payant (Mux, LiveKit, Cloudflare Stream...). Tant que
`playbackUrl` est vide sur le document `liveStreams`, `VideoPlaceholder`
s'affiche à la place. Pour activer un vrai live : crée le live côté
fournisseur, stocke `ingestUrl`/`ingestKey` (à donner au vendeur, ex. pour
OBS) + `playbackUrl`, puis remplace `VideoPlaceholder` par un vrai lecteur
dans `app/live/[streamId]/page.tsx`.

## Session du 13 juillet — cartes produit, édition, avis photo, modération IA

**3 correctifs adoptés de tes fichiers** (bugs de compatibilité réels) :
- `app/checkout/page.tsx` : `useSearchParams()` doit être dans un `<Suspense>` (exigence Next.js pour le rendu statique) — même chose appliquée à `app/sell/page.tsx` qui en a maintenant besoin aussi (mode édition via `?edit=`).
- `components/stories/story-bar.tsx` : casts `as any` sur `group.author` pour satisfaire TypeScript.
- `components/layout/topbar.tsx` : `<UserButton afterSignOutUrl="/" />` → prop retirée de l'API v7, redirection déplacée au niveau du `<ClerkProvider>` — **à vérifier après `npm install`**, je n'ai pas pu tester ce nom de prop exact en conditions réelles.

**Fiches produit** : coins moins arrondis (`rounded-3xl` → `rounded-xl`), pied de carte opaque (`bg-ink-soft`) au lieu de glass pour un meilleur contraste du texte, halo bleu `ravinala` au survol au lieu d'un simple déplacement.

**Modifier / supprimer une publication** : boutons sur la fiche produit pour le vendeur (`convex/products.ts` → `update`/`remove`). La suppression est "douce" (`isActive: false`) plutôt qu'une vraie suppression en base, pour ne pas casser l'historique des commandes/avis qui référencent l'article.

**Avis avec photos, sur la fiche produit** : `reviews.images` dans le schéma, formulaire (`components/products/review-form.tsx`) qui apparaît automatiquement dans la conversation une fois la commande finalisée (`OrderStatusCard`), et affichage avec photos cliquables en plein écran directement sur `app/product/[id]/page.tsx` (`components/products/product-reviews.tsx`) — plus seulement sur le profil du vendeur.

**Modération IA à la publication** (`convex/moderation.ts`) : passe par Gemini (texte + photo de couverture) avant toute publication. Trois verdicts : `approved` (publié), `flagged_for_review` (publié mais marqué — en attente d'un futur tableau de bord admin pour vérification humaine), `rejected` (refusé, avec raison affichée au vendeur). Le contenu ordinaire n'est jamais bloqué par excès de prudence — seul du contenu manifestement illégal l'est. Nécessite la même `GEMINI_API_KEY` que l'OCR des reçus.

## Dashboard admin (`/admin`)

Structure complète : `/admin` (stats + graphique des ventes 14 jours),
`/admin/moderation` (annonces flaggées par l'IA, signalements, litiges —
en onglets), `/admin/users` (recherche, vérifier, suspendre),
`/admin/products` (activer/désactiver n'importe quel article).

**Sécurité — important :** la vérification admin (`convex/admin.ts` →
`requireAdmin()`) se fait côté serveur à partir de la vraie session Clerk
(`ctx.auth.getUserIdentity()`), pas d'un identifiant passé en argument par
le client qui pourrait être falsifié. `AdminGuard` côté front n'est qu'un
confort d'affichage — la vraie protection est dans chaque fonction Convex.

**Premier admin :** le seed (`convex/seed.ts`) rend le vendeur de démo
admin automatiquement. En dehors du seed, il faut promouvoir le tout
premier admin manuellement depuis le dashboard Convex (`users` → éditer
le document → `isAdmin: true`) — après ça, `admin.setAdmin` permet d'en
promouvoir d'autres depuis l'app elle-même.

Deux mutations manquaient pour que la modération ait des données à
traiter : `escrow.openDispute` (bouton "Signaler un problème" sur le
statut de commande) et `reports.submit` (bouton "Signaler" sur la fiche
produit, qui ne faisait rien avant).

## Système "verre" et nav — retours du 13 juillet

- **Effet liquid glass amélioré** (`.glass` dans `globals.css`) : reflets
  spéculaires plus marqués, ombres internes en plusieurs couches,
  `saturate(1.4)` sur le flou pour un rendu plus riche. Le fichier de démo
  fourni (`index.html`/`style.css`/`script.js`, effet SVG
  `feDisplacementMap`) n'a pas été repris tel quel — il ne fonctionne que
  sous Chromium (`backdrop-filter: url()` non supporté par Safari/Firefox),
  ce qui aurait cassé l'app pour tous les utilisateurs iPhone. On en garde
  l'esprit (profondeur, reflets) avec des techniques compatibles partout.
- **Nav basse avec indicateur glissant** (`components/layout/bottom-nav.tsx`) :
  la pastille derrière l'onglet actif glisse d'un onglet à l'autre avec un
  easing "spring" (`cubic-bezier(0.34, 1.56, 0.64, 1)`), façon tab bar iOS.
- **Bouton déconnexion** : l'API Clerk utilisée (`signOut({ redirectUrl })`)
  était déjà correcte après vérification de la doc à jour — le vrai
  correctif est une redirection explicite (`window.location.href`) après
  la promesse `signOut()`, plutôt que de compter uniquement sur le routing
  interne, plus un état de chargement pour voir immédiatement si ça
  répond. Si ça ne suffit pas, il faudra un retour précis (message
  d'erreur dans la console, comportement observé) pour aller plus loin.

## Corrections récentes (retours utilisateur)

- **En-tête mobile manquant** : `Topbar` était `hidden md:block` sans
  équivalent mobile → ajout de `components/layout/mobile-header.tsx`.
- **Stories invisibles sans données** : `StoryBar` renvoyait `null` si aucune
  story active, ce qui cachait complètement la fonctionnalité → elle est
  maintenant toujours visible, avec une bulle "Ta story +" pour en publier une.
- **Messages** : refonte de la liste (façon liste de discussions native) et
  du fil (en-tête sticky avec retour + avatar, bulles groupées façon iMessage).

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
