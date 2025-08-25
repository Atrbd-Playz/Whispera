import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import toast from "react-hot-toast";
import useComponentVisible from "@/hooks/useComponentVisible";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import MediaDropdown from "./utils/media-dropdown";
import TextareaAutoSize from 'react-textarea-autosize'

const ChatFooter = () => {
	const [msgText, setMsgText] = useState("");
	const { selectedConversation } = useConversationStore();
	const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);





	const me = useQuery(api.users.getMe);
	const sendTextMsg = useMutation(api.messages.sendTextMessage);

	const handleSendTextMsg = async (e: React.FormEvent) => {
		e.preventDefault();
		if (msgText.trim() === "") return; // Prevent empty messages
		try {
			await sendTextMsg({ content: msgText.trim(), conversation: selectedConversation!._id, sender: me!._id });
			setMsgText("");
		} catch (err: any) {
			toast.error(err.message);
			console.error(err);
		}
	};

	// SVG icons
	const SmileIcon = (props: React.SVGProps<SVGSVGElement>) => (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7">
			<path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
		</svg>
	);
	const Send = (props: React.SVGProps<SVGSVGElement>) => (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
		</svg>
	);
	const Mic = (props: React.SVGProps<SVGSVGElement>) => (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
		</svg>
	);

	return (
		<div className='w-full sticky bottom-1 z-20 shadow-md bg-background p-[1px] rounded-md'>
			<div className='flex justify-between bg-gray-primary p-2 dark:bg-accent'>
				<div className='flex sm:gap-3 items-center justify-center w-full'>
					<form onSubmit={handleSendTextMsg} className='w-full flex gap-3 items-end'>
						{/* Emoji Picker */}
						<div ref={ref} onClick={() => setIsComponentVisible(true)}>
							{isComponentVisible && (
								<EmojiPicker
									skinTonesDisabled={true}
									autoFocusSearch={false}
									theme={Theme.DARK}
									allowExpandReactions={false}
									onEmojiClick={(emojiObject) => {
										setMsgText((prev) => prev + emojiObject.emoji);
									}}
									style={{ position: "absolute", bottom: "1.5rem", left: "1rem", zIndex: 50 }}
								/>
							)}
							<SmileIcon />
						</div>

						<div className='flex w-full items-end'>
							<TextareaAutoSize
								rows={1} maxRows={3}
								placeholder='Type a message'
								className='py-[10px] text-sm h-10 no-scrollbar rounded-[2px] bg-transparent focus:border-b-[1px] focus:outline-none focus:border-primary overflow-y-auto w-full resize-none overflow-hidden leading-tight'
								value={msgText}
								onChange={(e) => setMsgText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && e.shiftKey) {
										handleSendTextMsg
									}
								}}

							/>
							<MediaDropdown />
						</div>

						<button
							type='submit'

							className={`bg-transparent no-scrollbar text-foreground hover:bg-transparent transform transition-transform duration-300 ${msgText.length > 0 ? "animate-scale-up" : "animate-scale-down"}`}
						>
							{msgText.length > 0 ? <Send /> : <Mic />}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ChatFooter;