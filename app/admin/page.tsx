"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { PremiumCard } from "@/components/ui/premium-card";
import { formatAriary } from "@/lib/utils";
import { Users, Package, Wallet, TrendingUp, ShieldAlert, Flag, AlertTriangle, UserX, Zap, ScrollText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function DashboardContent() {
  const stats = useQuery(api.admin.dashboardStats);

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl shimmer-bg" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Utilisateurs", value: stats.totalUsers, icon: Users, tone: "text-ravinala", href: "/admin/users" },
    { label: "Vendeurs actifs", value: stats.totalSellers, icon: Users, tone: "text-ravinala", href: "/admin/users" },
    { label: "Articles en vente", value: stats.totalProducts, icon: Package, tone: "text-vanille", href: "/admin/products" },
    { label: "GMV (total vendu)", value: formatAriary(stats.gmv), icon: TrendingUp, tone: "text-malachite" },
    { label: "Commission gagnée", value: formatAriary(stats.commissionEarned), icon: Wallet, tone: "text-vanille" },
    { label: "Revenu boosts", value: formatAriary(stats.boostRevenue), icon: Zap, tone: "text-corail" },
    { label: "À modérer", value: stats.pendingModeration, icon: ShieldAlert, tone: "text-corail", href: "/admin/moderation" },
    { label: "Signalements", value: stats.pendingReports, icon: Flag, tone: "text-corail", href: "/admin/moderation" },
    { label: "Litiges ouverts", value: stats.openDisputes, icon: AlertTriangle, tone: "text-corail", href: "/admin/moderation" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const content = (
            <PremiumCard className={`p-4 h-full ${c.href ? "hover:brightness-110 transition-all cursor-pointer" : ""}`}>
              <c.icon className={`h-4 w-4 mb-2 ${c.tone}`} />
              <p className="font-display text-2xl leading-none">{c.value}</p>
              <p className="text-xs text-white/50 mt-1.5">{c.label}</p>
            </PremiumCard>
          );
          return c.href ? (
            <Link key={c.label} href={c.href}>{content}</Link>
          ) : (
            <div key={c.label}>{content}</div>
          );
        })}
      </div>

      <PremiumCard className="p-5">
        <h2 className="font-display text-lg mb-4">Ventes — 14 derniers jours</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#181C25", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                labelStyle={{ color: "white" }}
                formatter={(value: number) => formatAriary(value)}
              />
              <Line type="monotone" dataKey="amount" stroke="#0A84FF" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Ventes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PremiumCard>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {stats.suspendedUsers > 0 && (
          <PremiumCard className="p-4 flex items-center gap-2.5">
            <UserX className="h-4 w-4 text-corail" />
            <p className="text-sm text-white/70">
              {stats.suspendedUsers} compte{stats.suspendedUsers > 1 ? "s" : ""} suspendu{stats.suspendedUsers > 1 ? "s" : ""}
            </p>
          </PremiumCard>
        )}
        <Link href="/admin/logs">
          <PremiumCard className="p-4 flex items-center gap-2.5 hover:brightness-110 transition-all cursor-pointer">
            <ScrollText className="h-4 w-4 text-white/50" />
            <p className="text-sm text-white/70">Journal des actions admin →</p>
          </PremiumCard>
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <DashboardContent />
    </AdminGuard>
  );
}
