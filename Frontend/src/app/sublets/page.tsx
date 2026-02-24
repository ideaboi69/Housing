"use client";

import { useState, useMemo } from "react";
import { Heart, Check, ChevronRight, SlidersHorizontal, X, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Pushpin, TapeStrip } from "@/components/ui/BoardDecorations";
import { getScoreColor } from "@/lib/utils";
import Link from "next/link";

/* ════════════════════════════════════════════════════════
   Types & Data
   ════════════════════════════════════════════════════════ */

interface SubletListing {
  id: string;
  title: string;
  street: string;
  subletPrice: number;
  originalPrice: number;
  healthScore: number;
  verified: boolean;
  posterType: string;
  posterIsStudent: boolean;
  availableMonths: boolean[]; // [Jan ... Dec]
  neighborhood: string;
  furnished: boolean;
  negotiablePrice: boolean;
  flexibleDates: boolean;
  roommatesStaying: number | null;
  roommateDesc: string | null;
  bedsAvailable: number;
  bedsTotal: number;
  distance: string;
  walkTime: string;
  amenities: string[];
  views: number;
  saves: number;
  rotation: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const subletListings: SubletListing[] = [
  {
    id: "s1", title: "Furnished Room in 4BR House", street: "78 College Ave W",
    subletPrice: 550, originalPrice: 720, healthScore: 91, verified: true,
    posterType: "4th year, Engineering", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, true, false, false, false, false, false], neighborhood: "Campus",
    furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: 2, roommateDesc: "2 upper-year science students staying for summer",
    bedsAvailable: 1, bedsTotal: 4, distance: "0.3 km", walkTime: "4 min",
    amenities: ["Utilities Incl.", "Laundry", "Backyard"], views: 89, saves: 14, rotation: -2.2,
  },
  {
    id: "s2", title: "Entire 2BR Apartment", street: "155 Gordon St",
    subletPrice: 1100, originalPrice: 1400, healthScore: 86, verified: true,
    posterType: "Property Manager", posterIsStudent: false,
    availableMonths: [false, false, false, false, true, true, true, true, false, false, false, false], neighborhood: "Stone Road",
    furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 2, bedsTotal: 2, distance: "1.2 km", walkTime: "14 min",
    amenities: ["Parking", "Dishwasher", "A/C"], views: 203, saves: 31, rotation: 1.5,
  },
  {
    id: "s3", title: "Private Room near Campus", street: "42 Suffolk St W",
    subletPrice: 480, originalPrice: 680, healthScore: 68, verified: false,
    posterType: "3rd year, Arts", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, true, false, false, false, false, false], neighborhood: "Campus",
    furnished: false, negotiablePrice: false, flexibleDates: false,
    roommatesStaying: 1, roommateDesc: "1 grad student staying for research term",
    bedsAvailable: 1, bedsTotal: 3, distance: "0.5 km", walkTime: "6 min",
    amenities: ["Laundry", "WiFi"], views: 47, saves: 5, rotation: -0.8,
  },
  {
    id: "s4", title: "Studio Apartment Downtown", street: "88 Macdonell St",
    subletPrice: 700, originalPrice: 950, healthScore: 82, verified: true,
    posterType: "Landlord", posterIsStudent: false,
    availableMonths: [false, false, false, false, false, true, true, true, false, false, false, false], neighborhood: "Downtown",
    furnished: false, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 1, bedsTotal: 1, distance: "1.8 km", walkTime: "22 min",
    amenities: ["A/C", "Gym", "Utilities Incl."], views: 134, saves: 22, rotation: 2.1,
  },
  {
    id: "s5", title: "Room in Townhouse", street: "31 Grange St",
    subletPrice: 450, originalPrice: 640, healthScore: 64, verified: false,
    posterType: "2nd year, Business", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, false, false, false, false, false, false], neighborhood: "South End",
    furnished: true, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: 2, roommateDesc: "2 upper-year kinesiology students staying",
    bedsAvailable: 1, bedsTotal: 4, distance: "2.1 km", walkTime: "26 min",
    amenities: ["Parking", "Backyard"], views: 28, saves: 3, rotation: -1.4,
  },
  {
    id: "s6", title: "Master Bedroom in 5BR House", street: "62 Dean Ave",
    subletPrice: 500, originalPrice: 600, healthScore: 88, verified: true,
    posterType: "4th year, CompSci", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, true, true, false, false, false, false], neighborhood: "Campus",
    furnished: true, negotiablePrice: true, flexibleDates: true,
    roommatesStaying: 3, roommateDesc: "3 engineering students staying for internships",
    bedsAvailable: 1, bedsTotal: 5, distance: "0.4 km", walkTime: "5 min",
    amenities: ["Utilities Incl.", "Laundry", "WiFi", "Backyard"], views: 156, saves: 27, rotation: 0.6,
  },
];

function getScoreLabel(score: number) {
  if (score >= 85) return "Great Match";
  if (score >= 65) return "Good Option";
  return "Review First";
}

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

function SubletHero({ onListClick }: { onListClick: () => void }) {
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
            Find short-term housing from students leaving for co-op, or list your place while you&apos;re away. Better than Facebook groups.
          </p>
        </div>
        <motion.button
          onClick={onListClick}
          className="border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors px-5 py-2.5 rounded-xl shrink-0"
          style={{ fontSize: "14px", fontWeight: 700 }}
          whileTap={{ scale: 0.97 }}
        >
          ☀️ List Your Sublet
        </motion.button>
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

function ListSubletForm({ visible }: { visible: boolean }) {
  const isMobile = useIsMobile();
  const [photos, setPhotos] = useState<File[]>([]);

  const [form, setForm] = useState({
    // Basic info
    title: "",
    address: "",
    postal_code: "",
    description: "",
    // Pricing
    rent_per_month: "",
    estimated_utility_cost: "",
    // Dates
    sublet_start_date: "",
    sublet_end_date: "",
    move_in_date: "",
    // Room details
    room_type: "private" as "private" | "shared",
    total_rooms: "1",
    bathrooms: "1",
    beds_available: "1",
    // Commute
    distance_to_campus_km: "",
    walk_time_minutes: "",
    drive_time_minutes: "",
    bus_time_minutes: "",
    nearest_bus_route: "",
    // Amenities (booleans)
    is_furnished: false,
    has_parking: false,
    has_laundry: false,
    utilities_included: false,
    // Preferences
    gender_preference: "any",
  });

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
                  {[{ v: "any", l: "Any" }, { v: "male", l: "Male" }, { v: "female", l: "Female" }, { v: "other", l: "Other" }].map((g) => (
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
                className="flex-1 px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors active:scale-[0.98]"
                style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
              >
                Post Sublet →
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

const filterOptions = [
  { label: "Furnished 🛋️", key: "furnished" },
  { label: "Negotiable 💬", key: "negotiable" },
  { label: "Verified ✓", key: "verified" },
  { label: "Private Room 🚪", key: "private" },
  { label: "Entire Place 🏠", key: "entire" },
  { label: "Parking 🅿️", key: "parking" },
];

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
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                    Amenities & Match Filters
                  </div>
                  {activeFilters.length > 0 && (
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
  const [saved, setSaved] = useState(false);
  const discount = Math.round(((listing.originalPrice - listing.subletPrice) / listing.originalPrice) * 100);
  const scoreColor = getScoreColor(listing.healthScore);
  const scoreLabel = getScoreLabel(listing.healthScore);

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

      <Link href={`/sublets/${listing.id}`} className="bg-white rounded-sm overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow block" style={{ padding: "8px 8px 14px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Image area */}
        <div className="relative rounded-sm overflow-hidden" style={{ height: isMobile ? "130px" : "150px" }}>
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(46,196,182,0.15) 100%)" }}>
            <span style={{ fontSize: "36px", opacity: 0.3 }}>☀️</span>
          </div>
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
            <motion.button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }} className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm" whileTap={{ scale: 0.85 }}>
              <Heart className={`w-3.5 h-3.5 ${saved ? "fill-[#E71D36] text-[#E71D36]" : "text-[#1B2D45]/40"}`} />
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
        <div className="pt-3 px-1">
          <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{listing.title}</h3>
          <p className="text-[#1B2D45]/40 truncate mt-0.5" style={{ fontSize: "11px", fontWeight: 400 }}>{listing.street}</p>

          <AvailabilityTimeline months={listing.availableMonths} selectedRange={selectedRange} />

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-[#FF6B35]" style={{ fontSize: "22px", fontWeight: 800 }}>
              ${listing.subletPrice}<span style={{ fontSize: "12px", fontWeight: 500 }}>/mo</span>
            </span>
            <span className="text-[#1B2D45]/30 line-through" style={{ fontSize: "13px", fontWeight: 500 }}>${listing.originalPrice}</span>
          </div>

          {/* Flexibility badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {listing.negotiablePrice && (
              <span className="px-2 py-0.5 rounded-full border" style={{ fontSize: "9px", fontWeight: 600, background: "rgba(46,196,182,0.08)", borderColor: "rgba(46,196,182,0.2)", color: "#2EC4B6" }}>💬 Price Negotiable</span>
            )}
            {listing.flexibleDates && (
              <span className="px-2 py-0.5 rounded-full border" style={{ fontSize: "9px", fontWeight: 600, background: "rgba(255,182,39,0.08)", borderColor: "rgba(255,182,39,0.2)", color: "#D4990F" }}>📅 Flexible Dates</span>
            )}
            {listing.furnished && (
              <span className="px-2 py-0.5 rounded-full border" style={{ fontSize: "9px", fontWeight: 600, background: "rgba(27,45,69,0.06)", borderColor: "rgba(27,45,69,0.12)", color: "#1B2D45" }}>🛋️ Furnished</span>
            )}
          </div>

          {/* Roommate info */}
          {listing.roommatesStaying !== null && listing.roommatesStaying > 0 && (
            <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "rgba(27,45,69,0.04)" }}>
              <div className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>
                🏠 {listing.roommatesStaying} roommate{listing.roommatesStaying > 1 ? "s" : ""} staying
              </div>
              {listing.roommateDesc && <div className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "10px", fontWeight: 400 }}>{listing.roommateDesc}</div>}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="bg-[#1B2D45]/5 text-[#1B2D45]/50 px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 500 }}>📍 {listing.distance}</span>
            <span className="bg-[#1B2D45]/5 text-[#1B2D45]/50 px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 500 }}>🚶 {listing.walkTime}</span>
            <span className="bg-[#1B2D45]/5 text-[#1B2D45]/50 px-2 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 500 }}>{listing.bedsAvailable}/{listing.bedsTotal} beds</span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1 mt-2">
            {listing.amenities.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded border border-black/[0.04] text-[#1B2D45]/50" style={{ fontSize: "9px", fontWeight: 500 }}>{a}</span>
            ))}
          </div>

          {/* Pin to board */}
          {onTogglePin && (
            <button
              onClick={(e) => { e.preventDefault(); onTogglePin(listing.id); }}
              className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all active:scale-[0.97] ${
                isPinned
                  ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                  : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]/60"
              }`}
              style={{ fontSize: "10px", fontWeight: 600 }}
            >
              📌 {isPinned ? "Pinned" : "Pin to board"}
            </button>
          )}

          {/* Bottom bar */}
          <div className="mt-3 pt-2.5 border-t border-black/[0.04] flex items-center justify-between">
            <span className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 500 }}>👁 {listing.views} · 📌 {listing.saves}</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: scoreColor }}>{scoreLabel}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function BottomCTA() {
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
        <motion.button
          className="px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors shrink-0"
          style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
          whileTap={{ scale: 0.97 }}
        >
          List Your Sublet →
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════ */

const desktopStaggers = [0, 18, 8, 14, 4, 20];

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
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center shrink-0">
        <span style={{ fontSize: "14px" }}>🏠</span>
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

function SubletPicksTray({ picks, onRemove, showSheet, onCloseSheet }: { picks: SubletListing[]; onRemove: (id: string) => void; showSheet: boolean; onCloseSheet: () => void }) {
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
                <button className="flex items-center gap-1.5 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 600 }}>
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
                <button className="flex items-center gap-1.5 text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 600 }}>
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
  const scoreColor = getScoreColor(listing.healthScore);

  return (
    <Link href={`/sublets/${listing.id}`} className="bg-white rounded-xl border border-black/[0.04] overflow-hidden hover:shadow-md hover:border-[#FF6B35]/15 transition-all group block">
      {/* Image placeholder */}
      <div className="h-[130px] bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center relative">
        <span style={{ fontSize: "28px" }}>🏠</span>
        <div className="absolute top-2 left-2">
          <ScoreRing score={listing.healthScore} size={30} />
        </div>
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-[#2EC4B6] text-white px-1.5 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 700 }}>
            ↓ {discount}%
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 700 }}>{listing.title}</h4>
        <p className="text-[#1B2D45]/30 truncate" style={{ fontSize: "10px" }}>{listing.street} · {listing.neighborhood}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-[#FF6B35]" style={{ fontSize: "16px", fontWeight: 800 }}>${listing.subletPrice}</span>
          <span className="text-[#1B2D45]/20 line-through" style={{ fontSize: "10px" }}>${listing.originalPrice}</span>
          <span className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>/mo</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {listing.furnished && <span className="bg-[#1B2D45]/5 text-[#1B2D45]/40 px-1.5 py-0.5 rounded" style={{ fontSize: "8px", fontWeight: 500 }}>Furnished</span>}
          <span className="bg-[#1B2D45]/5 text-[#1B2D45]/40 px-1.5 py-0.5 rounded" style={{ fontSize: "8px", fontWeight: 500 }}>{listing.bedsAvailable} bed</span>
          <span className="bg-[#1B2D45]/5 text-[#1B2D45]/40 px-1.5 py-0.5 rounded" style={{ fontSize: "8px", fontWeight: 500 }}>{listing.walkTime}</span>
        </div>
        {/* Availability mini-bar */}
        <div className="flex gap-0.5 mt-2">
          {MONTHS.map((m, idx) => (
            <div key={m} className="flex-1 h-1.5 rounded-full" style={{ background: listing.availableMonths[idx] ? (idx >= selectedRange[0] && idx <= selectedRange[1] ? "#FF6B35" : "#FF6B35" + "40") : "#e5e5e5" }} />
          ))}
        </div>
        {onTogglePin && (
          <button onClick={(e) => { e.preventDefault(); onTogglePin(listing.id); }} className={`mt-2 w-full py-1.5 rounded-lg border text-center transition-all active:scale-[0.97] ${isPinned ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/30 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "10px", fontWeight: 600 }}>
            📌 {isPinned ? "Pinned" : "Pin"}
          </button>
        )}
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════
   Sublet Map View (UofG campus)
   ════════════════════════════════════════════════════════ */

function SubletMapView({ listings, pinnedIds, onTogglePin, selectedRange }: { listings: SubletListing[]; pinnedIds: string[]; onTogglePin: (id: string) => void; selectedRange: [number, number] }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4">
      <div className="relative w-full bg-[#f0ece6] rounded-2xl overflow-hidden border border-black/[0.04]" style={{ height: "500px" }}>
        {/* Placeholder map — real Leaflet can be added later */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span style={{ fontSize: "48px" }}>🗺</span>
            <p className="text-[#1B2D45]/30 mt-2" style={{ fontSize: "14px", fontWeight: 500 }}>Map view coming soon</p>
            <p className="text-[#1B2D45]/20 mt-1" style={{ fontSize: "12px" }}>Sublet locations will appear here</p>
          </div>
        </div>
        {/* Floating cards on map */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3 overflow-x-auto no-scrollbar">
          {listings.slice(0, 5).map((l) => (
            <div key={l.id} className="bg-white rounded-xl p-3 shrink-0 w-[200px] shadow-lg border border-black/[0.04]">
              <div className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 700 }}>{l.title}</div>
              <div className="text-[#1B2D45]/30 truncate" style={{ fontSize: "10px" }}>{l.street}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 800 }}>${l.subletPrice}/mo</span>
                <button onClick={() => onTogglePin(l.id)} className={`text-xs ${pinnedIds.includes(l.id) ? "text-[#FF6B35]" : "text-[#1B2D45]/30"}`} style={{ fontSize: "10px", fontWeight: 600 }}>
                  📌 {pinnedIds.includes(l.id) ? "Pinned" : "Pin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

type SubletViewMode = "board" | "grid" | "map";

export default function SubletsPage() {
  const isMobile = useIsMobile();
  const [showListForm, setShowListForm] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<[number, number]>([4, 6]); // May-Jul default (summer feel)
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<SubletViewMode>("board");
  const [showPicksSheet, setShowPicksSheet] = useState(false);

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };
  const clearFilters = () => setActiveFilters([]);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]);
  };

  const pinnedListings = useMemo(() => subletListings.filter((l) => pinnedIds.includes(l.id)), [pinnedIds]);

  const filteredListings = useMemo(() => {
    return subletListings.filter((listing) => {
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
      return true;
    });
  }, [selectedRange, activeFilters]);

  return (
    <div className="min-h-screen" style={{ background: "#FFFCF5" }}>
      <SummerBanner />
      <SubletHero onListClick={() => setShowListForm(!showListForm)} />
      <InsightStats />
      <ListSubletForm visible={showListForm} />
      <DateRangeSelector selectedRange={selectedRange} onChange={setSelectedRange} />

      {/* View toggle + filter bar */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <motion.button
            onClick={() => setShowFiltersModal(true)}
            className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border bg-white text-[#1B2D45]/60 hover:border-[#FF6B35]/20 hover:text-[#FF6B35] transition-all"
            style={{ fontSize: "12px", fontWeight: 600 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilters.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6B35] text-white flex items-center justify-center"
                style={{ fontSize: "10px", fontWeight: 700 }}
              >
                {activeFilters.length}
              </span>
            )}
          </motion.button>

          {filterOptions.map((f) => {
            const active = activeFilters.includes(f.key);
            return (
              <button key={f.key} onClick={() => toggleFilter(f.key)} className={`px-3 py-1.5 rounded-full border transition-all ${active ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]"} ${isMobile ? "hidden sm:inline-flex" : ""}`} style={{ fontSize: "12px", fontWeight: active ? 600 : 500 }}>
                {f.label}
              </button>
            );
          })}
          {isMobile && activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full border border-black/[0.06] text-[#1B2D45]/40 hover:text-[#E71D36] hover:border-[#E71D36]/15 transition-all"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Clear
            </button>
          )}
          <span className="text-[#1B2D45]/30 ml-1" style={{ fontSize: "12px", fontWeight: 500 }}>{filteredListings.length} available</span>
        </div>
        {/* View toggle */}
        <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0">
          {(["board", "grid", "map"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
              style={{ fontSize: "12px", fontWeight: 600 }}
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

      <SubletPicksTray picks={pinnedListings} onRemove={togglePin} showSheet={showPicksSheet} onCloseSheet={() => setShowPicksSheet(false)} />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      <BottomCTA />
    </div>
  );
}
