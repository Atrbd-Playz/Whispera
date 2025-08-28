import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!me) throw new ConvexError("User not found");

    const conversation = await ctx.db.get(args.id);
    if (!conversation) throw new ConvexError("Conversation not found");

    if (!conversation.participants.includes(me._id)) {
      throw new ConvexError("You are not a participant of this conversation");
    }

    return conversation;
  },
});

export const updateGroup = mutation({
  args: {
    id: v.id("conversations"),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!me) throw new ConvexError("User not found");

    const conversation = await ctx.db.get(args.id);
    if (!conversation) throw new ConvexError("Conversation not found");

    if (!conversation.isGroup) throw new ConvexError("Not a group conversation");

    // Only admin can update group details if an admin is set
    if (conversation.admin && conversation.admin !== me._id) {
      throw new ConvexError("Only the group admin can update this conversation");
    }

    const patch: Record<string, any> = {};
    if (args.groupName !== undefined) patch.groupName = args.groupName;

    if (args.groupImage) {
      const url = await ctx.storage.getUrl(args.groupImage);
      patch.groupImage = url ?? undefined;
    }

    if (Object.keys(patch).length === 0) return await ctx.db.get(args.id);

    await ctx.db.patch(args.id, patch);
    const updated = await ctx.db.get(args.id);
    return updated;
  },
});
