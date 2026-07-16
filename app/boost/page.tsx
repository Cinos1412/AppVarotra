"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { PremiumCard } from "@/components/ui/premium-card";
import { GlassButton } from "@/components/ui/glass-button";
import { BackButton } from "@/components/ui/back-button";
import { formatAriary, cn } from "@/lib/utils";
import { Zap, Check, Copy, Loader2, ShieldCheck, Upload } from "lucide-react";

const PLANS = [
  { id: "weekly" as const, label: "1 semaine", price: 15000, tagline: "Pour tester une remontée ponctuelle" },
  { id: "monthly" as const, label: "1 mois", price: 45000, tagline: "Le meilleur rapport visibilité / prix" },
];

const OPERATORS = [
  { id: "mvola" as const, label: "Mvola", color: "from-yellow-400 to-yellow-600" },
  { id: "orange_money" as const, label: "Orange Money", color: "from-orange-400 to-orange-600" },
  { id: "airtel_money" as const, label: "Airtel Money", color: "from-red-500 to-red-700" },
];

export default function BoostPage() {
  const { userId, profile } = useCurrentUser();
  const initiate = useMutation(api.boosts.initiate);
  const submitProof = useMutation(api.boosts.submitProof);
  const verifyPayment = useAction(api.boosts.verifyPayment);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const currentBoost = useQuery(api.boosts.myBoost, userId ? { userId: userId as any } : "skip");

  const [step, setStep] = useState<"plans" | "operator" | "instructions" | "proof" | "verifying" | "done">("plans");
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly" | null>(null);
  const [boostId, setBoostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instructions = useQuery(api.boosts.getPaymentInstructions, boostId ? { boostId: boostId as any } : "skip");

  async function handlePickOperator(operator: (typeof OPERATORS)[number]["id"]) {
    if (!userId || !selectedPlan) return;
    const id = await initiate({ userId: userId as any, plan: selectedPlan, operator });
    setBoostId(id);
    setStep("instructions");
  }

  async function handleSubmitTxId() {
    if (!boostId || !txId.trim()) return;
    await submitProof({ boostId: boostId as any, transactionId: txId });
    setStep("verifying");
    const result = await verifyPayment({ boostId: boostId as any });
    if (result.valid) setStep("done");
    else {
      setError(result.reason ?? "Vérification échouée.");
      setStep("proof");
    }
  }

  async function handleUploadScreenshot(file: File) {
    if (!boostId) return;
    setUploading(true);
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    const { storageId } = await res.json();
    const url = await convex.query(api.files.getUrl, { storageId });
    await submitProof({ boostId: boostId as any, screenshotUrl: url ?? undefined });
    setUploading(false);
    setStep("verifying");
    const result = await verifyPayment({ boostId: boostId as any });
    if (result.valid) setStep("done");
    else {
      setError(result.reason ?? "Vérification échouée.");
      setStep("proof");
    }
  }

  function copyReference() {
    if (!instructions) return;
    navigator.clipboard.writeText(instructions.referenceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour booster tes articles.</p>;

  return (
    <div className="max-w-lg mx-auto">
      <BackButton />
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-vanille to-corail flex items-center justify-center mx-auto mb-3">
          <Zap className="h-7 w-7 text-ink" />
        </div>
        <h1 className="font-display text-2xl">Boost de visibilité</h1>
        <p className="text-white/55 text-sm mt-1">
          Fais remonter tous tes articles actifs en tête du fil pendant la durée choisie.
        </p>
      </div>

      {profile?.boostActive && (
        <PremiumCard className="p-4 mb-5 text-center text-sm text-ravinala">
          Boost actif jusqu'au {new Date(profile.boostExpiresAt!).toLocaleDateString("fr-FR")}
        </PremiumCard>
      )}
      {currentBoost?.status === "awaiting_payment" && (
        <PremiumCard className="p-4 mb-5 text-center text-sm text-vanille">
          Un paiement de boost est en attente — termine-le ci-dessous.
        </PremiumCard>
      )}

      {step === "plans" && (
        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button key={plan.id} onClick={() => { setSelectedPlan(plan.id); setStep("operator"); }} className="w-full text-left">
              <PremiumCard className="p-5 flex items-center justify-between hover:brightness-110 transition-all">
                <div>
                  <p className="font-medium">{plan.label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{plan.tagline}</p>
                  <p className="font-display text-lg text-vanille mt-1">{formatAriary(plan.price)}</p>
                </div>
                <Check className="h-4 w-4 text-white/30" />
              </PremiumCard>
            </button>
          ))}
        </div>
      )}

      {step === "operator" && (
        <PremiumCard className="p-6 space-y-2.5">
          <p className="text-sm text-white/70 mb-1">Choisis ton opérateur Mobile Money :</p>
          {OPERATORS.map((op) => (
            <button
              key={op.id}
              onClick={() => handlePickOperator(op.id)}
              className="w-full flex items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3.5 hover:bg-white/[0.09] transition-colors"
            >
              <span className={cn("h-9 w-9 rounded-full bg-gradient-to-br", op.color)} />
              <span className="font-medium">{op.label}</span>
            </button>
          ))}
        </PremiumCard>
      )}

      {step === "instructions" && instructions && (
        <PremiumCard className="p-6 space-y-4">
          <div className="rounded-2xl bg-white/[0.05] p-4 space-y-3">
            <Row label="Numéro marchand" value={instructions.merchantNumber} mono />
            <Row label="Montant exact" value={formatAriary(instructions.amount)} />
            <div className="flex items-center justify-between">
              <span className="text-white/55 text-sm">Description</span>
              <button onClick={copyReference} className="flex items-center gap-1.5 font-mono text-vanille text-sm">
                {instructions.referenceCode}
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-white/50">
            Effectue le virement vers ce numéro marchand (le même que pour les achats — c'est l'administration
            App'Varotra qui le reçoit), puis confirme ci-dessous.
          </p>
          <GlassButton variant="primary" className="w-full" onClick={() => setStep("proof")}>
            J'ai effectué le virement
          </GlassButton>
        </PremiumCard>
      )}

      {step === "proof" && (
        <PremiumCard className="p-6 space-y-4">
          {error && <p className="text-corail text-sm">{error}</p>}
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">ID de transaction reçu par SMS</label>
            <input
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="ex: MP240710.1234.A56789"
              className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] px-4 text-sm font-mono focus:outline-none focus:border-ravinala/60"
            />
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <div className="h-px flex-1 bg-white/10" /> ou <div className="h-px flex-1 bg-white/10" />
          </div>
          <input
            id="boost-receipt"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUploadScreenshot(e.target.files[0])}
          />
          <label htmlFor="boost-receipt" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/60 cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Téléverser une capture d'écran
          </label>
          <GlassButton variant="primary" className="w-full" onClick={handleSubmitTxId} disabled={!txId.trim()}>
            Valider avec l'ID de transaction
          </GlassButton>
        </PremiumCard>
      )}

      {step === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-ravinala" />
          <p className="text-white/60 text-sm">Vérification en cours...</p>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-14 w-14 rounded-full bg-ravinala/20 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-ravinala" />
          </div>
          <p className="font-display text-lg">Boost activé !</p>
          <p className="text-white/55 text-sm max-w-xs">Tes articles remontent maintenant en tête du fil.</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55 text-sm">{label}</span>
      <span className={cn("text-sm text-white", mono && "font-mono")}>{value}</span>
    </div>
  );
}
