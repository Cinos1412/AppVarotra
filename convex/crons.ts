import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Vérifie toutes les 15 minutes les séquestres "livrés" depuis plus de 24h
// sans contestation de l'acheteur, et libère les fonds au vendeur (CGU §3).
crons.interval(
  "auto-release escrow funds",
  { minutes: 15 },
  internal.escrow.autoReleaseExpired,
  {},
);

crons.interval(
  "expire outdated visibility boosts",
  { hours: 1 },
  internal.boosts.expireOutdatedBoosts,
  {},
);

export default crons;
