import { Id } from "../convex/_generated/dataModel";
import { create } from "zustand";

export type Conversation = {
    _id: Id<"conversations">;
    image?: string;
    participants: Id<"users">[];
    isGroup: boolean;
    name?: string;
    groupImage?: string;
    groupName?: string;
    admin?: Id<"users">;
    isOnline?: boolean;
    lastMessage?: {
        _id: Id<"messages">;
        conversation: Id<"conversations">;
        content: string;
        sender: Id<"users"> | string;  // Adjusted to accept string as well
    };
};


type ConversationStore = {
	selectedConversation: Conversation | null;
	setSelectedConversation: (conversation: Conversation | null) => void;
	// Reply state: when user chooses to reply to a message (supports text/image/video)
	replyToMessage: { id: Id<"messages">; content: string; messageType?: "text" | "image" | "video" } | null;
	setReplyToMessage: (m: { id: Id<"messages">; content: string; messageType?: "text" | "image" | "video" } | null) => void;
};

export const useConversationStore = create<ConversationStore>((set) => ({
	selectedConversation: null,
	setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
	replyToMessage: null,
	setReplyToMessage: (m) => set({ replyToMessage: m }),
}));

// Message cache support for offline / fast loading of messages per conversation.
// We keep this separate from the ConversationStore above to avoid breaking existing
// imports — export a small messages cache store using the same zustand create.

type MessagesCacheState = {
	// keyed by conversation id
	messagesCache: Record<string, IMessage[] | undefined>;
	setCachedMessages: (conversationId: string, msgs: IMessage[] | undefined) => void;
	getCachedMessages: (conversationId: string) => IMessage[] | undefined;
};

export const useMessagesCacheStore = create<MessagesCacheState>((set, get) => ({
	messagesCache: {},
	setCachedMessages: (conversationId, msgs) => {
		set((s) => ({ messagesCache: { ...s.messagesCache, [conversationId]: msgs } }));
		try {
			if (typeof window !== 'undefined' && conversationId) {
				const key = `whispera_msgs_${conversationId}`;
				if (msgs) window.localStorage.setItem(key, JSON.stringify(msgs));
				else window.localStorage.removeItem(key);
			}
		} catch (e) {
			// ignore storage errors
		}
	},
	getCachedMessages: (conversationId) => {
		const fromState = get().messagesCache[conversationId];
		if (fromState) return fromState;
		try {
			if (typeof window !== 'undefined' && conversationId) {
				const key = `whispera_msgs_${conversationId}`;
				const raw = window.localStorage.getItem(key);
				if (raw) {
					const parsed = JSON.parse(raw) as IMessage[];
					// populate in-memory cache for future reads
					set((s) => ({ messagesCache: { ...s.messagesCache, [conversationId]: parsed } }));
					return parsed;
				}
			}
		} catch (e) {
			// ignore
		}
		return undefined;
	},
}));

export interface IMessage {
	_id: string;
	content: string;
	_creationTime: number;
	messageType: "text" | "image" | "video";
	deliveredTo?: Id<"users">[];
	seenBy?: Id<"users">[];
	replyTo?: { _id: Id<"messages">; content: string; sender?: any } | null;
	sender: {
		_id: Id<"users">;
		image: string;
		name?: string;
		tokenIdentifier: string;
		email: string;
		_creationTime: number;
		isOnline: boolean;
	};
}