"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatChip } from "@/components/ui/stat-chip";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Star, ShieldCheck, Zap, Share2, Pencil, MessageCircle, Users, LogOut, LayoutDashboard } from "lucide-react";

export function ProfileHeader({ profile, currentUserId }: { profile: any; currentUserId?: string }) {
  const follow = useMutation(api.users.follow);
  const unfollow = useMutation(api.users.unfollow);
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);
  const hasActiveStory = useQuery(api.stories.hasActive, { authorId: profile._id });
  const isFollowingQuery = useQuery(
    api.users.isFollowing,
    currentUserId ? { followerId: currentUserId as any, followingId: profile._id } : "skip",
  );
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const isFollowing = optimistic ?? isFollowingQuery ?? false;
  const isSelf = currentUserId === profile._id;

  async function toggleFollow() {
    if (!currentUserId) return;
    setOptimistic(!isFollowing);
    if (isFollowing) {
      await unfollow({ followerId: currentUserId as any, followingId: profile._id });
    } else {
      await follow({ followerId: currentUserId as any, followingId: profile._id });
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // Redirection "en dur" plutôt que de compter uniquement sur le
      // routing interne de Clerk — si jamais ça ne redirige pas tout
      // seul, ça garantit quand même que l'utilisateur atterrit sur
      // l'accueil avec une session bien terminée.
      window.location.href = "/";
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
      setSigningOut(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.displayName, url });
      } catch {
        /* annulé */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleMessage() {
    if (!currentUserId) return;
    const conversationId = await getOrCreateConversation({
      buyerId: currentUserId as any,
      sellerId: profile._id,
    });
    window.location.href = `/messages/${conversationId}`;
  }

  return (
    <GlassPanel className="p-6" intensity="strong">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "rounded-full shrink-0 h-20 w-20",
            hasActiveStory ? "bg-ravinala p-[3px] animate-float-subtle" : "p-0",
          )}
        >
          <div className="h-full w-full rounded-full border-2 border-ink overflow-hidden bg-ink-soft">
            {profile.avatarUrl && (
              <Image src={profile.avatarUrl} alt={profile.displayName} width={80} height={80} className="object-cover h-full w-full" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-xl truncate">{profile.displayName}</h1>
            {profile.isVerified && <ShieldCheck className="h-4 w-4 text-ravinala shrink-0" />}
            {profile.boostActive && <Zap className="h-4 w-4 text-vanille shrink-0" />}
          </div>
          <p className="text-white/50 text-sm">@{profile.username} · {profile.location}</p>
          {profile.bio && <p className="text-sm text-white/70 mt-2 leading-relaxed">{profile.bio}</p>}
        </div>

        <button onClick={handleShare} className="relative h-9 w-9 rounded-full glass flex items-center justify-center shrink-0">
          <Share2 className="h-3.5 w-3.5" />
          {copied && (
            <span className="absolute -top-8 right-0 text-[10px] bg-ink-soft px-2 py-1 rounded-lg whitespace-nowrap">
              Lien copié !
            </span>
          )}
        </button>
      </div>

      {/* Stats — chips façon dashboard, remplace le texte brut */}
      <div className="flex flex-wrap gap-2.5 mt-5">
        <StatChip icon={Users} value={profile.followersCount} label="abonnés" tone="malachite" />
        <StatChip value={profile.followingCount} label="suivis" tone="neutral" />
        <StatChip icon={Star} value={profile.ratingAvg.toFixed(1)} label={`(${profile.ratingCount} avis)`} tone="vanille" />
      </div>

      <div className="flex gap-2.5 mt-5">
        {isSelf ? (
          <>
            {profile.isAdmin && (
              <Link href="/admin">
                <GlassButton variant="glass">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </GlassButton>
              </Link>
            )}
            <Link href="/onboarding" className="flex-1">
              <GlassButton variant="glass" className="w-full">
                <Pencil className="h-3.5 w-3.5" /> Modifier mon profil
              </GlassButton>
            </Link>
            <Link href="/boost">
              <GlassButton variant="primary">
                <Zap className="h-3.5 w-3.5" /> {profile.boostActive ? "Actif" : "Booster"}
              </GlassButton>
            </Link>
            <GlassButton variant="glass" onClick={handleSignOut} isLoading={signingOut}>
              <LogOut className="h-3.5 w-3.5" />
            </GlassButton>
          </>
        ) : (
          <>
            <GlassButton variant={isFollowing ? "glass" : "primary"} className="flex-1" onClick={toggleFollow}>
              {isFollowing ? "Abonné" : "Suivre"}
            </GlassButton>
            <GlassButton variant="glass" className="flex-1" onClick={handleMessage} disabled={!currentUserId}>
              <MessageCircle className="h-3.5 w-3.5" /> Message
            </GlassButton>
          </>
        )}
      </div>
    </GlassPanel>
  );
}
