"use client";

import Link from "next/link";
import { Bell, MessageCircle, ShoppingCart, Radio } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * En-tête mobile — Topbar (desktop) a `hidden md:block`, il fallait donc
 * l'équivalent compact pour < md. Reste discret : logo + accès rapides,
 * pas de barre de recherche pleine largeur (elle vit sur /search).
 */
export function MobileHeader() {
  const { userId } = useCurrentUser();
  const cartItems = useQuery(api.cart.getCart, userId ? { userId: userId as any } : "skip");
  const notifications = useQuery(api.notifications.listForUser, userId ? { userId: userId as any } : "skip");
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const cartCount = cartItems?.length ?? 0;

  return (
    <header className="md:hidden sticky top-0 z-30 -mx-4 px-4 pt-3 pb-2 mb-2">
      <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="font-display text-lg tracking-tight text-white">
          App'<span className="text-vanille">Varotra</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle className="!h-9 !w-9" />
          <Link href="/live" aria-label="Live" className="relative h-9 w-9 flex items-center justify-center">
            <Radio className="h-[18px] w-[18px] text-white/75" />
          </Link>
          <Link href="/notifications" aria-label="Notifications" className="relative h-9 w-9 flex items-center justify-center">
            <Bell className="h-[18px] w-[18px] text-white/75" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-corail" />
            )}
          </Link>
          <Link href="/cart" aria-label="Panier" className="relative h-9 w-9 flex items-center justify-center">
            <ShoppingCart className="h-[18px] w-[18px] text-white/75" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-corail text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
