"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { PremiumCard } from "@/components/ui/premium-card";
import { timeAgo } from "@/lib/utils";
import { ScrollText } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  approve_product: "a approuvé l'article",
  reject_product: "a refusé l'article",
  resolve_report: "a traité un signalement",
  resolve_dispute: "a tranché un litige",
  suspend_user: "a suspendu l'utilisateur",
  reactivate_user: "a réactivé l'utilisateur",
  verify_user: "a vérifié l'utilisateur",
  unverify_user: "a retiré la vérification de l'utilisateur",
  grant_admin: "a promu administrateur",
  revoke_admin: "a retiré les droits admin de",
  deactivate_product: "a désactivé l'article",
  reactivate_product: "a réactivé l'article",
};

function LogsContent() {
  const logs = useQuery(api.admin.actionLog);

  if (logs === undefined) return <div className="h-40 rounded-2xl shimmer-bg" />;
  if (logs.length === 0) {
    return (
      <PremiumCard className="p-10 text-center text-white/50 text-sm">
        Aucune action admin enregistrée pour l'instant.
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {logs.map((log) => (
        <PremiumCard key={log._id} className="p-3.5 flex items-start gap-3">
          <ScrollText className="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/85">
              <span className="font-medium">{log.admin?.displayName ?? "Admin"}</span>{" "}
              {ACTION_LABELS[log.action] ?? log.action}
              {log.note && <span className="text-white/50"> — {log.note}</span>}
            </p>
            <p className="text-xs text-white/40 mt-0.5">{timeAgo(log._creationTime)}</p>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <h1 className="font-display text-xl mb-4">Journal des actions</h1>
      <LogsContent />
    </AdminGuard>
  );
}
