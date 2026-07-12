"use client";

import Link from "next/link";
import { ShoppingCart, Search, Bell, MessageCircle, Radio } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GlassButton } from "@/components/ui/glass-button";
import { useCurrentUser } from "@/lib/use-current-user";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar() {
  const { userId } = useCurrentUser();
  const cartItems = useQuery(api.cart.getCart, userId ? { userId: userId as any } : "skip");
  const cartCount = cartItems?.length ?? 0;
  return (
    <header className="hidden md:block sticky top-4 z-40 mx-auto max-w-6xl px-6">
      <div className="glass rounded-3xl px-6 py-3 flex items-center gap-6">
        <Link href="/" className="font-display text-xl tracking-tight text-white shrink-0">
          App'<span className="text-vanille">Varotra</span>
        </Link>

        <Link href="/search" className="flex-1 relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <div className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] pl-11 pr-4 text-sm flex items-center text-white/40">
            Rechercher un article, un vendeur...
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle className="!h-11 !w-11" />
          <Link href="/live">
            <GlassButton variant="ghost" size="md" className="!px-3">
              <Radio className="h-5 w-5" />
            </GlassButton>
          </Link>
          <Link href="/messages">
            <GlassButton variant="ghost" size="md" className="!px-3">
              <MessageCircle className="h-5 w-5" />
            </GlassButton>
          </Link>
          <Link href="/notifications">
            <GlassButton variant="ghost" size="md" className="!px-3">
              <Bell className="h-5 w-5" />
            </GlassButton>
          </Link>
          <Link href="/cart" className="relative">
            <GlassButton variant="ghost" size="md" className="!px-3">
              <ShoppingCart className="h-5 w-5" />
            </GlassButton>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-corail text-[11px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <div className="ml-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </nav>
      </div>
    </header>
  );
}
