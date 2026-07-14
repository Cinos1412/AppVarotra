"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { PremiumCard } from "@/components/ui/premium-card";
import { GlassButton } from "@/components/ui/glass-button";
import { formatAriary, cn, timeAgo } from "@/lib/utils";
import { Check, X, Flag, AlertTriangle } from "lucide-react";

type Tab = "flagged" | "reports" | "disputes";

function ModerationContent() {
  const [tab, setTab] = useState<Tab>("flagged");

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "flagged"} onClick={() => setTab("flagged")} label="Annonces à vérifier" />
        <TabButton active={tab === "reports"} onClick={() => setTab("reports")} label="Signalements" />
        <TabButton active={tab === "disputes"} onClick={() => setTab("disputes")} label="Litiges" />
      </div>

      {tab === "flagged" && <FlaggedProducts />}
      {tab === "reports" && <Reports />}
      {tab === "disputes" && <Disputes />}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", active ? "bg-white text-ink" : "glass text-white/60")}
    >
      {label}
    </button>
  );
}

function FlaggedProducts() {
  const products = useQuery(api.admin.flaggedProducts);
  const approve = useMutation(api.admin.approveProduct);
  const reject = useMutation(api.admin.rejectProduct);

  if (products === undefined) return <div className="h-40 rounded-2xl shimmer-bg" />;
  if (products.length === 0) return <EmptyState text="Aucune annonce en attente de vérification." />;

  return (
    <div className="space-y-3 stagger-children">
      {products.map((p) => (
        <PremiumCard key={p._id} className="p-4 flex items-center gap-3">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
            <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/product/${p._id}`} className="text-sm font-medium truncate hover:underline block">{p.title}</Link>
            <p className="text-xs text-white/50">{p.seller?.displayName} · {formatAriary(p.price)}</p>
            {p.moderationReason && <p className="text-xs text-vanille mt-1">Raison IA : {p.moderationReason}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => approve({ productId: p._id })} className="h-9 w-9 rounded-full bg-ravinala/20 text-ravinala flex items-center justify-center">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => reject({ productId: p._id, reason: prompt("Raison du refus (optionnel) ?") ?? undefined })}
              className="h-9 w-9 rounded-full bg-corail/20 text-corail flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}

function Reports() {
  const reports = useQuery(api.admin.pendingReports);
  const resolve = useMutation(api.admin.resolveReport);

  if (reports === undefined) return <div className="h-40 rounded-2xl shimmer-bg" />;
  if (reports.length === 0) return <EmptyState text="Aucun signalement en attente." />;

  return (
    <div className="space-y-3 stagger-children">
      {reports.map((r) => (
        <PremiumCard key={r._id} className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Flag className="h-3.5 w-3.5 text-corail" />
            <span className="text-xs text-white/50">
              {r.targetType === "product" ? "Article" : "Profil"} signalé par {r.reporter?.displayName} · {timeAgo(r._creationTime)}
            </span>
          </div>
          <p className="text-sm text-white/85 mb-3">{r.reason}</p>
          {r.target && (
            <Link
              href={r.targetType === "product" ? `/product/${r.targetId}` : `/profile/${(r.target as any).username}`}
              className="text-xs text-ravinala hover:underline"
            >
              Voir {r.targetType === "product" ? "l'article" : "le profil"} →
            </Link>
          )}
          <div className="flex gap-2 mt-3">
            <GlassButton variant="glass" size="sm" onClick={() => resolve({ reportId: r._id, resolution: "dismissed" })}>
              Ignorer
            </GlassButton>
            <GlassButton variant="danger" size="sm" onClick={() => resolve({ reportId: r._id, resolution: "action_taken" })}>
              Marquer comme traité
            </GlassButton>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}

function Disputes() {
  const disputes = useQuery(api.admin.openDisputes);
  const resolve = useMutation(api.admin.resolveDispute);

  if (disputes === undefined) return <div className="h-40 rounded-2xl shimmer-bg" />;
  if (disputes.length === 0) return <EmptyState text="Aucun litige ouvert." />;

  return (
    <div className="space-y-3 stagger-children">
      {disputes.map((d) => (
        <PremiumCard key={d._id} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-corail" />
            <span className="text-sm font-medium">{d.product?.title ?? "Article supprimé"}</span>
            <span className="text-xs text-white/40 ml-auto">{formatAriary(d.amount)}</span>
          </div>
          <p className="text-xs text-white/50 mb-1">
            Acheteur : {d.buyer?.displayName} · Vendeur : {d.seller?.displayName}
          </p>
          {d.disputeReason && <p className="text-sm text-white/80 mt-2">{d.disputeReason}</p>}

          <div className="flex gap-2 mt-3">
            <GlassButton variant="glass" size="sm" onClick={() => resolve({ escrowId: d._id, resolution: "refunded_to_buyer" })}>
              Rembourser l'acheteur
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={() => resolve({ escrowId: d._id, resolution: "released_to_seller" })}>
              Verser au vendeur
            </GlassButton>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <PremiumCard className="p-10 text-center text-white/50 text-sm">{text}</PremiumCard>;
}

export default function ModerationPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <ModerationContent />
    </AdminGuard>
  );
}
