"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, X, MapPin, Home, Calendar, DollarSign, Loader2, ArrowLeft, Sofa, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useSavedStore } from "@/lib/saved-store";
import { api } from "@/lib/api";
import { mockListings } from "@/lib/mock-data";
import { mockSubletDetails } from "@/lib/mock-sublets";
import type { SavedListingDetailResponse } from "@/types";

type SavedPageItem = SavedListingDetailResponse & {
  href: string;
};

function toSavedPageItem(item: SavedListingDetailResponse): SavedPageItem {
  const matchedSublet = mockSubletDetails.find((sublet) => sublet.listing_id === item.listing_id);
  return {
    ...item,
    href: item.is_sublet && matchedSublet ? `/sublets/${matchedSublet.id}` : `/browse/${item.listing_id}`,
  };
}

/** Convert mock data into the SavedListingDetailResponse shape */
function mockToSaved(listingId: number): SavedPageItem | null {
  const sublet = mockSubletDetails.find((item) => item.listing_id === listingId);
  if (sublet) {
    return {
      id: listingId,
      listing_id: listingId,
      saved_at: new Date().toISOString(),
      rent_per_room: sublet.subletPrice,
      rent_total: sublet.subletPrice * Math.max(sublet.bedsAvailable, 1),
      lease_type: "sublet",
      move_in_date: sublet.subletStart ?? null,
      is_sublet: true,
      status: "active",
      title: sublet.title,
      address: sublet.address,
      property_type: sublet.propertyType,
      is_furnished: sublet.is_furnished,
      has_parking: sublet.has_parking,
      distance_to_campus_km: sublet.distanceKm ?? null,
      href: `/sublets/${sublet.id}`,
    };
  }

  const l = mockListings.find((m) => m.id === listingId);
  if (!l) return null;
  return {
    id: listingId,
    listing_id: listingId,
    saved_at: new Date().toISOString(),
    rent_per_room: l.rent_per_room,
    rent_total: l.rent_total,
    lease_type: l.lease_type,
    move_in_date: l.move_in_date ?? null,
    is_sublet: l.is_sublet ?? false,
    status: "active",
    title: l.title,
    address: l.address,
    property_type: l.property_type,
    is_furnished: l.is_furnished,
    has_parking: l.has_parking,
    distance_to_campus_km: l.distance_to_campus_km ?? null,
    href: `/browse/${listingId}`,
  };
}

export default function SavedListingsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { savedIds, toggleSave } = useSavedStore();
  const [listings, setListings] = useState<SavedPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  async function loadSaved() {
    try {
      // Try backend first
      const data = await api.saved.getAll();
      if (data && data.length > 0) {
        setListings(data.map(toSavedPageItem));
        setLoading(false);
        return;
      }
    } catch {
      // Backend unavailable — fall through to store
    }

    // Fallback: use Zustand savedIds + mock data
    const fallbackListings: SavedPageItem[] = [];
    savedIds.forEach((id) => {
      const item = mockToSaved(id);
      if (item) fallbackListings.push(item);
    });
    setListings(fallbackListings);
    setLoading(false);
  }

  // Re-sync when savedIds change (e.g. user saves from browse and comes back)
  useEffect(() => {
    if (!loading && listings.length === 0 && savedIds.size > 0) {
      const fallbackListings: SavedPageItem[] = [];
      savedIds.forEach((id) => {
        const item = mockToSaved(id);
        if (item) fallbackListings.push(item);
      });
      if (fallbackListings.length > 0) {
        setListings(fallbackListings);
      }
    }
  }, [savedIds, loading, listings.length]);

  async function handleUnsave(listingId: number) {
    setRemovingId(listingId);
    try {
      await toggleSave(listingId);
      setListings((prev) => prev.filter((l) => l.listing_id !== listingId));
    } catch {
      // Failed
    } finally {
      setRemovingId(null);
    }
  }

  function formatPrice(n: number) {
    return `$${Math.round(n).toLocaleString()}`;
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F4" }}>
      <div className="max-w-[900px] mx-auto px-4 md:px-6 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-white border border-black/[0.06] flex items-center justify-center text-[#1B2D45]/40 hover:text-[#FF6B35] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em" }}>
              Saved Listings
            </h1>
            <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "13px" }}>
              {loading ? "Loading..." : `${listings.length} listing${listings.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/[0.08] flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <h3 className="text-[#1B2D45] mt-4" style={{ fontSize: "18px", fontWeight: 800 }}>No saved listings yet</h3>
            <p className="text-[#1B2D45]/40 mt-2 max-w-[320px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Browse listings or sublets and tap the heart icon to save them here for easy comparison later.
            </p>
            <Link
              href="/browse"
              className="inline-block mt-5 px-6 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Browse Listings
            </Link>
          </div>
        )}

        {/* Listing cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {listings.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.25 } }}
                className="bg-white rounded-xl border border-black/[0.04] overflow-hidden hover:border-[#FF6B35]/15 hover:shadow-md transition-all group"
              >
                <Link href={item.href} className="flex items-stretch">
                  {/* Left color bar */}
                  <div className="w-1.5 shrink-0" style={{ background: item.status === "active" ? "#4ADE80" : "#FFB627" }} />

                  <div className="flex-1 p-4 flex items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 700 }}>
                          {item.title}
                        </h3>
                        {item.is_sublet && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 700 }}>
                            Sublet
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[#1B2D45]/40">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate" style={{ fontSize: "12px" }}>{item.address}</span>
                      </div>

                      {/* Tags row */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FF6B35]/[0.06]" style={{ fontSize: "10px", fontWeight: 600, color: "#FF6B35" }}>
                          <DollarSign className="w-3 h-3" /> {formatPrice(item.rent_per_room)}/rm
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>
                          <Home className="w-3 h-3" /> {item.property_type}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>
                          <Calendar className="w-3 h-3" /> {item.lease_type}
                        </span>
                        {item.is_furnished && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#4ADE80]/[0.06] text-[#4ADE80]" style={{ fontSize: "10px", fontWeight: 600 }}>
                            <Sofa className="w-3 h-3" /> Furnished
                          </span>
                        )}
                        {item.has_parking && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2EC4B6]/[0.06] text-[#2EC4B6]" style={{ fontSize: "10px", fontWeight: 600 }}>
                            <Car className="w-3 h-3" /> Parking
                          </span>
                        )}
                        {item.distance_to_campus_km != null && (
                          <span className="px-2 py-0.5 rounded-md bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 600 }}>
                            📍 {item.distance_to_campus_km}km
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + unsave */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <div className="text-[#FF6B35]" style={{ fontSize: "18px", fontWeight: 800 }}>
                          {formatPrice(item.rent_per_room)}
                        </div>
                        <div className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>/room/mo</div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnsave(item.listing_id); }}
                        disabled={removingId === item.listing_id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FF6B35] bg-[#FF6B35]/[0.06] hover:bg-[#E71D36]/10 hover:text-[#E71D36] transition-all opacity-0 group-hover:opacity-100"
                        title="Unsave"
                      >
                        {removingId === item.listing_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
