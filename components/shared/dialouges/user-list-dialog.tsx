import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

    const { setSelectedConversation } = useConversationStore();

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
                    <DialogTitle>USERS</DialogTitle>
                </DialogHeader>

                <DialogDescription className="flex flex-col">Start a new chat <span className="tracking-tight font-serif italic text-gray-500 text-[12px]"> Select multiple accounts to create a group</span></DialogDescription>
                {renderedImage && (
                    <div className='w-16 h-16 relative mx-auto'>
                        <Image src={renderedImage} fill alt='user image' className='rounded-full object-cover' />
                    </div>
                )}
                <input
                    type='file'
                    accept='image/*'
                    ref={imgRef}
                    hidden
                    onChange={(e) => setSelectedImage(e.target.files![0])}
                />
                {selectedUsers.length > 1 && (
                    <>
                        <Input
                            placeholder='Group Name'
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <Button className='flex gap-2' onClick={() => imgRef.current?.click()}>
                            <ImageIcon size={20} />
                            Group Image
                        </Button>
                    </>
                )}
                <div className='flex flex-col gap-3 overflow-auto max-h-60'>
                    {users?.map((user) => (
                        <div
                            key={user._id}
                            className={`flex gap-3 items-center p-2 rounded cursor-pointer active:scale-95 
                                transition-all ease-in-out duration-300
                            ${selectedUsers.includes(user._id) ? "bg-accent rounded-sm" : ""}`}
                            onClick={() => {
                                if (selectedUsers.includes(user._id)) {
                                    setSelectedUsers(selectedUsers.filter((id) => id !== user._id));
                                } else {
                                    setSelectedUsers([...selectedUsers, user._id]);
                                }
                            }}
                        >
                            <Avatar className='overflow-visible'>
                                
                                <AvatarImage src={user.image} className='rounded-full object-cover' />
                                <AvatarFallback>
                                    <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
                                </AvatarFallback>
                            </Avatar>

                            <div className='w-full '>
                                <div className='flex items-center justify-between'>
                                    <p className='text-md font-medium'>{user.name || user.email.split("@")[0]}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex justify-between'>
                    <DialogClose asChild>
                        <Button variant={"outline"}>Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleCreateConversation}
                        disabled={selectedUsers.length === 0 || (selectedUsers.length > 1 && !groupName) || isLoading}
                    >
                        {isLoading ? (
                            <div className='w-5 h-5 border-t-2 border-b-2  rounded-full animate-spin' />
                        ) : (
                            "Create"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserListDialog;
