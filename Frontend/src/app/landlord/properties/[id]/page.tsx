"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { PropertyResponse, ListingDetailResponse, HealthScoreResponse } from "@/types";
import { formatPrice, formatLeaseType, formatDate, getScoreColor } from "@/lib/utils";
import {
  ArrowLeft, Plus, Eye, Trash2, Edit3, Home, Calendar, DollarSign,
  MapPin, Loader2, AlertTriangle, Check, X,
} from "lucide-react";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const propertyId = Number(id);
  const router = useRouter();
  const { user } = useAuthStore();
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [listings, setListings] = useState<ListingDetailResponse[]>([]);
  const [scores, setScores] = useState<Record<number, HealthScoreResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [confirmDeleteProperty, setConfirmDeleteProperty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const prop = await api.properties.getById(propertyId);
        setProperty(prop);

        const allListings = await api.listings.browse({ skip: 0, limit: 100 });
        const propListings = allListings.filter(l => l.property_id === propertyId);
        setListings(propListings);

        // Fetch health scores
        const scoreMap: Record<number, HealthScoreResponse> = {};
        await Promise.allSettled(
          propListings.map(async (l) => {
            try {
              const hs = await api.healthScores.get(l.id);
              scoreMap[l.id] = hs;
            } catch { /* not computed */ }
          })
        );
        setScores(scoreMap);
      } catch {
        // Property not found
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [propertyId]);

  async function deleteListing(listingId: number) {
    setDeleting(listingId);
    try {
      await api.listings.delete(listingId);
      setListings((prev) => prev.filter(l => l.id !== listingId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function deleteProperty() {
    setDeletingProperty(true);
    try {
      await api.properties.delete(propertyId);
      router.push("/landlord");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete property");
      setDeletingProperty(false);
    }
  }

  if (!user || user.role !== "landlord") return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-[#FFB627] mx-auto mb-2" />
          <p className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Property not found</p>
          <Link href="/landlord" className="text-[#FF6B35] mt-2 inline-block" style={{ fontSize: "13px", fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const activeListings = listings.filter(l => l.status === "active").length;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link href="/landlord" className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "13px", fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Property header */}
        <div className="bg-white rounded-xl border border-black/[0.04] p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>{property.title}</h1>
              <p className="text-[#1B2D45]/40 flex items-center gap-1.5 mt-1" style={{ fontSize: "13px" }}>
                <MapPin className="w-3.5 h-3.5" /> {property.address}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/landlord/properties/${propertyId}/listings/new`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Listing
              </Link>
            </div>
          </div>

          {/* Property details grid */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { label: property.property_type, icon: "🏠" },
              { label: `${property.total_rooms} bed`, icon: "🛏️" },
              { label: `${property.bathrooms} bath`, icon: "🚿" },
              property.is_furnished && { label: "Furnished", icon: "🛋️" },
              property.has_parking && { label: "Parking", icon: "🅿️" },
              property.has_laundry && { label: "Laundry", icon: "🧺" },
              property.utilities_included && { label: "Utilities Incl.", icon: "💡" },
              property.distance_to_campus_km && { label: `${property.distance_to_campus_km} km`, icon: "📍" },
              property.walk_time_minutes && { label: `${property.walk_time_minutes} min walk`, icon: "🚶" },
            ].filter(Boolean).map((tag, i) => (
              <span key={i} className="bg-[#1B2D45]/5 text-[#1B2D45]/60 px-2.5 py-1 rounded-lg" style={{ fontSize: "11px", fontWeight: 500 }}>
                {(tag as { icon: string }).icon} {(tag as { label: string }).label}
              </span>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
            Listings ({listings.length})
          </h2>
          <span className={`px-2.5 py-1 rounded-lg ${activeListings > 0 ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#1B2D45]/5 text-[#1B2D45]/30"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
            {activeListings} active
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-black/[0.06] p-8 text-center">
            <Calendar className="w-8 h-8 text-[#FF6B35]/30 mx-auto mb-2" />
            <p className="text-[#1B2D45]/40" style={{ fontSize: "14px", fontWeight: 500 }}>No listings yet</p>
            <Link
              href={`/landlord/properties/${propertyId}/listings/new`}
              className="inline-flex items-center gap-1.5 mt-3 text-[#FF6B35]"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" /> Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const score = scores[listing.id];
              const scoreColor = score?.overall_score ? getScoreColor(score.overall_score) : undefined;

              return (
                <div key={listing.id} className="bg-white rounded-xl border border-black/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#FF6B35]" style={{ fontSize: "18px", fontWeight: 800 }}>
                          {formatPrice(Number(listing.rent_per_room))}
                          <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 400 }}>/room</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${listing.status === "active" ? "bg-[#4ADE80]/10 text-[#4ADE80]" : listing.status === "rented" ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" : "bg-[#1B2D45]/5 text-[#1B2D45]/30"}`} style={{ fontSize: "10px", fontWeight: 600 }}>
                          {listing.status}
                        </span>
                        {listing.is_sublet && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFB627]/10 text-[#FFB627]" style={{ fontSize: "10px", fontWeight: 600 }}>
                            ☀️ Sublet
                          </span>
                        )}
                        {score?.overall_score && (
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 700, color: scoreColor, background: `${scoreColor}15` }}>
                            HS {score.overall_score}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
                        <span>{formatLeaseType(listing.lease_type)}</span>
                        <span>·</span>
                        <span>Move-in {formatDate(listing.move_in_date)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.view_count} views</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      disabled={deleting === listing.id}
                      className="w-8 h-8 rounded-lg border border-black/[0.06] flex items-center justify-center text-[#1B2D45]/30 hover:text-[#E71D36] hover:border-[#E71D36]/20 transition-all shrink-0"
                    >
                      {deleting === listing.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Health score breakdown */}
                  {score && (
                    <div className="mt-3 pt-3 border-t border-black/[0.04] grid grid-cols-4 gap-2">
                      {[
                        { label: "Price", value: score.price_vs_market_score },
                        { label: "Reputation", value: score.landlord_reputation_score },
                        { label: "Maintenance", value: score.maintenance_score },
                        { label: "Lease Clarity", value: score.lease_clarity_score },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="text-[#1B2D45]/30" style={{ fontSize: "9px", fontWeight: 500 }}>{s.label}</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: s.value ? getScoreColor(s.value) : "#1B2D45" }}>
                            {s.value ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Danger zone */}
        <div className="mt-10 pt-6 border-t border-black/[0.06]">
          <h3 className="text-[#E71D36]/60" style={{ fontSize: "13px", fontWeight: 600 }}>Danger Zone</h3>
          {!confirmDeleteProperty ? (
            <button
              onClick={() => setConfirmDeleteProperty(true)}
              className="mt-2 px-4 py-2 rounded-lg border border-[#E71D36]/20 text-[#E71D36]/60 hover:bg-[#E71D36]/5 transition-all"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Delete this property and all its listings
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 500 }}>Are you sure? This cannot be undone.</span>
              <button
                onClick={deleteProperty}
                disabled={deletingProperty}
                className="px-4 py-2 rounded-lg bg-[#E71D36] text-white hover:bg-[#c91830] transition-all"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {deletingProperty ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDeleteProperty(false)}
                className="px-4 py-2 rounded-lg border border-black/[0.06] text-[#1B2D45]/40"
                style={{ fontSize: "12px", fontWeight: 500 }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
