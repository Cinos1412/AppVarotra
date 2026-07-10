"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Pont Clerk ↔ Convex : Clerk gère qui est connecté, Convex stocke le profil
 * métier (bio, notation, boost...). On résout l'un à partir de l'autre ici,
 * une seule fois, plutôt que de passer "me" en dur dans chaque composant.
 */
export function useCurrentUser() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const profile = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");

  return {
    clerkUser: user,
    profile: profile ?? null,
    userId: profile?._id ?? null,
    isLoading: !clerkLoaded || (!!user && profile === undefined),
    isSignedIn: !!user,
  };
}
