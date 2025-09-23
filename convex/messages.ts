import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendTextMessage = mutation({
	args: {
    sender: v.string(),
    content: v.string(),
    conversation: v.id("conversations"),
    replyTo: v.optional(v.id("messages")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const conversation = await ctx.db
			.query("conversations")
			.filter((q) => q.eq(q.field("_id"), args.conversation))
			.first();

		if (!conversation) {
			throw new ConvexError("Conversation not found");
		}

		if (!conversation.participants.includes(user._id)) {
			throw new ConvexError("You are not part of this conversation");
		}

    const insertObj: any = {
      sender: args.sender,
      content: args.content,
      conversation: args.conversation,
      messageType: "text",
      deliveredTo: [],
      seenBy: [],
    };
    if (args.replyTo) insertObj.replyTo = args.replyTo;

    await ctx.db.insert("messages", insertObj);
	},
});

// Allow a sender to unsend (delete) their own message within a conversation
export const unsendMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!me) throw new ConvexError("User not found");

    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new ConvexError("Message not found");
    if (msg.sender !== me._id) throw new ConvexError("Not allowed");

    // For simplicity remove the message record
    await ctx.db.delete(args.messageId);
  },
});


export const getMessages = query({
  args: {
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const rawMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation", args.conversation)
      )
      .order("desc") // oldest → newest
      .take(1000); // Convex needs a cap, paginatedQuery will handle slicing

    const userProfileCache = new Map();

    const messagesWithSender = await Promise.all(
      rawMessages.map(async (message) => {
        // Attach sender
        let sender: any = null;
        if (message.sender === "ChatGPT") {
          const image = message.messageType === "text" ? "/gpt.png" : "dall-e.png";
          sender = { name: "ChatGPT", image };
        } else if (userProfileCache.has(message.sender)) {
          sender = userProfileCache.get(message.sender);
        } else {
          sender = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), message.sender))
            .first();
          userProfileCache.set(message.sender, sender);
        }

        // If this message replies to another message, fetch a small reply preview
        let replyToData = null;
        if ((message as any).replyTo) {
          try {
            const replied = await ctx.db.get((message as any).replyTo);
            // Make sure the returned record looks like a message before accessing message fields
            if (replied && typeof replied === "object" && "sender" in replied && "content" in replied) {
              const repliedMsg: any = replied;
              let repliedSender: any = null;
              if (repliedMsg.sender === "ChatGPT") {
                const image = ("messageType" in repliedMsg && repliedMsg.messageType === "text") ? "/gpt.png" : "dall-e.png";
                repliedSender = { name: "ChatGPT", image };
              } else if (userProfileCache.has(repliedMsg.sender)) {
                repliedSender = userProfileCache.get(repliedMsg.sender);
              } else {
                repliedSender = await ctx.db
                  .query("users")
                  .filter((q) => q.eq(q.field("_id"), repliedMsg.sender))
                  .first();
                userProfileCache.set(repliedMsg.sender, repliedSender);
              }
              replyToData = { _id: repliedMsg._id, content: repliedMsg.content, sender: repliedSender };
            }
          } catch (e) {
            // ignore reply fetch errors
          }
        }

        return { ...message, sender, replyTo: replyToData };
      })
    );

    return messagesWithSender;
  },
});



export const sendImage = mutation({
	args: {
		imgId: v.id("_storage"),
		sender: v.id("users"),
		conversation: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Unauthorized");
		}

		const content = (await ctx.storage.getUrl(args.imgId)) as string;

		await ctx.db.insert("messages", {
			content: content,
			sender: args.sender,
			messageType: "image",
			conversation: args.conversation,
			deliveredTo: [],
			seenBy: [],
		});
	},
});

export const sendVideo = mutation({
	args: {
		videoId: v.id("_storage"),
		sender: v.id("users"),
		conversation: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Unauthorized");
		}

		const content = (await ctx.storage.getUrl(args.videoId)) as string;

		await ctx.db.insert("messages", {
			content: content,
			sender: args.sender,
			messageType: "video",
			conversation: args.conversation,
			deliveredTo: [],
			seenBy: [],
		});
	},
});

// Mark messages in a conversation as delivered for the current user
export const markDeliveredForConversation = mutation({
  args: { conversation: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!me) throw new ConvexError("User not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversation", args.conversation))
      .order("desc")
      .take(500);

    for (const m of messages) {
      if (m.sender === me._id) continue; // don't mark own messages
      const delivered = new Set((m.deliveredTo || []).map((x) => x));
      if (!delivered.has(me._id)) {
        delivered.add(me._id);
        await ctx.db.patch(m._id, { deliveredTo: Array.from(delivered) });
      }
    }
  },
});

// Mark messages in a conversation as seen for the current user
export const markSeenForConversation = mutation({
  args: { conversation: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!me) throw new ConvexError("User not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversation", args.conversation))
      .order("desc")
      .take(500);

    for (const m of messages) {
      if (m.sender === me._id) continue; // don't mark own messages
      const seen = new Set((m.seenBy || []).map((x) => x));
      if (!seen.has(me._id)) {
        seen.add(me._id);
        // ensure delivered as well
        const delivered = new Set((m.deliveredTo || []).map((x) => x));
        delivered.add(me._id);
        await ctx.db.patch(m._id, {
          seenBy: Array.from(seen),
          deliveredTo: Array.from(delivered),
        });
      }
    }
  },
});