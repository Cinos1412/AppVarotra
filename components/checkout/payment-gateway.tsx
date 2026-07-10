"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatAriary, cn } from "@/lib/utils";
import { Copy, Check, Upload, ShieldCheck, Loader2 } from "lucide-react";

const OPERATORS = [
  { id: "mvola", label: "Mvola", color: "from-yellow-400 to-yellow-600", baseUssd: "#111#" },
  { id: "orange_money", label: "Orange Money", color: "from-orange-400 to-orange-600", baseUssd: "#144#" },
  { id: "airtel_money", label: "Airtel Money", color: "from-red-500 to-red-700", baseUssd: "*436#" },
] as const;

type Step = "choose_operator" | "instructions" | "submit_proof" | "verifying" | "in_escrow";

export function PaymentGateway({
  conversationId,
  productId,
  buyerId,
  sellerId,
  amount,
}: {
  conversationId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
}) {
  const [step, setStep] = useState<Step>("choose_operator");
  const [operator, setOperator] = useState<(typeof OPERATORS)[number]["id"] | null>(null);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const initiate = useMutation(api.escrow.initiate);
  const submitProof = useMutation(api.escrow.submitProof);
  const parseScreenshot = useAction(api.escrow.parseScreenshotAction);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const instructions = useQuery(
    api.escrow.getPaymentInstructions,
    escrowId ? { escrowId: escrowId as any } : "skip",
  );

  async function handleChooseOperator(op: (typeof OPERATORS)[number]["id"]) {
    setOperator(op);
    const id = await initiate({
      conversationId: conversationId as any,
      productId: productId as any,
      buyerId: buyerId as any,
      sellerId: sellerId as any,
      amount,
      operator: op,
    });
    setEscrowId(id);
    setStep("instructions");
  }

  async function handleSubmitTransactionId() {
    if (!escrowId || !transactionId.trim()) return;
    await submitProof({ escrowId: escrowId as any, proofType: "transaction_id", transactionId });
    setStep("verifying");
    const result = await parseScreenshot({ escrowId: escrowId as any });
    if (result.valid) {
      setStep("in_escrow");
    } else {
      setError(result.reason ?? "Vérification impossible, réessaie.");
      setStep("submit_proof");
    }
  }

  async function handleSubmitScreenshot(file: File) {
    if (!escrowId) return;
    setUploadingScreenshot(true);

    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    const { storageId } = await result.json();
    const screenshotUrl = await convex.query(api.files.getUrl, { storageId });

    await submitProof({ escrowId: escrowId as any, proofType: "screenshot", screenshotUrl: screenshotUrl ?? undefined });
    setUploadingScreenshot(false);
    setStep("verifying");

    const verifyResult = await parseScreenshot({ escrowId: escrowId as any });
    if (verifyResult.valid) {
      setStep("in_escrow");
    } else {
      setError(verifyResult.reason ?? "Vérification impossible, réessaie.");
      setStep("submit_proof");
    }
  }

  function copyReference() {
    if (!instructions) return;
    navigator.clipboard.writeText(instructions.referenceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <GlassPanel className="p-6 max-w-md mx-auto" intensity="strong">
      <h2 className="font-display text-xl mb-1">Paiement sécurisé</h2>
      <p className="text-white/55 text-sm mb-5">
        Les fonds restent bloqués en séquestre jusqu'à confirmation de la livraison.
      </p>

      <div className="rounded-2xl bg-white/[0.06] px-4 py-3 mb-5 flex items-center justify-between">
        <span className="text-white/60 text-sm">Montant à payer</span>
        <span className="font-display text-lg text-vanille">{formatAriary(amount)}</span>
      </div>

      {step === "choose_operator" && (
        <div className="space-y-2.5">
          <p className="text-sm text-white/70 mb-1">Choisis ton opérateur Mobile Money :</p>
          {OPERATORS.map((op) => (
            <button
              key={op.id}
              onClick={() => handleChooseOperator(op.id)}
              className="w-full flex items-center gap-3 rounded-2xl glass px-4 py-3.5 hover:bg-white/[0.12] transition-colors"
            >
              <span className={cn("h-9 w-9 rounded-full bg-gradient-to-br", op.color)} />
              <span className="font-medium">{op.label}</span>
            </button>
          ))}
        </div>
      )}

      {step === "instructions" && instructions && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.06] p-4 space-y-3">
            <Row label="Opérateur" value={OPERATORS.find((o) => o.id === instructions.operator)?.label ?? ""} />
            <Row label="Numéro marchand" value={instructions.merchantNumber} mono />
            <Row label="Montant exact" value={formatAriary(instructions.amount)} />
            <div className="flex items-center justify-between">
              <span className="text-white/55 text-sm">Description (générée automatiquement)</span>
              <button onClick={copyReference} className="flex items-center gap-1.5 font-mono text-vanille text-sm">
                {instructions.referenceCode}
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {instructions.ussdVerified ? (
            <a
              href={`tel:${encodeURIComponent(instructions.ussdDialCode)}`}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-malachite-light to-malachite py-4 text-white"
            >
              <span className="text-sm font-medium">📞 Payer en un tap</span>
              <span className="text-[11px] font-mono opacity-80">{instructions.ussdDialCode}</span>
            </a>
          ) : (
            <div className="rounded-2xl border border-vanille/30 bg-vanille/[0.06] p-3.5">
              <p className="text-xs text-vanille mb-2">
                ⚠️ Raccourci direct pas encore vérifié pour cet opérateur — utilise le menu manuel :
              </p>
              <a
                href={`tel:${encodeURIComponent(OPERATORS.find((o) => o.id === instructions.operator)?.baseUssd ?? "")}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 py-2.5 text-sm text-white/80"
              >
                📞 Composer {OPERATORS.find((o) => o.id === instructions.operator)?.baseUssd}
              </a>
              <p className="text-[11px] text-white/45 mt-2 leading-relaxed">
                Choisis "Transférer argent", entre le numéro marchand, le montant exact, puis
                colle la description ci-dessus dans le motif quand elle est demandée.
              </p>
            </div>
          )}

          <p className="text-[11px] text-white/35 leading-relaxed">
            Ça ouvre ton clavier téléphone avec le code déjà rempli — il te reste à appuyer sur
            appeler et à entrer ton code secret. Aucun site web ne peut faire cette dernière étape
            à ta place, ni savoir automatiquement si le virement a réussi : confirme ci-dessous
            une fois fait.
          </p>

          <GlassButton variant="primary" className="w-full" onClick={() => setStep("submit_proof")}>
            J'ai effectué le virement
          </GlassButton>
        </div>
      )}

      {step === "submit_proof" && (
        <div className="space-y-4">
          {error && <p className="text-corail text-sm">{error}</p>}
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">ID de transaction reçu par SMS</label>
            <input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="ex: MP240710.1234.A56789"
              className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] px-4 text-sm font-mono focus:outline-none focus:border-ravinala/60"
            />
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <div className="h-px flex-1 bg-white/10" /> ou <div className="h-px flex-1 bg-white/10" />
          </div>
          <input
            id="receipt-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleSubmitScreenshot(e.target.files[0])}
          />
          <label
            htmlFor="receipt-upload"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/60 hover:border-white/40 transition-colors cursor-pointer"
          >
            {uploadingScreenshot ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Téléverser une capture d'écran du reçu
          </label>
          <GlassButton variant="primary" className="w-full" onClick={handleSubmitTransactionId}>
            Valider mon paiement
          </GlassButton>
        </div>
      )}

      {step === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-ravinala" />
          <p className="text-white/60 text-sm">Vérification de la preuve en cours...</p>
        </div>
      )}

      {step === "in_escrow" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-14 w-14 rounded-full bg-ravinala/20 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-ravinala" />
          </div>
          <p className="font-display text-lg">Fonds bloqués en séquestre</p>
          <p className="text-white/55 text-sm max-w-xs">
            Le vendeur a été notifié. Les fonds seront versés dès que tu confirmeras la réception
            de ton article — ou automatiquement 24h après la livraison.
          </p>
        </div>
      )}
    </GlassPanel>
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
