import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageSeenSvg } from "@/lib/svgs";
import { ImageIcon, Users, VideoIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IMessage, useConversationStore } from "@/store/chat-store";

const Conversation = ({ conversation }: { conversation: any }) => {
    const conversationImage = conversation.groupImage || conversation.image;
    const conversationName = conversation.groupName || conversation.name;
    const lastMessage = conversation.lastMessage;
    const lastMessageType = lastMessage?.messageType;
    const me = useQuery(api.users.getMe);
    const sender = useQuery(api.users.getUserById, { id: lastMessage?.sender });

    const { setSelectedConversation, selectedConversation } = useConversationStore();


    return (
        <>
            <div
                className={`flex gap-3 w-full items-center px-4 py-3 cursor-pointer transition-colors
    ${selectedConversation?._id === conversation._id ? "bg-gray-200 dark:bg-neutral-900 rounded-sm" : ""}
  `}
                onClick={() => setSelectedConversation(conversation)}
                style={{ minHeight: 72 }}
            >

                <Avatar className=' overflow-visible relative w-12 h-12'>
                    <AvatarImage src={conversationImage || "/placeholder.png"} className='object-cover rounded-full' alt="User Profile" />
                    <AvatarFallback>
                        <div className='animate-pulse bg-gray-300 w-full h-full rounded-full'></div>
                    </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center mb-1'>
                        <h3 className='text-base font-semibold truncate'>{conversationName}</h3>
                        <span className='text-xs text-gray-500 ml-auto'>
                            {formatDate(lastMessage?._creationTime || conversation._creationTime)}
                        </span>
                    </div>
                    <div className='flex items-center gap-1 text-[13px] dark:text-gray-200  truncate'>
                        {lastMessage?.sender === me?._id && <MessageSeenSvg className="text-cyan-600 bg-opacity-70" />}
                        {conversation.isGroup && <Users size={15} className="text-gray-400" />}
                        {conversation.isGroup && lastMessage?.sender !== me?._id && sender && (
                            <span className="opacity-50 italic text-[14px]">
                                {sender.name?.split(" ")[0]}:
                            </span>
                        )}

                        {!lastMessage && <span className="italic text-gray-400">--Say Hi!</span>}
                        {lastMessageType === "text" && (
                            <span className="truncate">
                                {lastMessage?.content.length > 30
                                    ? `${lastMessage?.content.slice(0, 30)}...`
                                    : lastMessage?.content}
                            </span>
                        )}
                        {lastMessageType === "image" && <div className="flex items-center gap-1"> <ImageIcon size={15} className="dark:text-gray-400 text-gray-600 " /> <span className="italic text-gray-400">Photo</span> </div>}
                        {lastMessageType === "video" &&
                            <div className="flex items-center gap-1">
                                <VideoIcon size={15} className="dark:text-gray-400 text-gray-600 " />
                                <span className="italic text-gray-400">Video</span>
                            </div>}
                    </div>
                </div>
            </div>
            <hr className='h-[1px] mx-16 border-none bg-gray-200 dark:bg-zinc-700' />
        </>
    );
};
export default Conversation;