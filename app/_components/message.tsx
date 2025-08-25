import { MessageSeenSvg } from "@/lib/svgs";
import { IMessage, useConversationStore } from "@/store/chat-store";
import { useState } from "react";
import Image from "next/image";
import DateIndicator from "./date-indicator";
import ChatBubbleAvatar from "./chat-buble-avatar";
import ChatAvatarActions from "./Chat-avatar-action";
import { ImageDialog } from "./ImageDialog";
import VideoDialog from "./VideoDialog";

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

  const bgClass = fromMe
    ? "bg-[#00715c] text-white"
    : !fromAI
      ? "bg-slate-200 dark:bg-zinc-700"
      : "bg-blue-500 text-white";

  const [openImage, setOpenImage] = useState(false);
  const [openVideo, setOpenVideo] = useState(false);

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
        {!fromMe && (
          <ChatBubbleAvatar
            isGroup={isGroup}
            isMember={isMember}
            message={message}
            fromAI={fromAI}
          />
        )}

        <div
          className={`flex flex-col z-20 max-w-fit ${message.messageType === "text" ? "px-2 pt-1" : ""} rounded-md shadow-md relative ${bgClass}`}
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
          {message.messageType !== "video" && (
            <MessageTime time={time} fromMe={fromMe} />
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
}) => (
  <div
    className="relative w-[250px] h-[300px] rounded-lg overflow-hidden bg-zinc-950 cursor-pointer shadow-sm border"
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
    {/* time + ticks overlay */}
    <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white bg-black/40 px-1 rounded">
      <span>{time}</span>
      {fromMe && <MessageSeenSvg />}
    </div>
  </div>
);

// WhatsApp-style image bubble
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
}) => (
  <div
    className="sm:w-[220px] sm:h-[270px] w-[140px] h-[220px] overflow-hidden rounded-lg bg-gray-50 cursor-pointer shadow-sm border border-gray-200"
    onClick={handleClick}
  >
    <Image
      src={message.content}
      fill
      className="object-cover rounded-sm"
      alt="image"
      sizes="220px"
    />
     <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white bg-black/40 px-1 rounded">
      <span>{time}</span>
      {fromMe && <MessageSeenSvg />}
    </div>
  </div>
);

/** ---------- META ---------- **/
const MessageTime = ({ time, fromMe }: { time: string; fromMe: boolean }) => {
  return (
    <p className="text-[10px] mr-1 my-1 dark:text-gray-300 self-end flex gap-1 items-center">
      {time} {fromMe && <MessageSeenSvg />}
    </p>
  );
};

const TextMessage = ({ message }: { message: IMessage }) => {
  const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(message.content);
  return (
    <div>
      {isLink ? (
        <a
          href={message.content}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-2 text-sm font-light text-blue-400 underline"
        >
          {message.content}
        </a>
      ) : (
        <p className="mr-2 text-sm font-light">{message.content}</p>
      )}
    </div>
  );
};
