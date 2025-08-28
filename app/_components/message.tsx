import { MessageSeenSvg, MessageSentSvg } from "@/lib/svgs";
import { IMessage, useConversationStore } from "@/store/chat-store";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DateIndicator from "./date-indicator";
import ChatBubbleAvatar from "./chat-buble-avatar";
import ChatAvatarActions from "./Chat-avatar-action";
import { ImageDialog } from "./ImageDialog";
import VideoDialog from "./VideoDialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type ChatBubbleProps = {
  message: IMessage;
  me: any;
  previousMessage?: IMessage;
  lastByUser?: boolean;
};

const Message = ({ me, message, previousMessage }: ChatBubbleProps) => {
  const date = new Date(message._creationTime);
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  const time = `${hour}:${minute}`;

  const { selectedConversation } = useConversationStore();
  const isMember =
    selectedConversation?.participants.includes(message.sender?._id) || false;
  const isGroup = selectedConversation?.isGroup;
  const fromMe = message.sender?._id === me._id;
  const fromAI = message.sender?.name === "ChatGPT";
  const deliveredCount = message.deliveredTo?.length ?? 0;
  const seenCount = message.seenBy?.length ?? 0;
  const isDelivered = fromMe && deliveredCount > 0;
  const isSeen = fromMe && seenCount > 0;

  const bgClass = fromMe
    ? "bg-[#00715c] text-white"
    : !fromAI
      ? "bg-slate-200 dark:bg-zinc-700"
      : "bg-blue-500 text-white";

  const [openImage, setOpenImage] = useState(false);
  const [openVideo, setOpenVideo] = useState(false);

  // Convex mutation to mark messages as delivered for the selected conversation
  const markDelivered = useMutation(api.messages.markDeliveredForConversation);

  // Ask notification permission once per component lifecycle
  const notificationAskedRef = useRef(false);
  const lastNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default" && !notificationAskedRef.current) {
      Notification.requestPermission()
        .finally(() => {
          notificationAskedRef.current = true;
        });
    }
  }, []);

  // When the user has the app open but not active (tab hidden or window unfocused),
  // mark messages in the open conversation as delivered (WhatsApp-like behavior).
  useEffect(() => {
    if (!selectedConversation?._id) return;

    const tryMarkDelivered = () => {
      if (typeof document === "undefined") return;
      const inactive = document.hidden || !document.hasFocus();
      if (inactive) {
        // idempotent server-side; safe to call multiple times
        markDelivered({ conversation: selectedConversation._id });
      }
    };

    // initial check (e.g., if user opens app while minimized or backgrounded)
    tryMarkDelivered();

    const onVisibility = () => tryMarkDelivered();
    const onBlur = () => tryMarkDelivered();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [selectedConversation?._id, markDelivered]);

  // Notify and ensure delivery marking for new incoming messages while inactive
  useEffect(() => {
    if (!selectedConversation?._id) return;
    if (fromMe) return; // only notify on incoming messages
    if (typeof document === "undefined") return;

    const inactive = document.hidden || !document.hasFocus();
    if (!inactive) return;

    // ensure delivered state for the conversation
    markDelivered({ conversation: selectedConversation._id });

    // System notification (if permitted) for recent messages
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const isRecent = Date.now() - new Date(message._creationTime).getTime() < 2 * 60 * 1000; // 2 minutes
    if (!isRecent) return;
    if (lastNotifiedRef.current === (message as any)._id) return;
    lastNotifiedRef.current = (message as any)._id as string;

    const body =
      message.messageType === "text"
        ? message.content
        : message.messageType === "image"
          ? "Photo"
          : "Video";

    try {
      const n = new Notification(message.sender?.name || "New message", {
        body,
        icon: (message as any).sender?.image || "/favicon.ico",
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (_) {
      // Ignore notification errors
    }
  }, [message._creationTime, (message as any)._id, fromMe, selectedConversation?._id, markDelivered]);

  const renderMessageContent = () => {
    switch (message.messageType) {
      case "text":
        return <TextMessage message={message} />;
      case "image":
        return (
          <ImageMessage
            message={message}
            time={time}
            fromMe={fromMe}
            handleClick={() => setOpenImage(true)}
          />
        );
      case "video":
        return (
          <VideoMessage
            message={message}
            time={time}
            fromMe={fromMe}
            handleClick={() => setOpenVideo(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>

      <DateIndicator message={message} previousMessage={previousMessage} />


      <div
        className={`flex gap-1 w-2/3 ${fromMe ? "ml-auto justify-end" : "justify-start"
          }`}
      >
        {/* ✅ Only show avatar+name if it's a group AND not from me */}
        {isGroup && !fromMe && (
          <ChatBubbleAvatar
            isGroup={true}
            isMember={isMember}
            message={message}
            fromAI={fromAI}
          />
        )}

        <div
          className={`flex flex-col z-20 max-w-fit ${message.messageType === "text" ? "px-2 pt-1" : ""
            } rounded-md shadow-md relative ${bgClass}`}
        >
          <ChatAvatarActions message={message} me={me} />
          {renderMessageContent()}

          {/* dialogs */}
          {openImage && (
            <ImageDialog
              src={message.content}
              open={openImage}
              onClose={() => setOpenImage(false)}
            />
          )}
          {openVideo && (
            <VideoDialog
              src={message.content}
              open={openVideo}
              onClose={() => setOpenVideo(false)}
            />
          )}

          {/* For text / image messages, keep time below bubble */}
          {message.messageType === "text" && (
            <MessageTime
              time={time}
              fromMe={fromMe}
              delivered={isDelivered}
              seen={isSeen}
            />
          )}
        </div>
      </div>
    </>
  );
};
export default Message;

/** ---------- BUBBLES ---------- **/

// Video bubble with overlay time + ticks (bottom-right)
const VideoMessage = ({
  message,
  time,
  fromMe,
  handleClick,
}: {
  message: IMessage;
  time: string;
  fromMe: boolean;
  handleClick: () => void;
}) => {
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    const video = document.createElement("video");
    video.src = message.content;
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const d = video.duration;
      const min = Math.floor(d / 60).toString().padStart(2, "0");
      const sec = Math.floor(d % 60).toString().padStart(2, "0");
      setDuration(`${min}:${sec}`);
    };
  }, [message.content]);

  return (
    <div
      className="relative w-[250px] h-[300px] rounded-sm overflow-hidden bg-zinc-950 cursor-pointer shadow-sm border"
      onClick={handleClick}
    >
      <video
        src={message.content}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
      />

      {/* play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <span className="text-white text-3xl">▶</span>
      </div>

      {/* duration bottom-left */}
      {duration && (
        <div className="absolute bottom-1 left-2 text-[11px] text-white bg-black/50 px-1 rounded">
          {duration}
        </div>
      )}

      {/* time + ticks bottom-right */}
      <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] text-white bg-black/40 px-1 rounded">
        <span>{time}</span>
        {fromMe && <Ticks message={message} />}
      </div>
    </div>
  );
};

// WhatsApp-style image bubble with smart preview sizing/cropping
const ImageMessage = ({
  time,
  fromMe,
  message,
  handleClick,
}: {
  message: IMessage;
  time: string;
  fromMe: boolean;
  handleClick: () => void;
}) => {
  return (
    <div
      className="relative max-w-[280px] max-h-[320px] sm:w-[240px] sm:h-[280px] w-[180px] h-[240px] flex items-center justify-center overflow-hidden rounded-sm dark:bg-neutral-800 bg-slate-100 cursor-pointer shadow-sm border dark:border-neutral-700"
      onClick={handleClick}
    >
      <Image
        src={message.content}
        fill
        className="object-contain rounded-sm"
        alt="image"
        sizes="(max-width: 640px) 180px, 240px"
      />

      {/* overlay time + ticks */}
      <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] text-white bg-black/40 px-1 rounded">
        <span>{time}</span>
        {fromMe && <Ticks message={message} />}
      </div>
    </div>
  );
};

/** ---------- META ---------- **/
const Ticks = ({ message, delivered, seen }: { message?: IMessage; delivered?: boolean; seen?: boolean }) => {
  let isDelivered = delivered;
  let isSeen = seen;
  if (message) {
    isDelivered = (message.deliveredTo?.length ?? 0) > 0;
    isSeen = (message.seenBy?.length ?? 0) > 0;
  }
  if (isSeen) return <MessageSeenSvg className="text-cyan-500" />; // blue double tick
  if (isDelivered) return <MessageSeenSvg className="text-gray-300" />; // gray double tick
  return <MessageSentSvg className="text-gray-300" />; // single tick
};

const MessageTime = ({ time, fromMe, delivered, seen }: { time: string; fromMe: boolean; delivered?: boolean; seen?: boolean }) => {
  
  return (
    
    <p className="text-[10px] mr-1 my-1 dark:text-gray-300 self-end flex gap-1 items-center">
      {time} {fromMe && <Ticks delivered={delivered} seen={seen} />}
    </p>
  );
};

const TextMessage = ({ message }: { message: IMessage }) => {
  const [expanded, setExpanded] = useState(false);

  // Regex patterns
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const phoneRegex = /(\+?\d[\d\s.-]{7,}\d)/g;
  const mentionRegex = /(@\w+)/g;
  const hashtagRegex = /(#\w+)/g;

  // Combined regex (order matters)
  const combinedRegex =
    /(https?:\/\/[^\s]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?\d[\d\s.-]{7,}\d)|(@\w+)|(#\w+)/g;

  // Decide if message is "too long"
  const isLong = message.content.length > 400; // adjust threshold as needed

  return (
    <div className="max-w-[75%]">
      <p
        className={`mr-2 text-sm font-light whitespace-pre-wrap break-words break-all ${
          !expanded && isLong ? "line-clamp-5" : ""
        }`}
      >
        {message.content.split(combinedRegex).map((part, idx) => {
          if (!part) return null;

          if (urlRegex.test(part)) {
            return (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-600 transition-colors break-all"
              >
                {part}
              </a>
            );
          } else if (emailRegex.test(part)) {
            return (
              <a
                key={idx}
                href={`mailto:${part}`}
                className="text-purple-500 underline hover:text-purple-600 transition-colors break-all"
              >
                {part}
              </a>
            );
          } else if (phoneRegex.test(part)) {
            return (
              <a
                key={idx}
                href={`tel:${part.replace(/\s|-/g, "")}`}
                className="text-green-500 underline hover:text-green-600 transition-colors break-all"
              >
                {part}
              </a>
            );
          } else if (mentionRegex.test(part)) {
            return (
              <span
                key={idx}
                className="text-sky-500 font-medium cursor-pointer hover:underline break-all"
              >
                {part}
              </span>
            );
          } else if (hashtagRegex.test(part)) {
            return (
              <span
                key={idx}
                className="text-pink-500 font-medium cursor-pointer hover:underline break-all"
              >
                {part}
              </span>
            );
          }

          return part; // plain text
        })}
      </p>

      {/* Expand/Collapse Button */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-500 hover:underline mt-1"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
};