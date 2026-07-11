import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const TONES = {
  malachite: "bg-malachite/15 text-malachite-light",
  vanille: "bg-vanille/15 text-vanille",
  corail: "bg-corail/15 text-corail",
  neutral: "bg-white/[0.06] text-white/80",
};

export function StatChip({
  icon: Icon,
  value,
  label,
  tone = "neutral",
  className,
}: {
  icon?: LucideIcon;
  value: string | number;
  label: string;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div className={cn("stat-chip", TONES[tone], className)}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 self-center" />}
      <span className="font-display text-lg leading-none">{value}</span>
      <span className="text-[11px] opacity-70 leading-none">{label}</span>
    </div>
  );
}
