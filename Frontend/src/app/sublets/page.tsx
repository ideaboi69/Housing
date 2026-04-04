"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Heart, Check, ChevronRight, X, ArrowRight, ChevronDown, Plus,
  Sparkles, ExternalLink, Minus, MapPin, DollarSign, Clock, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Pushpin, TapeStrip } from "@/components/ui/BoardDecorations";
import { SearchAndFilters } from "@/components/browse/SearchAndFilters";
import { getScoreColor, formatPrice } from "@/lib/utils";
import {
  PROXIMITY_FILTER_OPTIONS,
  type ProximityFilterKey,
  getMaxWalkForProximityFilter,
  getProximityLabel,
} from "@/lib/proximity";
import { buildStaticMapUrl, GUELPH_CENTER, projectLngLatToContainer } from "@/lib/mapbox";
import {
  DEFAULT_MAP_VIEW_LANDMARKS,
  GUELPH_LANDMARKS,
  LANDMARK_TYPES,
  MAP_VIEW_LANDMARK_ORDER,
  type LandmarkType,
} from "@/lib/guelph-landmarks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { useSavedStore } from "@/lib/saved-store";
import { BrowseGridSkeleton } from "@/components/ui/Skeletons";
import type { GenderPreference } from "@/types";
import {
  type SubletListing, type SubletViewMode, type SubletCellValue,
  MONTHS, subletListings, getScoreLabel, filterOptions,
  getSubletBestIndex, parseSubletDistance, parseSubletWalkTime, generateSubletCompareSummary,
} from "@/components/sublets/sublet-data";

/* ════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════ */

function SummerBanner() {
  return (
    <motion.div
      className="mx-auto max-w-[1200px] px-4 md:px-6 mt-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="rounded-xl border border-[#FF6B35]/15 px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(46,196,182,0.08) 100%)" }}
      >
        <span style={{ fontSize: "20px" }}>☀️</span>
        <span className="text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 700 }}>Summer 2026 Sublet Season</span>
        <span className="text-[#1B2D45]/50" style={{ fontSize: "13px", fontWeight: 400 }}>Listings go fast — check back daily</span>
      </div>
    </motion.div>
  );
}

function SubletHero({ onListClick, canList }: { onListClick: () => void; canList: boolean }) {
  const isMobile = useIsMobile();
  return (
    <motion.div
      className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-4 md:pb-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <div className={`flex ${isMobile ? "flex-col gap-4" : "items-start justify-between"}`}>
        <div style={{ maxWidth: "480px" }}>
          <h1 className="text-[#1B2D45]" style={{ fontSize: isMobile ? "24px" : "30px", fontWeight: 900, lineHeight: 1.15 }}>
            Summer Sublets in Guelph
          </h1>
          <p className="text-[#1B2D45]/50 mt-2" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}>
            Find short-term housing from students leaving for co-op, or list your place while you&apos;re away.
          </p>
        </div>
        {canList ? (
          <motion.button
            onClick={onListClick}
            className="border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors px-5 py-2.5 rounded-xl shrink-0"
            style={{ fontSize: "14px", fontWeight: 700 }}
            whileTap={{ scale: 0.97 }}
          >
            ☀️ List Your Sublet
          </motion.button>
        ) : (
          <div
            className="rounded-xl border border-[#1B2D45]/10 bg-white px-4 py-2.5 text-[#1B2D45]/55 shrink-0"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            Student sublets only
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InsightStats() {
  const isMobile = useIsMobile();
  const stats = [
    { emoji: "☀️", bgColor: "rgba(255,107,53,0.12)", label: "Available now", value: "24 sublets" },
    { emoji: "💰", bgColor: "rgba(46,196,182,0.12)", label: "Avg. savings", value: "28% off regular rent" },
    { emoji: "🛋️", bgColor: "rgba(255,182,39,0.12)", label: "Furnished", value: "18 of 24" },
    { emoji: "✓", bgColor: "rgba(46,196,182,0.12)", label: "Landlord approved", value: "16 verified" },
  ];

  return (
    <motion.div
      className="max-w-[1200px] mx-auto px-4 md:px-6 pb-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-black/[0.04] px-3.5 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bgColor, fontSize: "16px" }}>{s.emoji}</div>
            <div className="min-w-0">
              <div className="text-[#1B2D45]/40 truncate" style={{ fontSize: "11px", fontWeight: 500 }}>{s.label}</div>
              <div className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: 700 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const INITIAL_SUBLET_FORM = {
  title: "",
  address: "",
  postal_code: "",
  description: "",
  rent_per_month: "",
  estimated_utility_cost: "",
  sublet_start_date: "",
  sublet_end_date: "",
  move_in_date: "",
  room_type: "private" as "private" | "shared",
  total_rooms: "1",
  bathrooms: "1",
  beds_available: "1",
  distance_to_campus_km: "",
  walk_time_minutes: "",
  drive_time_minutes: "",
  bus_time_minutes: "",
  nearest_bus_route: "",
  is_furnished: false,
  has_parking: false,
  has_laundry: false,
  utilities_included: false,
  gender_preference: "any" as "any" | "male" | "female" | "other",
};

function ListSubletForm({
  visible,
  selectedRange,
  onCreated,
  onClose,
}: {
  visible: boolean;
  selectedRange: [number, number];
  onCreated: (listing: SubletListing) => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState(INITIAL_SUBLET_FORM);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const roommatesStaying = Math.max(0, Number(form.total_rooms) - Number(form.beds_available));

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/30 focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";
  const labelClass = "text-[#1B2D45] block mb-1.5";
  const labelStyle = { fontSize: "12px" as const, fontWeight: 600 as const };

  const amenities = [
    { key: "is_furnished" as const, label: "Furnished", emoji: "🛋️" },
    { key: "utilities_included" as const, label: "Utilities Incl.", emoji: "💡" },
    { key: "has_parking" as const, label: "Parking", emoji: "🅿️" },
    { key: "has_laundry" as const, label: "Laundry", emoji: "🧺" },
  ];

  const handleSubmit = async () => {
    if (submitting) return;

    if (user?.role === "landlord") {
      toast.error("Landlord accounts can't post student sublets.");
      return;
    }

    if (!token) {
      toast.info("Please sign in to post a sublet.");
      router.push("/login?next=/sublets");
      return;
    }

    const requiredTextFields = [
      form.title.trim(),
      form.address.trim(),
      form.postal_code.trim(),
      form.sublet_start_date,
      form.sublet_end_date,
      form.move_in_date,
      form.nearest_bus_route.trim(),
    ];
    if (requiredTextFields.some((v) => !v)) {
      toast.error("Please fill in the required fields.");
      return;
    }

    const rent = Number(form.rent_per_month);
    const distance = Number(form.distance_to_campus_km);
    const walk = Number(form.walk_time_minutes);
    const drive = Number(form.drive_time_minutes);
    const bus = Number(form.bus_time_minutes);
    const rooms = Number(form.total_rooms);
    const baths = Number(form.bathrooms);
    const utilityCost = Number(form.estimated_utility_cost || 0);
    const bedsAvailable = Number(form.beds_available);

    if ([rent, distance, walk, drive, bus, rooms, baths, bedsAvailable].some((n) => Number.isNaN(n))) {
      toast.error("Please make sure all required numbers are filled in.");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Posting your sublet...");

    try {
      const response = await api.sublets.create({
        title: form.title.trim(),
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
        latitude: null,
        longitude: null,
        distance_to_campus_km: distance,
        walk_time_minutes: walk,
        drive_time_minutes: drive,
        bus_time_minutes: bus,
        nearest_bus_route: form.nearest_bus_route.trim(),
        room_type: form.room_type,
        total_rooms: rooms,
        bathrooms: baths,
        is_furnished: form.is_furnished,
        has_parking: form.has_parking,
        has_laundry: form.has_laundry,
        utilities_included: form.utilities_included,
        estimated_utility_cost: utilityCost,
        rent_per_month: rent,
        sublet_start_date: form.sublet_start_date,
        sublet_end_date: form.sublet_end_date,
        move_in_date: form.move_in_date,
        gender_preference: form.gender_preference === "any" ? null : (form.gender_preference as GenderPreference),
        description: form.description.trim() || null,
      });

      let coverImage = "/demo/listings/house.jpg";
      if (photos.length > 0) {
        try {
          const uploaded = await api.sublets.uploadImages(response.id, photos);
          if (uploaded.length > 0) {
            coverImage = uploaded[0].image_url;
          }
        } catch {
          coverImage = URL.createObjectURL(photos[0]);
        }
      }

      const availableMonths = MONTHS.map((_, i) => i >= selectedRange[0] && i <= selectedRange[1]);
      const flexibleDates = (selectedRange[1] - selectedRange[0]) >= 2;
      const scoreBase = 72
        + (distance <= 0.7 ? 12 : distance <= 1.5 ? 7 : 2)
        + (form.is_furnished ? 4 : 0)
        + (form.utilities_included ? 3 : 0)
        + (form.has_laundry ? 2 : 0)
        + (form.has_parking ? 1 : 0);
      const healthScore = Math.min(96, scoreBase);
      const roommates = Math.max(0, rooms - bedsAvailable);

      onCreated({
        id: String(response.id),
        title: response.title,
        street: response.address.split(",")[0],
        coverImage,
        subletPrice: rent,
        originalPrice: Math.round(rent * 1.22),
        healthScore,
        verified: true,
        posterType: user?.role === "landlord" ? "Landlord" : "Student poster",
        posterIsStudent: user?.role !== "landlord",
        availableMonths,
        neighborhood: distance <= 0.7 ? "Campus" : distance <= 1.5 ? "Near Campus" : "Guelph",
        furnished: form.is_furnished,
        negotiablePrice: form.utilities_included,
        flexibleDates,
        roommatesStaying: roommates > 0 ? roommates : null,
        roommateDesc: roommates > 0 ? `${roommates} roommate${roommates > 1 ? "s" : ""} staying` : null,
        bedsAvailable,
        bedsTotal: rooms,
        distance: `${distance.toFixed(1)} km`,
        walkTime: `${walk} min`,
        amenities: [
          form.is_furnished ? "Furnished" : null,
          form.utilities_included ? "Utilities Incl." : null,
          form.has_parking ? "Parking" : null,
          form.has_laundry ? "Laundry" : null,
        ].filter(Boolean) as string[],
        views: 0,
        saves: 0,
        rotation: response.id % 2 === 0 ? 1.2 : -1.2,
      });

      setForm(INITIAL_SUBLET_FORM);
      setPhotos([]);
      onClose();
      toast.success("Your sublet is live.");
    } catch (error) {
      console.error("Failed to create sublet", error);
      toast.error("We couldn’t post your sublet. Please try again.");
    } finally {
      toast.dismiss(loadingToast);
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="max-w-[1200px] mx-auto px-4 md:px-6 pb-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <div className="bg-white rounded-2xl border border-[#FF6B35]/20 p-5 md:p-7" style={{ boxShadow: "0 4px 24px rgba(255,107,53,0.06)" }}>
            <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>List your sublet ☀️</h3>
            <p className="text-[#1B2D45]/50 mt-1 mb-5" style={{ fontSize: "13px", fontWeight: 400 }}>
              Leaving Guelph for the summer? Every field here shows up on your listing — the more you fill, the better.
            </p>

            {/* ─── Photos ─── */}
            <div className="mb-5">
              <label className={labelClass} style={labelStyle}>Photos (up to 5)</label>
              <div className="flex gap-2 flex-wrap">
                {photos.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-black/[0.06] group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span style={{ fontSize: "10px", fontWeight: 700 }}>✕</span>
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-black/[0.08] flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.02] transition-all">
                    <span className="text-[#1B2D45]/20" style={{ fontSize: "20px" }}>+</span>
                    <span className="text-[#1B2D45]/20" style={{ fontSize: "8px", fontWeight: 500 }}>Add</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                )}
              </div>
            </div>

            {/* ─── Title & Location ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>LISTING INFO</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className={isMobile ? "" : "col-span-2"}>
                  <label className={labelClass} style={labelStyle}>Title *</label>
                  <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Furnished Room in 4BR House" className={inputClass} style={{ fontSize: "13px" }} />
                  <p className="text-[#1B2D45]/20 mt-1" style={{ fontSize: "10px" }}>Give students a quick idea of what you&apos;re subletting</p>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Address *</label>
                  <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. 78 College Ave W, Guelph" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Postal code *</label>
                  <input type="text" value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} placeholder="e.g. N1G 2W1" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div className={isMobile ? "" : "col-span-2"}>
                  <label className={labelClass} style={labelStyle}>Description</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Anything else students should know — vibe, move-in flexibility, etc." rows={2} className={`${inputClass} resize-none`} style={{ fontSize: "13px" }} />
                </div>
              </div>
            </div>

            {/* ─── Pricing ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>PRICING</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Monthly sublet rent *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                    <input type="number" value={form.rent_per_month} onChange={(e) => update("rent_per_month", e.target.value)} placeholder="550" className={`${inputClass} pl-7`} style={{ fontSize: "13px" }} />
                  </div>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Est. monthly utilities</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                    <input type="number" value={form.estimated_utility_cost} onChange={(e) => update("estimated_utility_cost", e.target.value)} placeholder="150" className={`${inputClass} pl-7`} style={{ fontSize: "13px" }} />
                  </div>
                  <p className="text-[#1B2D45]/20 mt-1" style={{ fontSize: "10px" }}>Skip if utilities are included</p>
                </div>
              </div>
            </div>

            {/* ─── Dates ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>AVAILABILITY</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Sublet start date *</label>
                  <input type="date" value={form.sublet_start_date} onChange={(e) => update("sublet_start_date", e.target.value)} className={`${inputClass} bg-white`} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Sublet end date *</label>
                  <input type="date" value={form.sublet_end_date} onChange={(e) => update("sublet_end_date", e.target.value)} className={`${inputClass} bg-white`} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Move-in date *</label>
                  <input type="date" value={form.move_in_date} onChange={(e) => update("move_in_date", e.target.value)} className={`${inputClass} bg-white`} style={{ fontSize: "13px" }} />
                </div>
              </div>
            </div>

            {/* ─── Room Details ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>ROOM DETAILS</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Room type *</label>
                  <div className="flex gap-2">
                    {(["private", "shared"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => update("room_type", t)} className={`flex-1 py-2.5 rounded-xl border transition-all text-center ${form.room_type === t ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"}`} style={{ fontSize: "13px", fontWeight: form.room_type === t ? 600 : 500 }}>
                        {t === "private" ? "🚪 Private Room" : "🛏️ Shared Room"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} style={labelStyle}>Total rooms *</label>
                    <select value={form.total_rooms} onChange={(e) => update("total_rooms", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                      {["1", "2", "3", "4", "5", "6"].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Bathrooms *</label>
                    <select value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                      {["1", "2", "3", "4"].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className={`grid gap-4 mt-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Beds you&apos;re subletting *</label>
                  <select value={form.beds_available} onChange={(e) => update("beds_available", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {Array.from({ length: Number(form.total_rooms) }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2.5">
                  <div className={`px-4 py-2.5 rounded-xl ${roommatesStaying > 0 ? "bg-[#FFB627]/[0.08] text-[#D4990F]" : "bg-[#4ADE80]/[0.08] text-[#4ADE80]"}`} style={{ fontSize: "12px", fontWeight: 600 }}>
                    {roommatesStaying > 0 ? `👥 ${roommatesStaying} roommate${roommatesStaying > 1 ? "s" : ""} staying` : "🏠 Place will be empty"}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className={labelClass} style={labelStyle}>Gender preference</label>
                <div className="flex gap-2">
                  {([{ v: "any", l: "Any" }, { v: "male", l: "Male" }, { v: "female", l: "Female" }, { v: "other", l: "Other" }] as const).map((g) => (
                    <button key={g.v} type="button" onClick={() => update("gender_preference", g.v)} className={`px-3.5 py-2 rounded-xl border transition-all ${form.gender_preference === g.v ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"}`} style={{ fontSize: "12px", fontWeight: form.gender_preference === g.v ? 600 : 500 }}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Getting to Campus ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-1" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>GETTING TO CAMPUS</div>
              <p className="text-[#1B2D45]/20 mb-3" style={{ fontSize: "10px" }}>Helps students compare commute times</p>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Distance to campus (km) *</label>
                  <input type="number" step="0.1" value={form.distance_to_campus_km} onChange={(e) => update("distance_to_campus_km", e.target.value)} placeholder="1.2" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Walk time (min) *</label>
                  <input type="number" value={form.walk_time_minutes} onChange={(e) => update("walk_time_minutes", e.target.value)} placeholder="15" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Drive time (min) *</label>
                  <input type="number" value={form.drive_time_minutes} onChange={(e) => update("drive_time_minutes", e.target.value)} placeholder="5" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Bus time (min) *</label>
                  <input type="number" value={form.bus_time_minutes} onChange={(e) => update("bus_time_minutes", e.target.value)} placeholder="8" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div className={isMobile ? "" : "col-span-2"}>
                  <label className={labelClass} style={labelStyle}>Nearest bus route *</label>
                  <input type="text" value={form.nearest_bus_route} onChange={(e) => update("nearest_bus_route", e.target.value)} placeholder="e.g. Route 99" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
              </div>
            </div>

            {/* ─── Amenities ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>AMENITIES</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {amenities.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => update(a.key, !form[a.key])}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                      form[a.key]
                        ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                        : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"
                    }`}
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${form[a.key] ? "bg-[#FF6B35] border-[#FF6B35]" : "border-[#1B2D45]/15"}`}>
                      {form[a.key] && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span>{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Submit ─── */}
            <div className="border-t border-black/[0.04] pt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors active:scale-[0.98]"
                style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Posting..." : "Post Sublet →"}
              </button>
              <p className="text-[#1B2D45]/20 shrink-0" style={{ fontSize: "10px", maxWidth: "140px", lineHeight: 1.4 }}>
                * Required fields. You can edit after posting.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DateRangeSelector({ selectedRange, onChange }: { selectedRange: [number, number]; onChange: (range: [number, number]) => void }) {
  const isMobile = useIsMobile();
  const [start, end] = selectedRange;
  const [anchorMonth, setAnchorMonth] = useState<number | null>(null);
  const duration = end - start + 1;

  const handleMonthClick = (idx: number) => {
    if (anchorMonth === null) {
      setAnchorMonth(idx);
      return;
    }

    const nextStart = Math.min(anchorMonth, idx);
    const nextEnd = Math.max(anchorMonth, idx);
    onChange([nextStart, nextEnd]);
    setAnchorMonth(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-4">
      <div className="bg-white rounded-2xl border border-black/[0.04] px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap" style={{ boxShadow: "0 2px 12px rgba(27,45,69,0.04)" }}>
        <span style={{ fontSize: "18px" }}>📅</span>
        <span className="text-[#1B2D45] mr-2" style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 600 }}>I need a place</span>
        <div className="flex items-center overflow-x-auto no-scrollbar max-w-full">
          {MONTHS.map((m, i) => {
            const isSelected = i >= start && i <= end;
            const isAnchor = anchorMonth === i;
            const isStart = i === start;
            const isEnd = i === end;
            const isMiddle = isSelected && !isStart && !isEnd;
            return (
              <button
                key={m}
                onClick={() => handleMonthClick(i)}
                className={`relative px-3 md:px-4 py-1.5 transition-all ${isSelected ? "text-white" : "text-[#1B2D45]/50 hover:text-[#FF6B35]"}`}
                style={{
                  fontSize: isMobile ? "12px" : "13px", fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? "#FF6B35" : "transparent",
                  borderRadius: isStart && isEnd ? "10px" : isStart ? "10px 0 0 10px" : isEnd ? "0 10px 10px 0" : isMiddle ? "0" : "10px",
                  boxShadow: isAnchor ? "inset 0 0 0 2px rgba(255,255,255,0.9), 0 0 0 2px rgba(255,107,53,0.35)" : undefined,
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
        <span className="text-[#1B2D45]/30 ml-1" style={{ fontSize: "12px", fontWeight: 500 }}>
          {anchorMonth === null
            ? `(${duration} ${duration === 1 ? "month" : "months"})`
            : `(Start: ${MONTHS[anchorMonth]} · pick end)`}
        </span>
      </div>
    </div>
  );
}

function SubletFiltersModal({
  open,
  activeFilters,
  selectedRange,
  filteredCount,
  onToggleFilter,
  onClear,
  onClose,
}: {
  open: boolean;
  activeFilters: string[];
  selectedRange: [number, number];
  filteredCount: number;
  onToggleFilter: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const [start, end] = selectedRange;
  const monthLabel = `${MONTHS[start]}-${MONTHS[end]}`;
  const proximityFilterKeys = PROXIMITY_FILTER_OPTIONS.map((option) => option.key);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className={`z-[101] bg-white border border-black/[0.04] overflow-hidden flex flex-col ${
              isMobile
                ? "w-full rounded-t-2xl max-h-[78vh]"
                : "rounded-2xl w-[520px] max-w-[calc(100vw-2rem)] max-h-[78vh]"
            }`}
            initial={isMobile ? { y: "100%", opacity: 0 } : { y: 20, opacity: 0, scale: 0.96 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%", opacity: 0 } : { y: 20, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
          >
            <div className="p-4 md:p-5 border-b border-black/[0.05] flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
                  Sublet Filters
                </h3>
                <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>
                  {filteredCount} matches · {monthLabel}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#1B2D45]/50 flex items-center justify-center"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 md:p-5 space-y-4 overflow-y-auto">
              <div className="rounded-xl border border-black/[0.05] bg-[#FAF8F4] p-3">
                <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                  Date Range
                </div>
                <div className="text-[#1B2D45]/45 mt-1" style={{ fontSize: "12px" }}>
                  Using {MONTHS[start]} through {MONTHS[end]} from the timeline selector above.
                </div>
              </div>

              <div>
                <div className="text-[#1B2D45] mb-2" style={{ fontSize: "13px", fontWeight: 700 }}>
                  Campus Proximity
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PROXIMITY_FILTER_OPTIONS.map((option) => {
                    const active = option.key === "any_distance"
                      ? !activeFilters.some((filter) => proximityFilterKeys.includes(filter as ProximityFilterKey))
                      : activeFilters.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        onClick={() => onToggleFilter(option.key)}
                        className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                          active
                            ? "border-[#2EC4B6]/30 bg-[#2EC4B6]/[0.08] text-[#2EC4B6]"
                            : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#2EC4B6]/20 hover:text-[#2EC4B6]"
                        }`}
                        style={{ fontSize: "12px", fontWeight: active ? 700 : 500 }}
                      >
                        <div>{option.label}</div>
                        <div className="mt-0.5 text-current/70" style={{ fontSize: "10px", fontWeight: 500 }}>
                          {option.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                    Amenities & Match Filters
                  </div>
                  {activeFilters.filter((filter) => !proximityFilterKeys.includes(filter as ProximityFilterKey)).length > 0 && (
                    <button
                      onClick={onClear}
                      className="text-[#FF6B35] hover:text-[#e55e2e]"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.map((f) => {
                    const active = activeFilters.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => onToggleFilter(f.key)}
                        className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                          active
                            ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                            : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]"
                        }`}
                        style={{ fontSize: "12px", fontWeight: active ? 700 : 500 }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 border-t border-black/[0.05] flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-[#1B2D45]/60 hover:bg-black/[0.02]"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                Done
              </button>
              <div
                className="px-3 py-2.5 rounded-xl bg-[#FF6B35] text-white"
                style={{ fontSize: "13px", fontWeight: 700 }}
              >
                {filteredCount} match{filteredCount !== 1 ? "es" : ""}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TimelineLegend() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-2 rounded-full bg-[#FF6B35]" />
          <span className="text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 500 }}>Available in your dates</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-2 rounded-full bg-[#1B2D45]/[0.08]" />
          <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>Not available</span>
        </div>
      </div>
    </div>
  );
}

function AvailabilityTimeline({ months, selectedRange }: { months: boolean[]; selectedRange: [number, number] }) {
  return (
    <div className="mt-2.5">
      <div className="flex gap-1">
        {months.map((available, i) => {
          const inRange = i >= selectedRange[0] && i <= selectedRange[1];
          const matchesSearch = available && inRange;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full h-2 rounded-full" style={{ background: matchesSearch ? "#FF6B35" : available ? "rgba(255,107,53,0.25)" : "rgba(27,45,69,0.08)" }} />
              <span className="text-[#1B2D45]/30" style={{ fontSize: "8px", fontWeight: 500 }}>{MONTHS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Sublet Card
   ════════════════════════════════════════════════════════ */

function SubletCard({ listing, selectedRange, isMobile, isPinned, onTogglePin }: { listing: SubletListing; selectedRange: [number, number]; isMobile: boolean; isPinned?: boolean; onTogglePin?: (id: string) => void }) {
  const router = useRouter();
  const [savedFallback, setSavedFallback] = useState(false);
  const hasListingId = typeof listing.listing_id === "number";
  const saved = useSavedStore((s) => hasListingId ? s.savedIds.has(listing.listing_id!) : false);
  const toggling = useSavedStore((s) => hasListingId ? s.togglingIds.has(listing.listing_id!) : false);
  const toggleSave = useSavedStore((s) => s.toggleSave);
  const discount = Math.round(((listing.originalPrice - listing.subletPrice) / listing.originalPrice) * 100);
  const scoreColor = getScoreColor(listing.healthScore);
  const scoreLabel = getScoreLabel(listing.healthScore);
  const isSaved = hasListingId ? saved : savedFallback;
  const walkMinutes = parseSubletWalkTime(listing.walkTime);
  const proximity = getProximityLabel(walkMinutes);

  const handleSaveClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasListingId) {
      setSavedFallback((current) => !current);
      return;
    }

    try {
      await toggleSave(listing.listing_id!);
    } catch (err) {
      if (err instanceof Error && err.message === "auth_required") {
        router.push("/login");
      }
    }
  }, [hasListingId, listing.listing_id, toggleSave, router]);

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20, rotate: listing.rotation }}
      animate={{ opacity: 1, y: 0, rotate: listing.rotation }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      whileHover={isMobile ? undefined : { y: -8, rotate: 0, scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 24 } }}
    >
      {/* Pushpin */}
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" }}>
        <Pushpin />
      </div>
      <TapeStrip side="left" rotation={-8} />
      <TapeStrip side="right" rotation={6} />

      <Link href={`/sublets/${listing.id}`} className="bg-white rounded-sm overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow block" style={{ padding: "10px 10px 18px 10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Image area */}
        <div className="relative rounded-sm overflow-hidden" style={{ height: isMobile ? "138px" : "176px" }}>
          {listing.coverImage ? (
            <img src={listing.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(46,196,182,0.15) 100%)" }}>
              <span style={{ fontSize: "36px", opacity: 0.3 }}>☀️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

          {/* Score + discount */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <ScoreRing score={listing.healthScore} size={isMobile ? 30 : 34} />
            <div className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: "9px", fontWeight: 700, background: "rgba(46,196,182,0.9)" }}>
              ↓ {discount}% off
            </div>
          </div>

          {/* Save */}
          <div className="absolute top-2 right-2">
            <motion.button onClick={handleSaveClick} disabled={toggling} className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm disabled:opacity-50" whileTap={{ scale: 0.85 }}>
              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-[#E71D36] text-[#E71D36]" : "text-[#1B2D45]/40"}`} />
            </motion.button>
          </div>

          {/* Bottom badges */}
          <div className="absolute bottom-2 left-2 flex flex-col gap-1">
            {listing.verified && (
              <div className="px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(46,196,182,0.85)", fontSize: "9px", fontWeight: 600, color: "white" }}>✓ Landlord Approved</div>
            )}
            {listing.posterIsStudent && (
              <div className="px-2 py-0.5 rounded-full" style={{ background: "rgba(27,45,69,0.75)", fontSize: "9px", fontWeight: 600, color: "white" }}>👤 {listing.posterType}</div>
            )}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm" style={{ fontSize: "9px", fontWeight: 600, color: "#1B2D45" }}>{listing.neighborhood}</div>
        </div>

        {/* Content */}
        <div className="px-3 pt-4 pb-3">
          <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 700 }}>{listing.title}</h3>
          <p className="text-[#1B2D45]/40 truncate mt-1" style={{ fontSize: "11px", fontWeight: 400 }}>{listing.street}</p>

          <AvailabilityTimeline months={listing.availableMonths} selectedRange={selectedRange} />

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-[#FF6B35]" style={{ fontSize: "22px", fontWeight: 800 }}>
              ${listing.subletPrice}<span style={{ fontSize: "12px", fontWeight: 500 }}>/mo</span>
            </span>
            <span className="text-[#1B2D45]/30 line-through" style={{ fontSize: "13px", fontWeight: 500 }}>${listing.originalPrice}</span>
          </div>

          {/* Flexibility badges */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "10px", fontWeight: 600, color: proximity.color, background: proximity.bg }}>
              {proximity.emoji} {proximity.label}
            </span>
            {listing.negotiablePrice && (
              <span className="px-2.5 py-1 rounded-full border" style={{ fontSize: "10px", fontWeight: 600, background: "rgba(46,196,182,0.08)", borderColor: "rgba(46,196,182,0.2)", color: "#2EC4B6" }}>💬 Price Negotiable</span>
            )}
            {listing.flexibleDates && (
              <span className="px-2.5 py-1 rounded-full border" style={{ fontSize: "10px", fontWeight: 600, background: "rgba(255,182,39,0.08)", borderColor: "rgba(255,182,39,0.2)", color: "#D4990F" }}>📅 Flexible Dates</span>
            )}
            {listing.furnished && (
              <span className="px-2.5 py-1 rounded-full border" style={{ fontSize: "10px", fontWeight: 600, background: "rgba(27,45,69,0.06)", borderColor: "rgba(27,45,69,0.12)", color: "#1B2D45" }}>🛋️ Furnished</span>
            )}
          </div>

          {/* Roommate info */}
          {listing.roommatesStaying !== null && listing.roommatesStaying > 0 && (
            <div className="mt-3 rounded-lg px-3 py-2.5" style={{ background: "rgba(27,45,69,0.04)" }}>
              <div className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>
                🏠 {listing.roommatesStaying} roommate{listing.roommatesStaying > 1 ? "s" : ""} staying
              </div>
              {listing.roommateDesc && <div className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "10px", fontWeight: 400 }}>{listing.roommateDesc}</div>}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-[#1B2D45]/5 text-[#1B2D45]/50 px-2.5 py-1 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>📍 {listing.distance}</span>
            <span className="bg-[#1B2D45]/5 text-[#1B2D45]/50 px-2.5 py-1 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>🚶 {listing.walkTime}</span>
            <span className="bg-[#1B2D45]/5 text-[#1B2D45]/50 px-2.5 py-1 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>{listing.bedsAvailable}/{listing.bedsTotal} beds</span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {listing.amenities.map((a) => (
              <span key={a} className="px-2.5 py-1 rounded border border-black/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 500 }}>{a}</span>
            ))}
          </div>

          {/* Pin to board */}
          {onTogglePin && (
            <button
              onClick={(e) => { e.preventDefault(); onTogglePin(listing.id); }}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-all active:scale-[0.97] ${
                isPinned
                  ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                  : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]/60"
              }`}
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              📌 {isPinned ? "Pinned" : "Pin to board"}
            </button>
          )}

          {/* Bottom bar */}
          <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between">
            <span className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 500 }}>👁 {listing.views} viewed · ❤️ {listing.saves} saved</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: scoreColor }}>{scoreLabel}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function BottomCTA({ onListClick, canList }: { onListClick: () => void; canList: boolean }) {
  const isMobile = useIsMobile();
  return (
    <motion.div
      className="max-w-[1200px] mx-auto px-4 md:px-6 pb-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className={`bg-white rounded-2xl border border-black/[0.04] p-6 md:p-8 flex ${isMobile ? "flex-col gap-4" : "items-center justify-between"}`} style={{ boxShadow: "0 2px 16px rgba(27,45,69,0.04)" }}>
        <div style={{ maxWidth: "480px" }}>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Leaving Guelph for the summer? ✈️</h3>
          <p className="text-[#1B2D45]/45 mt-1.5" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.6 }}>
            Don&apos;t pay rent on an empty room. List your sublet in 2 minutes — it&apos;s free, and we&apos;ll help you find someone.
          </p>
        </div>
        {canList ? (
          <motion.button
            onClick={onListClick}
            className="px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors shrink-0"
            style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            whileTap={{ scale: 0.97 }}
          >
            List Your Sublet →
          </motion.button>
        ) : (
          <Link
            href="/landlord"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[#1B2D45]/10 text-[#1B2D45]/60 hover:border-[#1B2D45]/20 hover:text-[#1B2D45] transition-colors shrink-0"
            style={{ fontSize: "13px", fontWeight: 700 }}
          >
            Go to Landlord Dashboard
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════ */

const desktopStaggers = [0, 18, 8, 14, 4, 20];

/* ════════════════════════════════════════════════════════
   Sublet Compare Modal (matches browse flow + AI summary)
   ════════════════════════════════════════════════════════ */

interface SubletCompareRow {
  label: string;
  icon?: React.ReactNode;
  values: SubletCellValue[];
  type: "text" | "price" | "boolean" | "score" | "distance" | "time";
  bestFn?: "lowest" | "highest";
}

function SubletCompareCell({
  value,
  type,
  isBest,
}: {
  value: SubletCellValue;
  type: SubletCompareRow["type"];
  isBest: boolean;
}) {
  const bestClass = isBest ? "text-[#4ADE80] font-bold" : "text-[#1B2D45]";

  if (value === null || value === undefined) {
    return <span className="text-[#1B2D45]/20" style={{ fontSize: "13px" }}>—</span>;
  }

  if (type === "boolean") {
    return value ? (
      <Check className={`w-4 h-4 ${isBest ? "text-[#4ADE80]" : "text-[#2EC4B6]"}`} />
    ) : (
      <Minus className="w-4 h-4 text-[#1B2D45]/15" />
    );
  }

  if (type === "price") {
    return <span className={bestClass} style={{ fontSize: "14px", fontWeight: 700 }}>{formatPrice(value as number)}</span>;
  }

  if (type === "score") {
    const score = value as number;
    return <span style={{ fontSize: "14px", fontWeight: 700, color: getScoreColor(score) }}>{score}</span>;
  }

  if (type === "distance") {
    return <span className={bestClass} style={{ fontSize: "13px", fontWeight: 600 }}>{value} km</span>;
  }

  if (type === "time") {
    return <span className={bestClass} style={{ fontSize: "13px", fontWeight: 600 }}>{value} min</span>;
  }

  return <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{String(value)}</span>;
}

function SubletCompareModal({
  isOpen,
  onClose,
  listings,
}: {
  isOpen: boolean;
  onClose: () => void;
  listings: SubletListing[];
}) {
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen && listings.length >= 2) {
      setAiLoading(true);
      setShowAI(true);
      const timer = setTimeout(() => {
        setAiText(generateSubletCompareSummary(listings));
        setAiLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    setShowAI(false);
    setAiText("");
  }, [isOpen, listings]);

  const rows: SubletCompareRow[] = useMemo(() => {
    const vals = (fn: (l: SubletListing) => SubletCellValue) => listings.map(fn);
    return [
      { label: "Sublet Price", icon: <DollarSign className="w-3.5 h-3.5" />, values: vals((l) => l.subletPrice), type: "price", bestFn: "lowest" },
      { label: "Original Rent", icon: <DollarSign className="w-3.5 h-3.5" />, values: vals((l) => l.originalPrice), type: "price", bestFn: "lowest" },
      { label: "Cribb Score", icon: <ShieldCheck className="w-3.5 h-3.5" />, values: vals((l) => l.healthScore), type: "score", bestFn: "highest" },
      { label: "Distance", icon: <MapPin className="w-3.5 h-3.5" />, values: vals((l) => parseSubletDistance(l.distance)), type: "distance", bestFn: "lowest" },
      { label: "Walk Time", icon: <Clock className="w-3.5 h-3.5" />, values: vals((l) => parseSubletWalkTime(l.walkTime)), type: "time", bestFn: "lowest" },
      { label: "Neighborhood", values: vals((l) => l.neighborhood), type: "text" },
      { label: "Type", values: vals((l) => (l.roommatesStaying === null ? "Entire place" : "Private room")), type: "text" },
      { label: "Beds", values: vals((l) => `${l.bedsAvailable} of ${l.bedsTotal}`), type: "text" },
      { label: "Furnished", values: vals((l) => l.furnished), type: "boolean" },
      { label: "Negotiable", values: vals((l) => l.negotiablePrice), type: "boolean" },
      { label: "Verified", values: vals((l) => l.verified), type: "boolean" },
      { label: "Parking", values: vals((l) => l.amenities.includes("Parking")), type: "boolean" },
      { label: "Utilities Incl.", values: vals((l) => l.amenities.includes("Utilities Incl.")), type: "boolean" },
      { label: "Poster", values: vals((l) => l.posterType), type: "text" },
    ];
  }, [listings]);

  if (!isOpen || listings.length === 0) return null;

  const colWidth = listings.length <= 2 ? "min-w-[220px]" : listings.length === 3 ? "min-w-[180px]" : "min-w-[160px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex flex-col"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-black/[0.06] px-5 py-4 flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                <span style={{ fontSize: "16px" }}>📊</span>
              </div>
              <div>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                  Compare Sublets
                </h2>
                <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>
                  {listings.length} picks · Best values highlighted in green
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-[#1B2D45]/50" />
            </button>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex-1 overflow-auto bg-[#FAF8F4]"
          >
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-5">
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 bg-gradient-to-br from-[#FF6B35]/[0.04] to-[#FFB627]/[0.04] rounded-xl border border-[#FF6B35]/10 p-5"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>AI Analysis</span>
                    </div>
                    {aiLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]/40"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                        <span className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>Analyzing your picks...</span>
                      </div>
                    ) : (
                      <p className="text-[#1B2D45]/70" style={{ fontSize: "13px", lineHeight: 1.7 }}>{aiText}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: `${140 + listings.length * 180}px` }}>
                    <thead>
                      <tr className="border-b border-black/[0.04]">
                        <th className="w-[140px] min-w-[140px] p-4 text-left sticky left-0 bg-white z-10" />
                        {listings.map((l) => (
                          <th key={l.id} className={`${colWidth} p-4 text-center`}>
                            <Link href={`/sublets/${l.id}`} className="group block">
                              <div className="w-full h-[100px] rounded-lg bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] mb-2.5 overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span style={{ fontSize: "24px" }}>☀️</span>
                                </div>
                                <div
                                  className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-white"
                                  style={{ fontSize: "10px", fontWeight: 800, backgroundColor: getScoreColor(l.healthScore) }}
                                >
                                  {l.healthScore}
                                </div>
                              </div>
                              <p className="text-[#1B2D45] truncate group-hover:text-[#FF6B35] transition-colors" style={{ fontSize: "13px", fontWeight: 700 }}>
                                {l.title}
                              </p>
                              <p className="text-[#1B2D45]/30 truncate mt-0.5" style={{ fontSize: "10px" }}>
                                {l.street}
                              </p>
                              <div className="flex items-center justify-center gap-1 mt-1.5 text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: "10px", fontWeight: 600 }}>
                                View sublet <ExternalLink className="w-2.5 h-2.5" />
                              </div>
                            </Link>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => {
                        const bestIndices = row.bestFn ? getSubletBestIndex(row.values, row.bestFn) : [];
                        return (
                          <tr key={row.label} className={`border-b border-black/[0.02] ${ri % 2 === 0 ? "bg-white" : "bg-[#FAF8F4]/50"}`}>
                            <td className="px-4 py-3 sticky left-0 z-10" style={{ backgroundColor: ri % 2 === 0 ? "white" : "#FDFCFA" }}>
                              <div className="flex items-center gap-2">
                                {row.icon && <span className="text-[#1B2D45]/25">{row.icon}</span>}
                                <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 600 }}>{row.label}</span>
                              </div>
                            </td>
                            {row.values.map((val, ci) => (
                              <td key={ci} className="px-4 py-3 text-center">
                                <SubletCompareCell value={val} type={row.type} isBest={bestIndices.includes(ci)} />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-center text-[#1B2D45]/25 mt-4" style={{ fontSize: "11px" }}>
                Tap any sublet header to view full details · Green highlights indicate best value in each row
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════
   Sublet Picks Tray
   ════════════════════════════════════════════════════════ */

function SubletPickCard({ listing, onRemove }: { listing: SubletListing; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 bg-[#FAF8F4] rounded-xl px-3 py-2 shrink-0 border border-black/[0.04]"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center shrink-0">
        {listing.coverImage ? (
          <img src={listing.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: "14px" }}>🏠</span>
        )}
      </div>
      <div className="min-w-0">
        <Link
          href={`/sublets/${listing.id}`}
          className="text-[#1B2D45] truncate block max-w-[140px] hover:underline"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          {listing.title}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 800 }}>
            ${listing.subletPrice}
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getScoreColor(listing.healthScore) }} />
          <span className="text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 600 }}>
            {listing.healthScore}
          </span>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors ml-1 shrink-0"
        aria-label={`Remove ${listing.title} from picks`}
      >
        <X className="w-3 h-3 text-[#1B2D45]/40" />
      </button>
    </motion.div>
  );
}

function SubletPicksTray({ picks, onRemove, onCompare, showSheet, onCloseSheet }: { picks: SubletListing[]; onRemove: (id: string) => void; onCompare: () => void; showSheet: boolean; onCloseSheet: () => void }) {
  const isMobile = useIsMobile();

  if (picks.length === 0) return null;

  // Desktop: horizontal tray (matches browse)
  if (!isMobile) {
    return (
      <AnimatePresence>
        {picks.length > 0 && (
          <motion.div
            className="max-w-[1200px] mx-auto px-4 md:px-6 pb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="bg-white rounded-2xl border border-[#FF6B35]/15 p-4 shadow-[0_2px_12px_rgba(255,107,53,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "15px" }}>📌</span>
                  <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                    My Picks
                  </span>
                  <motion.span
                    key={picks.length}
                    className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-full"
                    style={{ fontSize: "10px", fontWeight: 700 }}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {picks.length}
                  </motion.span>
                </div>
                <button onClick={onCompare} className="flex items-center gap-1.5 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Compare all
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                <AnimatePresence>
                  {picks.map((s) => (
                    <SubletPickCard key={s.id} listing={s} onRemove={() => onRemove(s.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Mobile: bottom sheet
  return (
    <AnimatePresence>
      {showSheet && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseSheet} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[70vh] flex flex-col"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-black/10" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "15px" }}>📌</span>
                <span className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>My Picks</span>
                <span className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 700 }}>
                  {picks.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onCompare} className="flex items-center gap-1.5 text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Compare
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={onCloseSheet} className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center ml-1" aria-label="Close picks">
                  <ChevronDown className="w-4 h-4 text-[#1B2D45]/40" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar p-4">
              <div className="flex gap-3">
                <AnimatePresence>
                  {picks.map((s) => (
                    <SubletPickCard key={s.id} listing={s} onRemove={() => onRemove(s.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════
   Sublet Grid Card (compact, no rotation)
   ════════════════════════════════════════════════════════ */

function SubletGridCard({ listing, selectedRange, isPinned, onTogglePin }: { listing: SubletListing; selectedRange: [number, number]; isPinned?: boolean; onTogglePin?: (id: string) => void }) {
  const discount = Math.round(((listing.originalPrice - listing.subletPrice) / listing.originalPrice) * 100);
  const walkMinutes = parseSubletWalkTime(listing.walkTime);
  const proximity = getProximityLabel(walkMinutes);

  return (
    <Link href={`/sublets/${listing.id}`} className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden hover:shadow-[0_12px_28px_rgba(27,45,69,0.08)] hover:border-[#FF6B35]/15 transition-all group block">
      {/* Image */}
      <div className="h-[152px] bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center relative overflow-hidden">
        {listing.coverImage ? (
          <img src={listing.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: "30px" }}>🏠</span>
        )}
        <div className="absolute top-2.5 left-2.5">
          <ScoreRing score={listing.healthScore} size={32} />
        </div>
        {discount > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-[#2EC4B6] text-white px-2 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 700 }}>
            ↓ {discount}%
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{listing.title}</h4>
        <p className="text-[#1B2D45]/30 truncate mt-0.5" style={{ fontSize: "11px" }}>{listing.street} · {listing.neighborhood}</p>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-[#FF6B35]" style={{ fontSize: "19px", fontWeight: 800 }}>${listing.subletPrice}</span>
          <span className="text-[#1B2D45]/20 line-through" style={{ fontSize: "11px" }}>${listing.originalPrice}</span>
          <span className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>/mo</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 600, color: proximity.color, background: proximity.bg }}>
            {proximity.emoji} {proximity.label}
          </span>
          {listing.verified && <span className="bg-[#2EC4B6]/[0.10] text-[#2EC4B6] px-2 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 600 }}>Verified</span>}
          {listing.furnished && <span className="bg-[#1B2D45]/5 text-[#1B2D45]/40 px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 500 }}>Furnished</span>}
          {listing.flexibleDates && <span className="bg-[#FFB627]/[0.10] text-[#D4990F] px-2 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 600 }}>Flexible dates</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-xl bg-[#FAF8F4] px-2.5 py-2 text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>
            📍 {listing.distance}
          </div>
          <div className="rounded-xl bg-[#FAF8F4] px-2.5 py-2 text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>
            🚶 {listing.walkTime}
          </div>
          <div className="rounded-xl bg-[#FAF8F4] px-2.5 py-2 text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>
            🛏 {listing.bedsAvailable}/{listing.bedsTotal} beds
          </div>
          <div className="rounded-xl bg-[#FAF8F4] px-2.5 py-2 text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>
            {listing.posterIsStudent ? "🎓 Student post" : "🏢 Managed post"}
          </div>
        </div>
        {listing.roommatesStaying !== null && (
          <div className="mt-3 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 text-[#1B2D45]/60" style={{ fontSize: "10px", fontWeight: 600 }}>
            {listing.roommatesStaying > 0
              ? `🏠 ${listing.roommatesStaying} roommate${listing.roommatesStaying > 1 ? "s" : ""} staying`
              : "🏠 Entire place available"}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.amenities.slice(0, 2).map((amenity) => (
            <span key={amenity} className="bg-[#1B2D45]/5 text-[#1B2D45]/40 px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 500 }}>
              {amenity}
            </span>
          ))}
          {listing.negotiablePrice && (
            <span className="bg-[#2EC4B6]/[0.08] text-[#2EC4B6] px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 600 }}>
              Negotiable
            </span>
          )}
        </div>
        {/* Availability mini-bar */}
        <div className="flex gap-0.5 mt-3">
          {MONTHS.map((m, idx) => (
            <div key={m} className="flex-1 h-1.5 rounded-full" style={{ background: listing.availableMonths[idx] ? (idx >= selectedRange[0] && idx <= selectedRange[1] ? "#FF6B35" : "#FF6B35" + "40") : "#e5e5e5" }} />
          ))}
        </div>
        {onTogglePin && (
          <button onClick={(e) => { e.preventDefault(); onTogglePin(listing.id); }} className={`mt-3 w-full py-2 rounded-lg border text-center transition-all active:scale-[0.97] ${isPinned ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/30 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
            📌 {isPinned ? "Pinned" : "Pin"}
          </button>
        )}
      </div>
    </Link>
  );
}

function SubletMapNearbyFilters({
  activeTypes,
  onToggle,
}: {
  activeTypes: Set<LandmarkType>;
  onToggle: (type: LandmarkType) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-[10] overflow-hidden rounded-2xl bg-white/92 shadow-md backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center gap-2 px-3 py-2.5 text-[#1B2D45] transition-colors hover:bg-black/[0.02]"
        style={{ fontSize: "11px", fontWeight: 800 }}
      >
        <span>📍</span>
        Nearby places
        <ChevronDown className={`h-3.5 w-3.5 text-[#1B2D45]/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="border-t border-black/[0.06] px-3 pb-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {MAP_VIEW_LANDMARK_ORDER.map((type) => {
              const config = LANDMARK_TYPES[type];
              const isActive = activeTypes.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggle(type)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all ${
                    isActive ? "bg-white shadow-sm" : "bg-black/[0.03] opacity-45"
                  }`}
                  style={{
                    borderColor: isActive ? `${config.color}30` : "transparent",
                    color: "#1B2D45",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SubletMapSummary({ listings, selectedRange }: { listings: SubletListing[]; selectedRange: [number, number] }) {
  return (
    <div className="absolute left-4 top-4 z-[10] max-w-[calc(100%-5rem)] sm:max-w-[250px] rounded-2xl bg-white/92 px-3 py-2.5 shadow-md backdrop-blur-sm sm:px-4 sm:py-3">
      <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800 }}>
        Summer sublets
      </div>
      <div className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "10px", fontWeight: 600 }}>
        {listings.length} sublets · {MONTHS[selectedRange[0]]} to {MONTHS[selectedRange[1]]}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#2EC4B6]/10 px-2 py-1 text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 700 }}>
          ☀️ Short-term stays
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/10 px-2 py-1 text-[#FF6B35]" style={{ fontSize: "9px", fontWeight: 700 }}>
          🎓 Campus-ready
        </span>
      </div>
    </div>
  );
}

function SubletMapControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="absolute right-4 top-4 z-[10] flex flex-col gap-2">
      <button onClick={onZoomIn} className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50">
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B2D45]" />
      </button>
      <button onClick={onZoomOut} className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50">
        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B2D45]" />
      </button>
    </div>
  );
}

function SubletMapHint() {
  return (
    <div className="absolute bottom-4 right-4 z-[10] hidden max-w-[220px] rounded-2xl bg-white/90 px-3 py-2.5 shadow-md backdrop-blur-sm md:block">
      <p className="text-[#1B2D45]/55" style={{ fontSize: "10px", fontWeight: 700, lineHeight: 1.45 }}>
        Keep the map clean, then turn on groceries, gyms, trails, or transit when you need them.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Sublet Map View (Guelph campus)
   ════════════════════════════════════════════════════════ */

function SubletMapView({ listings, pinnedIds, onTogglePin, selectedRange }: { listings: SubletListing[]; pinnedIds: string[]; onTogglePin: (id: string) => void; selectedRange: [number, number] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(13.8);
  const [mapSize, setMapSize] = useState({ width: 960, height: 720 });
  const [activePoiTypes, setActivePoiTypes] = useState<Set<LandmarkType>>(
    () => new Set(DEFAULT_MAP_VIEW_LANDMARKS)
  );
  const selectedSublet = listings.find((l) => l.id === selectedId);

  // Mock coords for sublets based on neighborhood
  const subletCoords: Record<string, { lat: number; lng: number }> = {
    s1: { lat: 43.5310, lng: -80.2240 },
    s2: { lat: 43.5220, lng: -80.2450 },
    s3: { lat: 43.5290, lng: -80.2210 },
    s4: { lat: 43.5470, lng: -80.2490 },
    s5: { lat: 43.5350, lng: -80.2180 },
    s6: { lat: 43.5190, lng: -80.2500 },
    s7: { lat: 43.5260, lng: -80.2350 },
    s8: { lat: 43.5400, lng: -80.2600 },
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setMapSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedId && listings.length > 0) {
      setSelectedId(listings[0].id);
    }
  }, [listings, selectedId]);

  const staticMapUrl = useMemo(() => buildStaticMapUrl({
    center: GUELPH_CENTER,
    zoom: mapZoom,
    width: mapSize.width,
    height: mapSize.height,
  }), [mapSize.height, mapSize.width, mapZoom]);

  const markerPoints = useMemo(() => {
    return listings.map((sublet) => {
      const coords = subletCoords[sublet.id];
      if (!coords) return null;
      const point = projectLngLatToContainer({
        lat: coords.lat,
        lng: coords.lng,
        center: GUELPH_CENTER,
        zoom: mapZoom,
        width: mapSize.width,
        height: mapSize.height,
      });
      return { sublet, point };
    }).filter(Boolean) as { sublet: SubletListing; point: { x: number; y: number } }[];
  }, [listings, mapSize.height, mapSize.width, mapZoom]);

  const poiPoints = useMemo(() => {
    return GUELPH_LANDMARKS.filter((landmark) => activePoiTypes.has(landmark.type))
      .map((landmark) => {
        const point = projectLngLatToContainer({
          lat: landmark.lat,
          lng: landmark.lng,
          center: GUELPH_CENTER,
          zoom: mapZoom,
          width: mapSize.width,
          height: mapSize.height,
        });

        if (point.x < -24 || point.x > mapSize.width + 24 || point.y < -24 || point.y > mapSize.height + 24) {
          return null;
        }

        return { landmark, point };
      })
      .filter(Boolean) as { landmark: (typeof GUELPH_LANDMARKS)[number]; point: { x: number; y: number } }[];
  }, [activePoiTypes, mapSize.height, mapSize.width, mapZoom]);

  const togglePoiType = useCallback((type: LandmarkType) => {
    setActivePoiTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-5">
      <div
        className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white xl:h-[calc(100vh-190px)]"
        style={{ boxShadow: "0 22px 55px rgba(27,45,69,0.08)" }}
      >
        <div className="grid xl:h-full xl:grid-cols-[minmax(0,1.18fr)_430px]">
          <div className="relative min-h-[54vh] bg-[#EEF5F4] xl:h-full">
            <div ref={mapRef} className="absolute inset-0" />
            {staticMapUrl ? (
              <img src={staticMapUrl} alt="Guelph sublet map" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#EEF5F4_0%,#E4EFED_100%)]" />
            )}

            <SubletMapSummary listings={listings} selectedRange={selectedRange} />
            <SubletMapControls
              onZoomIn={() => setMapZoom((value) => Math.min(16.5, value + 0.8))}
              onZoomOut={() => setMapZoom((value) => Math.max(11.5, value - 0.8))}
            />
            <SubletMapNearbyFilters activeTypes={activePoiTypes} onToggle={togglePoiType} />
            <SubletMapHint />

            <div className="absolute inset-0 z-[5]">
              {poiPoints.map(({ landmark, point }) => {
                const config = LANDMARK_TYPES[landmark.type];
                const isCampus = landmark.type === "campus";
                return (
                  <div
                    key={landmark.name}
                    title={landmark.name}
                    className="absolute flex items-center justify-center rounded-full border-2 border-white shadow-[0_3px_12px_rgba(0,0,0,0.14)]"
                    style={{
                      width: isCampus ? 34 : landmark.type === "park" ? 26 : 24,
                      height: isCampus ? 34 : landmark.type === "park" ? 26 : 24,
                      left: point.x,
                      top: point.y,
                      transform: "translate(-50%, -50%)",
                      background: `${config.color}E8`,
                      zIndex: isCampus ? 4 : 3,
                      fontSize: isCampus ? "16px" : landmark.type === "park" ? "12px" : "11px",
                    }}
                  >
                    <span>{landmark.emoji}</span>
                  </div>
                );
              })}

              {markerPoints.map(({ sublet, point }) => {
                const isSelected = selectedSublet?.id === sublet.id;
                return (
                  <button
                    key={sublet.id}
                    onClick={() => setSelectedId(sublet.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2EC4B6] bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all"
                    style={{
                      left: point.x,
                      top: point.y,
                      transform: `translate(-50%, -50%) scale(${isSelected ? 1.08 : 1})`,
                      background: isSelected ? "#1B2D45" : "white",
                      zIndex: isSelected ? 8 : 6,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#2EC4B6]" />
                      <span style={{ fontSize: "11px", fontWeight: 800, color: isSelected ? "white" : "#2EC4B6" }}>
                        ${sublet.subletPrice}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          <div className="min-h-[46vh] border-t xl:h-full xl:border-t-0 xl:border-l border-black/[0.06] bg-[#FCFBF8] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] bg-white/92 backdrop-blur-sm">
              <div className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 700 }}>
                Home • ON • Guelph
              </div>
              <h2 className="mt-1 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                {listings.length} sublets found
              </h2>
              <p className="mt-1 text-[#1B2D45]/42" style={{ fontSize: "12px" }}>
                Compare summer options by price, walk time, and setup.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {listings.map((listing) => {
                const proximity = getProximityLabel(parseSubletWalkTime(listing.walkTime));
                const isSelected = selectedSublet?.id === listing.id;
                return (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedId(listing.id)}
                    className={`rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#2EC4B6]/35 shadow-[0_12px_28px_rgba(46,196,182,0.12)]"
                        : "border-black/[0.06] hover:border-[#1B2D45]/12 hover:shadow-[0_10px_24px_rgba(27,45,69,0.08)]"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 800 }}>{listing.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[#1B2D45]/40 min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate" style={{ fontSize: "11px", fontWeight: 500 }}>{listing.street}</span>
                          </div>
                        </div>
                        <ScoreRing score={listing.healthScore} size={40} />
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border"
                          style={{ fontSize: "10px", fontWeight: 700, color: proximity.color, background: proximity.bg, borderColor: `${proximity.color}22` }}
                        >
                          <span>{proximity.emoji}</span>
                          <span>{proximity.label}</span>
                        </span>
                        <span className="text-[#1B2D45]/42" style={{ fontSize: "11px", fontWeight: 600 }}>{listing.walkTime} walk</span>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-[#1B2D45]/52 flex-wrap" style={{ fontSize: "11px", fontWeight: 600 }}>
                        <span>{listing.bedsAvailable}/{listing.bedsTotal} beds</span>
                        <span>{listing.neighborhood}</span>
                        <span>{listing.posterType}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Link href={`/sublets/${listing.id}`} className="flex-1 py-2 rounded-xl bg-[#2EC4B6] text-white text-center hover:bg-[#28b0a3]" style={{ fontSize: "12px", fontWeight: 700 }}>
                          View sublet
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); onTogglePin(listing.id); }} className={`px-3 py-2 rounded-xl border flex items-center gap-1 ${pinnedIds.includes(listing.id) ? "border-[#2EC4B6]/30 bg-[#2EC4B6]/[0.08] text-[#2EC4B6]" : "border-black/[0.06] text-[#1B2D45]/40"}`} style={{ fontSize: "12px", fontWeight: 700 }}>
                          📌 {pinnedIds.includes(listing.id) ? "Pinned" : "Pin"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

export default function SubletsPage() {
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);
  const [listings, setListings] = useState<SubletListing[]>(subletListings);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<[number, number]>([4, 6]); // May-Jul default (summer feel)
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<SubletViewMode>("board");
  const [showPicksSheet, setShowPicksSheet] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const isLandlord = user?.role === "landlord";
  const router = useRouter();

  const handleListClick = () => {
    if (isLandlord) {
      toast.info("Sublet posting is only available for student accounts.");
      return;
    }
    router.push("/sublets/create");
  };
  const proximityFilterKeys = PROXIMITY_FILTER_OPTIONS.map((option) => option.key);

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      if (proximityFilterKeys.includes(key as ProximityFilterKey)) {
        const withoutProximity = prev.filter((k) => !proximityFilterKeys.includes(k as ProximityFilterKey));
        if (key === "any_distance") return withoutProximity;
        return prev.includes(key) ? withoutProximity : [...withoutProximity, key];
      }
      return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
    });
  };
  const clearFilters = () => setActiveFilters([]);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]);
  };

  const pinnedListings = useMemo(() => listings.filter((l) => pinnedIds.includes(l.id)), [listings, pinnedIds]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const activeProximityFilter = activeFilters.find((key) => proximityFilterKeys.includes(key as ProximityFilterKey)) as ProximityFilterKey | undefined;
    const maxWalk = getMaxWalkForProximityFilter(activeProximityFilter);

    return listings.filter((listing) => {
      const [start, end] = selectedRange;
      let hasOverlap = false;
      for (let i = start; i <= end; i++) {
        if (listing.availableMonths[i]) { hasOverlap = true; break; }
      }
      if (!hasOverlap) return false;
      if (activeFilters.includes("furnished") && !listing.furnished) return false;
      if (activeFilters.includes("negotiable") && !listing.negotiablePrice) return false;
      if (activeFilters.includes("verified") && !listing.verified) return false;
      if (activeFilters.includes("private") && listing.roommatesStaying === null) return false;
      if (activeFilters.includes("entire") && listing.roommatesStaying !== null) return false;
      if (activeFilters.includes("parking") && !listing.amenities.includes("Parking")) return false;
      if (maxWalk !== undefined) {
        const walkMinutes = parseSubletWalkTime(listing.walkTime);
        if (walkMinutes == null || walkMinutes > maxWalk) return false;
      }
      if (normalizedQuery) {
        const haystack = [
          listing.title,
          listing.street,
          listing.neighborhood,
        ].join(" ").toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [listings, selectedRange, activeFilters, searchQuery, proximityFilterKeys]);

  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen" style={{ background: "#FFFCF5" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12">
          <BrowseGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen" style={{ background: "#FFFCF5" }}>
      <SummerBanner />
      <SubletHero onListClick={handleListClick} canList={!isLandlord} />
      <InsightStats />
      <DateRangeSelector selectedRange={selectedRange} onChange={setSelectedRange} />
      <SearchAndFilters
        onSearchChange={setSearchQuery}
        onOpenFilters={() => setShowFiltersModal(true)}
        activeFilterCount={activeFilters.length}
        placeholder="Search by street, neighborhood..."
      />

      {/* Results meta + view toggle */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-[#1B2D45]/35" style={{ fontSize: "12px", fontWeight: 600 }}>
            {filteredListings.length} available
          </span>
          {activeFilters.length > 0 && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[#1B2D45]/45 border border-black/[0.06]" style={{ fontSize: "11px", fontWeight: 600 }}>
              {activeFilters.length} filter{activeFilters.length !== 1 ? "s" : ""} active
            </span>
          )}
        </div>
        {/* View toggle */}
        <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0 w-full sm:w-auto">
          {(["board", "grid", "map"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all duration-200 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
              style={{ fontSize: "12px", fontWeight: 600, minWidth: 0 }}
            >
              {mode === "board" ? "📌 Board" : mode === "grid" ? "▦ Grid" : "🗺 Map"}
            </button>
          ))}
        </div>
      </div>

      <TimelineLegend />

      <SubletFiltersModal
        open={showFiltersModal}
        activeFilters={activeFilters}
        selectedRange={selectedRange}
        filteredCount={filteredListings.length}
        onToggleFilter={toggleFilter}
        onClear={clearFilters}
        onClose={() => setShowFiltersModal(false)}
      />

      <SubletPicksTray
        picks={pinnedListings}
        onRemove={togglePin}
        onCompare={() => setCompareOpen(true)}
        showSheet={showPicksSheet}
        onCloseSheet={() => setShowPicksSheet(false)}
      />

      {/* Content */}
      {filteredListings.length === 0 ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-2xl border-2 border-dashed border-black/[0.06]">
            <span style={{ fontSize: "40px" }}>🔍</span>
            <h3 className="text-[#1B2D45] mt-3 text-center" style={{ fontSize: "18px", fontWeight: 700 }}>No sublets match those dates</h3>
            <p className="text-[#1B2D45]/40 mt-1.5 text-center max-w-[360px]" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.6 }}>
              Try expanding your date range or check back soon — new sublets are posted daily.
            </p>
          </div>
        </div>
      ) : viewMode === "board" ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6 cork-bg">
          <div className={isMobile ? "flex flex-col gap-6" : "grid grid-cols-3 gap-6"}>
            {filteredListings.map((listing, i) => (
              <div key={listing.id} style={isMobile ? undefined : { marginTop: `${desktopStaggers[i % desktopStaggers.length]}px` }}>
                <SubletCard listing={listing} selectedRange={selectedRange} isMobile={isMobile} isPinned={pinnedIds.includes(listing.id)} onTogglePin={togglePin} />
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {filteredListings.map((listing) => (
              <SubletGridCard key={listing.id} listing={listing} selectedRange={selectedRange} isPinned={pinnedIds.includes(listing.id)} onTogglePin={togglePin} />
            ))}
          </div>
        </div>
      ) : (
        <SubletMapView listings={filteredListings} pinnedIds={pinnedIds} onTogglePin={togglePin} selectedRange={selectedRange} />
      )}

      {/* Mobile floating picks badge */}
      <AnimatePresence>
        {isMobile && pinnedIds.length > 0 && !showPicksSheet && (
          <motion.div
            className="fixed bottom-4 right-4 z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <button
              onClick={() => setShowPicksSheet(true)}
              className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(255,107,53,0.4)] active:scale-95 transition-transform"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              📌 {pinnedIds.length} pick{pinnedIds.length !== 1 ? "s" : ""}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomCTA onListClick={handleListClick} canList={!isLandlord} />

      <SubletCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        listings={pinnedListings}
      />
    </div>
  );
}
