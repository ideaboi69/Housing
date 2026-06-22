"use client";

import { useState } from "react";
import { Upload, Loader2, GripVertical, X } from "lucide-react";
import { api } from "@/lib/api";
import type { PropertyImageResponse } from "@/types";

interface PropertyImageManagerProps {
  propertyId: number;
  initialImages?: PropertyImageResponse[];
  /** Notified whenever the image set changes (add/delete/reorder). */
  onChanged?: (images: PropertyImageResponse[]) => void;
}

const MAX_IMAGES = 10;

/**
 * Inline panel for managing property-level photos (the home itself), distinct
 * from per-listing/room photos. Designed to live inside the Edit Property modal.
 */
export function PropertyImageManager({ propertyId, initialImages = [], onChanged }: PropertyImageManagerProps) {
  const [images, setImages] = useState<PropertyImageResponse[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const sync = (next: PropertyImageResponse[]) => {
    setImages(next);
    onChanged?.(next);
  };

  const handleUpload = async (files: FileList) => {
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} photos per property`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await api.properties.uploadImages(propertyId, Array.from(files));
      sync([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    setError("");
    try {
      await api.properties.deleteImage(propertyId, imageId);
      sync(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  // Drag-and-drop reorder. Optimistic — revert on API failure.
  const handleDrop = (targetId: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const fromIdx = images.findIndex((img) => img.id === draggedId);
    const toIdx = images.findIndex((img) => img.id === targetId);
    setDraggedId(null);
    if (fromIdx === -1 || toIdx === -1) return;

    const previous = images;
    const next = [...images];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    sync(next);

    try {
      await api.properties.reorderImages(propertyId, next.map((img) => img.id));
    } catch (err) {
      sync(previous);
      setError(err instanceof Error ? err.message : "Couldn't save new order");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[#1B2D45]/50" style={{ fontSize: "11px", lineHeight: 1.5 }}>
        Photos of the property itself (exterior, common areas). Drag to reorder — the first image is the cover. Room-specific
        photos are managed per listing.
      </p>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => {
            const isDeleting = deletingId === img.id;
            const isDragging = draggedId === img.id;
            const isDragTarget = dragOverId === img.id && draggedId !== img.id;
            return (
              <div
                key={img.id}
                draggable={!isDeleting}
                onDragStart={(e) => { setDraggedId(img.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (img.id !== dragOverId) setDragOverId(img.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={handleDrop(img.id)}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                className={`group relative aspect-[4/3] rounded-lg overflow-hidden bg-[#FAF8F4] cursor-grab active:cursor-grabbing transition-all ${
                  isDragging ? "opacity-30" : ""
                } ${isDragTarget ? "ring-2 ring-[#1B2D45] ring-offset-2" : ""}`}
              >
                <img
                  src={img.image_url}
                  alt={`Property photo ${i + 1}`}
                  draggable={false}
                  className={`w-full h-full object-cover transition-opacity ${isDeleting ? "opacity-40" : ""}`}
                />
                <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={isDeleting}
                  aria-label="Delete photo"
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-[#E71D36] transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white" style={{ fontSize: "8px", fontWeight: 700 }}>
                    Cover
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 rounded-xl bg-[#FAF8F4] text-[#1B2D45]/35" style={{ fontSize: "12px", fontWeight: 500 }}>
          No property photos yet — add some below.
        </div>
      )}

      <label className={`flex flex-col items-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
        uploading ? "border-[#1B2D45]/10 bg-[#FAF8F4]" : "border-[#1B2D45]/10 hover:border-[#1B2D45]/25 hover:bg-[#1B2D45]/[0.02]"
      }`}>
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-[#1B2D45]/30 animate-spin" />
            <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-[#1B2D45]/20" />
            <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>Click to upload photos</span>
            <span className="text-[#1B2D45]/20" style={{ fontSize: "10px" }}>
              JPG, PNG, WebP · {MAX_IMAGES - images.length} remaining
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          disabled={uploading || images.length >= MAX_IMAGES}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {error && <div className="text-[#E71D36]" style={{ fontSize: "12px" }}>{error}</div>}
    </div>
  );
}
