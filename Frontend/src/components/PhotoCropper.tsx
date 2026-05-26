"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

interface PhotoCropperProps {
  file: File;
  shape?: "circle" | "rect";
  aspect?: number;
  outputSize?: number;
  title?: string;
  hint?: string;
  confirmLabel?: string;
  filename?: string;
  onConfirm: (cropped: File) => void;
  onCancel: () => void;
}

const VIEWPORT_MAX = 320;

export function PhotoCropper({
  file,
  shape = "circle",
  aspect = 1,
  outputSize = 512,
  title,
  hint,
  confirmLabel,
  filename,
  onConfirm,
  onCancel,
}: PhotoCropperProps) {
  const { viewportW, viewportH } = useMemo(() => {
    if (shape === "circle") return { viewportW: 280, viewportH: 280 };
    if (aspect >= 1) {
      return { viewportW: VIEWPORT_MAX, viewportH: Math.round(VIEWPORT_MAX / aspect) };
    }
    // Portrait: cap height
    return { viewportW: Math.round(VIEWPORT_MAX * aspect), viewportH: VIEWPORT_MAX };
  }, [shape, aspect]);

  // Compute output dimensions.
  const { outputW, outputH } = useMemo(() => {
    if (shape === "circle") return { outputW: outputSize, outputH: outputSize };
    return { outputW: outputSize, outputH: Math.round(outputSize / aspect) };
  }, [shape, aspect, outputSize]);

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [busy, setBusy] = useState(false);

  // Track whether we're mounted on the client (portals need document)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Read the file → image element + auto-fit
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    const img = new Image();
    img.onload = () => {
      // Minimum scale so the image always fully covers the viewport on both axes
      const fit = Math.max(viewportW / img.naturalWidth, viewportH / img.naturalHeight);
      setMinScale(fit);
      setScale(fit);
      setOffset({
        x: (viewportW - img.naturalWidth * fit) / 2,
        y: (viewportH - img.naturalHeight * fit) / 2,
      });
      setImgEl(img);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, viewportW, viewportH]);

  // Re-clamp the offset whenever scale changes so the image keeps covering the viewport
  const clampOffset = useCallback(
    (next: { x: number; y: number }, currentScale: number) => {
      if (!imgEl) return next;
      const drawnW = imgEl.naturalWidth * currentScale;
      const drawnH = imgEl.naturalHeight * currentScale;
      const minX = viewportW - drawnW;
      const minY = viewportH - drawnH;
      return {
        x: Math.min(0, Math.max(minX, next.x)),
        y: Math.min(0, Math.max(minY, next.y)),
      };
    },
    [imgEl, viewportW, viewportH]
  );

  useEffect(() => {
    setOffset((prev) => clampOffset(prev, scale));
  }, [scale, clampOffset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset(
      { x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy },
      scale
    ));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  // Render the cropped result to a canvas → File
  const handleConfirm = async () => {
    if (!imgEl) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = outputW;
      canvas.height = outputH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Source rect on the natural-sized image that maps to the viewport
      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      const sw = viewportW / scale;
      const sh = viewportH / scale;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputW, outputH);
      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, outputW, outputH);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
          "image/jpeg",
          0.92
        );
      });

      const defaultName = shape === "circle" ? "avatar.jpg" : "image.jpg";
      const cropped = new File([blob], filename || defaultName, { type: "image/jpeg" });
      onConfirm(cropped);
    } finally {
      setBusy(false);
    }
  };

  const maxScale = minScale * 4;
  const isCircle = shape === "circle";
  const defaultTitle = isCircle ? "Position your photo" : "Crop image";
  const defaultHint = isCircle
    ? "Drag to move, use the slider to zoom. The circle is what others will see."
    : "Drag to move, use the slider to zoom. The frame is what others will see in the preview.";
  const defaultConfirm = isCircle ? "Save photo" : "Save image";

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[2001] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
            {title || defaultTitle}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1B2D45]/45 hover:bg-[#1B2D45]/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[#1B2D45]/45 mb-4" style={{ fontSize: "12px", lineHeight: 1.5 }}>
          {hint || defaultHint}
        </p>

        {/* Crop viewport */}
        <div className="relative mx-auto" style={{ width: viewportW, height: viewportH }}>
          <div
            className={`absolute inset-0 overflow-hidden bg-[#FAF8F4] cursor-grab active:cursor-grabbing select-none touch-none ${
              isCircle ? "rounded-full" : "rounded-xl"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imgUrl && imgEl && (
              <img
                src={imgUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: imgEl.naturalWidth * scale,
                  height: imgEl.naturalHeight * scale,
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
          {/* Faint ring overlay so the user always sees the crop boundary */}
          <div
            className={`pointer-events-none absolute inset-0 ring-2 ring-white/70 ${
              isCircle ? "rounded-full" : "rounded-xl"
            }`}
          />
        </div>

        {/* Zoom slider */}
        <div className="mt-5 flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-[#1B2D45]/35 shrink-0" />
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={0.001}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6B35]"
            disabled={!imgEl}
          />
          <ZoomIn className="w-4 h-4 text-[#1B2D45]/35 shrink-0" />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:border-[#1B2D45]/18 hover:text-[#1B2D45] transition-all disabled:opacity-50"
            style={{ fontSize: "13px", fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !imgEl}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all disabled:opacity-50"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.24)" }}
          >
            {busy ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {confirmLabel || defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}