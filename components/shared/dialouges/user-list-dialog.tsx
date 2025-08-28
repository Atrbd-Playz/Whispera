import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { useConversationStore } from "../../../store/chat-store";

const UserListDialog = () => {
    const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
    const [groupName, setGroupName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [renderedImage, setRenderedImage] = useState("");

    const imgRef = useRef<HTMLInputElement>(null);
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

    const createConversation = useMutation(api.conversations.createConversation);
    const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
    const me = useQuery(api.users.getMe);
    const users = useQuery(api.users.getUsers);
    const conversations = useQuery(api.conversations.getMyConversations);
    const router = useRouter();

    const { setSelectedConversation } = useConversationStore();
    const [query, setQuery] = useState("");

    const handleCreateConversation = async () => {
        if (selectedUsers.length === 0) return;
        setIsLoading(true);
        try {
            const isGroup = selectedUsers.length > 1;

            let conversationId;
            if (!isGroup) {
                conversationId = await createConversation({
                    participants: [...selectedUsers, me?._id!],
                    isGroup: false,
                });
            } else {
                const postUrl = await generateUploadUrl();

                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedImage?.type! },
                    body: selectedImage,
                });

                const { storageId } = await result.json();

                conversationId = await createConversation({
                    participants: [...selectedUsers, me?._id!],
                    isGroup: true,
                    admin: me?._id!,
                    groupName,
                    groupImage: storageId,
                });
            }

            dialogCloseRef.current?.click();
            resetDialogState();

            const conversationName = isGroup ? groupName : users?.find((user) => user._id === selectedUsers[0])?.name;

            setSelectedConversation({
                _id: conversationId,
                participants: selectedUsers,
                isGroup,
                image: isGroup ? renderedImage : users?.find((user) => user._id === selectedUsers[0])?.image,
                name: conversationName,
                admin: me?._id!,
            });
        } catch (err) {
            toast.error("Failed to create conversation");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedImage) return setRenderedImage("");
        const reader = new FileReader();
        reader.onload = (e) => setRenderedImage(e.target?.result as string);
        reader.readAsDataURL(selectedImage);
    }, [selectedImage]);

    const resetDialogState = () => {
        setSelectedUsers([]);
        setGroupName("");
        setSelectedImage(null);
        setRenderedImage("");
        setQuery("");
    };

    const filteredUsers = (users || []).filter((u) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (u.name || u.email || "").toLowerCase().includes(q);
    });

    const filteredConversations = (conversations || []).filter((c: any) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return ((c.groupName || c.name || "").toLowerCase().includes(q));
    });

    const findExisting1to1 = (userId: Id<"users">) => {
        return (conversations || []).find((c: any) => !c.isGroup && c.participants.includes(me?._id) && c.participants.includes(userId));
    };

    const openOrCreate1to1 = async (user: any) => {
        const existing = findExisting1to1(user._id as any);
        if (existing) {
            setSelectedConversation(existing);
            router.push(`/chats/${existing._id}`);
            dialogCloseRef.current?.click();
            return;
        }
        try {
            const id = await createConversation({ isGroup: false, participants: [me?._id!, user._id] });
            setSelectedConversation({ _id: id, isGroup: false, participants: [me?._id!, user._id], name: user.name, image: user.image } as any);
            router.push(`/chats/${id}`);
            dialogCloseRef.current?.click();
        } catch (err) {
            toast.error("Failed to start chat");
            console.error(err);
        }
    };

    return (
        <Dialog onOpenChange={(isOpen) => !isOpen && resetDialogState()}>
            <DialogTrigger>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#00000" fill="none">
                    <path d="M16.2141 4.98239L17.6158 3.58063C18.39 2.80646 19.6452 2.80646 20.4194 3.58063C21.1935 4.3548 21.1935 5.60998 20.4194 6.38415L19.0176 7.78591M16.2141 4.98239L10.9802 10.2163C9.93493 11.2616 9.41226 11.7842 9.05637 12.4211C8.70047 13.058 8.3424 14.5619 8 16C9.43809 15.6576 10.942 15.2995 11.5789 14.9436C12.2158 14.5877 12.7384 14.0651 13.7837 13.0198L19.0176 7.78591M16.2141 4.98239L19.0176 7.78591" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M21 12C21 16.2426 21 18.364 19.682 19.682C18.364 21 16.2426 21 12 21C7.75736 21 5.63604 21 4.31802 19.682C3 18.364 3 16.2426 3 12C3 7.75736 3 5.63604 4.31802 4.31802C5.63604 3 7.75736 3 12 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogClose ref={dialogCloseRef} />
                    <DialogTitle>Start a chat</DialogTitle>
                </DialogHeader>

                <DialogDescription className="flex flex-col">Search for people or conversations. Select multiple users to create a group.</DialogDescription>

                {/* Group preview image */}
                {renderedImage && (
                    <div className='w-16 h-16 relative mx-auto'>
                        <Image src={renderedImage} fill alt='group image' className='rounded-full object-cover' />
                    </div>
                )}

                {/* Search */}
                <Input
                    placeholder='Search users or conversations'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className='my-2'
                />

                {/* Group config */}
                <input
                    type='file'
                    accept='image/*'
                    ref={imgRef}
                    hidden
                    onChange={(e) => setSelectedImage(e.target.files![0])}
                />
                {selectedUsers.length > 1 && (
                    <div className='flex items-center gap-2 my-2'>
                        <Input
                            placeholder='Group name'
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <Button className='flex gap-2' onClick={() => imgRef.current?.click()}>
                            <ImageIcon size={20} />
                            Group Image
                        </Button>
                    </div>
                )}

                {/* Results list */}
                <div className='flex flex-col gap-2 overflow-auto max-h-80'>
                    {/* Conversations section */}
                    {query && (
                        <div>
                            <p className='text-xs uppercase text-muted-foreground px-1 mb-1'>Conversations</p>
                            <div className='rounded-md border divide-y'>
                                {filteredConversations.length === 0 && (
                                    <div className='px-3 py-2 text-sm text-muted-foreground'>No conversations</div>
                                )}
                                {filteredConversations.map((c: any) => (
                                    <div key={c._id} className='flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer' onClick={() => { setSelectedConversation(c); router.push(`/chats/${c._id}`); dialogCloseRef.current?.click(); }}>
                                        <Avatar>
                                            <AvatarImage src={c.groupImage || c.image || "/placeholder.png"} />
                                            <AvatarFallback>
                                                <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className='min-w-0'>
                                            <p className='text-sm font-medium truncate'>{c.groupName || c.name || 'Conversation'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Users section */}
                    <div>
                        <p className='text-xs uppercase text-muted-foreground px-1 mb-1'>Users</p>
                        <div className='rounded-md border divide-y'>
                            {filteredUsers.length === 0 && (
                                <div className='px-3 py-2 text-sm text-muted-foreground'>No users</div>
                            )}
                            {filteredUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className={`flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer ${selectedUsers.includes(user._id) ? 'bg-accent' : ''}`}
                                    onClick={() => {
                                        if (query.trim()) {
                                            openOrCreate1to1(user);
                                        } else {
                                            if (selectedUsers.includes(user._id)) {
                                                setSelectedUsers(selectedUsers.filter((id) => id !== user._id));
                                            } else {
                                                setSelectedUsers([...selectedUsers, user._id]);
                                            }
                                        }
                                    }}
                                >
                                    <Avatar>
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback>
                                            <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='min-w-0 flex-1'>
                                        <p className='text-sm font-medium truncate'>{user.name || user.email.split('@')[0]}</p>
                                        <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
                                    </div>
                                    {query.trim() && (
                                        <Button size='sm' className='ml-auto'>Chat</Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className='flex justify-between mt-3'>
                    <DialogClose asChild>
                        <Button variant={'outline'}>Close</Button>
                    </DialogClose>
                    <Button
                        onClick={handleCreateConversation}
                        disabled={selectedUsers.length === 0 || (selectedUsers.length > 1 && !groupName) || isLoading}
                    >
                        {isLoading ? (
                            <div className='w-5 h-5 border-t-2 border-b-2  rounded-full animate-spin' />
                        ) : (
                            selectedUsers.length > 1 ? 'Create group' : 'Create'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserListDialog;
