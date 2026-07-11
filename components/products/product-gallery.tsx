"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function goTo(index: number) {
    setActive((index + images.length) % images.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) goTo(active + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  return (
    <div>
      {/* Image principale — swipe tactile + tap pour plein écran */}
      <button
        onClick={() => setLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square w-full rounded-4xl overflow-hidden glass block group"
      >
        <Image src={images[active]} alt={title} fill className="object-cover" priority />

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-white/40")}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Expand className="h-4 w-4 text-white" />
        </div>
      </button>

      {/* Miniatures cliquables */}
      {images.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "relative shrink-0 h-16 w-16 rounded-2xl overflow-hidden transition-all",
                i === active ? "ring-2 ring-ravinala opacity-100" : "opacity-50 hover:opacity-80",
              )}
            >
              <Image src={img} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Plein écran */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-5 right-5 z-10 text-white/80">
            <X className="h-7 w-7" />
          </button>

          <div
            className="relative w-full h-full max-w-3xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image src={images[active]} alt={title} fill className="object-contain" />

            {images.length > 1 && (
              <>
                <button onClick={() => goTo(active - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button onClick={() => goTo(active + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <span key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-white/40")} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
