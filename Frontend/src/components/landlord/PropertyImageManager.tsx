"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Upload, Loader2, GripVertical, Undo2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { PropertyImageResponse } from "@/types";

interface PropertyImageManagerProps {
  propertyId: number;
  initialImages?: PropertyImageResponse[];
  /** Notified whenever the image set changes (add/delete/reorder). */
  onChanged?: (images: PropertyImageResponse[]) => void;
}

export interface PropertyImageManagerHandle {
  /** Run any pending photo deletions against the server. Returns the surviving
   *  images on success, or throws if any delete failed. */
  commitPendingDeletes: () => Promise<PropertyImageResponse[]>;
  /** Count of photos staged for deletion but not yet committed. */
  pendingDeleteCount: number;
}

const MAX_IMAGES = 10;

/**
 * Inline panel for managing property-level photos (the home itself), distinct
 * from per-listing/room photos. Designed to live inside the Edit Property modal.
 * Uploads + reorders persist immediately; deletes stage locally and only commit
 * when the parent calls commitPendingDeletes() (e.g. from Save changes).
 */
export const PropertyImageManager = forwardRef<PropertyImageManagerHandle, PropertyImageManagerProps>(function PropertyImageManager({ propertyId, initialImages = [], onChanged }, ref) {
  const [images, setImages] = useState<PropertyImageResponse[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  // Photos the landlord clicked X on, but hasn't committed via Save yet. They
  // stay in `images` so they don't visually jump around / lose their slot.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>(() => []);
  // Suppress one re-sync after a local mutation (upload/delete/reorder) so the
  // parent's stale snapshot doesn't clobber our fresh state.
  const skipParentSync = useRef(false);
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; }, [onChanged]);

  // Adopt updated initialImages from the parent (e.g. fresh fetch after open),
  // unless we just made a local change that the parent hasn't observed yet.
  useEffect(() => {
    if (skipParentSync.current) {
      skipParentSync.current = false;
      return;
    }
    setImages(initialImages);
    // intentionally exclude initialImages identity — we key off id+order list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, initialImages.map((i) => i.id).join(",")]);

  const sync = (next: PropertyImageResponse[]) => {
    skipParentSync.current = true;
    setImages(next);
    onChangedRef.current?.(next);
  };

  const handleUpload = async (files: FileList) => {
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} photos per property`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploaded = await api.properties.uploadImages(propertyId, Array.from(files));
      const next = [...images, ...uploaded];
      skipParentSync.current = true;
      setImages(next);
      onChangedRef.current?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Stage a delete locally (X click). Actual API call happens in
  // commitPendingDeletes(), invoked from the parent's Save handler.
  const stageDelete = (imageId: number) => {
    setError("");
    setPendingDeleteIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]));
  };

  const undoStagedDelete = (imageId: number) => {
    setPendingDeleteIds((prev) => prev.filter((id) => id !== imageId));
  };

  useImperativeHandle(ref, () => ({
    pendingDeleteCount: pendingDeleteIds.length,
    commitPendingDeletes: async () => {
      if (pendingDeleteIds.length === 0) return images;
      const failed: number[] = [];
      for (const id of pendingDeleteIds) {
        try {
          await api.properties.deleteImage(propertyId, id);
        } catch {
          failed.push(id);
        }
      }
      const survivingIds = new Set([...failed, ...images.filter((i) => !pendingDeleteIds.includes(i.id)).map((i) => i.id)]);
      const next = images.filter((img) => survivingIds.has(img.id));
      skipParentSync.current = true;
      setImages(next);
      setPendingDeleteIds(failed); // keep ones we couldn't delete so the user sees + can retry
      onChangedRef.current?.(next);
      if (failed.length > 0) {
        throw new Error(`Couldn't delete ${failed.length} photo${failed.length === 1 ? "" : "s"}.`);
      }
      return next;
    },
  }), [images, pendingDeleteIds, propertyId]);

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
            const isPendingDelete = pendingDeleteIds.includes(img.id);
            const isDragging = draggedId === img.id;
            const isDragTarget = dragOverId === img.id && draggedId !== img.id;
            return (
              <div
                key={img.id}
                draggable={!isPendingDelete}
                onDragStart={(e) => { if (isPendingDelete) return; setDraggedId(img.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (img.id !== dragOverId) setDragOverId(img.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={handleDrop(img.id)}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                className={`group relative aspect-[4/3] rounded-lg overflow-hidden bg-[#FAF8F4] transition-all ${
                  isPendingDelete ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                } ${isDragging ? "opacity-30" : ""} ${isDragTarget ? "ring-2 ring-[#1B2D45] ring-offset-2" : ""}`}
              >
                <img
                  src={img.image_url}
                  alt={`Property photo ${i + 1}`}
                  draggable={false}
                  className={`w-full h-full object-cover transition-opacity ${isPendingDelete ? "opacity-30 grayscale" : ""}`}
                />
                {!isPendingDelete && (
                  <>
                    <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => stageDelete(img.id)}
                      aria-label="Remove photo"
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-[#E71D36] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white" style={{ fontSize: "8px", fontWeight: 700 }}>
                        Cover
                      </div>
                    )}
                  </>
                )}
                {isPendingDelete && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/35 backdrop-blur-[1px]">
                    <span className="text-white" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Will delete on save
                    </span>
                    <button
                      type="button"
                      onClick={() => undoStagedDelete(img.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-white text-[#1B2D45] hover:bg-[#FAF8F4] transition-colors"
                      style={{ fontSize: "10px", fontWeight: 700 }}
                    >
                      <Undo2 className="w-3 h-3" /> Undo
                    </button>
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

      {pendingDeleteIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-[#FFB627]/10 border border-[#FFB627]/30 px-3 py-2">
          <span className="text-[#B45309]" style={{ fontSize: "11px", fontWeight: 600 }}>
            {pendingDeleteIds.length} photo{pendingDeleteIds.length === 1 ? "" : "s"} staged for delete — applied when you click Save.
          </span>
          <button
            type="button"
            onClick={() => setPendingDeleteIds([])}
            className="text-[#B45309] hover:underline"
            style={{ fontSize: "11px", fontWeight: 700 }}
          >
            Undo all
          </button>
        </div>
      )}

      {error && <div className="text-[#E71D36]" style={{ fontSize: "12px" }}>{error}</div>}
    </div>
  );
});
