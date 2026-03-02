"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface ListingImageUploadProps {
  listingId: number;
  existingImages?: { id: number; image_url: string }[];
  onClose: () => void;
  onUploaded?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ListingImageUpload({ listingId, existingImages = [], onClose, onUploaded }: ListingImageUploadProps) {
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
    try {
      const token = localStorage.getItem("cribb_token");
      await fetch(`${API_URL}/api/listings/${listingId}/images/${imageId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Failed to delete image");
    }
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
          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {images.map((img, i) => (
                <div key={img.id} className="relative aspect-[4/3] rounded-lg overflow-hidden group bg-[#FAF8F4]">
                  <img
                    src={img.image_url}
                    alt={`Listing photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#E71D36]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white" style={{ fontSize: "8px", fontWeight: 700 }}>
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
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
            First image will be used as the cover photo. Max 10 images per listing.
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