import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const createUser = internalMutation({
    args: {
        tokenIdentifier: v.string(),
        email: v.string(),
        name: v.string(),
        image: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("users", {
            tokenIdentifier: args.tokenIdentifier,
            email: args.email,
            name: args.name,
            image: args.image,
            isOnline: true,
        });
    },
});

export const deleteUser = internalMutation({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) return;

    // Update conversations that include this user
    const conversations = await ctx.db.query("conversations").collect();

    for (const c of conversations) {
      if (!c.participants.includes(user._id)) continue;

      if (c.isGroup) {
        const remaining = c.participants.filter((id) => id !== user._id);
        const newAdmin = c.admin && c.admin === user._id ? remaining[0] : c.admin;
        await ctx.db.patch(c._id, {
          participants: remaining,
          admin: newAdmin,
        });
      } else {
        // 1:1 chat: nothing to patch; UI will fallback when other user is missing
      }
    }

    // Finally delete the user document
    await ctx.db.delete(user._id);
  },
});

export const updateUser = internalMutation({
    args: {
        tokenIdentifier: v.string(),
        image: v.string(),
        name: v.optional(v.string())
    },
    async handler(ctx, args) {
        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .unique();

        if (!user) {
            throw new ConvexError("User not found");
        }

        await ctx.db.patch(user._id, {
            image: args.image,
            name: args.name
        });
    },
});

// export const setUserOnline = internalMutation({
//     args: { tokenIdentifier: v.string() },
//     handler: async (ctx, args) => {
//         const user = await ctx.db
//             .query("users")
//             .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
//             .unique();

//         if (!user) {
//             throw new ConvexError("User not found");
//         }

//         await ctx.db.patch(user._id, { isOnline: true });
//     },
// });

// export const setUserOffline = internalMutation({
//     args: { tokenIdentifier: v.string() },
//     handler: async (ctx, args) => {
//         const user = await ctx.db
//             .query("users")
//             .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
//             .unique();

//         if (!user) {
//             throw new ConvexError("User not found");
//         }

//         await ctx.db.patch(user._id, { isOnline: false });
//     },
// });

export const getUsers = query({
    args: {},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const users = await ctx.db.query("users").collect();
        return users.filter((user) => user.tokenIdentifier !== identity.tokenIdentifier);
    },
});

export const getUserById = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), args.id))
            .first();

        // Return null instead of throwing to allow clients to handle deleted users gracefully
        if (!user) {
            return null as any;
        }

        return user;
    },
});

export const getMe = query({
    args: {},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new ConvexError("User not found");
        }

        return user;
    },
});

export const getGroupMembers = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const conversation = await ctx.db
            .query("conversations")
            .filter((q) => q.eq(q.field("_id"), args.conversationId))
            .first();
        if (!conversation) {
            throw new ConvexError("Conversation not found");
        }

        const users = await ctx.db.query("users").collect();
        const groupMembers = users.filter((user) => conversation.participants.includes(user._id));

        return groupMembers;
    },
});