import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Conversation from './conversation';
import { useConversationStore } from '@/store/chat-store';
import { Conversation as ConversationType } from '@/store/chat-store';
import { motion, AnimatePresence } from 'framer-motion'; // Add this import

type Props = {}

const ChatPanel = (props: Props) => {
    const router = useRouter();
    const conversations = useQuery(api.conversations.getMyConversations);
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
