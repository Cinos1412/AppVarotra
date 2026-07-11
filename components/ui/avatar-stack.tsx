import Image from "next/image";

export function AvatarStack({ avatars, max = 4 }: { avatars: (string | undefined)[]; max?: number }) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((src, i) => (
        <div
          key={i}
          className="h-7 w-7 rounded-full border-2 border-ink-soft overflow-hidden bg-ink-soft -ml-2 first:ml-0"
          style={{ zIndex: visible.length - i }}
        >
          {src && <Image src={src} alt="" width={28} height={28} className="object-cover h-full w-full" />}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-7 w-7 rounded-full border-2 border-ink-soft bg-white/10 -ml-2 flex items-center justify-center text-[10px] text-white/70">
          +{remaining}
        </div>
      )}
    </div>
  );
}
