"use client";

import { Suspense, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { LeaseType, GenderPreference, ListingCreate } from "@/types";
import type { PropertyResponse } from "@/types";
import { ArrowLeft, DollarSign, Calendar, Users, Check, Home, Loader2, Image as ImageIcon, X, Upload, GripVertical } from "lucide-react";

const leaseTypes = [
  { value: LeaseType.EIGHT_MONTH, label: "8-month", desc: "Sep – Apr", emoji: "📚" },
  { value: LeaseType.TEN_MONTH, label: "10-month", desc: "Sep – Jun", emoji: "📅" },
  { value: LeaseType.TWELVE_MONTH, label: "12-month", desc: "Full year", emoji: "🏠" },
  { value: LeaseType.FLEXIBLE, label: "Flexible", desc: "Custom dates", emoji: "🔄" },
];

function NewListingPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const propertyId = Number(id);
  const router = useRouter();
  const { user } = useAuthStore();
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    rent_per_room: "",
    rent_total: "",
    lease_type: LeaseType.TWELVE_MONTH,
    move_in_date: "",
    is_sublet: false,
    sublet_start_date: "",
    sublet_end_date: "",
    gender_preference: GenderPreference.ANY,
    
  });
  const [perRoomPricing, setPerRoomPricing] = useState(false);
  const [rooms, setRooms] = useState<{ label: string; rent: string }[]>([]);

  useEffect(() => {
    async function loadProperty() {
      try {
        const prop = await api.properties.getById(propertyId);
        setProperty(prop);
      } catch {
        setError("Property not found");
      } finally {
        setLoadingProperty(false);
      }
    }
    loadProperty();
  }, [propertyId]);

  useEffect(() => {
    if (!property) return;
    // Initialize one row per property room when entering per-room mode (or property changes)
    setRooms((prev) => {
      const need = property.total_rooms;
      if (prev.length === need) return prev;
      const next = Array.from({ length: need }, (_, i) => ({
        label: prev[i]?.label || (i === 0 ? "Master Bedroom" : `Room ${i + 1}`),
        rent: prev[i]?.rent || "",
      }));
      return next;
    });
  }, [property]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateRoom(index: number, field: "label" | "rent", value: string) {
    setRooms((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  // Auto-calculate total rent
  function updateRentPerRoom(val: string) {
    setForm((prev) => ({
      ...prev,
      rent_per_room: val,
      rent_total: val && property ? String(Number(val) * property.total_rooms) : prev.rent_total,
    }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const totalCount = imageFiles.length + fileArray.length;

    if (totalCount > 10) {
      setError("Maximum 10 images per listing");
      return;
    }

    setError("");
    setImageFiles((prev) => [...prev, ...fileArray]);

    // Generate previews
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") {
          setImagePreviews((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so re-selecting the same file works
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // Drag-and-drop reorder for local images (no API — uploaded together on submit in this order).
  function handleDragStart(idx: number) {
    return (e: React.DragEvent) => {
      setDraggedIdx(idx);
      e.dataTransfer.effectAllowed = "move";
    };
  }

  function handleDragOver(idx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (idx !== dragOverIdx) setDragOverIdx(idx);
    };
  }

  function handleDragLeave() {
    setDragOverIdx(null);
  }

  function handleDrop(targetIdx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIdx(null);

      if (draggedIdx === null || draggedIdx === targetIdx) {
        setDraggedIdx(null);
        return;
      }

      // Move both arrays in lockstep so previews stay matched to their files
      setImageFiles((prev) => {
        const next = [...prev];
        const [moved] = next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
      setImagePreviews((prev) => {
        const next = [...prev];
        const [moved] = next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
      setDraggedIdx(null);
    };
  }

  function handleDragEnd() {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }

  async function uploadImagesToListing(listingId: number) {
    const token = localStorage.getItem("cribb_token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const formData = new FormData();
    imageFiles.forEach((f) => formData.append("files", f));

    const res = await fetch(`${API_URL}/api/listings/${listingId}/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Image upload failed" }));
      throw new Error(body.detail || "Image upload failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate based on pricing mode
    if (perRoomPricing) {
      const allFilled = rooms.every((r) => r.rent && Number(r.rent) > 0);
      if (!allFilled) {
        setError("Set a rent for every room");
        return;
      }
    } else {
      if (!form.rent_per_room) {
        setError("Rent per room is required");
        return;
      }
    }

    if (!form.move_in_date) {
      setError("Move-in date is required");
      return;
    }

    if (imageFiles.length < 1) {
      setError("At least 1 image is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload: ListingCreate = {
        property_id: propertyId,
        per_room_pricing: perRoomPricing,
        lease_type: form.lease_type,
        move_in_date: form.move_in_date,
        is_sublet: form.is_sublet,
        sublet_start_date: form.is_sublet && form.sublet_start_date ? form.sublet_start_date : undefined,
        sublet_end_date: form.is_sublet && form.sublet_end_date ? form.sublet_end_date : undefined,
        gender_preference: form.gender_preference !== GenderPreference.ANY ? form.gender_preference : undefined,
      };

      if (perRoomPricing) {
        payload.rooms = rooms.map((r, i) => ({
          label: r.label || `Room ${i + 1}`,
          rent: Number(r.rent),
          display_order: i,
        }));
      } else {
        payload.rent_per_room = Number(form.rent_per_room);
        payload.rent_total = Number(form.rent_total || form.rent_per_room);
      }

      const createdListing = await api.listings.create(payload);

      // Upload images. If this fails, leave the listing as DRAFT so the user
      // can retry from the property page — no data loss.
      try {
        await uploadImagesToListing(createdListing.id);
      } catch (imgErr) {
        setError(
          (imgErr instanceof Error ? imgErr.message : "Image upload failed") +
          " — your listing was saved as a draft. You can add images from the property page."
        );
        setIsSubmitting(false);
        return;
      }

      // Compute Cribb Score (optional)
      try {
        await api.healthScores.compute(createdListing.id);
      } catch { /* score computation is optional */ }

      router.push("/landlord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      setIsSubmitting(false);
    }
  }

  if (!user || user.role !== "landlord") return null;

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[640px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link
          href="/landlord"
          className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>Create a Listing</h1>
        {property && (
          <div className="flex items-center gap-2 mt-1 mb-6">
            <Home className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span className="text-[#FF6B35]" style={{ fontSize: "13px", fontWeight: 600 }}>{property.title}</span>
            <span className="text-[#1B2D45]/30" style={{ fontSize: "13px" }}>— {property.address}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                <DollarSign className="w-4 h-4 text-[#FF6B35]" /> Pricing
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={perRoomPricing}
                  onChange={(e) => setPerRoomPricing(e.target.checked)}
                  className="w-4 h-4 accent-[#FF6B35]"
                />
                <span className="text-[#1B2D45]/70" style={{ fontSize: "12px", fontWeight: 500 }}>
                  Different price per room
                </span>
              </label>
            </div>

            {!perRoomPricing ? (
              <>
                <p className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
                  Same rent for every room. Check the box above if rooms have different prices.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Rent per room / month</label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "14px" }}>$</span>
                      <input
                        type="number"
                        value={form.rent_per_room}
                        onChange={(e) => updateRentPerRoom(e.target.value)}
                        placeholder="650"
                        className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                        style={{ fontSize: "14px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Total rent / month</label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "14px" }}>$</span>
                      <input
                        type="number"
                        value={form.rent_total}
                        onChange={(e) => update("rent_total", e.target.value)}
                        placeholder="2600"
                        className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                        style={{ fontSize: "14px" }}
                      />
                    </div>
                    {property && form.rent_per_room && (
                      <div className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "11px" }}>
                        Auto-calculated: ${Number(form.rent_per_room) * property.total_rooms} for {property.total_rooms} rooms
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
                  Set a price for each of the {property?.total_rooms ?? 0} room{(property?.total_rooms ?? 0) === 1 ? "" : "s"}. The master bedroom is usually a bit more.
                </p>
                <div className="space-y-2">
                  {rooms.map((room, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px] gap-3">
                      <input
                        type="text"
                        value={room.label}
                        onChange={(e) => updateRoom(i, "label", e.target.value)}
                        placeholder={i === 0 ? "Master Bedroom" : `Room ${i + 1}`}
                        className="px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                        style={{ fontSize: "13px" }}
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "14px" }}>$</span>
                        <input
                          type="number"
                          value={room.rent}
                          onChange={(e) => updateRoom(i, "rent", e.target.value)}
                          placeholder="650"
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                          style={{ fontSize: "13px" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {rooms.length > 0 && rooms.every((r) => r.rent && Number(r.rent) > 0) && (
                  <div className="text-[#1B2D45]/40 pt-1 border-t border-black/[0.04]" style={{ fontSize: "11px" }}>
                    Total: ${rooms.reduce((sum, r) => sum + Number(r.rent || 0), 0).toLocaleString()}/month
                    {" — "}from ${Math.min(...rooms.map((r) => Number(r.rent))).toLocaleString()}/room
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lease Details */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Calendar className="w-4 h-4 text-[#FF6B35]" /> Lease Details
            </h2>

            <div>
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>Lease type</label>
              <div className="grid grid-cols-2 gap-2">
                {leaseTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update("lease_type", t.value)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      form.lease_type === t.value
                        ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06]"
                        : "border-black/[0.06] hover:border-[#FF6B35]/15"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "16px" }}>{t.emoji}</span>
                      <span className={form.lease_type === t.value ? "text-[#FF6B35]" : "text-[#1B2D45]"} style={{ fontSize: "13px", fontWeight: 600 }}>{t.label}</span>
                    </div>
                    <div className="text-[#1B2D45]/30 mt-0.5 ml-7" style={{ fontSize: "11px" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Move-in date</label>
              <input
                type="date"
                value={form.move_in_date}
                onChange={(e) => update("move_in_date", e.target.value)}
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>
          </div>

          {/* Sublet toggle */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>☀️ Summer Sublet?</h2>
                <p className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "12px" }}>Mark this as a sublet listing on the sublet marketplace</p>
              </div>
              <button
                type="button"
                onClick={() => update("is_sublet", !form.is_sublet)}
                className={`w-12 h-7 rounded-full transition-all ${form.is_sublet ? "bg-[#FF6B35]" : "bg-[#1B2D45]/10"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.is_sublet ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {form.is_sublet && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/[0.04]">
                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Sublet start</label>
                  <input
                    type="date"
                    value={form.sublet_start_date}
                    onChange={(e) => update("sublet_start_date", e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Sublet end</label>
                  <input
                    type="date"
                    value={form.sublet_end_date}
                    onChange={(e) => update("sublet_end_date", e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gender preference */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-3">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Users className="w-4 h-4 text-[#FF6B35]" /> Tenant Preference
            </h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: GenderPreference.ANY, label: "Any" },
                { value: GenderPreference.MALE, label: "Male" },
                { value: GenderPreference.FEMALE, label: "Female" },
                { value: GenderPreference.OTHER, label: "Other" },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => update("gender_preference", g.value)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    form.gender_preference === g.value
                      ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                      : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#FF6B35]/15"
                  }`}
                  style={{ fontSize: "13px", fontWeight: form.gender_preference === g.value ? 600 : 500 }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-[#E71D36]/10 text-[#E71D36] px-4 py-3 rounded-xl" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <div>
              <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                <ImageIcon className="w-4 h-4 text-[#FF6B35]" /> Photos <span className="text-[#E71D36]" style={{ fontWeight: 500 }}>*</span>
              </h2>
              <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px" }}>
                At least 1 photo required. Listings with 3–5 photos perform best.
              </p>
            </div>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => {
                  const isDragging = draggedIdx === idx;
                  const isDragTarget = dragOverIdx === idx && draggedIdx !== idx;
                  return (
                    <div
                      key={idx}
                      draggable
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={handleDragStart(idx)}
                      onDragOver={handleDragOver(idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-lg overflow-hidden bg-[#f3f3f5] group cursor-grab active:cursor-grabbing transition-all ${
                        isDragging ? "opacity-30" : ""
                      } ${isDragTarget ? "ring-2 ring-[#FF6B35] ring-offset-2" : ""}`}
                    >
                      <img src={src} alt={`Preview ${idx + 1}`} draggable={false} className="w-full h-full object-cover" />
                      {/* Drag hint */}
                      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5 text-[#1B2D45]" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/60 text-white" style={{ fontSize: "10px", fontWeight: 600 }}>
                          Cover
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* File picker */}
            {imageFiles.length < 10 && (
              <label
                htmlFor="listing-photos"
                className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-[#1B2D45]/15 hover:border-[#FF6B35]/40 hover:bg-[#FF6B35]/[0.02] cursor-pointer transition-all"
              >
                <Upload className="w-5 h-5 text-[#1B2D45]/40" />
                <span className="text-[#1B2D45]/60" style={{ fontSize: "13px", fontWeight: 600 }}>
                  {imageFiles.length === 0 ? "Add photos" : `Add more (${imageFiles.length}/10)`}
                </span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>JPEG, PNG, WebP — up to 10</span>
                <input
                  id="listing-photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}

            {imageFiles.length >= 3 && imageFiles.length <= 5 && (
              <p className="text-[#4ADE80]" style={{ fontSize: "11px", fontWeight: 600 }}>
                ✓ Great — you&apos;re in the sweet spot for visibility.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/landlord"
              className="px-6 py-3 rounded-xl border border-black/[0.08] text-[#1B2D45]/60 hover:bg-black/[0.02] transition-all"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || imageFiles.length < 1}
              className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Listing →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <NewListingPageContent params={params} />
    </Suspense>
  );
}
