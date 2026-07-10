import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["500", "600"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "App'Varotra",
  description: "Le marché social malgache — achète, vends, échange en toute confiance.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body>
        <div className="app-varotra-atmosphere" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <Providers>
          <Topbar />
          <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-28 md:pb-16">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
