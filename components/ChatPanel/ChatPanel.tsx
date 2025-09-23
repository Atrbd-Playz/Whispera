"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '@/convex/_generated/api';
import Conversation from './conversation';
import { useConversationStore } from '@/store/chat-store';
import { Conversation as ConversationType } from '@/store/chat-store';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '@/components/ui/Spinner';

type Props = {};

export default function ChatPanel(_props: Props) {
    const router = useRouter();
    const conversations = useQuery(api.conversations.getMyConversations);
    const me = useQuery(api.users.getMe);
    const selectedConversation = useConversationStore((s) => s.selectedConversation);
    const setSelectedConversation = useConversationStore((state) => state.setSelectedConversation);

    const sortedConversations = React.useMemo(() => {
        if (!conversations) return [] as ConversationType[];
        return [...conversations].sort((a, b) => {
            const bTime = b.lastMessage?._creationTime ?? b._creationTime;
            const aTime = a.lastMessage?._creationTime ?? a._creationTime;
            return bTime - aTime;
        });
    }, [conversations]);

    const handleConversationClick = (conversation: ConversationType) => {
        setSelectedConversation(conversation);
        router.push(`/chats/${conversation._id}`);
    };

    const prevLastMapRef = React.useRef<Record<string, string | undefined>>({});

    const playNotify = () => {
        try {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            const master = ctx.createGain();
            master.gain.value = 0.08;
            master.connect(ctx.destination);

            const tone = (freq: number, start: number, dur: number) => {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(freq, ctx.currentTime + start);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
                g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.03);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
                o.connect(g).connect(master);
                o.start(ctx.currentTime + start);
                o.stop(ctx.currentTime + start + dur + 0.05);
            };

            tone(660, 0.0, 0.45);
            tone(880, 0.15, 0.6);
        } catch (e) {
            console.warn('[ChatPanel] playNotify failed', e);
        }
    };

    const notifyBrowser = async (title: string, body: string, icon?: string, url?: string) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        const opts: NotificationOptions = { body, icon, data: { url } } as any;
        if (Notification.permission === 'granted') {
            try {
                new Notification(title, opts);
                return;
            } catch (e) {
                console.warn('[ChatPanel] Notification API failed', e);
            }
        }
        toast(title + ': ' + body);
    };

    const showToast = (conv: any) => {
        const image = conv.groupImage || conv.image || '/placeholder.png';
        const name = conv.groupName || conv.name || 'New message';
        const preview = conv.lastMessage?.content || 'New message';
        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t.id);
                    handleConversationClick(conv);
                }}
                className="cursor-pointer w-[300px] rounded-xl border bg-background shadow-lg ring-1 ring-black/5 overflow-hidden"
            >
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500" />
                <div className="p-3 flex gap-3 items-center">
                    <img src={image} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{preview}</p>
                    </div>
                </div>
            </div>
        ), { duration: 4000, position: 'top-right' });
    };

    React.useEffect(() => {
        if (!conversations || !me) return;
        const prev = prevLastMapRef.current;
        for (const conv of conversations) {
            const last = conv.lastMessage;
            if (!last) continue;
            const prevId = prev[conv._id];
            const isNew = prevId && prevId !== last._id;
            const isUnread = last.sender !== me._id && !((last.seenBy || []).includes?.(me._id));
            const isActive = selectedConversation?._id === conv._id;
            if (isNew && isUnread && !isActive) {
                playNotify();
                notifyBrowser(
                    conv.groupName || conv.name || 'New message',
                    last.content,
                    conv.groupImage || conv.image,
                    `/chats/${conv._id}`
                );
                showToast(conv);
            }
            prev[conv._id] = last._id;
        }
        if (Object.keys(prev).length === 0) {
            for (const conv of conversations) {
                if (conv.lastMessage) prev[conv._id] = conv.lastMessage._id;
            }
        }
    }, [conversations, me?._id, selectedConversation?._id]);

    return (
        <div className='my-3 flex flex-col h-screen gap-0 overflow-auto w-full'>
            {!conversations ? (
                <div className="flex items-center justify-center h-full">
                    <Spinner size={48} />
                </div>
            ) : (
                <AnimatePresence>
                    {sortedConversations.map((conversation: ConversationType) => (
                        <motion.div
                            key={conversation._id}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                            onClick={() => handleConversationClick(conversation)}
                            className="cursor-pointer"
                        >
                            <Conversation conversation={conversation} />
                        </motion.div>
                    ))}

                    {sortedConversations.length === 0 && (
                        <div className='py-8 text-center'>
                            <p className='text-gray-500 text-sm'>No conversations yet</p>
                            <p className='text-gray-500 text-sm mt-2'>Your chat list is as quiet as an introvert at a party. 😶</p>
                        </div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
