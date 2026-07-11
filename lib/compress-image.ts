/**
 * Compresse une image côté client avant upload — réduit la taille du
 * fichier (et donc le temps d'attente sur une connexion mobile faible)
 * en la redimensionnant et en la ré-encodant en JPEG.
 *
 * Ne fait rien si :
 * - le fichier n'est pas une image
 * - la compression obtenue est plus grosse que l'original (arrive parfois
 *   sur de petits PNG déjà optimisés) → on garde l'original dans ce cas
 */
export interface CompressOptions {
  /** Plus grand côté (largeur ou hauteur) autorisé, en pixels. */
  maxDimension?: number;
  /** Qualité JPEG, de 0 à 1. */
  quality?: number;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1600, quality = 0.82 } = options;

  if (!file.type.startsWith("image/")) return file;
  // Les GIF animés perdraient leur animation en passant par un canvas — on les laisse tels quels.
  if (file.type === "image/gif") return file;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // En cas de souci de décodage (format exotique, HEIC mal supporté par
    // le navigateur, etc.), on ne bloque jamais l'upload : on renvoie
    // l'original plutôt que de faire échouer toute l'action.
    return file;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
