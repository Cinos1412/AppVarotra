import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Génère une URL d'upload à usage unique — le client y POST le fichier directement. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
