"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StoryViewer } from "./story-viewer";
import { useCurrentUser } from "@/lib/use-current-user";
import { compressImage } from "@/lib/compress-image";
import { Plus, Loader2 } from "lucide-react";

/**
 * Bandeau "Nouveautés du jour" — TOUJOURS rendu, même sans aucune story
 * active : sinon la fonctionnalité est invisible et personne ne sait
 * qu'elle existe. La première bulle est toujours "Ta story", pour poster.
 */
export function StoryBar() {
  const { userId, profile } = useCurrentUser();
  const groups = useQuery(api.stories.activeFeed) ?? [];
  const createStory = useMutation(api.stories.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // On exclut mes propres stories de la liste générale pour les afficher
  // à part, sous ma propre bulle "Ta story".
  const myGroup = groups.find((g) => g.author?._id === userId);
  const otherGroups = groups.filter((g) => g.author?._id !== userId);

  async function handleAddStory(file: File) {
    if (!userId) return;
    setUploading(true);
    const compressed = await compressImage(file, { maxDimension: 1920, quality: 0.8 });
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": compressed.type }, body: compressed });
    const { storageId } = await result.json();
    const url = await convex.query(api.files.getUrl, { storageId });
    if (url) {
      await createStory({ authorId: userId as any, mediaUrl: url, mediaType: "image" });
    }
    setUploading(false);
  }

  const allGroups = myGroup ? [myGroup, ...otherGroups] : otherGroups;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-0 pb-1">
        {/* Bulle "Ta story" — toujours visible, avec ou sans story active */}
        {userId && (
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              onClick={() => (myGroup ? setOpenIndex(0) : fileRef.current?.click())}
              className="relative h-[68px] w-[68px]"
            >
              {myGroup ? (
                <div className="ravinala-ring p-[2.5px] rounded-full h-full w-full animate-ring-spin">
                  <div className="h-full w-full rounded-full border-2 border-ink overflow-hidden bg-ink-soft">
                    {profile?.avatarUrl && (
                      <Image src={profile.avatarUrl} alt="" width={64} height={64} className="object-cover h-full w-full" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full w-full rounded-full border-2 border-dashed border-white/25 flex items-center justify-center bg-white/[0.04] animate-float-subtle">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white/60" />
                  ) : (
                    <Plus className="h-6 w-6 text-white/60" />
                  )}
                </div>
              )}
              {myGroup && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                  className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-vanille flex items-center justify-center border-2 border-ink"
                >
                  <Plus className="h-3.5 w-3.5 text-ink" />
                </button>
              )}
            </button>
            <span className="text-xs text-white/70">Ta story</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAddStory(e.target.files[0])}
            />
          </div>
        )}

        {otherGroups.map((group, i) => (
          <button
            key={group.author?._id ?? i}
            onClick={() => setOpenIndex(allGroups.indexOf(group))}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="ravinala-ring p-[2.5px] rounded-full h-[68px] w-[68px] animate-ring-spin">
              <div className="h-full w-full rounded-full border-2 border-ink overflow-hidden bg-ink-soft">
                {group.author?.avatarUrl && (
                  <Image
                    src={group.author.avatarUrl}
                    alt={group.author.displayName}
                    width={64}
                    height={64}
                    className="object-cover h-full w-full"
                  />
                )}
              </div>
            </div>
            <span className="text-xs text-white/70 max-w-[68px] truncate">
              {group.author?.displayName ?? "Vendeur"}
            </span>
          </button>
        ))}

        {!userId && otherGroups.length === 0 && (
          <p className="text-xs text-white/35 flex items-center px-2">
            Les stories des vendeurs apparaîtront ici.
          </p>
        )}
      </div>

      {openIndex !== null && allGroups[openIndex] && (
        <StoryViewer groups={allGroups} initialIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
