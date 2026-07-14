"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Barre de navigation basse, visible uniquement < md (mobile/tablette
 * portrait). L'onglet actif est surligné par une pastille qui GLISSE d'un
 * onglet à l'autre (façon tab bar iOS / App Store) plutôt que d'apparaître
 * instantanément — le bouton "Vendre" (CTA surélevé) n'en fait pas partie,
 * ce n'est pas un onglet de navigation classique.
 */
export function BottomNav() {
  const pathname = usePathname();
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const activeIndex = items.findIndex((item) => item.href === pathname);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (!el || items[activeIndex]?.href === "/sell") {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
  }, [activeIndex, pathname]);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden w-[92%] max-w-md">
      <div className="glass relative rounded-full px-2 py-2 flex items-center justify-between overflow-hidden">
        {/* Pastille glissante */}
        <div
          className="absolute top-2 h-11 w-11 rounded-full bg-white/[0.14] transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: indicator.left,
            width: indicator.width,
            opacity: indicator.visible ? 1 : 0,
          }}
        />

        {items.map(({ href, icon: Icon, label }, i) => {
          const active = pathname === href;
          const isSell = href === "/sell";
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              aria-label={label}
              className={cn(
                "relative z-10 flex flex-col items-center justify-center rounded-full transition-colors",
                isSell
                  ? "h-12 w-12 bg-gradient-to-br from-vanille to-corail text-ink shadow-glass -mt-1"
                  : "h-11 w-11",
                !isSell && active && "text-white",
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
