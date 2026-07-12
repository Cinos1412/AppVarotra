"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatAriary } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  const { userId } = useCurrentUser();
  const invoices = useQuery(api.invoices.forUser, userId ? { userId: userId as any } : "skip");

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour voir tes factures.</p>;
  if (invoices === undefined) return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton />
      <h1 className="font-display text-2xl mb-6">Mes factures</h1>

      {invoices.length === 0 ? (
        <GlassPanel className="p-10 text-center text-white/60">Aucune facture pour l'instant.</GlassPanel>
      ) : (
        <div className="space-y-3 stagger-children">
          {invoices.map((inv) => {
            const isSeller = inv.sellerId === userId;
            return (
              <GlassPanel key={inv._id} className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-vanille" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.productTitle}</p>
                  <p className="text-xs text-white/50">{inv.invoiceNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-vanille">
                    {formatAriary(isSeller ? inv.netAmountForSeller : inv.amount)}
                  </p>
                  <p className="text-xs text-white/40">
                    {isSeller ? `commission ${formatAriary(inv.commissionAmount)}` : "payé"}
                  </p>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
