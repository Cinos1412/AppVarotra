import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un prix en Ariary, ex: 4400000 → "4 400 000 Ar" */
export function formatAriary(amount: number) {
  return new Intl.NumberFormat("fr-MG", { maximumFractionDigits: 0 }).format(amount) + " Ar";
}

export function getActivePromo(product: { promoPrice?: number; promoEndsAt?: number; price: number }) {
  if (product.promoPrice === undefined || product.promoEndsAt === undefined) return null;
  if (product.promoEndsAt <= Date.now()) return null;
  const discountPercent = Math.round((1 - product.promoPrice / product.price) * 100);
  return { promoPrice: product.promoPrice, endsAt: product.promoEndsAt, discountPercent };
}

export function formatCountdown(endsAt: number) {
  const remaining = endsAt - Date.now();
  if (remaining <= 0) return "Terminé";
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min ${s}s`;
}

export function timeAgo(timestampMs: number) {
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
