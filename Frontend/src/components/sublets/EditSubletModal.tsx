"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Upload, Save } from "lucide-react";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import type {
  SubletResponse,
  SubletUpdate,
  SubletImageResponse,
  PetPolicy,
  SmokingPolicy,
  GenderPreference,
  SubletRoomType,
} from "@/types";

interface EditSubletModalProps {
  subletId: number;
  onClose: () => void;
  onSaved?: () => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-white text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";

const labelClass =
  "text-[#5C6B7A] block mb-1.5";
const labelStyle = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

export function EditSubletModal({ subletId, onClose, onSaved }: EditSubletModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [roomType, setRoomType] = useState<SubletRoomType | "private">("private");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [genderPref, setGenderPref] = useState<GenderPreference | "any" | "">("");
  const [petPolicy, setPetPolicy] = useState<PetPolicy | "">("");
  const [smokingPolicy, setSmokingPolicy] = useState<SmokingPolicy | "">("");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [isFurnished, setIsFurnished] = useState(false);
  const [nearestBusRoute, setNearestBusRoute] = useState("");

  // Image management
  const [images, setImages] = useState<SubletImageResponse[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Fetch sublet on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.sublets.getById(subletId);
        if (cancelled) return;
        setTitle(s.title);
        setAddress(s.address);
        setDescription(s.description ?? "");
        setRent(s.rent_per_month);
        setStartDate(s.sublet_start_date);
        setEndDate(s.sublet_end_date);
        setMoveInDate(s.move_in_date);
        setRoomType(s.room_type as SubletRoomType);
        setBathrooms(s.bathrooms);
        setGenderPref((s.gender_preference as GenderPreference) ?? "");
        setPetPolicy(s.pet_policy ?? "");
        setSmokingPolicy(s.smoking_policy ?? "");
        setUtilitiesIncluded(Boolean(s.utilities_included));
        setIsFurnished(Boolean(s.is_furnished));
        setNearestBusRoute(s.nearest_bus_route ?? "");
        setImages(s.images ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Could not load sublet");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subletId]);

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > 10) {
      toast.error("Maximum 10 photos per sublet");
      return;
    }
    setUploadingPhotos(true);
    try {
      const newImages = await api.sublets.uploadImages(subletId, Array.from(files));
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
      await api.sublets.deleteImage(subletId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Delete failed");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !address.trim() || !rent || !startDate || !endDate || !moveInDate) {
      setError("Please fill out all required fields");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: SubletUpdate = {
        title: title.trim(),
        address: address.trim(),
        description: description.trim() || null,
        rent_per_month: Number(rent),
        sublet_start_date: startDate,
        sublet_end_date: endDate,
        move_in_date: moveInDate,
        room_type: roomType,
        bathrooms: Number(bathrooms) || 1,
        utilities_included: utilitiesIncluded,
        is_furnished: isFurnished,
        nearest_bus_route: nearestBusRoute.trim() || "",
      };
      if (genderPref) payload.gender_preference = genderPref as GenderPreference;
      if (petPolicy) payload.pet_policy = petPolicy as PetPolicy;
      if (smokingPolicy) payload.smoking_policy = smokingPolicy as SmokingPolicy;

      await api.sublets.update(subletId, payload);
      toast.success("Sublet updated");
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update sublet");
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
        style={{ maxWidth: "640px", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] shrink-0">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Edit Sublet</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
            </div>
          ) : (
            <>
              {/* Photos section */}
              <div>
                <label className={labelClass} style={labelStyle}>Photos ({images.length}/10)</label>
                {images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {images.map((img, i) => {
                      const isDeleting = deletingPhotoId === img.id;
                      return (
                        <div key={img.id} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#FAF8F4]">
                          <img
                            src={img.image_url}
                            alt={`Sublet ${i + 1}`}
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

                {images.length < 10 && (
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
                          Add photos · {10 - images.length} remaining
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

              {/* Address */}
              <div>
                <label className={labelClass} style={labelStyle}>Address *</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} style={{ fontSize: "13px" }} />
              </div>

              {/* Rent + bathrooms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Rent / month *</label>
                  <input type="number" value={rent} onChange={(e) => setRent(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Bathrooms</label>
                  <input type="number" min={0} step={0.5} value={bathrooms} onChange={(e) => setBathrooms(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} style={{ fontSize: "13px" }} />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Start *</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} style={{ fontSize: "12px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>End *</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} style={{ fontSize: "12px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Move-in *</label>
                  <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className={inputClass} style={{ fontSize: "12px" }} />
                </div>
              </div>

              {/* Room type + bus route */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Room Type</label>
                  <select value={roomType} onChange={(e) => setRoomType(e.target.value as SubletRoomType)} className={inputClass} style={{ fontSize: "13px" }}>
                    <option value="private">Private room</option>
                    <option value="shared">Shared room</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Bus Route</label>
                  <input type="text" value={nearestBusRoute} onChange={(e) => setNearestBusRoute(e.target.value)} className={inputClass} style={{ fontSize: "13px" }} placeholder="e.g. 99" />
                </div>
              </div>

              {/* Gender, pet, smoking */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Gender pref</label>
                  <select value={genderPref} onChange={(e) => setGenderPref(e.target.value as GenderPreference)} className={inputClass} style={{ fontSize: "12px" }}>
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Pets</label>
                  <select value={petPolicy} onChange={(e) => setPetPolicy(e.target.value as PetPolicy)} className={inputClass} style={{ fontSize: "12px" }}>
                    <option value="">Unspecified</option>
                    <option value="allowed">Allowed</option>
                    <option value="not_allowed">Not allowed</option>
                    <option value="case_by_case">Case-by-case</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Smoking</label>
                  <select value={smokingPolicy} onChange={(e) => setSmokingPolicy(e.target.value as SmokingPolicy)} className={inputClass} style={{ fontSize: "12px" }}>
                    <option value="">Unspecified</option>
                    <option value="allowed">Allowed</option>
                    <option value="not_allowed">Not allowed</option>
                    <option value="outside_only">Outside only</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E4DC] cursor-pointer hover:border-[#FF6B35]/30 transition-colors">
                  <input type="checkbox" checked={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.checked)} className="accent-[#FF6B35]" />
                  <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>Utilities included</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E4DC] cursor-pointer hover:border-[#FF6B35]/30 transition-colors">
                  <input type="checkbox" checked={isFurnished} onChange={(e) => setIsFurnished(e.target.checked)} className="accent-[#FF6B35]" />
                  <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>Furnished</span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass} style={labelStyle}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputClass} resize-none`} style={{ fontSize: "13px", lineHeight: 1.6 }} />
              </div>

              {error && (
                <div className="text-[#E71D36] bg-[#E71D36]/5 rounded-xl px-3 py-2" style={{ fontSize: "12px", fontWeight: 500 }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
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