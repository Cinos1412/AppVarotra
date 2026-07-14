"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { PremiumCard } from "@/components/ui/premium-card";
import { cn } from "@/lib/utils";
import { Search, ShieldCheck, Ban, Shield } from "lucide-react";

function UsersContent() {
  const [search, setSearch] = useState("");
  const users = useQuery(api.admin.listUsers, { search: search || undefined });
  const setAccountStatus = useMutation(api.admin.setAccountStatus);
  const setVerified = useMutation(api.admin.setVerified);

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] pl-11 pr-4 text-sm focus:outline-none focus:border-ravinala/60"
        />
      </div>

      {users === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer-bg" />)}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {users.map((u) => (
            <PremiumCard key={u._id} className="p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-ink-soft shrink-0">
                {u.avatarUrl && <Image src={u.avatarUrl} alt="" width={40} height={40} className="object-cover h-full w-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${u.username}`} className="text-sm font-medium truncate hover:underline flex items-center gap-1.5">
                  {u.displayName}
                  {u.isAdmin && <Shield className="h-3 w-3 text-vanille" />}
                  {u.accountStatus === "suspended" && (
                    <span className="text-[10px] bg-corail/20 text-corail px-1.5 py-0.5 rounded-full">Suspendu</span>
                  )}
                </Link>
                <p className="text-xs text-white/45">@{u.username} · {u.salesCount} ventes · {u.ratingAvg.toFixed(1)}★</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setVerified({ userId: u._id, isVerified: !u.isVerified })}
                  title="Vérifier"
                  className={cn("h-8 w-8 rounded-full flex items-center justify-center", u.isVerified ? "bg-ravinala/20 text-ravinala" : "bg-white/[0.06] text-white/40")}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setAccountStatus({ userId: u._id, status: u.accountStatus === "suspended" ? "active" : "suspended" })}
                  title="Suspendre"
                  className={cn("h-8 w-8 rounded-full flex items-center justify-center", u.accountStatus === "suspended" ? "bg-corail/20 text-corail" : "bg-white/[0.06] text-white/40")}
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <UsersContent />
    </AdminGuard>
  );
}
