import { useRef } from 'react';
import ChatBubble from '../message';
import { useQuery } from 'convex/react';
import { useConversationStore } from '@/store/chat-store';
import { api } from '@/convex/_generated/api';
import Message from '../message';


type Props = {}
const ChatBody = (props: Props) => {
  const { selectedConversation } = useConversationStore();
  const messages = useQuery(api.messages.getMessages, { conversation: selectedConversation!._id, });
  const me = useQuery(api.users.getMe);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  return (
    <div className='w-full no-scrollbar overflow-y-scroll flex-1 flex-col-reverse flex gap-2 p-2'>
      {messages?.map((msg, idx) => (
        <div key={msg._id} ref={lastMessageRef}>
          <Message message={msg} me={me} previousMessage={idx > 0 ? messages[idx - 1] : undefined} />
        </div>))}
    </div>)
}
export default ChatBody