"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StoryViewer } from "./story-viewer";
import { useCurrentUser } from "@/lib/use-current-user";
import { compressImage } from "@/lib/compress-image";
import { GlassButton } from "@/components/ui/glass-button";
import { Plus, Loader2, X } from "lucide-react";
import { formatAriary } from "@/lib/utils";

/**
 * Bandeau "Nouveautés du jour" — cartes RECTANGULAIRES avec aperçu visible
 * de la story (au lieu de petites bulles rondes où il fallait cliquer à
 * l'aveugle pour voir le contenu). Toujours rendu, même sans donnée, avec
 * "Ta story" en premier pour publier.
 */
export function StoryBar() {
  const { userId, profile } = useCurrentUser();
  const groups = useQuery(api.stories.activeFeed) ?? [];
  const createStory = useMutation(api.stories.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<string | null>(null);
  const [linkedProductId, setLinkedProductId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const myProducts = useQuery(api.products.bySeller, userId ? { sellerId: userId as any } : "skip");

  // Sécurité TypeScript ajoutée ici pour le filtrage des groupes
  const myGroup = groups.find((g) => (g.author as any)?._id === userId);
  const otherGroups = groups.filter((g) => (g.author as any)?._id !== userId);
  const allGroups = myGroup ? [myGroup, ...otherGroups] : otherGroups;

  async function handleAddStory(file: File) {
    if (!userId) return;
    setUploading(true);
    const compressed = await compressImage(file, { maxDimension: 1920, quality: 0.8 });
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": compressed.type }, body: compressed });
    const { storageId } = await result.json();
    const url = await convex.query(api.files.getUrl, { storageId });
    setUploading(false);
    if (url) setPendingUpload(url); 
  }

  async function handlePublish() {
    if (!userId || !pendingUpload) return;
    await createStory({
      authorId: userId as any,
      mediaUrl: pendingUpload,
      mediaType: "image",
      productId: linkedProductId ? (linkedProductId as any) : undefined,
    });
    setPendingUpload(null);
    setLinkedProductId("");
  }

  const myLatestStory = myGroup?.stories[myGroup.stories.length - 1];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 md:px-0 pb-1">
        {/* Carte "Ta story" — toujours en premier, avec ou sans story active */}
        {userId && (
          <div className="relative shrink-0 w-[104px] h-[152px] rounded-2xl overflow-hidden glass">
            {myLatestStory ? (
              <button onClick={() => setOpenIndex(0)} className="absolute inset-0">
                <Image src={myLatestStory.mediaUrl} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white/[0.04]">
                {profile?.avatarUrl && (
                  <Image src={profile.avatarUrl} alt="" fill className="object-cover opacity-30" />
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-vanille flex items-center justify-center border-2 border-ink animate-float-subtle"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-ink" /> : <Plus className="h-4 w-4 text-ink" />}
            </button>

            <p className="absolute bottom-2 left-2.5 text-white text-xs font-medium drop-shadow">Ta story</p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAddStory(e.target.files[0])}
            />
          </div>
        )}

        {/* Cartes des autres vendeurs — avec la correction apportée pour TypeScript */}
        {otherGroups.map((group) => {
          const latest = group.stories[group.stories.length - 1];
          const author = group.author as any; 

          return (
            <button
              key={author?._id}
              onClick={() => setOpenIndex(allGroups.indexOf(group))}
              className="relative shrink-0 w-[104px] h-[152px] rounded-2xl overflow-hidden group"
            >
              <Image src={latest.mediaUrl} alt="" fill className="object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

              <div className="absolute top-2 left-2 ravinala-ring p-[2px] rounded-full h-7 w-7">
                <div className="h-full w-full rounded-full border border-ink overflow-hidden bg-ink-soft">
                  {author?.avatarUrl && (
                    <Image src={author.avatarUrl} alt="" width={28} height={28} className="object-cover h-full w-full" />
                  )}
                </div>
              </div>

              <p className="absolute bottom-2 left-2.5 right-2.5 text-white text-xs font-medium truncate text-left drop-shadow">
                {author?.displayName ?? "Vendeur"}
              </p>
            </button>
          );
        })}

        {!userId && otherGroups.length === 0 && (
          <p className="text-xs text-white/35 flex items-center px-2">
            Les stories des vendeurs apparaîtront ici.
          </p>
        )}
      </div>

      {openIndex !== null && allGroups[openIndex] && (
        <StoryViewer groups={allGroups} initialIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}

      {/* Étape de confirmation */}
      {pendingUpload && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm">
            <div className="relative aspect-[9/16] max-h-[55vh] rounded-3xl overflow-hidden mb-4">
              <Image src={pendingUpload} alt="" fill className="object-cover" />
              <button
                onClick={() => setPendingUpload(null)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {myProducts && myProducts.length > 0 && (
              <label className="block mb-3">
                <span className="text-xs text-white/60 mb-1.5 block">Lier un article (optionnel)</span>
                <select
                  value={linkedProductId}
                  onChange={(e) => setLinkedProductId(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-white/[0.08] border border-white/[0.14] px-4 text-sm text-white"
                >
                  <option value="">Aucun article</option>
                  {myProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} — {formatAriary(p.price)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <GlassButton variant="primary" size="lg" className="w-full" onClick={handlePublish}>
              Publier la story
            </GlassButton>
          </div>
        </div>
      )}
    </>
  );
}
