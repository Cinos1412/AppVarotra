"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, timeAgo } from "@/lib/utils";

const STORY_DURATION_MS = 10_000;

type StoryGroup = {
  author: any;
  stories: any[];
};

export function StoryViewer({
  groups,
  initialIndex,
  onClose,
}: {
  groups: StoryGroup[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [groupIndex, setGroupIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const recordView = useMutation(api.stories.recordView);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  const goNext = useCallback(() => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, group, groups, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setStoryIndex(0);
      setProgress(0);
    }
  }, [storyIndex, groupIndex]);

  // Barre de progression : avance toutes les 100ms, passe à la story suivante à 10s.
  useEffect(() => {
    if (!story) return;
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 100 / (STORY_DURATION_MS / 100);
      });
    }, 100);
    return () => clearInterval(tick);
  }, [story, goNext]);

  useEffect(() => {
    if (story) recordView({ storyId: story._id, viewerId: story.authorId });
  }, [story, recordView]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in">
      <button onClick={onClose} className="absolute top-5 right-5 z-10 text-white/80 hover:text-white">
        <X className="h-7 w-7" />
      </button>

      <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-3xl overflow-hidden">
        {/* Barres de progression, une par story du groupe courant */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
          {group.stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                  transition: i === storyIndex ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-7 left-3 right-3 z-10 flex items-center gap-2">
          <div className="ravinala-ring p-[2px] rounded-full h-9 w-9">
            <div className="h-full w-full rounded-full border border-ink overflow-hidden bg-ink-soft">
              {group.author?.avatarUrl && (
                <Image src={group.author.avatarUrl} alt="" width={36} height={36} className="object-cover" />
              )}
            </div>
          </div>
          <div className="text-white text-sm">
            <p className="font-medium leading-none">{group.author?.displayName}</p>
            <p className="text-white/60 text-xs mt-0.5">{timeAgo(story._creationTime)}</p>
          </div>
        </div>

        <Image src={story.mediaUrl} alt={story.caption ?? ""} fill className="object-cover" priority />

        {story.caption && (
          <div className="absolute bottom-6 left-4 right-4 glass rounded-2xl px-4 py-3">
            <p className="text-sm text-white">{story.caption}</p>
          </div>
        )}

        <button onClick={goPrev} className="absolute left-0 top-0 h-full w-1/3 flex items-center justify-start pl-2 group">
          <ChevronLeft className={cn("h-8 w-8 text-white/0 group-hover:text-white/60 transition-colors")} />
        </button>
        <button onClick={goNext} className="absolute right-0 top-0 h-full w-1/3 flex items-center justify-end pr-2 group">
          <ChevronRight className="h-8 w-8 text-white/0 group-hover:text-white/60 transition-colors" />
        </button>
      </div>
    </div>
  );
}
