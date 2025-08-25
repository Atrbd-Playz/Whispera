"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  RotateCcw,
} from "lucide-react";

type Props = {
  src?: string;
  open: boolean;
  onClose: () => void;
  className?: string;
};

export default function VideoDialog({ src, open, onClose, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("16 / 9");
  const [showControls, setShowControls] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  // Swipe state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setIsReady(false);
      setDuration(0);
      setCurrentTime(0);
      setIsLoading(true);
      setIsEnded(false);
      setTranslateY(0);
    }
  }, [open, src]);

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsReady(true);
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    if (w && h) setAspectRatio(`${w} / ${h}`);
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const format = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isEnded) {
      videoRef.current.currentTime = 0;
      setIsEnded(false);
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 700);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    setMuted((m) => {
      videoRef.current!.muted = !m;
      return !m;
    });
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current || duration === 0) return;
    const newTime = (value[0] / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolume = (value: number[]) => {
    if (!videoRef.current) return;
    const v = value[0];
    videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleFullscreen = () => {
    const el = videoRef.current as any;
    if (!el) return;
    (el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen)?.call(el);
  };

  useEffect(() => {
    if (!open) return;
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 2000);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchstart", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchstart", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [open]);

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (deltaY > 0) {
      setTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
    setTouchStartY(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={`fixed inset-0 flex items-center justify-center translate-x-0 translate-y-0 bg-black/90 p-0 max-w-none transition-transform duration-300 ease-in-out ${className}`}
        style={{ transform: `translateY(${translateY}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-40 bg-black/40 text-white rounded-full"
          onClick={onClose}
        >
          <X size={22} />
        </Button>

        {/* Video */}
        <div
          className="relative w-[92%] h-[92%] mx-auto flex items-center justify-center"
          style={{ aspectRatio }}
        >
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full rounded-xl bg-black object-contain"
            preload="metadata"
            playsInline
            muted={muted}
            onLoadedMetadata={onLoadedMetadata}
            onCanPlay={() => setIsLoading(false)}
            onPlaying={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onTimeUpdate={onTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              setIsEnded(true);
            }}
            onClick={togglePlay}
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 opacity-60 border-white/20"></div>
                <div className="absolute inset-0 rounded-full border-4 dark:border-t-white border-t-slate-800 animate-spin"></div>
              </div>
            </div>
          )}

          {/* Center Play/Pause */}
          {showCenterIcon && !isLoading && !isEnded && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="p-3 rounded-full bg-black/50 backdrop-blur-md">
                {isPlaying ? (
                  <Pause size={32} className="text-white" />
                ) : (
                  <Play size={32} className="text-white" />
                )}
              </div>
            </div>
          )}

          {/* Replay Button */}
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <button
                onClick={togglePlay}
                className="p-4 rounded-full bg-black/60 hover:bg-black/80 transition"
              >
                <RotateCcw size={40} className="text-white" />
              </button>
            </div>
          )}

          {/* Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex flex-col gap-2 transition-opacity duration-500 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Seek Bar */}
            <div className="group w-full relative z-30 cursor-pointer">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                max={100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full h-[1px] transition-all duration-200"
              />
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between w-full z-30 text-white">
              {/* Left side */}
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white bg-transparent"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>

                {/* Volume */}
                <div className="hidden md:flex items-center cursor-pointer gap-2 group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white bg-transparent"
                    onClick={toggleMute}
                  >
                    {muted || volume === 0 ? (
                      <VolumeX size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={handleVolume}
                    className="w-20 h-[3px] group-hover:h-[6px] transition-all duration-200"
                  />
                </div>

                {/* Time */}
                <span className="text-xs text-white/90 tabular-nums">
                  {format(currentTime)} / {format(duration)}
                </span>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white bg-transparent"
                  onClick={toggleFullscreen}
                >
                  <Maximize size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
