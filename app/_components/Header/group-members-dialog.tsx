import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Crown } from "lucide-react";
import { Conversation } from "@/store/chat-store";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type GroupMembersDialogProps = {
	selectedConversation: Conversation;
};

const GroupMembersDialog = ({ selectedConversation }: GroupMembersDialogProps) => {
	const users = useQuery(api.users.getGroupMembers, { conversationId: selectedConversation._id });
	return (
		<Dialog>
			<DialogTrigger>
				<p className='text-xs text-muted-foreground text-left'>See members</p>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='my-2'>Current Members</DialogTitle>
					<DialogDescription>
						<div className='flex flex-col gap-3 overflow-y-auto max-h-[400px]'>
							{users?.map((user) => (
								<div key={user._id} className={`flex gap-3 items-center p-2 rounded`}>
									<Avatar className='overflow-visible'>
										
										<AvatarImage src={user.image} className='rounded-full object-cover' />
										<AvatarFallback>
											<div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
										</AvatarFallback>
									</Avatar>

									<div className='w-full '>
										<div className='flex items-center gap-2'>
											<h3 className='text-md font-medium'>
												{/* johndoe@gmail.com */}
												{user.name || user.email.split("@")[0]}
											</h3>
											{user._id === selectedConversation.admin && (
												<Crown size={16} className='text-yellow-400' />
											)}
										</div>
									</div>
								</div>
								
							))}

							
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};
export default GroupMembersDialog;