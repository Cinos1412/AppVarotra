"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldCheck, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/moderation", label: "Modération", icon: ShieldCheck },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/products", label: "Produits", icon: Package },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4 md:mx-0 md:px-0">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-white text-ink" : "glass text-white/70",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
