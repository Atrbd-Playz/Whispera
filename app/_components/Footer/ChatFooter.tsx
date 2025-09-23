"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import toast from "react-hot-toast";
import useComponentVisible from "@/hooks/useComponentVisible";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import MediaDropdown from "./utils/media-dropdown";
import TextareaAutoSize from "react-textarea-autosize";
import { Smile, SendHorizonal, Mic, X } from "lucide-react";

const ChatFooter = () => {
  const [msgText, setMsgText] = useState("");
  const { selectedConversation } = useConversationStore();
  const { replyToMessage, setReplyToMessage } = useConversationStore();
  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

  const me = useQuery(api.users.getMe);
  const sendTextMsg = useMutation(api.messages.sendTextMessage);

  const [isSending, setIsSending] = useState(false);
  const handleSendTextMsg = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (msgText.trim() === "") return;
    if (isSending) return;

    try {
      setIsSending(true);
      await sendTextMsg({
        content: msgText.trim(),
        conversation: selectedConversation!._id,
        sender: me!._id,
        replyTo: replyToMessage?.id as any,
      });
      // clear reply state
      if (replyToMessage) setReplyToMessage(null);
      setMsgText("");
    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    } finally {
      setTimeout(() => setIsSending(false), 250);
    }
  };

  return (
    <div className="w-full sticky bottom-0 z-20 shadow-md bg-background pt-1 rounded-md">
      <div className="flex justify-between bg-gray-50 dark:bg-accent rounded-md items-center gap-2 px-2">
        {/* Emoji Picker */}
        <div ref={ref} className="relative flex-shrink-0">
          {isComponentVisible && (
            <EmojiPicker
              skinTonesDisabled
              autoFocusSearch={false}
              theme={Theme.DARK}
              onEmojiClick={(emojiObject) =>
                setMsgText((prev) => prev + emojiObject.emoji)
              }
              style={{
                position: "absolute",
                bottom: "2.5rem",
                left: "0",
                zIndex: 50,
              }}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => setIsComponentVisible(!isComponentVisible)}
          >
            <Smile className="w-6 h-6" />
          </Button>
        </div>

        {/* Input + Media */}
        <form
          onSubmit={handleSendTextMsg}
          className="flex flex-col gap-2 w-full pb-2"
        >
          {/* Reply preview bubble */}
          {replyToMessage && (
            <div className="w-full flex items-center justify-between gap-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-3 py-2">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-6 rounded bg-primary/80 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Replying to</span>
                  <span className="text-sm truncate max-w-[520px]">{replyToMessage.content}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 w-full">
          <TextareaAutoSize
            rows={1}
            maxRows={5}
            placeholder="Type a message"
            className="flex-grow px-0 py-2 text-sm rounded-[2px] dark:bg-zinc-800 border-b-[1px] rounded-t-md border-primary-foreground font-normal focus:outline-none focus:border-primary resize-none max-h-28"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            onKeyDown={(e) => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
              );

              if (!isMobile) {
                if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                  e.preventDefault();
                  if (!isSending) handleSendTextMsg();
                }
                if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
                  return;
                }
              }
            }}
          />

          <MediaDropdown />

          {/* Send / Mic button */}
          <Button
            type="submit"
            size="icon"
            disabled={isSending}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-primary/70 text-gray-100 hover:bg-primary/60 transition-transform duration-200 disabled:opacity-60"
          >
            {msgText.length > 0 ? (
              <SendHorizonal className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatFooter;
