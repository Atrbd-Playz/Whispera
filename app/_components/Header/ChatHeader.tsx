"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash, Video, X, Pencil, ImageIcon } from "lucide-react";
import GroupMembersDialog from "./group-members-dialog";
import { useConversationStore } from "@/store/chat-store";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";


const ChatHeader = () => {
	const { selectedConversation, setSelectedConversation } = useConversationStore();
	const { isLoading } = useConvexAuth();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const deleteConversation = useMutation(api.conversations.deleteConversation);
	const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
	const updateGroup = useMutation(api.conversation.updateGroup);
	const me = useQuery(api.users.getMe);

	const [editOpen, setEditOpen] = useState(false);
	const [groupName, setGroupName] = useState(selectedConversation?.groupName || "");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [renderedImage, setRenderedImage] = useState("");
	const imgRef = useRef<HTMLInputElement>(null);


	const router = useRouter()
	const handleBackClick = () => {
		router.replace("/chats");
		// setSelectedConversation(null)

	}

	// preview selected group image
	useEffect(() => {
		if (!selectedImage) return setRenderedImage("");
		const reader = new FileReader();
		reader.onload = (e) => setRenderedImage(e.target?.result as string);
		reader.readAsDataURL(selectedImage);
	}, [selectedImage]);

	if (isLoading) return (<div className="w-full h-full flex justify-center items-center">
		<svg aria-hidden="true" role="status" className="inline w-8 h-auto me-3  animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
		<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
		</svg>
		
		</div>);

	const conversationName = selectedConversation?.groupName || selectedConversation?.name;
	const conversationImage = selectedConversation?.groupImage || selectedConversation?.image;



	return (
		<>
			<div className='w-full bg-background z-50 dark:bg-accent shadow-md'>
				<div className='flex justify-between bg-gray-primary py-3 px-2'>

					<div className='flex sm:gap-3 items-center justify-center'>
						<button onClick={handleBackClick}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={25} height={25} color={"#00000"} fill={"none"}>
								<path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</button>
						<Avatar className="mr-2">
							<AvatarImage src={conversationImage || "/placeholder.png"} className='object-cover' />
							<AvatarFallback>
								<div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full' />
							</AvatarFallback>
						</Avatar>
						<div className='flex flex-col'>
							<p>{conversationName}</p>
							{selectedConversation?.isGroup && (
								<GroupMembersDialog selectedConversation={selectedConversation} />
							)}
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<a href='/audio-call' target='_blank'>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"}>
								<path d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
							</svg>
						</a>
						<a href='/video-call' target='_blank'>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-video-icon lucide-video"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
						</a>



						<div className="flex items-end justify-center">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<svg className="cursor-pointer"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<circle cx="12" cy="5" r="1.5" fill="currentColor" />
										<circle cx="12" cy="12" r="1.5" fill="currentColor" />
										<circle cx="12" cy="19" r="1.5" fill="currentColor" />
									</svg>
								</DropdownMenuTrigger>


								<DropdownMenuContent className="w-56">
								{selectedConversation?.isGroup && me?._id === selectedConversation?.admin && (
									<DropdownMenuItem
										onClick={(e) => {
											e.preventDefault();
											setGroupName(selectedConversation?.groupName || "");
											setRenderedImage("");
											setSelectedImage(null);
											setEditOpen(true);
										}}
									>
										<Pencil className="w-4 h-4 mr-2" /> Edit group
									</DropdownMenuItem>
								)}
								
								<DropdownMenuGroup className="flex gap-6">
								<DropdownMenuItem className="text-red-500/80" onClick={() => setConfirmOpen(true)}>
								<Trash className="w-4 h-4 mr-2" /> Delete conversation
								</DropdownMenuItem>
								</DropdownMenuGroup>
								
								</DropdownMenuContent>
							</DropdownMenu>
							
							{/* Edit group dialog */}
							{selectedConversation?.isGroup && me?._id === selectedConversation?.admin && (
								<Dialog open={editOpen} onOpenChange={setEditOpen}>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Edit group</DialogTitle>
											<DialogDescription>Update the group name and picture.</DialogDescription>
										</DialogHeader>

										<div className="flex flex-col items-center gap-4">
											<div className="relative w-20 h-20">
												<Avatar className="w-20 h-20">
													<AvatarImage src={renderedImage || (selectedConversation?.groupImage || selectedConversation?.image) || "/placeholder.png"} className="object-cover" />
													<AvatarFallback>
														<div className="animate-pulse bg-gray-300 w-full h-full rounded-full" />
													</AvatarFallback>
												</Avatar>
												<button
													className="absolute bottom-0 right-0 bg-accent p-1 rounded-full border"
													onClick={(e) => {
														e.preventDefault();
														imgRef.current?.click();
													}}
												>
													<ImageIcon size={16} />
												</button>
												<input
													type="file"
													accept="image/*"
													ref={imgRef}
													hidden
													onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
												/>
											</div>

											<Input
												value={groupName}
												onChange={(e) => setGroupName(e.target.value)}
												placeholder="Group name"
											/>
										</div>

										<DialogFooter>
											<Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
											<Button
												onClick={async (e) => {
													e.preventDefault();
													try {
														let storageId: string | undefined = undefined;
														if (selectedImage) {
															const postUrl = await generateUploadUrl();
															const result = await fetch(postUrl, {
																method: "POST",
																headers: { "Content-Type": selectedImage.type },
																body: selectedImage,
															});
															const json = await result.json();
															storageId = json.storageId;
														}

													const updated = await updateGroup({ id: selectedConversation!._id, groupName, groupImage: storageId as any });

													// update selected conversation in store
													setSelectedConversation({
														...selectedConversation!,
														groupName: updated?.groupName,
														groupImage: updated?.groupImage,
													} as any);

													setEditOpen(false);
													toast.success("Group updated");
												} catch (err: any) {
													console.error(err);
													toast.error(err?.message || "Failed to update group");
												}
											}}
											>
											Save
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							)}

							{/* Confirm delete dialog */}
							<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
							<DialogContent>
							<DialogHeader>
							<DialogTitle>Delete this conversation?</DialogTitle>
							<DialogDescription>
							This will permanently remove all messages in “{selectedConversation?.groupName || selectedConversation?.name}”. This action cannot be undone.
							</DialogDescription>
							</DialogHeader>
							<DialogFooter>
							<Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
							<Button
							variant="destructive"
							onClick={async () => {
							if (!selectedConversation) return;
							await deleteConversation({ conversationId: selectedConversation._id });
							setConfirmOpen(false);
							router.replace("/chats");
							setSelectedConversation(null);
							}}
							>
							Delete
							</Button>
							</DialogFooter>
							</DialogContent>
							</Dialog>
							
							</div>





					</div>
				</div>
			</div>
		</>
	)
}



export default ChatHeader