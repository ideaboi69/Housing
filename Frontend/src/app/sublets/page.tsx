"use client";

import { use, useState, useRef, useCallback } from "react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { ReportModal } from "@/components/ui/ReportModal";
import { ReviewModal } from "@/components/ui/ReviewModal";
import { ShareButton } from "@/components/ui/ShareButton";
import { LandlordContactCard } from "@/components/ui/LandlordContactCard";
import { getScoreColor } from "@/lib/utils";
import { getAmenityChecklist } from "@/lib/amenities";
import { getMockSublet } from "@/lib/mock-sublets";
import { getMockReviews } from "@/lib/mock-data";
import { useSavedStore } from "@/lib/saved-store";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Heart, Check, ChevronLeft, ChevronRight,
  Bed, Bath, Calendar, MessageCircle, Share2, Flag, Tag, Users,
  GraduationCap, Zap, Star,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { CribbMap } from "@/components/ui/CribbMap";
import type { ReviewResponse } from "@/types";

/* ── Helpers ───────────────────────────────────── */

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep"];

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } } };

function getScoreLabel(score: number) { return score >= 85 ? "Great" : score >= 65 ? "Good" : "Caution"; }

function formatDateRange(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;
}

function AnimatedBar({ score, color }: { score: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <div ref={ref} className="flex-1 h-2 rounded-full bg-[#1B2D45]/5 overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
        initial={{ width: 0 }} animate={isInView ? { width: `${score}%` } : { width: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }} />
    </div>
  );
}

/* ── Image Gallery ─────────────────────────────── */

function ImageGallery({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return <div className="h-[300px] md:h-[420px] bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] rounded-xl flex items-center justify-center"><span style={{ fontSize: "64px" }}>☀️</span></div>;
  return (
    <div className="relative rounded-xl overflow-hidden group">
      <div className="h-[300px] md:h-[420px] relative">
        <AnimatePresence mode="wait">
          <motion.img key={current} src={images[current]} alt={`Photo ${current + 1}`} className="w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>
      {images.length > 1 && (<>
        <button onClick={() => setCurrent((current - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#1B2D45]/70 opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-md"><ChevronLeft className="w-4 h-4" /></button>
        <button onClick={() => setCurrent((current + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#1B2D45]/70 opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-md"><ChevronRight className="w-4 h-4" /></button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">{images.map((_, i) => <button key={i} onClick={() => setCurrent(i)} className={`rounded-full transition-all ${i === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />)}</div>
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600 }}>{current + 1} / {images.length}</div>
      </>)}
    </div>
  );
}

/* ── Star Rating (no comments) ─────────────────── */

function ReviewCard({ review, index }: { review: ReviewResponse; index: number }) {
  return (
    <motion.div className="bg-[#FAF8F4] rounded-xl p-4" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>{new Date(review.created_at).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}</p>
        <div className={`px-2 py-0.5 rounded-full ${review.would_rent_again ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#E71D36]/10 text-[#E71D36]"}`} style={{ fontSize: "10px", fontWeight: 600 }}>
          {review.would_rent_again ? "Would rent again ✓" : "Would not rent again"}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[{ label: "Response", val: review.responsiveness }, { label: "Maintenance", val: review.maintenance_speed }, { label: "Privacy", val: review.respect_privacy }, { label: "Fairness", val: review.fairness_of_charges }].map((r) => (
          <div key={r.label} className="text-center">
            <div className="text-[#1B2D45]/30" style={{ fontSize: "9px", fontWeight: 600 }}>{r.label}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">{[1,2,3,4,5].map((s) => <span key={s} style={{ fontSize: "12px", color: s <= r.val ? "#FFB627" : "#1B2D45" + "15" }}>★</span>)}</div>
            <div className="text-[#1B2D45]/50 mt-0.5" style={{ fontSize: "11px", fontWeight: 700 }}>{r.val}/5</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════
   SUBLET DETAIL PAGE
   ════════════════════════════════════════════════════ */

export default function SubletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const sublet = getMockSublet(id);

  const [saved, setSaved] = useState(false);  // fallback for sublets without listing_id
  const [messageSending, setMessageSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const user = useAuthStore((s) => s.user);

  // Use saved store if sublet has a listing_id, otherwise local toggle
  const hasListingId = sublet && typeof sublet.listing_id === "number";
  const storeSaved = useSavedStore((s) => hasListingId ? s.savedIds.has(sublet.listing_id!) : false);
  const storeToggling = useSavedStore((s) => hasListingId ? s.togglingIds.has(sublet.listing_id!) : false);
  const storeToggle = useSavedStore((s) => s.toggleSave);

  const isSaved = hasListingId ? storeSaved : saved;

  const handleToggleSave = useCallback(async () => {
    if (hasListingId) {
      try {
        await storeToggle(sublet!.listing_id!);
      } catch (err) {
        if (err instanceof Error && err.message === "auth_required") {
          router.push("/login");
        }
      }
    } else {
      setSaved(!saved);
    }
  }, [hasListingId, sublet, storeToggle, saved, router]);

  // TODO: fetch real reviews for the property once backend links sublets to properties
  const [reviews, setReviews] = useState<ReviewResponse[]>(sublet ? getMockReviews(1) : []);

  const handleMessage = async () => {
    if (messageSending || messageSent) return;
    setMessageSending(true);
    setTimeout(() => { setMessageSent(true); setMessageSending(false); setTimeout(() => router.push("/messages"), 1500); }, 800);
  };

  if (!sublet) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#E71D36]" style={{ fontSize: "16px", fontWeight: 600 }}>Sublet not found</p>
          <Link href="/sublets" className="mt-4 inline-block text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 600 }}>← Back to Sublets</Link>
        </motion.div>
      </div>
    );
  }

  const discount = Math.round(((sublet.originalPrice - sublet.subletPrice) / sublet.originalPrice) * 100);
  const score = sublet.healthScore;
  const scoreColor = getScoreColor(score);

  const amenities = getAmenityChecklist(sublet as unknown as Record<string, unknown>);
  const hasAmenities = amenities.filter((a) => a.has);
  const noAmenities = amenities.filter((a) => !a.has);

  return (
    <div className="min-h-screen" style={{ background: "#FFFCF5" }}>
      <motion.div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6" variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <Link href="/sublets" className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-5 group" style={{ fontSize: "13px", fontWeight: 500 }}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sublets
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* ─── Main ─── */}
          <div>
            <motion.div variants={fadeUp}><ImageGallery images={sublet.images} /></motion.div>

            <motion.div variants={fadeUp} className="mt-6 bg-white rounded-xl border border-black/[0.04] p-5 md:p-6" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.03)" }}>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-white" style={{ fontSize: "10px", fontWeight: 700, background: "linear-gradient(135deg, #FF6B35, #E55E2E)" }}>☀️ Summer Sublet</span>
                {sublet.verified && <span className="px-2 py-0.5 rounded-full flex items-center gap-1 text-[#2EC4B6]" style={{ fontSize: "10px", fontWeight: 600, background: "rgba(46,196,182,0.1)" }}><Check className="w-3 h-3" /> Landlord Approved</span>}
              </div>

              {/* Title */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.3px" }}>{sublet.title}</h1>
                  <div className="flex items-center gap-2 mt-1.5 text-[#1B2D45]/50"><MapPin className="w-3.5 h-3.5 shrink-0" /><span style={{ fontSize: "13px" }}>{sublet.address}</span></div>
                </div>
                {score > 0 && <div className="shrink-0 text-center"><ScoreRing score={score} size={56} /><p className="mt-1" style={{ fontSize: "9px", fontWeight: 700, color: scoreColor }}>{getScoreLabel(score)}</p></div>}
              </div>

              {/* Savings */}
              <motion.div className="mt-4 rounded-xl p-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(46,196,182,0.08), rgba(46,196,182,0.03))", border: "1px solid rgba(46,196,182,0.15)" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/15 flex items-center justify-center shrink-0"><Tag className="w-5 h-5 text-[#2EC4B6]" /></div>
                <div>
                  <p className="text-[#2EC4B6]" style={{ fontSize: "14px", fontWeight: 800 }}>Save {discount}% off regular rent</p>
                  <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}><span className="line-through">${sublet.originalPrice}/mo</span> → <strong className="text-[#FF6B35]">${sublet.subletPrice}/mo</strong></p>
                </div>
              </motion.div>

              {/* Availability */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Availability</h3>
              <div className="flex gap-2 mt-3">
                {sublet.availableMonths.map((available, i) => (
                  <div key={i} className="flex-1">
                    <div className={`h-3 rounded-full ${available ? "bg-[#FF6B35]" : "bg-[#1B2D45]/[0.06]"}`} />
                    <p className="text-center mt-1" style={{ fontSize: "10px", fontWeight: available ? 700 : 400, color: available ? "#FF6B35" : "#1B2D45" + "30" }}>{MONTHS[i]}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2.5"><Calendar className="w-3.5 h-3.5 text-[#FF6B35]/50" /><span className="text-[#1B2D45]/60" style={{ fontSize: "12px" }}>{formatDateRange(sublet.subletStart, sublet.subletEnd)}</span></div>

              {/* Flexibility badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {sublet.negotiablePrice && <span className="px-3 py-1.5 rounded-full border" style={{ fontSize: "11px", fontWeight: 600, background: "rgba(46,196,182,0.06)", borderColor: "rgba(46,196,182,0.2)", color: "#2EC4B6" }}>💬 Price Negotiable</span>}
                {sublet.flexibleDates && <span className="px-3 py-1.5 rounded-full border" style={{ fontSize: "11px", fontWeight: 600, background: "rgba(255,182,39,0.06)", borderColor: "rgba(255,182,39,0.2)", color: "#D4990F" }}>📅 Flexible Dates</span>}
                {sublet.genderPreference !== "any" && <span className="px-3 py-1.5 rounded-full border" style={{ fontSize: "11px", fontWeight: 600, background: "rgba(168,85,247,0.06)", borderColor: "rgba(168,85,247,0.2)", color: "#A855F7" }}>Preferred: {sublet.genderPreference}</span>}
              </div>

              {/* Quick facts */}
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                {[{ label: "Beds", value: `${sublet.bedsAvailable} of ${sublet.bedsTotal}`, icon: Bed }, { label: "Bath", value: `${sublet.bathrooms}`, icon: Bath }, { label: "Type", value: sublet.propertyType.charAt(0).toUpperCase() + sublet.propertyType.slice(1), icon: MapPin }, { label: "Area", value: sublet.neighborhood, icon: MapPin }].map((fact) => {
                  const Icon = fact.icon;
                  return <motion.div key={fact.label} variants={fadeUp} className="bg-[#FAF8F4] rounded-xl p-3"><div className="flex items-center gap-1.5"><Icon className="w-3 h-3 text-[#FF6B35]/50" /><span className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>{fact.label}</span></div><div className="text-[#1B2D45] mt-1" style={{ fontSize: "13px", fontWeight: 700 }}>{fact.value}</div></motion.div>;
                })}
              </motion.div>

              {/* Roommates */}
              {sublet.roommatesStaying !== null && sublet.roommatesStaying > 0 && (
                <motion.div className="mt-5 rounded-xl border border-[#1B2D45]/[0.06] p-4" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#6C5CE7]/10 flex items-center justify-center"><Users className="w-4 h-4 text-[#6C5CE7]" /></div>
                    <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{sublet.roommatesStaying} roommate{sublet.roommatesStaying > 1 ? "s" : ""} staying for summer</p>
                  </div>
                  {sublet.roommateDesc && <p className="text-[#1B2D45]/50 ml-10" style={{ fontSize: "12px", lineHeight: 1.5 }}>{sublet.roommateDesc}</p>}
                </motion.div>
              )}

              {/* Description */}
              {sublet.description && (<div className="mt-5"><h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>About this sublet</h3><p className="text-[#1B2D45]/60 mt-2" style={{ fontSize: "13px", lineHeight: 1.7 }}>{sublet.description}</p></div>)}

              {/* Amenities — same checklist as listings */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Amenities</h3>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {hasAmenities.map((a) => { const Icon = a.icon; return (
                  <motion.div key={a.key} className="flex items-center gap-2.5 py-2" initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#4ADE80]/10"><Icon className="w-3.5 h-3.5 text-[#4ADE80]" /></div>
                    <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{a.label}</span>
                  </motion.div>);
                })}
                {noAmenities.map((a) => { const Icon = a.icon; return (
                  <div key={a.key} className="flex items-center gap-2.5 py-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1B2D45]/[0.03]"><Icon className="w-3.5 h-3.5 text-[#1B2D45]/15" /></div>
                    <span className="text-[#1B2D45]/25 line-through" style={{ fontSize: "13px", fontWeight: 500 }}>{a.label}</span>
                  </div>);
                })}
              </div>

              {/* Estimated utilities */}
              {sublet.estimated_utility_cost && !sublet.utilities_included && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFB627]/[0.06] border border-[#FFB627]/10">
                  <Zap className="w-3.5 h-3.5 text-[#FFB627]" />
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "11px" }}>Estimated utilities: <strong className="text-[#1B2D45]">${sublet.estimated_utility_cost}/mo</strong> per person</span>
                </div>
              )}

              {/* Getting to campus */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Getting to Campus</h3>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]"><span style={{ fontSize: "16px" }}>🚶</span><div><p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{sublet.walkTime} min</p><p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>walk</p></div></div>
                {sublet.busTime && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]"><span style={{ fontSize: "16px" }}>🚌</span><div><p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{sublet.busTime} min</p><p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>by bus</p></div></div>}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]"><span style={{ fontSize: "16px" }}>📍</span><div><p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{sublet.distanceKm} km</p><p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>to UofG</p></div></div>
              </div>

              {/* Cribb Score Breakdown */}
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                <h3 className="mt-8 text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                  Cribb Score Breakdown
                  <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: scoreColor }}>{score}/100</span>
                </h3>
                <div className="space-y-3 mt-3">
                  {[
                    { label: "Price", score: sublet.price_vs_market_score, emoji: "📊" },
                    { label: "Location", score: sublet.lease_clarity_score, emoji: "📍" },
                    { label: "Amenities", score: 50, emoji: "🏠" },
                    { label: "Tenant Reviews", score: sublet.landlord_reputation_score, emoji: "⭐" },
                  ].map((item, i) => (
                    <motion.div key={item.label} className="flex items-center gap-3" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}>
                      <span style={{ fontSize: "14px" }}>{item.emoji}</span>
                      <span className="text-[#1B2D45]/60 w-[120px] shrink-0" style={{ fontSize: "12px", fontWeight: 500 }}>{item.label}</span>
                      <AnimatedBar score={item.score} color={getScoreColor(item.score)} />
                      <span className="w-8 text-right shrink-0" style={{ fontSize: "13px", fontWeight: 800, color: getScoreColor(item.score) }}>{item.score}</span>
                    </motion.div>
                  ))}
                </div>
                {sublet.landlord_reputation_score === 50 && (
                  <p className="text-[#1B2D45]/30 mt-2" style={{ fontSize: "10px", fontStyle: "italic" }}>New listing — review score will update as tenants leave ratings.</p>
                )}
              </motion.div>

              {/* Reviews — stars only, no comments */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                    Property Reviews
                    {reviews.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1B2D45]/5 text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 700 }}>{reviews.length}</span>
                    )}
                  </h3>
                  {user ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setReviewOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFB627]/10 text-[#FFB627] hover:bg-[#FFB627]/15 transition-colors"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      <Star className="w-3.5 h-3.5" /> Leave a Review
                    </motion.button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/40 hover:text-[#1B2D45]/60 hover:bg-[#1B2D45]/[0.06] transition-colors"
                      style={{ fontSize: "12px", fontWeight: 500 }}
                    >
                      Sign in to review
                    </Link>
                  )}
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-3 mt-3">{reviews.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}</div>
                ) : (
                  <div className="mt-4 py-8 text-center rounded-xl border border-dashed border-[#1B2D45]/10 bg-[#FAF8F4]/50">
                    <span style={{ fontSize: "28px" }}>⭐</span>
                    <p className="text-[#1B2D45]/40 mt-2" style={{ fontSize: "13px", fontWeight: 500 }}>No reviews yet</p>
                    <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "12px" }}>Lived here? Be the first to rate this property.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ─── Sidebar ─── */}
          <motion.div className="space-y-4 sticky top-[80px] self-start" variants={fadeUp}>
            {/* Price card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-black/[0.04] p-5" style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.04)" }}>
              <div className="flex items-baseline gap-2">
                <span className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 800 }}>${sublet.subletPrice}</span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>/mo</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#1B2D45]/30 line-through" style={{ fontSize: "13px" }}>${sublet.originalPrice}/mo</span>
                <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#2EC4B6" }}>Save {discount}%</span>
              </div>

              {/* Posted by */}
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F4]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: sublet.posterIsStudent ? "#6C5CE7" + "15" : "#FF6B35" + "15" }}>
                  {sublet.posterIsStudent ? <GraduationCap className="w-5 h-5" style={{ color: "#6C5CE7" }} /> : <Users className="w-5 h-5 text-[#FF6B35]" />}
                </div>
                <div>
                  <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{sublet.posterName}</p>
                  <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>{sublet.posterType}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[#1B2D45]/50"><Calendar className="w-3.5 h-3.5 text-[#FF6B35]/50" /><span style={{ fontSize: "12px" }}>{formatDateRange(sublet.subletStart, sublet.subletEnd)}</span></div>

              {/* Message */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleMessage} disabled={messageSending || messageSent}
                className="relative w-full mt-5 py-3 rounded-xl bg-[#FF6B35] text-white overflow-hidden hover:bg-[#e55e2e] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}>
                {messageSent ? <><Check className="w-4 h-4" /> Message Sent</> : messageSending ? "Sending..." : <><MessageCircle className="w-4 h-4" /> Message {sublet.posterName}</>}
              </motion.button>

              {/* Save */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleToggleSave}
                disabled={storeToggling}
                className={`w-full mt-2 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${isSaved ? "border-[#E71D36]/20 bg-[#E71D36]/[0.04] text-[#E71D36]" : "border-black/[0.06] text-[#1B2D45]/60 hover:bg-[#1B2D45]/[0.03]"}`}
                style={{ fontSize: "14px", fontWeight: 500 }}>
                <Heart className={`w-4 h-4 ${isSaved ? "fill-[#E71D36]" : ""}`} /> {isSaved ? "Saved" : "Save Sublet"}
              </motion.button>

              {/* Share + Report */}
              <div className="flex items-center gap-2 mt-3">
                <ShareButton path={`/sublets/${id}`} title={sublet.title} variant="inline" />
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[#1B2D45]/30 hover:text-[#E71D36]/50 hover:bg-[#E71D36]/[0.03] transition-all"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                >
                  <Flag className="w-3 h-3" /> Report
                </button>
              </div>

              <div className="text-[#1B2D45]/25 text-center mt-4" style={{ fontSize: "11px" }}>{sublet.views} viewed · {sublet.saves} saved</div>

              {/* Map */}
              <div className="mt-4 rounded-xl border border-black/[0.04] overflow-hidden">
                <CribbMap
                  address={sublet.address}
                  height="180px"
                  zoom={15}
                />
              </div>

              {/* Contact Card */}
              {hasListingId ? (
                <LandlordContactCard
                  landlordId={sublet.listing_id!}
                  landlordName={sublet.posterName}
                  landlordVerified={false}
                />
              ) : (
                <div className="mt-4 bg-white/90 backdrop-blur-xl rounded-xl border border-black/[0.04] p-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2EC4B6]/20 to-[#4ADE80]/20 flex items-center justify-center">
                      <span className="text-[#2EC4B6]" style={{ fontSize: "16px", fontWeight: 800 }}>
                        {sublet.posterName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{sublet.posterName}</p>
                      <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>{sublet.posterType}</p>
                    </div>
                  </div>
                  {sublet.posterIsStudent && sublet.posterYear && sublet.posterProgram && (
                    <p className="text-[#1B2D45]/30 mt-3 pt-3 border-t border-[#1B2D45]/[0.04]" style={{ fontSize: "11px" }}>
                      🎓 {sublet.posterYear} year · {sublet.posterProgram}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        listingId={hasListingId ? sublet.listing_id! : parseInt(id, 10)}
        listingTitle={sublet.title}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        propertyId={1}
        propertyTitle={sublet.title}
        onReviewSubmitted={(newReview) => {
          setReviews((prev) => [newReview, ...prev]);
        }}
      />
    </div>
  );
}