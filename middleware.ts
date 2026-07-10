import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// On définit les routes publiques (qui ne demandent pas de connexion)
const isPublicRoute = createRouteMatcher(['/', '/terms', '/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect(); // Protège automatiquement toutes les autres routes
  }
});

export const config = {
  matcher: [
    // Ignore les fichiers internes de Next.js et les fichiers statiques
    '/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Exécute toujours le middleware pour les requêtes d'API
    '/(api|trpc)(.*)',
  ],
};
