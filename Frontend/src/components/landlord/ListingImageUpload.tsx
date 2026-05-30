"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface ListingImageUploadProps {
  listingId: number;
  /** Optionally pre-populate. If omitted, the modal fetches its own images on open. */
  existingImages?: { id: number; image_url: string }[];
  onClose: () => void;
  onUploaded?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ListingImageUpload({ listingId, existingImages, onClose, onUploaded }: ListingImageUploadProps) {
  const [images, setImages] = useState(existingImages ?? []);
  const [loadingExisting, setLoadingExisting] = useState(existingImages === undefined);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch existing images on mount if the caller didn't supply them
  useEffect(() => {
    if (existingImages !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const listing = await api.listings.getById(listingId);
        if (cancelled) return;
        setImages(
          (listing.images ?? []).map((img) => ({
            id: img.id,
            image_url: img.image_url,
          }))
        );
      } catch {
        if (!cancelled) setError("Couldn't load existing photos. You can still add new ones.");
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, existingImages]);

  const handleUpload = async (files: FileList) => {
    if (images.length + files.length > 10) {
      setError("Maximum 10 images per listing");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("cribb_token");
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));

      const res = await fetch(`${API_URL}/api/listings/${listingId}/images`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(body.detail || "Upload failed");
      }

      const newImages = await res.json();
      setImages((prev) => [...prev, ...newImages]);
      onUploaded?.();
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
      const token = localStorage.getItem("cribb_token");
      const res = await fetch(`${API_URL}/api/listings/${listingId}/images/${imageId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Delete failed" }));
        throw new Error(body.detail || "Delete failed");
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  // Drag-and-drop reorder. Optimistic — revert on API failure.
  const handleDragStart = (id: number) => (e: React.DragEvent) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (id: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = (targetId: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);

    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const fromIdx = images.findIndex((img) => img.id === draggedId);
    const toIdx = images.findIndex((img) => img.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedId(null);
      return;
    }

    const previous = images;
    const next = [...images];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setImages(next);
    setDraggedId(null);

    try {
      await api.listings.reorderImages(listingId, next.map((img) => img.id));
      onUploaded?.();
    } catch (err) {
      // Revert on failure
      setImages(previous);
      setError(err instanceof Error ? err.message : "Couldn't save new order");
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[520px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
            Listing Photos
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Loading state while fetching existing images */}
          {loadingExisting ? (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-[#FAF8F4] animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Image grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {images.map((img, i) => {
                    const isDeleting = deletingId === img.id;
                    const isDragging = draggedId === img.id;
                    const isDragTarget = dragOverId === img.id && draggedId !== img.id;
                    return (
                      <div
                        key={img.id}
                        draggable={!isDeleting}
                        onDragStart={handleDragStart(img.id)}
                        onDragOver={handleDragOver(img.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop(img.id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative aspect-[4/3] rounded-lg overflow-hidden bg-[#FAF8F4] cursor-grab active:cursor-grabbing transition-all ${
                          isDragging ? "opacity-30" : ""
                        } ${isDragTarget ? "ring-2 ring-[#FF6B35] ring-offset-2" : ""}`}
                      >
                        <img
                          src={img.image_url}
                          alt={`Listing photo ${i + 1}`}
                          draggable={false}
                          className={`w-full h-full object-cover transition-opacity ${isDeleting ? "opacity-40" : ""}`}
                        />
                        {/* Drag hint — visible on hover */}
                        <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        {/* Always-visible delete button (top-right) */}
                        <button
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
                <div className="mb-4 text-center py-6 rounded-xl bg-[#FAF8F4] text-[#1B2D45]/35" style={{ fontSize: "12px", fontWeight: 500 }}>
                  No photos yet — add some below.
                </div>
              )}
            </>
          )}

          {/* Upload area */}
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
                <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>
                  Click to upload photos
                </span>
                <span className="text-[#1B2D45]/20" style={{ fontSize: "10px" }}>
                  JPG, PNG up to 5MB · {10 - images.length} remaining
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUpload(e.target.files);
                }
              }}
            />
          </label>

          {error && (
            <div className="mt-3 text-[#E71D36]" style={{ fontSize: "12px" }}>{error}</div>
          )}

          <p className="text-[#1B2D45]/20 mt-3 text-center" style={{ fontSize: "10px" }}>
            Drag photos to reorder · First image is the cover · Max 10 per listing
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/[0.06] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}