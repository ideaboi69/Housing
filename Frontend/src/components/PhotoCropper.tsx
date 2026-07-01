"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

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
  const isCircle = shape === "circle";
  const cropAspect = isCircle ? 1 : aspect;

  const { viewportW, viewportH } = useMemo(() => {
    if (isCircle) return { viewportW: 300, viewportH: 300 };
    if (cropAspect >= 1) {
      return { viewportW: VIEWPORT_MAX, viewportH: Math.round(VIEWPORT_MAX / cropAspect) };
    }
    return { viewportW: Math.round(VIEWPORT_MAX * cropAspect), viewportH: VIEWPORT_MAX };
  }, [isCircle, cropAspect]);

  const { outputW, outputH } = useMemo(() => {
    if (isCircle) return { outputW: outputSize, outputH: outputSize };
    return { outputW: outputSize, outputH: Math.round(outputSize / cropAspect) };
  }, [isCircle, cropAspect, outputSize]);

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imgUrl || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const cropped = await renderCroppedImage(imgUrl, croppedAreaPixels, rotation, outputW, outputH);
      const defaultName = isCircle ? "avatar.jpg" : "image.jpg";
      onConfirm(new File([cropped], filename || defaultName, { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  };

  const defaultTitle = isCircle ? "Position your photo" : "Crop image";
  const defaultHint = isCircle
    ? "Drag to move, pinch or scroll to zoom. The circle is what others will see."
    : "Drag to move, pinch or scroll to zoom. The frame is what others will see.";
  const defaultConfirm = isCircle ? "Save photo" : "Save image";

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[2001] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
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

        <div
          className="relative mx-auto overflow-hidden rounded-2xl bg-[#1B2D45]"
          style={{ width: viewportW, height: viewportH }}
        >
          {imgUrl && (
            <Cropper
              image={imgUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={cropAspect}
              cropShape={isCircle ? "round" : "rect"}
              showGrid
              restrictPosition
              minZoom={1}
              maxZoom={4}
              zoomSpeed={0.5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              style={{
                containerStyle: { background: "#1B2D45" },
                mediaStyle: { touchAction: "none" },
              }}
            />
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-[#1B2D45]/35 shrink-0" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6B35]"
            aria-label="Zoom"
          />
          <ZoomIn className="w-4 h-4 text-[#1B2D45]/35 shrink-0" />
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1B2D45]/55 hover:bg-[#1B2D45]/[0.05] transition-colors shrink-0"
            aria-label="Rotate 90°"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

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
            disabled={busy || !croppedAreaPixels}
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

async function renderCroppedImage(
  imageUrl: string,
  cropArea: Area,
  rotationDeg: number,
  outputW: number,
  outputH: number,
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputW, outputH);

  if (rotationDeg === 0) {
    ctx.drawImage(
      img,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, outputW, outputH,
    );
    return canvasToBlob(canvas);
  }

  // Rotate: render the full rotated image to an offscreen canvas, then crop from that.
  const rad = (rotationDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotatedW = img.width * cos + img.height * sin;
  const rotatedH = img.width * sin + img.height * cos;

  const rot = document.createElement("canvas");
  rot.width = rotatedW;
  rot.height = rotatedH;
  const rctx = rot.getContext("2d");
  if (!rctx) throw new Error("Canvas not supported");
  rctx.translate(rotatedW / 2, rotatedH / 2);
  rctx.rotate(rad);
  rctx.drawImage(img, -img.width / 2, -img.height / 2);

  ctx.drawImage(
    rot,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, outputW, outputH,
  );
  return canvasToBlob(canvas);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.92,
    );
  });
}
