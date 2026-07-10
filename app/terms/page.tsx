"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";

const SECTIONS = [
  {
    title: "1. Notre rôle : simple intermédiaire technique",
    body: "App'Varotra est une plateforme de mise en relation. Elle fournit des outils (profils, stories, système de paiement) mais n'est ni le vendeur, ni l'acheteur, ni le livreur des produits. Elle n'intervient pas dans les négociations et ne vérifie pas les articles.",
  },
  {
    title: "2. Responsabilité des produits et livraisons",
    body: "Le vendeur est seul responsable de la qualité, de l'authenticité et de la livraison de ses produits. L'acheteur achète à ses risques et périls : l'application décline toute responsabilité en cas de produit défectueux, non conforme, de faux profil ou de problème durant la livraison.",
  },
  {
    title: "3. Fonctionnement du paiement et du séquestre",
    body: "L'argent payé par l'acheteur est conservé de manière sécurisée par l'application. Les fonds sont reversés au vendeur dès que l'acheteur clique sur \"Confirmer la réception\". Si le vendeur marque le produit comme livré et que l'acheteur ne signale aucun problème sous 24 heures, l'argent est automatiquement versé au vendeur. Une fois versé, aucun remboursement ne peut être réclamé à l'application.",
  },
  {
    title: "4. Gestion des litiges",
    body: "En cas de désaccord, l'acheteur et le vendeur règlent le problème à l'amiable via le chat intégré. Les décisions de blocage, de remboursement ou de déblocage prises par le système automatisé sont définitives et sans recours contre la plateforme.",
  },
  {
    title: "5. Fiscalité et lois en vigueur",
    body: "Chaque utilisateur est seul responsable du respect des lois malgaches, de ses licences commerciales et de ses obligations fiscales. L'application ne déclare et ne paie aucun impôt à sa place.",
  },
  {
    title: "6. Exclusion et modification",
    body: "App'Varotra se réserve le droit de suspendre ou supprimer, sans préavis, le compte de tout utilisateur qui tente de frauder, de contourner le système de paiement, ou qui ne respecte pas la communauté.",
  },
];

export default function TermsPage() {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setHasScrolledToEnd(true);
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-140px)]">
      <h1 className="font-display text-2xl mb-1">Conditions Générales d'Utilisation</h1>
      <p className="text-white/50 text-sm mb-4">
        Lis l'intégralité avant de continuer — c'est court, promis.
      </p>

      <GlassPanel className="flex-1 overflow-hidden" intensity="strong">
        <div onScroll={handleScroll} className="h-full overflow-y-auto p-6 space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-medium text-white mb-1.5">{s.title}</h2>
              <p className="text-sm text-white/65 leading-relaxed">{s.body}</p>
            </div>
          ))}
          <p className="text-xs text-white/35 pt-2">— Fin des conditions —</p>
        </div>
      </GlassPanel>

      <label
        className={`flex items-start gap-3 mt-4 text-sm transition-opacity ${
          hasScrolledToEnd ? "opacity-100" : "opacity-40 pointer-events-none"
        }`}
      >
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          disabled={!hasScrolledToEnd}
          className="mt-0.5 h-5 w-5 rounded-md accent-ravinala"
        />
        <span className="text-white/80">
          J'ai lu et j'accepte sans réserve les Conditions Générales d'Utilisation.
        </span>
      </label>

      <GlassButton
        variant="primary"
        size="lg"
        className="w-full mt-4"
        disabled={!accepted}
        onClick={() => router.push("/onboarding")}
      >
        Créer mon profil
      </GlassButton>

      {!hasScrolledToEnd && (
        <p className="text-center text-xs text-white/40 mt-2">
          Fais défiler jusqu'en bas pour activer la case à cocher.
        </p>
      )}
    </div>
  );
}
