"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImageIcon,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "convex/react";
import { useConversationStore } from "@/store/chat-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { api } from "@/convex/_generated/api";

/* -------------------- MediaDropdown -------------------- */
const MediaDropdown = () => {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Paste handler: capture image/video from clipboard and open preview
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (!file) continue;
          if (file.type.startsWith("image/")) {
            setSelectedImage(file);
            e.preventDefault();
            break;
          }
          if (file.type.startsWith("video/")) {
            setSelectedVideo(file);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste as any);
    return () => window.removeEventListener("paste", onPaste as any);
  }, []);

  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const sendImage = useMutation(api.messages.sendImage);
  const sendVideo = useMutation(api.messages.sendVideo);
  const me = useQuery(api.users.getMe);

  const { selectedConversation } = useConversationStore();

  const Plus = (props: React.SVGProps<SVGSVGElement>) => (
    <div className="mb-[6px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
        />
      </svg>
    </div>
  );

  const handleSendImage = async () => {
    setIsLoading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage!.type },
        body: selectedImage,
      });

      const { storageId } = await result.json();
      await sendImage({
        conversation: selectedConversation!._id,
        imgId: storageId,
        sender: me!._id,
      });

      setSelectedImage(null);
    } catch (err) {
      toast.error("Failed to send image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVideo = async () => {
    setIsLoading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedVideo!.type },
        body: selectedVideo,
      });

      const { storageId } = await result.json();
      await sendVideo({
        videoId: storageId,
        conversation: selectedConversation!._id,
        sender: me!._id,
      });

      setSelectedVideo(null);
    } catch (error) {
      toast.error("Failed to send video");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Hidden inputs */}
      <input
        type="file"
        ref={imageInput}
        accept="image/*"
        onChange={(e) => setSelectedImage(e.target.files![0])}
        hidden
      />
      <input
        type="file"
        ref={videoInput}
        accept="video/*"
        onChange={(e) => setSelectedVideo(e.target?.files![0])}
        hidden
      />

      {/* Image Dialog */}
      {selectedImage && (
        <MediaImageDialog
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          selectedImage={selectedImage}
          isLoading={isLoading}
          handleSendImage={handleSendImage}
        />
      )}

      {/* Video Dialog */}
      {selectedVideo && (
        <MediaVideoDialog
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          selectedVideo={selectedVideo}
          isLoading={isLoading}
          handleSendVideo={handleSendVideo}
        />
      )}

      {/* Upload Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Plus className="text-gray-600 dark:text-gray-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => imageInput.current!.click()}>
            <ImageIcon size={18} className="mr-1" /> Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInput.current!.click()}>
            <Video size={20} className="mr-1" />
            Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
export default MediaDropdown;

/* -------------------- Image Dialog -------------------- */
type MediaImageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: File;
  isLoading: boolean;
  handleSendImage: () => void;
};

const MediaImageDialog = ({
  isOpen,
  onClose,
  selectedImage,
  isLoading,
  handleSendImage,
}: MediaImageDialogProps) => {
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const reader = new FileReader();
    reader.onload = (e) => setRenderedImage(e.target?.result as string);
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-y-auto sm:overflow-hidden">
        <DialogHeader className="p-4">
          <DialogTitle>Preview Image</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center bg-black">
          {renderedImage && (
            <Image
              src={renderedImage}
              width={800}
              height={600}
              alt="selected image"
              className="max-h-[70vh] w-auto object-contain rounded-lg"
            />
          )}
        </div>
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={handleSendImage}>
            {isLoading ? "Uploading..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------- Video Dialog -------------------- */
type MediaVideoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: File | null;
  isLoading: boolean;
  handleSendVideo: () => void;
};

const MediaVideoDialog = ({
  isOpen,
  onClose,
  selectedVideo,
  isLoading,
  handleSendVideo,
}: MediaVideoDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate blob preview URL whenever file changes
  useEffect(() => {
    if (!selectedVideo) return;
    const url = URL.createObjectURL(selectedVideo);
    setPreviewUrl(url);
    setIsReady(false);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedVideo]);

  // Progress sync
  useEffect(() => {
    let frame: number;
    const update = () => {
      if (videoRef.current && duration > 0) {
        setProgress((videoRef.current.currentTime / duration) * 100);
      }
      frame = requestAnimationFrame(update);
    };
    if (isPlaying) {
      frame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (val: number[]) => {
    if (!videoRef.current) return;
    const time = (val[0] / 100) * duration;
    if (!isNaN(time)) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolume = (val: number[]) => {
    if (!videoRef.current) return;
    const vol = val[0];
    videoRef.current.volume = vol;
    setVolume(vol);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setIsReady(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4">
          <DialogTitle>Preview Video</DialogTitle>
        </DialogHeader>

        <div className="relative bg-black flex flex-col items-center justify-center">
          {!isReady && previewUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Loading video...
            </div>
          )}

          {previewUrl && (
            <video
              key={previewUrl}
              ref={videoRef}
              src={previewUrl}
              className="max-h-[70vh] w-full bg-black"
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
          )}

          {isReady && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3 flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>

              {/* Seekbar */}
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="flex-1"
              />

              {/* Volume */}
              <div className="flex items-center gap-2 w-32">
                <button
                  onClick={() => handleVolume([volume > 0 ? 0 : 1])}
                  className="text-white hover:text-gray-300 transition"
                >
                  {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolume}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              {/* Fullscreen (optional) */}
              <button className="text-white hover:text-gray-300 transition">
                <Maximize size={20} />
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isLoading || !previewUrl} onClick={handleSendVideo}>
            {isLoading ? "Uploading..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
