import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '@/convex/_generated/api';
import Conversation from './conversation';
import { useConversationStore } from '@/store/chat-store';
import { Conversation as ConversationType } from '@/store/chat-store';
import { motion, AnimatePresence } from 'framer-motion'; // Add this import

type Props = {}

const ChatPanel = (props: Props) => {
    const router = useRouter();
    const conversations = useQuery(api.conversations.getMyConversations);
    const me = useQuery(api.users.getMe);
    const { selectedConversation } = useConversationStore();
    const setSelectedConversation = useConversationStore((state) => state.setSelectedConversation);

    // Sort conversations by updatedAt (or createdAt) descending
    const sortedConversations = React.useMemo(() => {
        if (!conversations) return [];
        return [...conversations].sort(
            (a, b) => {
                const bTime = b.lastMessage?._creationTime ?? b._creationTime;
                const aTime = a.lastMessage?._creationTime ?? a._creationTime;
                return bTime - aTime;
            }
        );
    }, [conversations]);

    const handleConversationClick = (conversation: ConversationType) => {
        setSelectedConversation(conversation);
        router.push(`/chats/${conversation._id}`);
    };

    // Notification helpers
    const prevLastMapRef = React.useRef<Record<string, string | undefined>>({});

    const playNotify = () => {
        try {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();

            // Master gain for overall soft volume
            const master = ctx.createGain();
            master.gain.value = 0.08; // gentle volume
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

            // Soothing two-tone chime
            tone(660, 0.0, 0.45); // E5
            tone(880, 0.15, 0.6);  // A5
        } catch {}
    };

    const [swReady, setSwReady] = React.useState(false);
    const subscribePush = React.useCallback(async () => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return;
            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                // ensure it's saved on server
                await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(existing) });
                return;
            }
            if (Notification.permission !== 'granted') {
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') return;
            }
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string | undefined;
            if (!publicKey) return;
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
                const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            };
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
            await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
        } catch (e) {
            // ignore
        }
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(() => {
                setSwReady(true);
                subscribePush();
            }).catch(() => {});
        }
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, [subscribePush]);

    const notifyBrowser = async (title: string, body: string, icon?: string, url?: string) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        const opts: NotificationOptions = { body, icon, data: { url } } as any;
        // Prefer service worker so the notification appears in system tray and works while unfocused
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                reg.showNotification(title, opts);
                return;
            }
        } catch {}
        // Fallback
        if (Notification.permission === 'granted') {
            new Notification(title, opts);
        }
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
            // update map
            prev[conv._id] = last._id;
        }
        // Initialize for first load
        if (Object.keys(prev).length === 0) {
            for (const conv of conversations) {
                if (conv.lastMessage) prev[conv._id] = conv.lastMessage._id;
            }
        }
    }, [conversations, me?._id, selectedConversation?._id]);

    return (
        <>
            <div className='my-3 flex flex-col h-screen gap-0 overflow-auto w-full'>
                <AnimatePresence>
                    {sortedConversations.map((conversation: ConversationType) => (
                        <motion.div
                            key={conversation._id}
                            layout // This enables smooth reordering animation
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onClick={() => handleConversationClick(conversation)}
                            className="cursor-pointer"
                        >
                            <Conversation conversation={conversation} />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {sortedConversations.length === 0 && (
                    <>
                        <p className='text-center text-gray-500 text-sm mt-3'>No conversations yet</p>
                        <p className='text-center text-gray-500 text-sm mt-3'>
                            Your chat list is as quiet as an introvert at a party. 😶
                        </p>
                    </>
                )}
            </div>
        </>
    );
}

export default ChatPanel;
