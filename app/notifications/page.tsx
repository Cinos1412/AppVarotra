"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { timeAgo, cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import { Heart, UserPlus, Star, ShieldCheck, Package, Wallet, AlertTriangle, Zap, Radio } from "lucide-react";

const ICONS: Record<string, any> = {
  new_follower: UserPlus,
  new_reaction: Heart,
  new_review: Star,
  payment_in_escrow: ShieldCheck,
  order_delivered: Package,
  funds_released: Wallet,
  dispute_opened: AlertTriangle,
  boost_expiring: Zap,
  live_started: Radio,
};

const LABELS: Record<string, string> = {
  new_follower: "vous suit désormais.",
  new_reaction: "a réagi à votre article.",
  new_review: "a laissé un avis sur une de vos ventes.",
  payment_in_escrow: "Un paiement est bloqué en séquestre pour votre article.",
  order_delivered: "Le vendeur a marqué votre commande comme livrée.",
  funds_released: "Les fonds de votre vente ont été versés.",
  dispute_opened: "Un litige a été ouvert sur une commande.",
  boost_expiring: "Votre boost de visibilité arrive à expiration.",
  live_started: "est en direct maintenant !",
};

export default function NotificationsPage() {
  const { userId } = useCurrentUser();
  const notifications = useQuery(api.notifications.listForUser, userId ? { userId: userId as any } : "skip");
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour voir tes notifications.</p>;
  if (notifications === undefined) return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;

  return (
    <div className="max-w-lg mx-auto">
      <BackButton />
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <GlassButton variant="ghost" size="sm" onClick={() => markAllRead({ userId: userId as any })}>
            Tout marquer lu
          </GlassButton>
        )}
      </div>

      {notifications.length === 0 ? (
        <GlassPanel className="p-10 text-center text-white/60">Rien de nouveau pour l'instant.</GlassPanel>
      ) : (
        <div className="space-y-2 stagger-children">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Heart;
            return (
              <button key={n._id} onClick={() => !n.isRead && markRead({ notificationId: n._id })} className="w-full text-left">
                <GlassPanel className={cn("p-4 flex items-center gap-3", !n.isRead && "bg-white/[0.1]")}>
                  <div className="h-9 w-9 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-ravinala" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/85">{LABELS[n.type] ?? n.type}</p>
                    <p className="text-xs text-white/40 mt-0.5">{timeAgo(n._creationTime)}</p>
                  </div>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-corail shrink-0" />}
                </GlassPanel>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
