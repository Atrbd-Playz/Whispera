import { useRef, useEffect } from 'react';
import ChatBubble from '../message';
import { useQuery, useMutation } from 'convex/react';
import { useConversationStore } from '@/store/chat-store';
import { api } from '@/convex/_generated/api';
import Message from '../message';


type Props = {}
const ChatBody = (props: Props) => {
  const { selectedConversation } = useConversationStore();
  const messages = useQuery(api.messages.getMessages, { conversation: selectedConversation!._id, });
  const me = useQuery(api.users.getMe);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const markDelivered = useMutation(api.messages.markDeliveredForConversation);
  const markSeen = useMutation(api.messages.markSeenForConversation);

  useEffect(() => {
    if (!selectedConversation || !me || !messages) return;
    markDelivered({ conversation: selectedConversation._id });
    markSeen({ conversation: selectedConversation._id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id, me?._id, messages?.length]);

  return (
    <div className='w-full no-scrollbar overflow-y-scroll flex-1 flex-col-reverse flex gap-2 p-2'>
      {messages?.map((msg, idx) => (
        <div key={msg._id} ref={lastMessageRef}>
          <Message message={msg} me={me} previousMessage={idx < messages.length - 1 ? messages[idx + 1] : undefined} />
        </div>))}
    </div>)
}
export default ChatBody