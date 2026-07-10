"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";

const LOCATIONS = ["Antananarivo", "Mahajanga", "Toamasina", "Fianarantsoa", "Toliara", "Antsirabe"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, isLoading } = useCurrentUser();

  const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
  const updateProfile = useMutation(api.users.updateProfile);

  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.fullName ?? "");
  const [location, setLocation] = useState(profile?.location ?? "Antananarivo");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    // Filet de sécurité si le webhook Clerk → Convex n'a pas encore tourné.
    const userId =
      profile?._id ??
      (await getOrCreateProfile({
        clerkId: user.id,
        username: username || `varotra${user.id.slice(-6)}`,
        displayName: displayName || "Nouvel utilisateur",
        avatarUrl: user.imageUrl,
        location,
      }));

    await updateProfile({ userId: userId as any, displayName, bio, location });
    router.push(`/profile/${username}`);
  }

  if (isLoading) return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-2xl mb-1">Complète ton profil</h1>
      <p className="text-white/50 text-sm mb-6">Quelques infos pour que la communauté te reconnaisse.</p>

      <GlassPanel className="p-6" intensity="strong">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom d'utilisateur">
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
              placeholder="alice.rakoto"
              className="input"
            />
          </Field>
          <Field label="Nom affiché">
            <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
          </Field>
          <Field label="Ville">
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="input">
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Bio (optionnel)">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Passionné(e) de mode vintage, livraison rapide 🚀"
              className="input resize-none"
            />
          </Field>

          <GlassButton type="submit" variant="primary" size="lg" className="w-full" isLoading={saving}>
            Créer mon profil
          </GlassButton>
        </form>
      </GlassPanel>

      <style jsx global>{`
        .input {
          width: 100%;
          height: 2.75rem;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0 1rem;
          font-size: 0.875rem;
          color: white;
        }
        textarea.input { height: auto; padding: 0.75rem 1rem; }
        .input:focus { outline: none; border-color: rgba(47, 168, 143, 0.6); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-white/70 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
