"use client";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useRef, useState } from "react";
import { MessageSeenSvg, MessageSentSvg } from "@/lib/svgs";
import { ImageIcon, Users, VideoIcon, MoreVertical, Trash2, Pencil } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IMessage, useConversationStore } from "@/store/chat-store";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const Conversation = ({ conversation }: { conversation: any }) => {
  const conversationImage = conversation.groupImage || conversation.image;
  const conversationName = conversation.groupName || conversation.name;
  const lastMessage = conversation.lastMessage;
  const lastMessageType = lastMessage?.messageType;
  const me = useQuery(api.users.getMe);
  const sender = useQuery(
    api.users.getUserById,
    lastMessage?.sender ? { id: lastMessage.sender } : "skip"
  );

  const { setSelectedConversation, selectedConversation } =
    useConversationStore();

  const deleteConversation = useMutation(api.conversations.deleteConversation);
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const updateGroup = useMutation(api.conversation.updateGroup);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [groupName, setGroupName] = useState(conversation.groupName || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [renderedImage, setRenderedImage] = useState<string>("");
  const imgRef = useRef<HTMLInputElement>(null);

  const openConfirm = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteConversation({ conversationId: conversation._id });
      if (selectedConversation?._id === conversation._id) {
        setSelectedConversation(null);
      }
      setConfirmOpen(false);
    } catch (err) {
      console.error(err);
      alert((err as Error)?.message || "Failed to delete chat");
    }
  };

  const isActive = selectedConversation?._id === conversation._id;
  const isFromMeLast = lastMessage?.sender === me?._id;
  const hasSeen =
    Array.isArray(lastMessage?.seenBy) && me?._id
      ? lastMessage.seenBy.includes(me._id)
      : false;
  const isUnread = !!lastMessage && !isFromMeLast && !hasSeen;
  const shouldNotify = isUnread && !isActive;

  const prevMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedImage) return setRenderedImage("");
    const reader = new FileReader();
    reader.onload = (e) => setRenderedImage(e.target?.result as string);
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  const playNotification = () => {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      o.start(now);
      o.stop(now + 0.24);
    } catch {}
  };

  useEffect(() => {
    if (!lastMessage?._id) return;
    if (prevMsgIdRef.current === null) {
      prevMsgIdRef.current = lastMessage._id;
      return;
    }
    if (lastMessage._id !== prevMsgIdRef.current) {
      if (shouldNotify) {
        playNotification();
      }
      prevMsgIdRef.current = lastMessage._id;
    }
  }, [lastMessage?._id, shouldNotify]);

  return (
    <>
      <div
        className={`group flex gap-3 w-full items-center px-4 py-3 cursor-pointer transition-colors relative
        ${
          isActive
            ? "bg-gray-200 dark:bg-neutral-900 rounded-sm"
            : isUnread
            ? "bg-green-50 dark:bg-green-900/20 rounded-sm"
            : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
        style={{ minHeight: 72 }}
        onContextMenu={(e) => {
          e.preventDefault();
          openConfirm();
        }}
        onTouchStart={(e) => {
          // long-press for touch devices
          const target = e.currentTarget;
          const timer = setTimeout(() => openConfirm(e), 650);
          const cancel = () => clearTimeout(timer);
          target.addEventListener("touchend", cancel, { once: true });
          target.addEventListener("touchmove", cancel, { once: true });
          target.addEventListener("touchcancel", cancel, { once: true });
        }}
      >
        <Avatar className="overflow-visible relative w-12 h-12 shrink-0">
          <AvatarImage
            src={conversationImage || "/placeholder.png"}
            className="object-cover rounded-full"
            alt="User Profile"
          />
          <AvatarFallback>
            <div className="animate-pulse bg-gray-300 w-full h-full rounded-full"></div>
          </AvatarFallback>
        </Avatar>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <h3
              className={`text-base truncate ${
                isUnread ? "font-extrabold" : "font-semibold"
              }`}
            >
              {conversationName}
            </h3>
            <span className="text-xs text-gray-500 ml-auto flex items-center gap-2">
              {formatDate(lastMessage?._creationTime || conversation._creationTime)}
              {isUnread && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[13px] dark:text-gray-200 truncate">
            {lastMessage?.sender === me?._id &&
              ((lastMessage?.seenBy?.length ?? 0) > 0 ? (
                <MessageSeenSvg className="text-cyan-600 bg-opacity-70" />
              ) : (lastMessage?.deliveredTo?.length ?? 0) > 0 ? (
                <MessageSeenSvg className="text-gray-400" />
              ) : (
                <MessageSentSvg className="text-gray-400" />
              ))}

            {conversation.isGroup && (
              <Users size={15} className="text-gray-400 shrink-0" />
            )}
            {conversation.isGroup &&
              lastMessage?.sender !== me?._id &&
              sender !== undefined && (
                <span className="opacity-50 italic text-[14px]">
                  {(sender && (sender as any)?.name
                    ? (sender as any).name.split(" ")[0]
                    : "Deleted") + ":"}
                </span>
              )}

            {!lastMessage && (
              <span className="italic text-gray-400">--Say Hi!</span>
            )}
            {lastMessageType === "text" && (
              <span className={`truncate ${isUnread ? "font-medium" : ""}`}>
                {lastMessage?.content.length > 30
                  ? `${lastMessage?.content.slice(0, 30)}...`
                  : lastMessage?.content}
              </span>
            )}
            {lastMessageType === "image" && (
              <div className="flex items-center gap-1">
                <ImageIcon
                  size={15}
                  className="dark:text-gray-400 text-gray-600"
                />
                <span className="italic text-gray-400">Photo</span>
              </div>
            )}
            {lastMessageType === "video" && (
              <div className="flex items-center gap-1">
                <VideoIcon
                  size={15}
                  className="dark:text-gray-400 text-gray-600"
                />
                <span className="italic text-gray-400">Video</span>
              </div>
            )}
          </div>
        </div>

        {/* 3-dot menu (desktop only) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm hover:bg-accent opacity-0 group-hover:opacity-60 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation.isGroup && me?._id === conversation.admin && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGroupName(conversation.groupName || "");
                    setRenderedImage("");
                    setSelectedImage(null);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Edit group
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600" onClick={openConfirm}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit group dialog */}
      {conversation.isGroup && me?._id === conversation.admin && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Edit group</DialogTitle>
              <DialogDescription>Update the group name and picture.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-20 h-20">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={renderedImage || conversationImage || "/placeholder.png"} className="object-cover" />
                  <AvatarFallback>
                    <div className="animate-pulse bg-gray-300 w-full h-full rounded-full"></div>
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-0 right-0 bg-accent p-1 rounded-full border"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                  e.stopPropagation();
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

                    const updated = await updateGroup({ id: conversation._id, groupName, groupImage: storageId as any });

                    // update selected conversation in store if it's the same one
                    if (selectedConversation && selectedConversation._id === conversation._id) {
                      setSelectedConversation({
                        ...selectedConversation,
                        groupName: updated?.groupName,
                        groupImage: updated?.groupImage,
                      } as any);
                    }

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
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>
              This will permanently remove all messages in this conversation.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <hr className="h-[1px] mx-16 border-none bg-gray-200 dark:bg-zinc-700" />
    </>
  );
};

export default Conversation;
