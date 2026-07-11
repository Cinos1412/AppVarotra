import { Radio, Wrench } from "lucide-react";

/**
 * Placeholder volontaire tant qu'aucun fournisseur de streaming n'est
 * branché (Mux, LiveKit, Cloudflare Stream...). Dès que `playbackUrl` est
 * renseigné sur le document `liveStreams`, remplace ce composant par un
 * vrai lecteur — ex. avec Mux : `<MuxPlayer playbackId={...} />`, ou avec
 * un flux HLS générique : une balise <video> + hls.js.
 */
export function VideoPlaceholder({ isLive }: { isLive: boolean }) {
  return (
    <div className="relative aspect-[9/16] md:aspect-video w-full rounded-3xl overflow-hidden bg-gradient-to-br from-ink-soft to-ink flex flex-col items-center justify-center gap-3 border border-white/10">
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-corail px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse-glow-corail">
          <Radio className="h-3 w-3" /> EN DIRECT
        </div>
      )}
      <Wrench className="h-8 w-8 text-white/25" />
      <p className="text-white/40 text-sm text-center max-w-[200px]">
        Lecteur vidéo à brancher (Mux, LiveKit, Cloudflare Stream...)
      </p>
    </div>
  );
}
