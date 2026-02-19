"use client";

import { use } from "react";
import { useListing, useHealthScore, useReviews } from "@/hooks";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatLeaseType, formatPropertyType, formatDate, getScoreLabel, getScoreColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Bus, Heart, Flag, Check, X } from "lucide-react";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listingId = parseInt(id, 10);
  const { data: listing, isLoading, error } = useListing(listingId);
  const { data: healthScore } = useHealthScore(listingId);
  const { data: reviews } = useReviews(listing ? { property_id: listing.property_id } : undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <p className="text-[#1B2D45]/40">Loading listing...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#E71D36]" style={{ fontSize: "16px", fontWeight: 600 }}>Listing not found</p>
          <Link href="/browse" className="mt-4 inline-block text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 600 }}>
            ← Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const overallScore = healthScore?.overall_score ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Back link */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Main content */}
          <div>
            {/* Image placeholder */}
            <div className="bg-white rounded-xl overflow-hidden border border-black/[0.06]">
              <div className="h-[300px] md:h-[400px] bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center text-[#1B2D45]/20">
                <span style={{ fontSize: "64px" }}>🏠</span>
              </div>
            </div>

            {/* Listing info */}
            <div className="mt-6 bg-white rounded-xl border border-black/[0.06] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-[#1B2D45]/50">
                    <MapPin className="w-4 h-4" />
                    <span style={{ fontSize: "14px" }}>{listing.address}</span>
                  </div>
                </div>
                {overallScore > 0 && <ScoreRing score={overallScore} size={56} />}
              </div>

              {/* Quick facts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[
                  { label: "Type", value: formatPropertyType(listing.property_type) },
                  { label: "Rooms", value: `${listing.total_rooms} bed / ${listing.bathrooms} bath` },
                  { label: "Lease", value: formatLeaseType(listing.lease_type) },
                  { label: "Move-in", value: formatDate(listing.move_in_date) },
                ].map((fact) => (
                  <div key={fact.label} className="bg-[#FAF8F4] rounded-lg p-3">
                    <div className="text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 600 }}>{fact.label}</div>
                    <div className="text-[#1B2D45] mt-0.5" style={{ fontSize: "14px", fontWeight: 700 }}>{fact.value}</div>
                  </div>
                ))}
              </div>

              {/* Amenities */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Amenities</h3>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: "Furnished", has: listing.is_furnished },
                  { label: "Parking", has: listing.has_parking },
                  { label: "Laundry", has: listing.has_laundry },
                  { label: "Utilities Included", has: listing.utilities_included },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-2">
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
                  </div>
                ))}
              </div>

              {/* Distance info */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Getting to Campus</h3>
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

              {/* Health Score Breakdown */}
              {healthScore && (
                <>
                  <h3 className="mt-8 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                    Health Score Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      { label: "Price vs Market", score: healthScore.price_vs_market_score },
                      { label: "Landlord Reputation", score: healthScore.landlord_reputation_score },
                      { label: "Maintenance", score: healthScore.maintenance_score },
                      { label: "Lease Clarity", score: healthScore.lease_clarity_score },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#FAF8F4] rounded-lg p-3 flex items-center justify-between">
                        <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 500 }}>
                          {item.label}
                        </span>
                        <span
                          style={{ fontSize: "14px", fontWeight: 800, color: getScoreColor(item.score ?? 0) }}
                        >
                          {item.score ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <>
                  <h3 className="mt-8 text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                    Student Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-3 mt-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-[#FAF8F4] rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {["Responsive", "Maintenance", "Privacy", "Fairness"].map((cat, i) => {
                              const val = [review.responsiveness, review.maintenance_speed, review.respect_privacy, review.fairness_of_charges][i];
                              return (
                                <div key={cat} className="text-center">
                                  <div className="text-[#1B2D45]/30" style={{ fontSize: "8px" }}>{cat}</div>
                                  <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{val}/5</div>
                                </div>
                              );
                            })}
                          </div>
                          <div
                            className={`ml-auto px-2 py-0.5 rounded-full ${review.would_rent_again ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#E71D36]/10 text-[#E71D36]"}`}
                            style={{ fontSize: "10px", fontWeight: 600 }}
                          >
                            {review.would_rent_again ? "Would rent again ✓" : "Would not rent again"}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-[#1B2D45]/60" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 sticky top-[80px]">
              <div className="flex items-baseline gap-1">
                <span className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 800 }}>
                  {formatPrice(Number(listing.rent_per_room))}
                </span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>/room/mo</span>
              </div>
              <div className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px" }}>
                {formatPrice(Number(listing.rent_total))} total rent
              </div>

              {listing.landlord_verified && (
                <div className="flex items-center gap-1.5 mt-4 bg-[#4ADE80]/10 text-[#4ADE80] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 600 }}>
                  <Check className="w-3.5 h-3.5" />
                  Verified Landlord
                </div>
              )}

              <div className="text-[#1B2D45]/50 mt-3" style={{ fontSize: "12px" }}>
                Listed by <span className="text-[#1B2D45] font-semibold">{listing.landlord_name}</span>
              </div>

              <button
                className="w-full mt-5 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
              >
                Contact Landlord
              </button>

              <button className="w-full mt-2 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45] hover:bg-[#1B2D45]/[0.03] transition-all flex items-center justify-center gap-2"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                <Heart className="w-4 h-4" />
                Save Listing
              </button>

              <div className="text-[#1B2D45]/30 text-center mt-4" style={{ fontSize: "11px" }}>
                {listing.view_count} views · Listed {formatDate(listing.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
