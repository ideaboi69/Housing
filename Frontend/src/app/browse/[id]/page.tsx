"use client";

import { use, useRef } from "react";
import { useListing, useHealthScore, useReviews } from "@/hooks";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  formatPrice,
  formatLeaseType,
  formatPropertyType,
  formatDate,
  getScoreColor,
} from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Bus,
  Heart,
  Check,
  X,
} from "lucide-react";
import {
  motion,
  useInView,
} from "framer-motion";

/* ── Animation variants ──────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 22 },
  },
};

/* ── Animated progress bar for health score breakdown ─ */
function AnimatedBar({ score, color }: { score: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <div ref={ref} className="flex-1 h-2 rounded-full bg-[#1B2D45]/5 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={isInView ? { width: `${score}%` } : { width: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      />
    </div>
  );
}

/* ── Shimmer CTA Button ──────────────────────────── */
function ShimmerCTA({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <button
      className={`${className} relative overflow-hidden hover:scale-[1.02] active:scale-[0.97] transition-transform`}
      style={style}
    >
      {/* Diagonal shimmer — CSS animation */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
          backgroundSize: "250% 100%",
          animation: "shimmer 4s ease-in-out infinite",
        }}
      />
      <span className="relative z-[2]">{children}</span>
    </button>
  );
}
  );
}

/* ════════════════════════════════════════════════════
   LISTING DETAIL PAGE
   ════════════════════════════════════════════════════ */

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const listingId = parseInt(id, 10);
  const { data: listing, isLoading, error } = useListing(listingId);
  const { data: healthScore } = useHealthScore(listingId);
  const { data: reviews } = useReviews(
    listing ? { property_id: listing.property_id } : undefined
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-10 h-10 rounded-full bg-[#FF6B35]/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <p className="text-[#1B2D45]/40">Loading listing...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[#E71D36]" style={{ fontSize: "16px", fontWeight: 600 }}>
            Listing not found
          </p>
          <Link
            href="/browse"
            className="mt-4 inline-block text-[#FF6B35]"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            ← Back to Browse
          </Link>
        </motion.div>
      </div>
    );
  }

  const overallScore = healthScore?.overall_score ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <motion.div
        className="max-w-[1200px] mx-auto px-4 md:px-6 py-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Back link with animated arrow */}
        <motion.div variants={fadeUp}>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6 group"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            <motion.div
              className="flex items-center"
              whileHover={{ x: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.div>
            Back to listings
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Main content */}
          <div>
            {/* Image placeholder */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-xl overflow-hidden border border-black/[0.06]"
            >
              <div className="h-[300px] md:h-[400px] bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center text-[#1B2D45]/20 relative overflow-hidden">
                <span style={{ fontSize: "64px" }}>🏠</span>
                {/* Soft shimmer */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                    backgroundSize: "250% 100%",
                  }}
                  animate={{ backgroundPosition: ["200% 0", "-50% 0"] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
              </div>
            </motion.div>

            {/* Listing info */}
            <motion.div
              variants={fadeUp}
              className="mt-6 bg-white rounded-xl border border-black/[0.06] p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h1
                    className="text-[#1B2D45]"
                    style={{ fontSize: "24px", fontWeight: 800 }}
                  >
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-[#1B2D45]/50">
                    <MapPin className="w-4 h-4" />
                    <span style={{ fontSize: "14px" }}>{listing.address}</span>
                  </div>
                </div>
                {overallScore > 0 && (
                  <ScoreRing score={overallScore} size={56} />
                )}
              </div>

              {/* Quick facts — staggered */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { label: "Type", value: formatPropertyType(listing.property_type) },
                  { label: "Rooms", value: `${listing.total_rooms} bed / ${listing.bathrooms} bath` },
                  { label: "Lease", value: formatLeaseType(listing.lease_type) },
                  { label: "Move-in", value: formatDate(listing.move_in_date) },
                ].map((fact) => (
                  <motion.div
                    key={fact.label}
                    variants={fadeUp}
                    className="bg-[#FAF8F4] rounded-lg p-3"
                  >
                    <div className="text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 600 }}>
                      {fact.label}
                    </div>
                    <div className="text-[#1B2D45] mt-0.5" style={{ fontSize: "14px", fontWeight: 700 }}>
                      {fact.value}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Amenities */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: "Furnished", has: listing.is_furnished },
                  { label: "Parking", has: listing.has_parking },
                  { label: "Laundry", has: listing.has_laundry },
                  { label: "Utilities Included", has: listing.utilities_included },
                ].map((a) => (
                  <motion.div
                    key={a.label}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {a.has ? (
                      <Check className="w-4 h-4 text-[#4ADE80]" />
                    ) : (
                      <X className="w-4 h-4 text-[#1B2D45]/20" />
                    )}
                    <span
                      className={a.has ? "text-[#1B2D45]" : "text-[#1B2D45]/30"}
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      {a.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Distance info */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                Getting to Campus
              </h3>
              <div className="flex items-center gap-4 mt-3">
                {listing.walk_time_minutes && (
                  <div className="flex items-center gap-1.5 text-[#1B2D45]/60">
                    <Clock className="w-4 h-4" />
                    <span style={{ fontSize: "13px" }}>{listing.walk_time_minutes} min walk</span>
                  </div>
                )}
                {listing.bus_time_minutes && (
                  <div className="flex items-center gap-1.5 text-[#1B2D45]/60">
                    <Bus className="w-4 h-4" />
                    <span style={{ fontSize: "13px" }}>{listing.bus_time_minutes} min by bus</span>
                  </div>
                )}
                {listing.distance_to_campus_km && (
                  <div className="text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
                    {Number(listing.distance_to_campus_km).toFixed(1)} km
                  </div>
                )}
              </div>

              {/* Health Score Breakdown — animated bars */}
              {healthScore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="mt-8 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                    Health Score Breakdown
                  </h3>
                  <div className="space-y-3 mt-3">
                    {[
                      { label: "Price vs Market", score: healthScore.price_vs_market_score, emoji: "📊" },
                      { label: "Landlord Reputation", score: healthScore.landlord_reputation_score, emoji: "⭐" },
                      { label: "Maintenance", score: healthScore.maintenance_score, emoji: "🔧" },
                      { label: "Lease Clarity", score: healthScore.lease_clarity_score, emoji: "📋" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                      >
                        <span style={{ fontSize: "14px" }}>{item.emoji}</span>
                        <span
                          className="text-[#1B2D45]/60 w-[140px] shrink-0"
                          style={{ fontSize: "12px", fontWeight: 500 }}
                        >
                          {item.label}
                        </span>
                        <AnimatedBar
                          score={item.score ?? 0}
                          color={getScoreColor(item.score ?? 0)}
                        />
                        <span
                          className="w-8 text-right shrink-0"
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: getScoreColor(item.score ?? 0),
                          }}
                        >
                          {item.score ?? "—"}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <>
                  <h3 className="mt-8 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                    Student Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-3 mt-3">
                    {reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        className="bg-[#FAF8F4] rounded-lg p-4"
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {["Responsive", "Maintenance", "Privacy", "Fairness"].map(
                              (cat, ci) => {
                                const val = [
                                  review.responsiveness,
                                  review.maintenance_speed,
                                  review.respect_privacy,
                                  review.fairness_of_charges,
                                ][ci];
                                return (
                                  <div key={cat} className="text-center">
                                    <div className="text-[#1B2D45]/30" style={{ fontSize: "8px" }}>
                                      {cat}
                                    </div>
                                    <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                      {val}/5
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <div
                            className={`ml-auto px-2 py-0.5 rounded-full ${
                              review.would_rent_again
                                ? "bg-[#4ADE80]/10 text-[#4ADE80]"
                                : "bg-[#E71D36]/10 text-[#E71D36]"
                            }`}
                            style={{ fontSize: "10px", fontWeight: 600 }}
                          >
                            {review.would_rent_again
                              ? "Would rent again ✓"
                              : "Would not rent again"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Sidebar — glassmorphism sticky */}
          <motion.div className="space-y-4" variants={fadeUp}>
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-black/[0.06] p-6 sticky top-[80px] shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-baseline gap-1">
                <span className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 800 }}>
                  {formatPrice(Number(listing.rent_per_room))}
                </span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>
                  /room/mo
                </span>
              </div>
              <div className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px" }}>
                {formatPrice(Number(listing.rent_total))} total rent
              </div>

              {/* Verified badge — animated pulse */}
              {listing.landlord_verified && (
                <motion.div
                  className="relative flex items-center gap-1.5 mt-4 bg-[#4ADE80]/10 text-[#4ADE80] px-3 py-1.5 rounded-lg overflow-hidden"
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  {/* Subtle glow pulse */}
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "rgba(74,222,128,0.08)" }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <Check className="w-3.5 h-3.5 relative z-[1]" />
                  <span className="relative z-[1]">Verified Landlord</span>
                </motion.div>
              )}

              <div className="text-[#1B2D45]/50 mt-3" style={{ fontSize: "12px" }}>
                Listed by{" "}
                <span className="text-[#1B2D45] font-semibold">
                  {listing.landlord_name}
                </span>
              </div>

              {/* Magnetic CTA */}
              <ShimmerCTA
                className="relative w-full mt-5 py-3 rounded-xl bg-[#FF6B35] text-white overflow-hidden"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  boxShadow: "0 4px 20px rgba(255,107,53,0.3)",
                }}
              >
                Contact Landlord
              </ShimmerCTA>

              <motion.button
                className="w-full mt-2 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45] hover:bg-[#1B2D45]/[0.03] transition-all flex items-center justify-center gap-2"
                style={{ fontSize: "14px", fontWeight: 500 }}
                whileTap={{ scale: 0.97 }}
              >
                <Heart className="w-4 h-4" />
                Save Listing
              </motion.button>

              <div
                className="text-[#1B2D45]/30 text-center mt-4"
                style={{ fontSize: "11px" }}
              >
                {listing.view_count} views · Listed {formatDate(listing.created_at)}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
