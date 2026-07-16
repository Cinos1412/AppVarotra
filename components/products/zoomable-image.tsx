"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const MAX_ZOOM = 3;
const DOUBLE_TAP_ZOOM = 2.2;

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  function resetZoom() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function handleDoubleTapOrClick() {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(DOUBLE_TAP_ZOOM);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (scale > 1 || e.touches.length === 2) e.stopPropagation();
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchStartDistance.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        handleDoubleTapOrClick();
      }
      lastTap.current = now;
      if (scale > 1) {
        dragStart.current = { x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y };
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (scale > 1 || e.touches.length === 2) e.stopPropagation();
    if (e.touches.length === 2 && pinchStartDistance.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = distance / pinchStartDistance.current;
      setScale(Math.min(MAX_ZOOM, Math.max(1, pinchStartScale.current * ratio)));
    } else if (e.touches.length === 1 && dragStart.current && scale > 1) {
      setTranslate({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (scale > 1) e.stopPropagation();
    pinchStartDistance.current = null;
    dragStart.current = null;
    if (scale < 1.05) resetZoom();
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleTapOrClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-150 ease-out"
        style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
      >
        <Image src={src} alt={alt} fill className="object-contain" />
      </div>
      {scale === 1 && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/40 pointer-events-none">
          Double-tap ou pincer pour zoomer
        </p>
      )}
    </div>
  );
}
