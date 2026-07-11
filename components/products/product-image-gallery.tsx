"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-4xl overflow-hidden glass bg-white/5 flex items-center justify-center">
        <p className="text-white/40">Aucune image</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-4xl overflow-hidden glass group cursor-zoom-in transition-all duration-300"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <Image
          src={images[currentImageIndex]}
          alt={`${title} - Image ${currentImageIndex + 1}`}
          fill
          className={`object-cover transition-transform duration-500 ${
            isZoomed ? "scale-150" : "scale-100 group-hover:scale-105"
          }`}
          priority
        />

        {/* Overlay Zoom Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-ink/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-ink/50 backdrop-blur-md px-3 py-2 rounded-full">
            <ZoomIn className="h-4 w-4 text-vanille" />
            <span className="text-xs text-vanille font-medium">{isZoomed ? "Dézoom" : "Zoom"}</span>
          </div>
        </div>

        {/* Image Counter */}
        <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1.5 text-xs font-medium text-white/70">
          {currentImageIndex + 1} / {images.length}
        </div>

        {/* Navigation Arrows - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass flex items-center justify-center transition-all duration-300 hover:bg-white/20 active:scale-95"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass flex items-center justify-center transition-all duration-300 hover:bg-white/20 active:scale-95"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 ring-2 ${
                index === currentImageIndex
                  ? "ring-vanille ring-offset-2 ring-offset-ink-soft"
                  : "ring-white/10 hover:ring-white/30"
              }`}
              aria-label={`Voir l'image ${index + 1}`}
            >
              <Image src={image} alt={`Miniature ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
