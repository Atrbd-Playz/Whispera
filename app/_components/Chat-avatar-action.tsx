"use client";

import { IMessage, useConversationStore } from "@/store/chat-store";
import { useMutation } from "convex/react";
import { Ban, LogOut, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ChatAvatarActionsProps = {
  message: IMessage;
  me: any;
};

const ChatAvatarActions = ({ me, message }: ChatAvatarActionsProps) => {
  const { selectedConversation, setSelectedConversation } = useConversationStore();

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

  const [open, setOpen] = useState(false);
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
      {/* ✅ Only render sender name in group chats if it's NOT me */}
      {isGroup && !fromMe && (
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

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img
                src={senderImage || "/placeholder.png"}
                alt={senderName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span>{senderName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-sm text-muted-foreground">
            {fromAI ? "This is an AI assistant." : `User ID: ${senderId}`}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {/* Everyone sees Message */}
            {!fromAI && (
              <Button
                onClick={handleCreateConversation}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <MessageSquare size={16} />
                Message
              </Button>
            )}

            {/* Only admin sees Kick */}
            {isAdmin && isGroup && senderId !== selectedConversation?.admin && (
              <Button
                variant="destructive"
                onClick={handleKickUser}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Kick from Group
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatAvatarActions;
