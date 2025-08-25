import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IMessage } from "@/store/chat-store";


type ChatBubbleAvatarProps = {
	message: IMessage;
	isMember: boolean;
	isGroup: boolean | undefined;
	fromAI: boolean;
};

const ChatBubbleAvatar = ({ isGroup, isMember, message, fromAI }: ChatBubbleAvatarProps) => {
	if (!isGroup && !fromAI) return null;

	return (
		<Avatar className='overflow-visible relative border-none'>
			<AvatarImage src={message.sender?.image} className='rounded-full object-cover w-8 h-8' />
			<AvatarFallback className='w-8 h-8 '>
				<div className='animate-pulse bg-gray-tertiary rounded-full'></div>
			</AvatarFallback>
		</Avatar>
	);
};
export default ChatBubbleAvatar;