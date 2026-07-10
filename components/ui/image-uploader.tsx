"use client";

import { useState, useRef } from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";

/**
 * Téléverse un fichier vers le stockage Convex et renvoie son URL publique
 * au parent via onUploaded. Utilisé pour les photos produit, l'avatar, et
 * les captures d'écran de reçu dans le tunnel de paiement.
 */
export function ImageUploader({
  onUploaded,
  label = "Ajouter une photo",
}: {
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    const url = await convex.query(api.files.getUrl, { storageId });

    onUploaded(url ?? "");
    setUploading(false);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {preview ? (
        <div className="relative aspect-square rounded-2xl overflow-hidden">
          <Image src={preview} alt="" fill className="object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-square rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/50 hover:border-white/40 transition-colors"
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">{label}</span>
        </button>
      )}
    </div>
  );
}
