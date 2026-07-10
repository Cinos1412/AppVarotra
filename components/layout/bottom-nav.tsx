"use client";

import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/search", icon: Search, label: "Rechercher" },
  { href: "/sell", icon: PlusCircle, label: "Vendre" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profile/me", icon: User, label: "Profil" },
];

/** Barre de navigation basse, visible uniquement < md (mobile/tablette portrait). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden w-[92%] max-w-md">
      <div className="glass rounded-full px-2 py-2 flex items-center justify-between">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const isSell = href === "/sell";
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex flex-col items-center justify-center rounded-full transition-all",
                isSell
                  ? "h-12 w-12 bg-gradient-to-br from-vanille to-corail text-ink shadow-glass -mt-1"
                  : "h-11 w-11",
                !isSell && active && "bg-white/[0.14] text-white",
                !isSell && !active && "text-white/55",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
