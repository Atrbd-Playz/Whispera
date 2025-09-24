"use client";

import { IMessage, useConversationStore } from "@/store/chat-store";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ban, LogOut, MessageSquare, MoreHorizontal, CornerUpLeft } from "lucide-react";
import toast from "react-hot-toast";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ChatAvatarActionsProps = {
  message: IMessage;
  me: any;
  // Controlled open state (optional)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Whether to render the three-dot trigger (Message will control visibility via CSS)
  showTrigger?: boolean;
  // When true, render a compact actions UI (no sender/name label) to avoid layout shifts when placed absolutely
  compact?: boolean;
};

const ChatAvatarActions = ({ me, message, open: openProp, onOpenChange, showTrigger = true, compact = false }: ChatAvatarActionsProps) => {
  const { selectedConversation, setSelectedConversation, setReplyToMessage } = useConversationStore();
  const unsend = useMutation(api.messages.unsendMessage);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof openProp === "boolean" && typeof onOpenChange === "function";
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const sender = (message as any)?.sender;
  const senderId = sender?._id ?? null;
  const senderName = sender?.name || "Deleted user";
  const senderImage = sender?.image;
  const fromAI = senderName === "ChatGPT";

  const isGroup = selectedConversation?.isGroup;
  const isAdmin = selectedConversation?.admin === me?._id;
  const isMember =
    !!(selectedConversation && senderId && selectedConversation.participants.includes(senderId));

  const fromMe = senderId === me?._id; // ✅ check if message is from current user

  const kickUser = useMutation(api.conversations.kickUser);
  const createConversation = useMutation(api.conversations.createConversation);

  const [loading, setLoading] = useState(false);

  const handleKickUser = async () => {
    if (!isAdmin || fromAI || !senderId || !selectedConversation) return;
    if (senderId === selectedConversation.admin) {
      toast.error("You cannot kick the admin!");
      return;
    }

    try {
      setLoading(true);
      await kickUser({
        conversationId: selectedConversation._id,
        userId: senderId,
      });

      setSelectedConversation({
        ...selectedConversation,
        participants: selectedConversation.participants.filter((id) => id !== senderId),
      });

      toast.success(`${senderName} has been removed`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to kick user");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (fromAI || !senderId) return;

    try {
      setLoading(true);
      const conversationId = await createConversation({
        isGroup: false,
        participants: [me._id, senderId],
      });

      setSelectedConversation({
        _id: conversationId,
        name: senderName,
        participants: [me._id, senderId],
        isGroup: false,
        isOnline: sender?.isOnline,
        image: senderImage,
      });

      toast.success(`New conversation started with ${senderName}`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* DropdownMenu always rendered so it can be opened programmatically (contextmenu / long-press) */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          {/*
            Trigger is always present (for anchoring) but we control visibility:
            - hidden on small screens (mobile)
            - when `showTrigger` is true we make it interactive/visible
            - otherwise keep it invisible but present so contextmenu/open works
            Position: vertically centered, slightly outside bubble (-right-8 for incoming, -left-8 for outgoing)
          */}
          <button
            type="button"
            aria-label="Message actions"
            className={`hidden sm:flex items-center justify-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 absolute top-1/2 -translate-y-1/2 z-30 ${fromMe ? "-left-8" : "-right-8"} opacity-0 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto transition-opacity duration-150`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={6} className="w-44">
            <DropdownMenuItem
              onClick={() => {
                // pass full reply metadata so ReplyPreview can show text/image/video + sender name
                setReplyToMessage({
                  id: (message as any)._id as any,
                  content: message.content,
                  messageType: message.messageType,
                  sender: (message as any).sender || null,
                } as any);
                setOpen(false);
              }}
              className="flex items-center gap-2"
            >
              <CornerUpLeft className="w-4 h-4" />
              Reply
            </DropdownMenuItem>

            {fromMe && (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    setLoading(true);
                    await unsend({ messageId: (message as any)._id });
                    toast.success("Message unsent");
                    setOpen(false);
                  } catch (e) {
                    toast.error("Failed to unsend message");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex items-center gap-2 text-destructive"
              >
                Unsend
              </DropdownMenuItem>
            )}

          </DropdownMenuContent>
        </DropdownMenu>
      {/* ✅ Only render sender name in group chats if it's NOT me and not in compact mode */}
      {!compact && isGroup && !fromMe && (
        <div
          className="text-[11px] flex items-center gap-2 font-bold cursor-pointer group hover:text-primary transition"
          onClick={() => setOpen(true)}
        >
          {senderName}

          {!isMember && !fromAI && (
            <Ban size={16} className="text-red-500 ml-1" />
          )}
        </div>
      )}

      {/* dropdown handled above when showTrigger is true */}
    </>
  );
};

export default ChatAvatarActions;
