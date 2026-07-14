import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

/**
 * Webhook Clerk → Convex.
 * Configuration côté Clerk Dashboard : Webhooks → endpoint
 * `https://tonapp.com/api/webhooks/clerk`, événement `user.created`.
 * Nécessite CLERK_WEBHOOK_SECRET dans .env.local.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET manquant", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Headers svix manquants", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Signature invalide", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, username, first_name, last_name, image_url, unsafe_metadata } = event.data;

    await convex.mutation(api.users.getOrCreateProfile, {
      clerkId: id,
      username: username ?? `varotra${id.slice(-6)}`,
      displayName: [first_name, last_name].filter(Boolean).join(" ") || "Nouvel utilisateur",
      avatarUrl: image_url,
      location: (unsafe_metadata?.location as string) ?? "Antananarivo",
    });
  }

  return new Response("ok", { status: 200 });
}
