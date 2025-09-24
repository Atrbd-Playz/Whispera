"use client";

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../message';
import { useQuery, useMutation } from 'convex/react';
import { useConversationStore } from '@/store/chat-store';
import { api } from '@/convex/_generated/api';
import Message from '../message';
import Spinner from '@/components/ui/Spinner';
import { useMessagesCacheStore } from '@/store/chat-store';


type Props = {}
const ChatBody = (props: Props) => {
  const { selectedConversation } = useConversationStore();
  const messages = useQuery(api.messages.getMessages, { conversation: selectedConversation!._id });
  const me = useQuery(api.users.getMe);
  const cached = useMessagesCacheStore((s) => selectedConversation ? s.getCachedMessages(selectedConversation._id as string) : undefined);
  const setCached = useMessagesCacheStore((s) => s.setCachedMessages);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastSeenMessageId = useRef<string | null>(null);

  const markDelivered = useMutation(api.messages.markDeliveredForConversation);
  const markSeen = useMutation(api.messages.markSeenForConversation);

  useEffect(() => {
    if (!selectedConversation || !me || !messages) return;
    markDelivered({ conversation: selectedConversation._id });
    markSeen({ conversation: selectedConversation._id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id, me?._id, messages?.length]);

  // Auto-scroll to latest message when messages update. The conversation's
  // query returns messages with newest first, and the container uses
  // `flex-col-reverse`, so scrolling to `top = 0` shows latest message.
  useEffect(() => {
    if (!containerRef.current || !messages || messages.length === 0) return;
    const newestId = messages[0]._id as string;
    const behavior = lastSeenMessageId.current ? 'smooth' : 'auto';
    // Only scroll when the newest message changed
    if (lastSeenMessageId.current !== newestId) {
      try {
        containerRef.current.scrollTo({ top: 0, behavior: behavior as ScrollBehavior });
      } catch (e) {
        // fallback
        containerRef.current.scrollTop = 0;
      }
      lastSeenMessageId.current = newestId;
    }
  }, [messages]);

  // Persist fresh messages to local cache for quick reloads / offline fallback
  useEffect(() => {
    if (!selectedConversation) return;
    if (messages && messages.length >= 0) {
      setCached(selectedConversation._id as string, messages as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id, messages]);
  // build render content to avoid nested ternary JSX
  const cachedList = cached ?? [];

  const cachedContent = (
    <AnimatePresence initial={false} mode="popLayout">
      {cachedList.map((msg, idx) => (
        <motion.div key={msg._id} ref={lastMessageRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
          <Message message={msg as any} me={me} previousMessage={idx < cachedList.length - 1 ? cachedList[idx + 1] : undefined} />
        </motion.div>
      ))}
    </AnimatePresence>
  );

  const spinnerContent = (
    <div className='w-full flex items-center justify-center py-6'>
      <Spinner size={18} />
    </div>
  );

  const liveContent = (
    <AnimatePresence initial={false} mode="popLayout">
      {messages && messages.map((msg, idx) => (
        <motion.div key={msg._id} ref={lastMessageRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
          <Message message={msg} me={me} previousMessage={idx < messages.length - 1 ? messages[idx + 1] : undefined} />
        </motion.div>
      ))}
    </AnimatePresence>
  );

  const contentElement = !messages ? (cached ? cachedContent : spinnerContent) : liveContent;

  return (
    <div ref={containerRef} className='w-full no-scrollbar overflow-y-scroll flex-1 flex-col-reverse flex gap-2 p-2'>
      {contentElement}
    </div>
  );
}
export default ChatBody;