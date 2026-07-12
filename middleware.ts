import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes publiques — le reste exige une session Clerk valide.
const isPublicRoute = createRouteMatcher([
  "/",
  "/terms",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/product/(.*)",
  "/live",
  "/live/(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
