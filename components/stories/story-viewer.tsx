"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ShoppingBag, MessageCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, timeAgo, formatAriary } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";

const STORY_DURATION_MS = 10_000;
const REACTION_EMOJIS = ["❤️", "🔥", "😍", "👏", "😂"];

type StoryGroup = { author: any; stories: any[] };
type FloatingReaction = { id: number; emoji: string; left: number };

export function StoryViewer({
  groups,
  initialIndex,
  onClose,
}: {
  groups: StoryGroup[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { userId } = useCurrentUser();
  const [groupIndex, setGroupIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const recordView = useMutation(api.stories.recordView);
  const sendReaction = useMutation(api.stories.react);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const product = useQuery(api.products.getById, story?.productId ? { productId: story.productId } : "skip");
  const liveReactions = useQuery(api.stories.listReactions, story ? { storyId: story._id } : "skip");
  const seenReactionIds = useRef(new Set<string>());
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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

  // Barre de progression — respecte la pause (appui maintenu)
  useEffect(() => {
    if (!story || isPaused) return;
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
  }, [story, isPaused, goNext]);

  useEffect(() => {
    if (story && userId) recordView({ storyId: story._id, viewerId: userId as any });
    seenReactionIds.current.clear();
  }, [story, userId, recordView]);

  // Réactions en direct — dès qu'un nouveau document apparaît (le mien ou
  // celui d'un autre viewer connecté), on fait flotter l'emoji à l'écran.
  useEffect(() => {
    if (!liveReactions) return;
    for (const r of liveReactions) {
      if (!seenReactionIds.current.has(r._id)) {
        seenReactionIds.current.add(r._id);
        spawnFloatingReaction(r.emoji);
      }
    }
  }, [liveReactions]);

  function spawnFloatingReaction(emoji: string) {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, left: 20 + Math.random() * 60 }]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2000);
  }

  async function handleReact(emoji: string) {
    if (!userId || !story) return;
    await sendReaction({ storyId: story._id, userId: userId as any, emoji });
  }

  // Appui maintenu = pause (comme Instagram/Facebook)
  function handlePointerDown() {
    setIsPaused(true);
  }
  function handlePointerUp() {
    setIsPaused(false);
  }

  // Swipe bas = fermer, swipe gauche/droite = navigation
  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (dy > 90 && Math.abs(dx) < 60) {
      onClose();
    }
    touchStart.current = null;
  }

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in">
      <button onClick={onClose} className="absolute top-5 right-5 z-20 text-white/80 hover:text-white">
        <X className="h-7 w-7" />
      </button>

      <div
        className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-3xl overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Barres de progression */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
          {group.stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%" }}
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
          {isPaused && <span className="ml-auto text-[10px] text-white/50 bg-white/10 px-2 py-1 rounded-full">Pause</span>}
        </div>

        {/* Image — fond flouté + image en object-contain pour ne JAMAIS
            déformer/rogner, quel que soit le ratio de la photo d'origine. */}
        <div className="absolute inset-0">
          <Image src={story.mediaUrl} alt="" fill className="object-cover blur-2xl scale-110 opacity-40" />
        </div>
        <Image src={story.mediaUrl} alt={story.caption ?? ""} fill className="object-contain relative" priority />

        {/* Réactions flottantes */}
        {floatingReactions.map((r) => (
          <span
            key={r.id}
            className="absolute bottom-24 text-3xl animate-float-up pointer-events-none"
            style={{ left: `${r.left}%` }}
          >
            {r.emoji}
          </span>
        ))}

        {story.caption && (
          <div className="absolute bottom-24 left-4 right-4 glass rounded-2xl px-4 py-3">
            <p className="text-sm text-white">{story.caption}</p>
          </div>
        )}

        {/* Article lié — achat/contact directement depuis la story */}
        {product && (
          <div className="absolute bottom-16 left-4 right-4 glass rounded-2xl p-3 flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden shrink-0">
              <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{product.title}</p>
              <p className="text-vanille text-sm font-display">{formatAriary(product.price)}</p>
            </div>
            <Link
              href={`/product/${product._id}`}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-vanille to-corail flex items-center justify-center shrink-0"
            >
              <ShoppingBag className="h-4 w-4 text-ink" />
            </Link>
          </div>
        )}

        {/* Barre de réactions rapides */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="h-10 w-10 rounded-full glass flex items-center justify-center text-lg active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        <button onClick={goPrev} className="absolute left-0 top-0 h-full w-1/4 flex items-center justify-start pl-2 group z-[5]">
          <ChevronLeft className="h-8 w-8 text-white/0 group-hover:text-white/60 transition-colors" />
        </button>
        <button onClick={goNext} className="absolute right-0 top-0 h-full w-1/4 flex items-center justify-end pr-2 group z-[5]">
          <ChevronRight className="h-8 w-8 text-white/0 group-hover:text-white/60 transition-colors" />
        </button>
      </div>
    </div>
  );
}
