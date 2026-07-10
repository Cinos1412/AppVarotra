"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StoryViewer } from "./story-viewer";

/** Bandeau "Nouveautés du jour" — chaque bulle porte l'anneau signature Ravinala. */
export function StoryBar() {
  const groups = useQuery(api.stories.activeFeed) ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (groups.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-0 pb-1">
        {groups.map((group, i) => (
          <button
            key={group.author?._id ?? i}
            onClick={() => setOpenIndex(i)}
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
      </div>

      {openIndex !== null && (
        <StoryViewer
          groups={groups}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
