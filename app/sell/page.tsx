"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { ImageUploader } from "@/components/ui/image-uploader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { BackButton } from "@/components/ui/back-button";
import { ShieldAlert, Plus, X, Zap } from "lucide-react";

const CATEGORIES = ["Tech", "Mode", "Maison", "Jeux", "Sport", "Autre"] as const;
const STATES = ["Neuf", "Très bon état", "Bon état", "Correct"] as const;

// Attributs suggérés par catégorie — le vendeur peut aussi en ajouter de
// libres, ceci n'est qu'un point de départ pour gagner du temps.
const SUGGESTED_ATTRIBUTES: Record<string, string[]> = {
  Tech: ["Stockage", "RAM", "Processeur", "Carte graphique", "Autonomie batterie"],
  Mode: ["Taille", "Couleur", "Matière"],
  Maison: ["Dimensions", "Matériau", "Couleur"],
  Jeux: ["Plateforme", "Édition", "Région"],
  Sport: ["Taille", "Poids", "Marque"],
  Autre: [],
};

type Attribute = { key: string; value: string };

function SellForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { userId, isLoading } = useCurrentUser();

  const existingProduct = useQuery(api.products.getById, editId ? { productId: editId as any } : "skip");
  const createModerated = useAction(api.products.createModerated);
  const updateProduct = useMutation(api.products.update);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Tech");
  const [state, setState] = useState<(typeof STATES)[number]>("Bon état");
  const [location, setLocation] = useState("Antananarivo");
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [showPromo, setShowPromo] = useState(false);
  const [promoPrice, setPromoPrice] = useState("");
  const [promoDays, setPromoDays] = useState("3");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (existingProduct && !prefilled) {
      setTitle(existingProduct.title);
      setDescription(existingProduct.description);
      setPrice(String(existingProduct.price));
      setCategory(existingProduct.category as any);
      setState(existingProduct.state as any);
      setLocation(existingProduct.location);
      setImages(existingProduct.images);
      setAttributes(existingProduct.attributes ?? []);
      if (existingProduct.promoPrice) {
        setShowPromo(true);
        setPromoPrice(String(existingProduct.promoPrice));
      }
      setPrefilled(true);
    }
  }, [existingProduct, prefilled]);

  function addSuggestedAttribute(key: string) {
    if (attributes.some((a) => a.key === key)) return;
    setAttributes((prev) => [...prev, { key, value: "" }]);
  }

  function addCustomAttribute() {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateAttribute(index: number, field: "key" | "value", value: string) {
    setAttributes((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeAttribute(index: number) {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || images.length === 0) return;
    setSubmitting(true);
    setError(null);

    const cleanAttributes = attributes.filter((a) => a.key.trim() && a.value.trim());
    const promoData =
      showPromo && promoPrice
        ? { promoPrice: Number(promoPrice), promoEndsAt: Date.now() + Number(promoDays) * 24 * 60 * 60 * 1000 }
        : {};

    try {
      if (editId) {
        await updateProduct({
          productId: editId as any,
          sellerId: userId as any,
          title,
          description,
          price: Number(price),
          category,
          state,
          location,
          images,
          attributes: cleanAttributes,
          ...promoData,
        });
        router.push(`/product/${editId}`);
      } else {
        const productId = await createModerated({
          sellerId: userId as any,
          title,
          description,
          price: Number(price),
          category,
          state,
          location,
          images,
          attributes: cleanAttributes,
          ...promoData,
        });
        router.push(`/product/${productId}`);
      }
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? "Une erreur est survenue, réessaie.");
      setSubmitting(false);
    }
  }

  if (isLoading || (editId && existingProduct === undefined)) {
    return <div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />;
  }
  if (!userId) return <p className="text-white/60 text-center">Connecte-toi pour vendre un article.</p>;
  if (editId && existingProduct && existingProduct.sellerId !== userId) {
    return <p className="text-white/60 text-center">Tu ne peux modifier que tes propres articles.</p>;
  }

  const suggestions = SUGGESTED_ATTRIBUTES[category]?.filter((s) => !attributes.some((a) => a.key === s)) ?? [];

  return (
    <div className="max-w-lg mx-auto">
      <BackButton />
      <h1 className="font-display text-2xl mb-6">
        {editId ? "Modifier l'article" : "Mettre un article en vente"}
      </h1>

      <GlassPanel className="p-6" intensity="strong">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-corail/10 border border-corail/25 p-3.5">
              <ShieldAlert className="h-4 w-4 text-corail shrink-0 mt-0.5" />
              <p className="text-sm text-corail">{error}</p>
            </div>
          )}

          <div>
            <span className="text-sm text-white/70 mb-2 block">Photos</span>
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="aspect-square object-cover rounded-xl" />
              ))}
              {images.length < 6 && (
                <ImageUploader onUploaded={(url) => setImages((imgs) => [...imgs, url])} />
              )}
            </div>
          </div>

          <Field label="Titre">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="iPhone 14 Pro – 256Go" className="input" />
          </Field>

          <Field label="Description">
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="État, accessoires inclus, raison de la vente..."
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (Ar)">
              <input required type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
            </Field>
            <Field label="Ville">
              <input required value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="État">
              <select value={state} onChange={(e) => setState(e.target.value as any)} className="input">
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Attributs personnalisés — suggérés selon la catégorie + libres */}
          <div>
            <span className="text-sm text-white/70 mb-2 block">Caractéristiques (optionnel)</span>

            {attributes.map((attr, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={attr.key}
                  onChange={(e) => updateAttribute(i, "key", e.target.value)}
                  placeholder="Nom (ex: Stockage)"
                  className="input flex-1"
                />
                <input
                  value={attr.value}
                  onChange={(e) => updateAttribute(i, "value", e.target.value)}
                  placeholder="Valeur (ex: 128 Go)"
                  className="input flex-1"
                />
                <button type="button" onClick={() => removeAttribute(i)} className="shrink-0 text-white/40 hover:text-corail">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSuggestedAttribute(s)}
                    className="text-xs rounded-full px-3 py-1.5 bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}

            <button type="button" onClick={addCustomAttribute} className="flex items-center gap-1.5 text-xs text-ravinala">
              <Plus className="h-3.5 w-3.5" /> Ajouter une caractéristique personnalisée
            </button>
          </div>

          {/* Promotion / vente flash */}
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={showPromo} onChange={(e) => setShowPromo(e.target.checked)} className="h-4 w-4 accent-corail" />
              <span className="text-sm flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-corail" /> Mettre en promotion / vente flash
              </span>
            </label>

            {showPromo && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Prix promo (Ar)">
                  <input type="number" min={0} value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} className="input" />
                </Field>
                <Field label="Durée">
                  <select value={promoDays} onChange={(e) => setPromoDays(e.target.value)} className="input">
                    <option value="1">1 jour</option>
                    <option value="3">3 jours</option>
                    <option value="7">7 jours</option>
                  </select>
                </Field>
              </div>
            )}
          </div>

          <GlassButton type="submit" variant="primary" size="lg" className="w-full" isLoading={submitting} disabled={images.length === 0}>
            {editId ? "Enregistrer les modifications" : "Publier l'article"}
          </GlassButton>

          {!editId && (
            <p className="text-[11px] text-white/35 text-center leading-relaxed">
              Le contenu de ton annonce est vérifié automatiquement à la publication.
            </p>
          )}
        </form>
      </GlassPanel>

      <style jsx global>{`
        .input {
          width: 100%;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0 1rem;
          font-size: 0.875rem;
          color: white;
        }
        textarea.input { height: auto; padding: 0.75rem 1rem; }
        .input:focus { outline: none; border-color: rgba(10, 132, 255, 0.6); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-white/70 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 rounded-3xl bg-white/[0.05]" />}>
      <SellForm />
    </Suspense>
  );
}
