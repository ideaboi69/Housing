"use client";

import { useState, useMemo } from "react";
import { Heart, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Pushpin, TapeStrip } from "@/components/ui/BoardDecorations";
import { getScoreColor } from "@/lib/utils";

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
  availableMonths: boolean[]; // [May, Jun, Jul, Aug, Sep]
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

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep"];

const subletListings: SubletListing[] = [
  {
    id: "s1", title: "Furnished Room in 4BR House", street: "78 College Ave W",
    subletPrice: 550, originalPrice: 720, healthScore: 91, verified: true,
    posterType: "4th year, Engineering", posterIsStudent: true,
    availableMonths: [true, true, true, false, false], neighborhood: "Campus",
    furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: 2, roommateDesc: "2 upper-year science students staying for summer",
    bedsAvailable: 1, bedsTotal: 4, distance: "0.3 km", walkTime: "4 min",
    amenities: ["Utilities Incl.", "Laundry", "Backyard"], views: 89, saves: 14, rotation: -2.2,
  },
  {
    id: "s2", title: "Entire 2BR Apartment", street: "155 Gordon St",
    subletPrice: 1100, originalPrice: 1400, healthScore: 86, verified: true,
    posterType: "Property Manager", posterIsStudent: false,
    availableMonths: [true, true, true, true, false], neighborhood: "Stone Road",
    furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 2, bedsTotal: 2, distance: "1.2 km", walkTime: "14 min",
    amenities: ["Parking", "Dishwasher", "A/C"], views: 203, saves: 31, rotation: 1.5,
  },
  {
    id: "s3", title: "Private Room near Campus", street: "42 Suffolk St W",
    subletPrice: 480, originalPrice: 680, healthScore: 68, verified: false,
    posterType: "3rd year, Arts", posterIsStudent: true,
    availableMonths: [true, true, true, false, false], neighborhood: "Campus",
    furnished: false, negotiablePrice: false, flexibleDates: false,
    roommatesStaying: 1, roommateDesc: "1 grad student staying for research term",
    bedsAvailable: 1, bedsTotal: 3, distance: "0.5 km", walkTime: "6 min",
    amenities: ["Laundry", "WiFi"], views: 47, saves: 5, rotation: -0.8,
  },
  {
    id: "s4", title: "Studio Apartment Downtown", street: "88 Macdonell St",
    subletPrice: 700, originalPrice: 950, healthScore: 82, verified: true,
    posterType: "Landlord", posterIsStudent: false,
    availableMonths: [false, true, true, true, false], neighborhood: "Downtown",
    furnished: false, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 1, bedsTotal: 1, distance: "1.8 km", walkTime: "22 min",
    amenities: ["A/C", "Gym", "Utilities Incl."], views: 134, saves: 22, rotation: 2.1,
  },
  {
    id: "s5", title: "Room in Townhouse", street: "31 Grange St",
    subletPrice: 450, originalPrice: 640, healthScore: 64, verified: false,
    posterType: "2nd year, Business", posterIsStudent: true,
    availableMonths: [true, true, false, false, false], neighborhood: "South End",
    furnished: true, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: 2, roommateDesc: "2 upper-year kinesiology students staying",
    bedsAvailable: 1, bedsTotal: 4, distance: "2.1 km", walkTime: "26 min",
    amenities: ["Parking", "Backyard"], views: 28, saves: 3, rotation: -1.4,
  },
  {
    id: "s6", title: "Master Bedroom in 5BR House", street: "62 Dean Ave",
    subletPrice: 500, originalPrice: 600, healthScore: 88, verified: true,
    posterType: "4th year, CompSci", posterIsStudent: true,
    availableMonths: [true, true, true, true, false], neighborhood: "Campus",
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
    address: "",
    neighborhood: "Campus",
    price: "",
    originalPrice: "",
    availableFrom: "May 2026",
    availableUntil: "August 2026",
    bedsAvailable: "1",
    bedsTotal: "1",
    furnished: false,
    utilities: false,
    parking: false,
    laundry: false,
    ac: false,
    wifi: false,
    backyard: false,
    dishwasher: false,
    negotiablePrice: false,
    flexibleDates: false,
    roommatesStaying: "0",
    roommateDesc: "",
    posterType: "",
  });

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
    { key: "furnished" as const, label: "Furnished", emoji: "🛋️" },
    { key: "utilities" as const, label: "Utilities Incl.", emoji: "💡" },
    { key: "parking" as const, label: "Parking", emoji: "🅿️" },
    { key: "laundry" as const, label: "Laundry", emoji: "🧺" },
    { key: "ac" as const, label: "A/C", emoji: "❄️" },
    { key: "wifi" as const, label: "WiFi", emoji: "📶" },
    { key: "backyard" as const, label: "Backyard", emoji: "🌿" },
    { key: "dishwasher" as const, label: "Dishwasher", emoji: "🍽️" },
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

            {/* ─── Location & Price ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>LOCATION & PRICE</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Your address *</label>
                  <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. 78 College Ave W" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Neighborhood</label>
                  <select value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["Campus", "Stone Road", "Downtown", "South End", "West End", "Exhibition Park", "Other"].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Monthly sublet price *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                    <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="550" className={`${inputClass} pl-7`} style={{ fontSize: "13px" }} />
                  </div>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Original lease price</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                    <input type="number" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} placeholder="720" className={`${inputClass} pl-7`} style={{ fontSize: "13px" }} />
                  </div>
                  <p className="text-[#1B2D45]/20 mt-1" style={{ fontSize: "10px" }}>Shown as crossed out so students see the discount</p>
                </div>
              </div>
            </div>

            {/* ─── Dates ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>AVAILABILITY</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Available from *</label>
                  <select value={form.availableFrom} onChange={(e) => update("availableFrom", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["May 2026", "June 2026", "July 2026", "August 2026"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Available until *</label>
                  <select value={form.availableUntil} onChange={(e) => update("availableUntil", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["June 2026", "July 2026", "August 2026", "September 2026"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => update("negotiablePrice", !form.negotiablePrice)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${form.negotiablePrice ? "border-[#2EC4B6]/30 bg-[#2EC4B6]/[0.06] text-[#2EC4B6]" : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#2EC4B6]/20"}`} style={{ fontSize: "12px", fontWeight: 600 }}>
                  💬 Price Negotiable
                </button>
                <button onClick={() => update("flexibleDates", !form.flexibleDates)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${form.flexibleDates ? "border-[#FFB627]/30 bg-[#FFB627]/[0.06] text-[#D4990F]" : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FFB627]/20"}`} style={{ fontSize: "12px", fontWeight: 600 }}>
                  📅 Flexible Dates
                </button>
              </div>
            </div>

            {/* ─── Room Details ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>ROOM DETAILS</div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                <div>
                  <label className={labelClass} style={labelStyle}>Beds available *</label>
                  <select value={form.bedsAvailable} onChange={(e) => update("bedsAvailable", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["1", "2", "3", "4", "5"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Total beds in unit</label>
                  <select value={form.bedsTotal} onChange={(e) => update("bedsTotal", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["1", "2", "3", "4", "5", "6"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Roommates staying</label>
                  <select value={form.roommatesStaying} onChange={(e) => update("roommatesStaying", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["0", "1", "2", "3", "4"].map((n) => <option key={n} value={n}>{n === "0" ? "None — place will be empty" : n}</option>)}
                  </select>
                </div>
              </div>
              {Number(form.roommatesStaying) > 0 && (
                <div className="mt-3">
                  <label className={labelClass} style={labelStyle}>About the roommates</label>
                  <input type="text" value={form.roommateDesc} onChange={(e) => update("roommateDesc", e.target.value)} placeholder="e.g. 2 upper-year science students staying for summer" className={inputClass} style={{ fontSize: "13px" }} />
                </div>
              )}
            </div>

            {/* ─── About you ─── */}
            <div className="border-t border-black/[0.04] pt-5 mb-5">
              <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>ABOUT YOU</div>
              <div>
                <label className={labelClass} style={labelStyle}>Your year & program</label>
                <input type="text" value={form.posterType} onChange={(e) => update("posterType", e.target.value)} placeholder="e.g. 4th year, Engineering" className={inputClass} style={{ fontSize: "13px" }} />
                <p className="text-[#1B2D45]/20 mt-1" style={{ fontSize: "10px" }}>Shown on your listing so students know who they&apos;re subletting from</p>
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
  const duration = end - start + 1;

  const handleMonthClick = (idx: number) => {
    if (idx === start && idx === end) return;
    if (idx <= start) onChange([idx, end]);
    else if (idx >= end) onChange([start, idx]);
    else onChange([start, idx]);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-4">
      <div className="bg-white rounded-2xl border border-black/[0.04] px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap" style={{ boxShadow: "0 2px 12px rgba(27,45,69,0.04)" }}>
        <span style={{ fontSize: "18px" }}>📅</span>
        <span className="text-[#1B2D45] mr-2" style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 600 }}>I need a place</span>
        <div className="flex items-center">
          {MONTHS.map((m, i) => {
            const isSelected = i >= start && i <= end;
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
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
        <span className="text-[#1B2D45]/30 ml-1" style={{ fontSize: "12px", fontWeight: 500 }}>({duration} {duration === 1 ? "month" : "months"})</span>
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

function FilterBar({ activeFilters, onToggle, availableCount }: { activeFilters: string[]; onToggle: (key: string) => void; availableCount: number }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-3">
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((f) => {
          const active = activeFilters.includes(f.key);
          return (
            <button key={f.key} onClick={() => onToggle(f.key)} className={`px-3 py-1.5 rounded-full border transition-all ${active ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]"}`} style={{ fontSize: "12px", fontWeight: active ? 600 : 500 }}>
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto text-[#1B2D45]/30" style={{ fontSize: "12px", fontWeight: 500 }}>{availableCount} available</span>
      </div>
    </div>
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

      <div className="bg-white rounded-sm overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow" style={{ padding: "8px 8px 14px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)" }}>
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
            <motion.button onClick={(e) => { e.stopPropagation(); setSaved(!saved); }} className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm" whileTap={{ scale: 0.85 }}>
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
              onClick={() => onTogglePin(listing.id)}
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
      </div>
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

export default function SubletsPage() {
  const isMobile = useIsMobile();
  const [showListForm, setShowListForm] = useState(false);
  const [selectedRange, setSelectedRange] = useState<[number, number]>([0, 2]); // May-Jul
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) => prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]);
  };

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
      <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} availableCount={filteredListings.length} />
      <TimelineLegend />

      {/* Cards grid */}
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
      ) : (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6 cork-bg">
          <div className={isMobile ? "flex flex-col gap-6" : "grid grid-cols-3 gap-6"}>
            {filteredListings.map((listing, i) => (
              <div key={listing.id} style={isMobile ? undefined : { marginTop: `${desktopStaggers[i % desktopStaggers.length]}px` }}>
                <SubletCard listing={listing} selectedRange={selectedRange} isMobile={isMobile} isPinned={pinnedIds.includes(listing.id)} onTogglePin={togglePin} />
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomCTA />
    </div>
  );
}
