import { MessageSeenSvg, MessageSentSvg } from "@/lib/svgs";
import { IMessage, useConversationStore } from "@/store/chat-store";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import DateIndicator from "./date-indicator";

import ChatAvatarActions from "./Chat-avatar-action";
import { ImageDialog } from "./ImageDialog";
import VideoDialog from "./VideoDialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ChatBubbleAvatar from "./chat-buble-avatar";

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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const draggingRef = useRef(false);

  // Long-press handling for mobile
  const touchTimerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const lastTouchX = useRef<number | null>(null);

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
        return <TextMessage message={message} replyTo={message.replyTo} replyToIsMine={message.replyTo?.sender?._id === me._id} />;
      case "image":
        return (
          <ImageMessage
            message={message}
            time={time}
            fromMe={fromMe}
            replyTo={message.replyTo}
            replyToIsMine={message.replyTo?.sender?._id === me._id}
            handleClick={() => setOpenImage(true)}
          />
        );
      case "video":
        return (
          <VideoMessage
            message={message}
            time={time}
            fromMe={fromMe}
            replyTo={message.replyTo}
            replyToIsMine={message.replyTo?.sender?._id === me._id}
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
        className={`flex gap-1 w-full ${fromMe ? "justify-end" : "justify-start"}`}
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

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          /* removed pr-10 padding so design isn't changed; actions are absolutely positioned */
          className={`flex flex-col z-20 max-w-[80%] sm:max-w-[66%] ${message.messageType === "text" ? "px-2 pt-1" : ""} rounded-md shadow-md relative ${bgClass} break-words overflow-hidden`}
          style={{ transform: `translateX(${translateX}px)`, transition: draggingRef.current ? "none" : "transform 120ms ease-out" }}
          onMouseEnter={() => setShowTrigger(true)}
          onMouseLeave={() => setShowTrigger(false)}
          onTouchStart={(e) => {
            // start long-press timer
            if (touchTimerRef.current) window.clearTimeout(touchTimerRef.current);
            touchStartX.current = e.touches?.[0]?.clientX ?? null;
            lastTouchX.current = touchStartX.current;
            draggingRef.current = false;
            touchTimerRef.current = window.setTimeout(() => {
              setActionsOpen(true);
            }, 500); // 500ms long-press
          }}
          onTouchMove={(e) => {
            const x = e.touches?.[0]?.clientX ?? null;
            if (x === null || touchStartX.current === null) return;
            const dx = x - touchStartX.current;
            // If user moves finger more than 6px, cancel long-press
            if (Math.abs(dx) > 6 && touchTimerRef.current) {
              window.clearTimeout(touchTimerRef.current);
              touchTimerRef.current = null;
            }
            // For own messages require left-swipe to reply; otherwise require right-swipe
            const shouldHandleRight = !fromMe;
            if ((shouldHandleRight && dx > 0) || (!shouldHandleRight && dx < 0)) {
              draggingRef.current = true;
              // cap at 120px for visual (use absolute value for left-swipe)
              const capped = Math.min(Math.abs(dx), 120);
              setTranslateX(shouldHandleRight ? capped : -capped);
            }
            lastTouchX.current = x;
          }}
          onTouchEnd={(e) => {
            if (touchTimerRef.current) {
              window.clearTimeout(touchTimerRef.current);
              touchTimerRef.current = null;
            }
            const endX = lastTouchX.current ?? e.changedTouches?.[0]?.clientX ?? null;
            if (touchStartX.current !== null && endX !== null) {
              const dx = endX - touchStartX.current;
              const shouldHandleRight = !fromMe;
              if ((shouldHandleRight && dx > 80) || (!shouldHandleRight && dx < -80)) {
                // swipe -> set reply (direction depends on sender)
                const { setReplyToMessage } = useConversationStore.getState();
                setReplyToMessage({ id: (message as any)._id as any, content: message.content, messageType: message.messageType });
              }
            }
            // reset visual translate with a small delay for UX
            setTimeout(() => setTranslateX(0), 150);
            draggingRef.current = false;
            touchStartX.current = null;
            lastTouchX.current = null;
          }}
          onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            setActionsOpen(true);
          }}
        >
          {/* absolute container so opening doesn't change layout/width of bubble content
              pass compact flag so ChatAvatarActions doesn't render the sender/name fragment (avoids reflow) */}
          <div className="absolute top-1  z-30">
            <ChatAvatarActions
              message={message}
              me={me}
              open={actionsOpen}
              onOpenChange={setActionsOpen}
              showTrigger={showTrigger}
              compact
            />
          </div>
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
        </motion.div>
      </div>
    </>
  );
};
export default Message;

/** ---------- BUBBLES ---------- **/

// Video bubble with overlay time + ticks (bottom-right)
// (ReplyPreview moved above bubbles)
const VideoMessage = ({
  message,
  time,
  fromMe,
  replyTo,
  replyToIsMine,
  handleClick,
}: {
  message: IMessage;
  time: string;
  fromMe: boolean;
  replyTo?: any;
  replyToIsMine?: boolean;
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
    <div className="w-full">
      <ReplyPreview replyTo={replyTo} isMine={!!replyToIsMine} />
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
    </div>
  );
};

// WhatsApp-style image bubble with smart preview sizing/cropping
const ImageMessage = ({
  time,
  fromMe,
  message,
  replyTo,
  replyToIsMine,
  handleClick,
}: {
  message: IMessage;
  time: string;
  fromMe: boolean;
  replyTo?: any;
  replyToIsMine?: boolean;
  handleClick: () => void;
}) => {
  return (
    <div className="w-full">
      <ReplyPreview replyTo={replyTo} isMine={!!replyToIsMine} />

      <div
        className="relative max-w-[280px] max-h-[320px] sm:w-[240px] sm:h-[280px] w-[180px] h-[240px] flex items-center justify-center overflow-hidden rounded-sm dark:bg-neutral-800 bg-slate-100 cursor-pointer shadow-sm border dark:border-neutral-700"
        onClick={handleClick}
      >
        <Image
          src={message.content}
          fill
          className="object-cover rounded-sm"
          alt="image"
          sizes="(max-width: 640px) 180px, 240px"
        />

        {/* overlay time + ticks */}
        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] text-white bg-black/40 px-1 rounded">
          <span>{time}</span>
          {fromMe && <Ticks message={message} />}
        </div>
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

const TextMessage = ({ message, replyTo, replyToIsMine }: { message: IMessage; replyTo?: any; replyToIsMine?: boolean }) => {
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
    <div className="w-full">
  <ReplyPreview replyTo={replyTo} isMine={!!replyToIsMine} />
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

// Reusable reply preview component used by text/image/video bubbles
// Helper: try to capture a poster frame from a video URL (best-effort)
const attemptCapturePoster = (videoUrl: string, setPoster: (s: string | null) => void) => {
  if (!videoUrl) return;
  try {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    const cleanup = () => {
      try { v.pause(); v.src = ""; } catch (_) {}
    };
    const onLoaded = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth || 160;
        canvas.height = v.videoHeight || 90;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL("image/png");
          setPoster(data);
        }
      } catch (_) {
        // ignore
      } finally {
        cleanup();
      }
    };
    v.onloadeddata = onLoaded;
    v.onerror = cleanup;
    v.src = videoUrl;
    // try to load
    void v.play?.().catch(() => {});
    // fallback timeout
    setTimeout(() => {
      cleanup();
    }, 2500);
  } catch (e) {
    // ignore
  }
};

// Reusable reply preview component used by text/image/video bubbles
const ReplyPreview = ({ replyTo, isMine }: { replyTo?: any; isMine?: boolean }) => {
  // compute safe values before hooks (so hooks order is stable)
  const rawContent = typeof (replyTo as any)?.content === "string" ? (replyTo as any).content : "";
  const explicitType = (replyTo as any)?.messageType;

  // hooks must be called unconditionally
  const [detectedType, setDetectedType] = useState<string | null>(explicitType || null);
  const [poster, setPoster] = useState<string | null>(null);

  // Always declare hooks first, then bail out inside effects / render if there's no replyTo.
  useEffect(() => {

    if (!rawContent) {
      setDetectedType("text");
      return;
    }

    let cancelled = false;

    const inferTypeFromUrl = (url: string) => {
      if (!url) return null;
      const lower = url.split("?")[0].toLowerCase();
      if (lower.match(/\.(jpe?g|png|gif|webp|avif|bmp)$/)) return "image";
      if (lower.match(/\.(mp4|mov|webm|mkv|flv|avi|ogg)$/)) return "video";
      return null;
    };

    const runDetection = async () => {
      const byUrl = inferTypeFromUrl(rawContent);
      if (byUrl) {
        if (cancelled) return;
        setDetectedType(byUrl);
        if (byUrl === "video") attemptCapturePoster(rawContent, setPoster);
        return;
      }

      try {
        const res = await fetch(rawContent, { method: "HEAD" });
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (cancelled) return;
        if (ct.startsWith("image/")) {
          setDetectedType("image");
        } else if (ct.startsWith("video/")) {
          setDetectedType("video");
          attemptCapturePoster(rawContent, setPoster);
        } else {
          setDetectedType("text");
        }
        return;
      } catch (err) {
        // fallback: try loading as image then video
        if (cancelled) return;
        const img = new window.Image();
        img.onload = () => {
          if (cancelled) return;
          setDetectedType("image");
        };
        img.onerror = () => {
          if (cancelled) return;
          // try video by attempting to load metadata
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => {
            if (cancelled) return;
            setDetectedType("video");
            attemptCapturePoster(rawContent, setPoster);
          };
          v.onerror = () => {
            if (cancelled) return;
            setDetectedType("text");
          };
          try {
            v.src = rawContent;
          } catch (_) {
            if (!cancelled) setDetectedType("text");
          }
        };
        try {
          img.src = rawContent;
        } catch (_) {
          if (!cancelled) setDetectedType("text");
        }
      }
    };

    runDetection();
    return () => { cancelled = true; };
  }, [rawContent, explicitType, replyTo]);

  // If there's no replyTo, render nothing — hooks/effects already ran above so rules are satisfied
  if (!replyTo) return null;

  const leftBorderColor = isMine ? "border-emerald-400" : "border-sky-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14 }}
      className={`border-l-[3px] pl-3 pr-3 py-2 mb-2 bg-white/60 dark:bg-zinc-800/30 text-gray-800 dark:text-gray-200 w-full max-w-full rounded-e-sm rounded shadow-sm ${leftBorderColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {(detectedType === "image" && rawContent) && (
            <motion.div whileHover={{ scale: 1.03 }} className="w-16 h-16 rounded-lg overflow-hidden shadow-md ring-1 ring-black/5 flex-shrink-0">
              <Image src={rawContent} alt="thumb" width={64} height={64} className="object-cover w-full h-full" />
            </motion.div>
          )}

          {(detectedType === "video" && rawContent) && (
            <motion.div whileHover={{ scale: 1.03 }} className="w-16 h-16 rounded-lg overflow-hidden shadow-md ring-1 ring-black/5 relative flex-shrink-0 bg-black/5">
              {poster ? (
                <Image src={poster} alt="poster" width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <video src={rawContent} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </motion.div>
          )}

          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{isMine ? 'You' : (replyTo.sender?.name || 'Unknown')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
              {detectedType === 'image' ? 'Photo' : detectedType === 'video' ? 'Video' : (rawContent || '')}
            </div>
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          {detectedType === 'image' && <span className="px-2 py-1 bg-white/30 dark:bg-black/20 rounded">Image</span>}
          {detectedType === 'video' && <span className="px-2 py-1 bg-white/30 dark:bg-black/20 rounded">Video</span>}
        </div>
      </div>
    </motion.div>
  );
};