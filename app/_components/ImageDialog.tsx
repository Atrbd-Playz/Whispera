"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
} from "lucide-react";

type Props = {
  open: boolean;
  src: string;
  images?: string[]; // optional gallery
  onClose: () => void;
};

export const ImageDialog = ({ src, onClose, open, images = [] }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(images.indexOf(src) || 0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // swipe handling refs
  const startY = useRef<number | null>(null);
  const endY = useRef<number | null>(null);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Reset state when opening a new image
  useEffect(() => {
    if (src) {
      setCurrentIndex(images.indexOf(src));
      setZoom(1);
    }
  }, [src, images]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ---- Swipe-to-close handlers ----
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    endY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (startY.current !== null && endY.current !== null) {
      const diffY = endY.current - startY.current;
      if (diffY > 100) {
        // swipe down threshold
        onClose();
      }
    }
    startY.current = null;
    endY.current = null;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        ref={containerRef} // fix fullscreen
        className="fixed inset-0 translate-x-0 translate-y-0 flex items-center justify-center bg-black/90 p-0 max-w-none"
        // swipe listeners
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ==== Controls ==== */}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 bg-black/50 rounded-sm right-4 text-white hover:text-gray-300 z-50"
        >
          <X size={28} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 left-4 bg-black/50 rounded-sm text-white hover:text-gray-300 z-50"
        >
          {isFullscreen ? <Minimize2 size={26} /> : <Maximize2 size={26} />}
        </button>

        {/* Prev button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50"
          >
            <ChevronLeft size={42} />
          </button>
        )}

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50"
          >
            <ChevronRight size={42} />
          </button>
        )}

        {/* ==== Image Viewer ==== */}
        <div className="flex items-center justify-center">
          <Image
            src={images[currentIndex] || src}
            alt="image"
            width={1200}
            height={800}
            className="rounded-lg object-contain transition-transform duration-300"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              transform: `scale(${zoom})`,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
