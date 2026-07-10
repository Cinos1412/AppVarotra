import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un prix en Ariary, ex: 4400000 → "4 400 000 Ar" */
export function formatAriary(amount: number) {
  return new Intl.NumberFormat("fr-MG", { maximumFractionDigits: 0 }).format(amount) + " Ar";
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
