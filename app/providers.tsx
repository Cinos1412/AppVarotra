"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      // Le prop afterSignOutUrl a été retiré du <UserButton> — on garde une
      // redirection cohérente en la fixant globalement ici à la place.
      // ⚠️ Vérifie ce nom de prop dans le changelog Clerk v7 après
      // `npm install` : je n'ai pas pu tester ce changement en conditions
      // réelles (pas d'accès réseau dans mon environnement).
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#0A84FF",
          colorBackground: "#07090E",
          colorInputBackground: "#0F131A",
          colorInputText: "#F5FBF9",
          colorText: "#FFFFFF",
        },
        elements: {
          card: "glass backdrop-blur-xl border border-white/[0.06] shadow-glass",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
