"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/use-current-user";

export default function MyProfileRedirect() {
  const router = useRouter();
  const { profile, isSignedIn, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
    } else if (profile) {
      router.replace(`/profile/${profile.username}`);
    } else {
      router.replace("/onboarding");
    }
  }, [isLoading, isSignedIn, profile, router]);

  return <div className="animate-pulse h-48 rounded-3xl bg-white/[0.05]" />;
}
