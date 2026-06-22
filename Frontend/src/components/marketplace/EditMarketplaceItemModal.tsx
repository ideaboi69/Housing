"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Upload, Save } from "lucide-react";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import type {
  MarketplaceItemUpdate,
  MarketplaceImageResponse,
  MarketplaceCategory,
  ItemCondition,
  PricingType,
} from "@/types";
import { MARKETPLACE_CATEGORIES, CONDITION_LABELS, PICKUP_ZONES } from "./marketplace-data";

interface EditMarketplaceItemModalProps {
  itemId: number;
  onClose: () => void;
  onSaved?: () => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-white text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";
const labelClass = "text-[#5C6B7A] block mb-1.5";
const labelStyle = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

export function EditMarketplaceItemModal({ itemId, onClose, onSaved }: EditMarketplaceItemModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory>("other");
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [pricingType, setPricingType] = useState<PricingType>("fixed");
  const [price, setPrice] = useState<number | "">("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Images
  const [images, setImages] = useState<MarketplaceImageResponse[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const item = await api.marketplace.getItem(itemId);
        if (cancelled) return;
        setTitle(item.title);
        setDescription(item.description ?? "");
        setCategory(item.category);
        setCondition(item.condition);
        setPricingType(item.pricing_type);
        setPrice(item.price ?? "");
        setPickupLocation(item.pickup_location ?? "");
        setPickupNotes(item.pickup_notes ?? "");
        setImages(item.images ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Could not load item");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 photos per item");
      return;
    }
    setUploadingPhotos(true);
    try {
      const newImages = await api.marketplace.uploadImages(itemId, Array.from(files));
      setImages((prev) => [...prev, ...newImages]);
      toast.success(`Added ${newImages.length} photo${newImages.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Upload failed");
    } finally {
      setUploadingPhotos(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (imageId: number) => {
    setDeletingPhotoId(imageId);
    try {
      await api.marketplace.deleteImage(itemId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Delete failed");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!pickupLocation.trim()) { setError("Pickup location is required"); return; }
    if (pricingType !== "free" && (price === "" || Number(price) < 0)) {
      setError("Please enter a valid price");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: MarketplaceItemUpdate = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        condition,
        pricing_type: pricingType,
        price: pricingType === "free" ? undefined : Number(price),
        pickup_location: pickupLocation.trim(),
        pickup_notes: pickupNotes.trim() || undefined,
      };
      await api.marketplace.updateItem(itemId, payload);
      toast.success("Item updated");
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const modal = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: "560px", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] shrink-0">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Edit Item</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
            </div>
          ) : (
            <>
              {/* Photos */}
              <div>
                <label className={labelClass} style={labelStyle}>Photos ({images.length}/5)</label>
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {images.map((img, i) => {
                      const isDeleting = deletingPhotoId === img.id;
                      return (
                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-[#FAF8F4]">
                          <img
                            src={img.image_url}
                            alt={`Item ${i + 1}`}
                            className={`w-full h-full object-cover transition-opacity ${isDeleting ? "opacity-40" : ""}`}
                          />
                          <button
                            onClick={() => handleDeletePhoto(img.id)}
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
                  <div className="mb-3 text-center py-5 rounded-xl bg-[#FAF8F4] text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>
                    No photos yet
                  </div>
                )}

                {images.length < 5 && (
                  <label className={`flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    uploadingPhotos ? "border-[#1B2D45]/10 bg-[#FAF8F4]" : "border-[#1B2D45]/10 hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.02]"
                  }`}>
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-5 h-5 text-[#1B2D45]/30 animate-spin" />
                        <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-[#1B2D45]/20" />
                        <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>
                          Add photos · {5 - images.length} remaining
                        </span>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingPhotos}
                      onChange={(e) => handleAddPhotos(e.target.files)}
                    />
                  </label>
                )}
              </div>

              <div className="h-px bg-[#1B2D45]/[0.04]" />

              {/* Title */}
              <div>
                <label className={labelClass} style={labelStyle}>Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as MarketplaceCategory)} className={inputClass} style={{ fontSize: "13px" }}>
                    {MARKETPLACE_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Condition</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)} className={inputClass} style={{ fontSize: "13px" }}>
                    {(Object.keys(CONDITION_LABELS) as ItemCondition[]).map((k) => (
                      <option key={k} value={k}>{CONDITION_LABELS[k].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className={labelClass} style={labelStyle}>Pricing</label>
                <div className="flex gap-2 mb-2">
                  {([
                    { key: "fixed" as PricingType, label: "Fixed" },
                    { key: "negotiable" as PricingType, label: "Negotiable" },
                    { key: "free" as PricingType, label: "Free" },
                  ]).map((opt) => {
                    const active = pricingType === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPricingType(opt.key)}
                        className={`flex-1 py-2 rounded-xl border transition-all ${active ? "border-transparent bg-[#FF6B35] text-white" : "border-[#E8E4DC] text-[#5C6B7A] hover:border-[#FF6B35]/30"}`}
                        style={{ fontSize: "12px", fontWeight: 700 }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {pricingType !== "free" && (
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Price in CAD"
                    className={inputClass}
                    style={{ fontSize: "13px" }}
                  />
                )}
              </div>

              {/* Pickup */}
              <div>
                <label className={labelClass} style={labelStyle}>Pickup Location *</label>
                <select value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className={inputClass} style={{ fontSize: "13px" }}>
                  <option value="">Select a location</option>
                  {PICKUP_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Pickup Notes</label>
                <input type="text" value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} placeholder="e.g. weekdays after 5pm" className={inputClass} style={{ fontSize: "13px" }} />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass} style={labelStyle}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What are you selling?" className={`${inputClass} resize-none`} style={{ fontSize: "13px", lineHeight: 1.6 }} />
              </div>

              {error && (
                <div className="text-[#E71D36] bg-[#E71D36]/5 rounded-xl px-3 py-2" style={{ fontSize: "12px", fontWeight: 500 }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-black/[0.06] flex justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.03] disabled:opacity-50 transition-all" style={{ fontSize: "13px", fontWeight: 600 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-all"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
}
