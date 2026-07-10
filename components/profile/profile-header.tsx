"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Star, ShieldCheck, Zap } from "lucide-react";

export function ProfileHeader({ profile, currentUserId }: { profile: any; currentUserId?: string }) {
  const follow = useMutation(api.users.follow);
  const unfollow = useMutation(api.users.unfollow);
  const isFollowingQuery = useQuery(
    api.users.isFollowing,
    currentUserId ? { followerId: currentUserId as any, followingId: profile._id } : "skip",
  );
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
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

  return (
    <GlassPanel className="p-6" intensity="strong">
      <div className="flex items-start gap-4">
        <div className="ravinala-ring p-[3px] rounded-full h-20 w-20 shrink-0">
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

          <div className="flex items-center gap-4 mt-2.5 text-sm">
            <span><b>{profile.followersCount}</b> <span className="text-white/50">abonnés</span></span>
            <span><b>{profile.followingCount}</b> <span className="text-white/50">suivis</span></span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-vanille text-vanille" />
              <b>{profile.ratingAvg.toFixed(1)}</b>
              <span className="text-white/50">({profile.ratingCount})</span>
            </span>
          </div>

          {profile.bio && <p className="text-sm text-white/70 mt-2.5">{profile.bio}</p>}
        </div>
      </div>

      {!isSelf && (
        <GlassButton
          variant={isFollowing ? "glass" : "primary"}
          className="w-full mt-5"
          onClick={toggleFollow}
        >
          {isFollowing ? "Abonné" : "Suivre"}
        </GlassButton>
      )}
    </GlassPanel>
  );
}
