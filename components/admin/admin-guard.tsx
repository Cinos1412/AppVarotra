"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

/**
 * N'affiche le contenu admin que si `admin.amIAdmin` (vérifié côté serveur
 * via la vraie session Clerk, pas un flag client) renvoie true. Le simple
 * fait de cacher un lien dans la nav ne suffit jamais à protéger une page
 * admin — c'est `requireAdmin()` côté Convex qui fait le vrai travail,
 * ceci n'est qu'un confort d'affichage.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAdmin = useQuery(api.admin.amIAdmin);

  if (isAdmin === undefined) {
    return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-corail" />
        <p className="text-white/70">Cette section est réservée aux administrateurs.</p>
        <Link href="/" className="text-ravinala text-sm">Retour à l'accueil</Link>
      </div>
    );
  }

  return <>{children}</>;
}
