import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Vérifie le contenu d'une annonce (titre, description, catégorie, photo de
 * couverture) avant publication, pour repérer les contenus manifestement
 * illégaux (armes, drogues, contrefaçon explicite, espèces protégées,
 * biens volés annoncés comme tels, etc.).
 *
 * Trois verdicts possibles, volontairement nuancés — un modèle de langage
 * n'est pas un juge, et bloquer à tort la vente légitime de quelqu'un est
 * aussi un vrai coût :
 * - "approved" : rien de suspect, publication immédiate.
 * - "flagged_for_review" : douteux mais pas évident — publié quand même
 *   (l'app n'a pas encore de file de modération humaine pour bloquer en
 *   attente), mais marqué pour qu'un futur dashboard admin puisse le
 *   vérifier et le retirer si besoin.
 * - "rejected" : contenu manifestement illégal — publication refusée.
 *
 * Nécessite GEMINI_API_KEY côté Convex (déjà utilisée pour l'OCR des
 * reçus dans convex/escrow.ts — `npx convex env set GEMINI_API_KEY ...`).
 */
export const checkProductContent = internalAction({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    coverImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { title, description, category, coverImageUrl }): Promise<{
    verdict: "approved" | "flagged_for_review" | "rejected";
    reason?: string;
  }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Pas de clé configurée : on n'bloque jamais la publication pour une
      // raison d'infra manquante — on laisse passer, marqué comme non vérifié.
      return { verdict: "flagged_for_review", reason: "Modération IA indisponible (clé manquante)." };
    }

    const parts: any[] = [
      {
        text:
          "Tu es un modérateur pour une marketplace C2C à Madagascar. Analyse cette " +
          "annonce et détermine si elle enfreint manifestement la loi (armes, " +
          "drogues, contrefaçon explicitement annoncée comme telle, espèces " +
          "protégées/braconnage, biens visiblement volés, contenu à caractère " +
          "sexuel, arnaque évidente). Les objets ordinaires d'occasion (électronique, " +
          "vêtements, mobilier...) sont toujours approuvés, même très bon marché — " +
          "la simple originalité ou un prix bas n'est jamais une raison de refuser.\n\n" +
          `Titre : ${title}\nCatégorie : ${category}\nDescription : ${description}\n\n` +
          'Réponds STRICTEMENT en JSON, sans texte autour : ' +
          '{"verdict": "approved" | "flagged_for_review" | "rejected", "reason": "courte explication en français ou null"}. ' +
          'Utilise "rejected" uniquement si c\'est manifestement et clairement illégal. ' +
          'Utilise "flagged_for_review" en cas de doute réel. Sinon "approved".',
      },
    ];

    if (coverImageUrl) {
      try {
        const imageResponse = await fetch(coverImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const mimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";
        parts.push({ inline_data: { mime_type: mimeType, data: arrayBufferToBase64(imageBuffer) } });
      } catch {
        // Si l'image ne charge pas, on modère quand même sur le texte seul.
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      },
    );

    if (!response.ok) {
      return { verdict: "flagged_for_review", reason: "Modération IA indisponible (erreur réseau)." };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    try {
      const parsed = JSON.parse(text);
      if (!["approved", "flagged_for_review", "rejected"].includes(parsed.verdict)) {
        return { verdict: "flagged_for_review", reason: "Réponse de modération inattendue." };
      }
      return parsed;
    } catch {
      return { verdict: "flagged_for_review", reason: "Réponse de modération illisible." };
    }
  },
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
