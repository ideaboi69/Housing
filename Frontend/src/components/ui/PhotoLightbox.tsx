"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoLightboxProps {
  images: string[];
  startIndex?: number;
  onClose: () => void;
  /** Optional label shown in the header (e.g. "Floor Plan", "Unit Photos"). */
  title?: string;
}

/**
 * Full-screen photo viewer. Navigate with the arrows, keyboard (←/→/Esc),
 * swipe on touch, or the thumbnail strip. Click the backdrop to close.
 */
export function PhotoLightbox({ images, startIndex = 0, onClose, title }: PhotoLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (images.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50 && images.length > 1) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/85" onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: "13px", fontWeight: 500 }}>
          {title ? <span className="font-bold mr-2 text-white">{title}</span> : null}
          {index + 1} / {images.length}
        </span>
        <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-2"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 1 && (
          <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={images[index]}
            alt={`Photo ${index + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-h-full max-w-full select-none rounded-lg object-contain"
            draggable={false}
          />
        </AnimatePresence>
        {images.length > 1 && (
          <button onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-12 w-16 shrink-0 overflow-hidden rounded-md transition-opacity ${i === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
