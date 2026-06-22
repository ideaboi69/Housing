"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useBack } from "@/lib/use-back";
import { api } from "@/lib/api";
import type { PropertyResponse, ListingDetailResponse, HealthScoreResponse, ConversationResponse } from "@/types";
import { formatPrice, formatDate, formatPropertyType } from "@/lib/utils";
import { getListingImages, getMockHealthScore, mockListings } from "@/lib/mock-data";
import {
  ArrowLeft, Plus, Eye, Trash2, Edit3, Calendar, Camera,
  MapPin, Loader2, AlertTriangle, ChevronDown, Maximize2,
} from "lucide-react";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { EditPropertyModal } from "@/components/landlord/EditPropertyModal";
import { ListingVisibilitySwitch } from "@/components/landlord/ListingVisibilitySwitch";
import { ListingMessagesCard } from "@/components/landlord/ListingMessagesCard";
import { getListingStatusBucket, getListingStatusLabel, getListingStatusTone, isToggleableStatus } from "@/lib/listing-status";

type ListingStatusFilter = "all" | "active" | "review" | "draft" | "archived";

function getMoveInLabel(listing: ListingDetailResponse) {
  return listing.has_flexible_move_in ? "Any move-in date" : `Move-in ${formatDate(listing.move_in_date)}`;
}

function getListingRowLabel(listing: ListingDetailResponse, index: number) {
  const firstRoom = listing.rooms?.[0];
  if (firstRoom?.label) return firstRoom.label;
  if (listing.rooms?.length === 1) return "Room 1";
  if (listing.rooms?.length > 1) return `${listing.rooms.length} rooms`;
  return `Listing ${index + 1}`;
}

function getListingTypeLabel(listing: ListingDetailResponse) {
  if (listing.rooms?.length === 1) return "Private Room";
  if (listing.rooms?.length > 1) return `${listing.rooms.length} Rooms`;
  return listing.is_sublet ? "Sublet" : "Unit";
}

function buildMockProperty(propertyId: number): PropertyResponse | null {
  const listing = mockListings.find((item) => item.property_id === propertyId);
  if (!listing) return null;

  return {
    id: listing.property_id,
    landlord_id: listing.landlord_id,
    title: listing.title,
    address: listing.address,
    postal_code: "",
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    property_type: listing.property_type as PropertyResponse["property_type"],
    total_rooms: listing.total_rooms,
    bathrooms: listing.bathrooms,
    is_furnished: listing.is_furnished,
    has_parking: listing.has_parking,
    has_laundry: listing.has_laundry,
    utilities_included: listing.utilities_included,
    has_wifi: Boolean(listing.has_wifi),
    has_air_conditioning: Boolean(listing.has_air_conditioning),
    has_dishwasher: Boolean(listing.has_dishwasher),
    has_gym: Boolean(listing.has_gym),
    has_elevator: Boolean(listing.has_elevator),
    has_backyard: Boolean(listing.has_backyard),
    has_balcony: Boolean(listing.has_balcony),
    wheelchair_accessible: Boolean(listing.wheelchair_accessible),
    pet_policy: (listing.pet_policy ?? (listing.pet_friendly ? "friendly" : "not_allowed")) as PropertyResponse["pet_policy"],
    smoking_policy: (listing.smoking_policy ?? (listing.smoking_allowed ? "allowed" : "not_allowed")) as PropertyResponse["smoking_policy"],
    estimated_utility_cost: listing.estimated_utility_cost ?? 0,
    distance_to_campus_km: listing.distance_to_campus_km ?? 0,
    walk_time_minutes: listing.walk_time_minutes ?? 0,
    drive_time_minutes: listing.drive_time_minutes ?? 0,
    bus_time_minutes: listing.bus_time_minutes ?? 0,
    nearest_bus_route: listing.nearest_bus_route ?? "",
    amenities: listing.amenities,
    policies: listing.policies,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
  };
}

function getMockPropertyListings(propertyId: number): ListingDetailResponse[] {
  return mockListings
    .filter((listing) => listing.property_id === propertyId)
    .map((listing) => ({
      ...listing,
      images: listing.images ?? getListingImages(listing.id).map((imageUrl, index) => ({
        id: listing.id * 100 + index,
        image_url: imageUrl,
        display_order: index,
      })),
    }));
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const propertyId = Number(id);
  const router = useRouter();
  const goBack = useBack("/landlord?tab=properties");
  const { user } = useAuthStore();
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [listings, setListings] = useState<ListingDetailResponse[]>([]);
  const [scores, setScores] = useState<Record<number, HealthScoreResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [confirmDeleteProperty, setConfirmDeleteProperty] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState<"basics" | "photos">("basics");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>("all");
  const [togglingListing, setTogglingListing] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const convos = await api.messages.getLandlordConversations();
        if (!cancelled) setConversations(convos);
      } catch {
        // No inbox to show — section falls back to an empty state.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        let prop: PropertyResponse | null = null;
        try {
          prop = await api.properties.getById(propertyId);
        } catch {
          prop = buildMockProperty(propertyId);
        }

        if (!prop) {
          setProperty(null);
          setListings([]);
          setScores({});
          return;
        }

        setProperty(prop);

        const listingResults = await Promise.allSettled(
          ["active", "draft", "rented", "expired"].map((status) =>
            api.listings.browse({ skip: 0, limit: 100, status })
          )
        );
        const allListings = listingResults.flatMap((result) => (
          result.status === "fulfilled" ? result.value : []
        ));
        const backendListings = allListings.filter(l => l.property_id === propertyId);
        const propListings = backendListings.length > 0 ? backendListings : getMockPropertyListings(propertyId);
        setListings(propListings);

        // Fetch Cribb Scores
        const scoreMap: Record<number, HealthScoreResponse> = {};
        await Promise.allSettled(
          propListings.map(async (l) => {
            try {
              const hs = await api.healthScores.get(l.id);
              scoreMap[l.id] = hs;
            } catch {
              const mockScore = getMockHealthScore(l.id);
              if (mockScore) scoreMap[l.id] = mockScore;
            }
          })
        );
        setScores(scoreMap);
      } catch {
        const fallbackProperty = buildMockProperty(propertyId);
        const fallbackListings = getMockPropertyListings(propertyId);
        setProperty(fallbackProperty);
        setListings(fallbackListings);
        setScores(Object.fromEntries(
          fallbackListings
            .map((listing) => [listing.id, getMockHealthScore(listing.id)] as const)
            .filter((entry): entry is readonly [number, HealthScoreResponse] => Boolean(entry[1]))
        ));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [propertyId]);

  async function deleteListing(listingId: number) {
    const confirmed = window.confirm("Delete this listing? This cannot be undone.");
    if (!confirmed) return;

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

  async function refreshListing(listingId: number) {
    try {
      const updated = await api.listings.getById(listingId);
      setListings((prev) => prev.map((listing) => (
        listing.id === listingId ? updated : listing
      )));
    } catch {
      // Keep the current card if refresh fails; the user can reload the page.
    }
  }

  async function toggleListingVisibility(listing: ListingDetailResponse) {
    if (togglingListing === listing.id) return;

    setTogglingListing(listing.id);
    try {
      // Active → take down (unpublish). Otherwise → publish live.
      if (listing.status.toLowerCase() === "active") {
        await api.listings.unpublish(listing.id);
      } else {
        await api.listings.publish(listing.id);
      }
      await refreshListing(listing.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update listing status.");
    } finally {
      setTogglingListing(null);
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
        <Loader2 className="w-6 h-6 text-[#1B2D45] animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-[#1B2D45] mx-auto mb-2" />
          <p className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Property not found</p>
          <Link href="/landlord" className="text-[#1B2D45] mt-2 inline-block" style={{ fontSize: "13px", fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const counts = {
    all: listings.length,
    active: listings.filter((listing) => getListingStatusBucket(listing.status) === "active").length,
    review: listings.filter((listing) => getListingStatusBucket(listing.status) === "review").length,
    draft: listings.filter((listing) => getListingStatusBucket(listing.status) === "draft").length,
    archived: listings.filter((listing) => getListingStatusBucket(listing.status) === "archived").length,
  };
  const filterLabels: Record<ListingStatusFilter, string> = {
    all: `All listings (${counts.all})`,
    active: `Active (${counts.active})`,
    review: `Under review (${counts.review})`,
    draft: `Draft (${counts.draft})`,
    archived: `Archived (${counts.archived})`,
  };
  const filteredListings = listings.filter((listing) => (
    statusFilter === "all" ? true : getListingStatusBucket(listing.status) === statusFilter
  ));
  const activeListings = counts.active;

  // Inquiries scoped to this property's listings
  const listingIds = new Set(listings.map((listing) => listing.id));
  const propertyConversations = conversations.filter((c) => listingIds.has(c.listing_id));

  // Photos: real property images, else demo placeholders so the gallery is previewable.
  const realImages = property.images && property.images.length > 0;
  const coverImages = realImages
    ? property.images!.map((img) => ({ key: String(img.id), url: img.image_url }))
    : ["/demo/listings/house.jpg", "/demo/listings/townhouse.jpg", "/demo/listings/apartment.jpg", "/demo/listings/studio.jpg"].map((url, i) => ({ key: `demo-${i}`, url }));

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-8">
          <button type="button" onClick={goBack} className="mb-5 inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 400 }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", lineHeight: 1.15, fontWeight: 600 }}>{property.title}</h1>
                {activeListings > 0 && (
                  <span className="rounded-full bg-[#239B55]/10 px-2 py-0.5 text-[#239B55]" style={{ fontSize: "11px", fontWeight: 500 }}>
                    {activeListings} active
                  </span>
                )}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[#1B2D45]/75" style={{ fontSize: "14px", fontWeight: 500 }}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-[#1B2D45]/45" />
                  {property.address}
                </span>
                <span className="text-[#1B2D45]/30">·</span>
                <span>{formatPropertyType(property.property_type)} · {property.total_rooms} bed · {property.bathrooms} bath</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2D45] px-3.5 py-2 text-white transition-colors hover:bg-[#152438]"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit property
              </button>
              <Link
                href={`/landlord/properties/${propertyId}/listings/new`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-3.5 py-2 text-[#1B2D45]/70 transition-colors hover:border-[#1B2D45]/25 hover:text-[#1B2D45]"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                <Plus className="h-3.5 w-3.5" /> Add listing
              </Link>
            </div>
          </div>
        </div>

        <section className="mb-5 rounded-2xl border border-[#1B2D45]/[0.08] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Photos</h2>
            <button
              type="button"
              onClick={() => { setEditTab("photos"); setEditing(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-3 py-1.5 text-[#1B2D45]/70 transition-colors hover:border-[#1B2D45]/25 hover:text-[#1B2D45]"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              <Camera className="h-3.5 w-3.5" /> Manage photos
            </button>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="group relative block h-44 w-full cursor-zoom-in overflow-hidden rounded-xl bg-[#FAF8F4] sm:h-52"
            >
              <img src={coverImages[0].url} alt="Property cover" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              {!realImages && (
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-white" style={{ fontSize: "10px", fontWeight: 500 }}>
                  Sample photos
                </span>
              )}
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100" style={{ fontSize: "11px", fontWeight: 500 }}>
                <Maximize2 className="h-3 w-3" /> View {coverImages.length} photo{coverImages.length === 1 ? "" : "s"}
              </span>
            </button>
            {coverImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {coverImages.slice(1).map((img, i) => (
                  <button
                    key={img.key}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-[#FAF8F4] transition-opacity hover:opacity-90"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {!realImages && (
              <p className="pt-1 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
                These are sample photos — add your own with “Manage photos”.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1B2D45]/[0.08] bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Listings</h2>
            <label className="flex min-w-[200px] flex-col gap-1.5">
              <span className="text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 500 }}>Status</span>
              <span className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as ListingStatusFilter)}
                  className="h-9 w-full appearance-none rounded-lg border border-[#1B2D45]/12 bg-transparent px-3 pr-9 text-[#1B2D45] outline-none transition-colors hover:border-[#1B2D45]/25 focus:border-[#1B2D45]/40"
                  style={{ fontSize: "13px", fontWeight: 400 }}
                >
                  {(Object.keys(filterLabels) as ListingStatusFilter[]).map((key) => (
                    <option key={key} value={key}>{filterLabels[key]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B2D45]/55" />
              </span>
            </label>
          </div>

          {listings.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto mb-3 h-8 w-8 text-[#1B2D45]/25" />
              <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>This property has no listings yet</h3>
              <p className="mx-auto mt-1 max-w-[360px] text-[#1B2D45]/65" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                Create a listing when you are ready to publish a rentable room or space for students.
              </p>
              <Link
                href={`/landlord/properties/${propertyId}/listings/new`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#1B2D45] px-4 py-2.5 text-white transition-colors hover:bg-[#152438]"
                style={{ fontSize: "13px", fontWeight: 800 }}
              >
                <Plus className="h-3.5 w-3.5" /> Create First Listing
              </Link>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[#1B2D45]/70" style={{ fontSize: "13px", fontWeight: 700 }}>
                No {statusFilter} listings for this property.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] table-fixed">
                  <thead>
                    <tr className="border-y border-[#1B2D45]/[0.08] text-left text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 500 }}>
                      <th className="w-[22%] px-4 py-2.5">Listing / room</th>
                      <th className="w-[16%] px-4 py-2.5">Type</th>
                      <th className="w-[15%] px-4 py-2.5">Rent</th>
                      <th className="w-[15%] px-4 py-2.5">Status</th>
                      <th className="w-[16%] px-4 py-2.5">On / off</th>
                      <th className="w-[16%] px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2D45]/[0.05]">
                    {filteredListings.map((listing, index) => {
                      const isActive = listing.status.toLowerCase() === "active";
                      const isToggleable = isToggleableStatus(listing.status);
                      return (
                        <tr key={listing.id} className="transition-colors hover:bg-[#1B2D45]/[0.02]">
                          <td className="px-4 py-3">
                            <Link href={`/landlord/properties/${propertyId}/listings/${listing.id}`} className="block text-[#1B2D45] hover:underline" style={{ fontSize: "13px", fontWeight: 500 }}>
                              {getListingRowLabel(listing, index)}
                            </Link>
                            <div className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "11px" }}>{getMoveInLabel(listing)}</div>
                          </td>
                          <td className="px-4 py-3 text-[#1B2D45]/65" style={{ fontSize: "12px" }}>{getListingTypeLabel(listing)}</td>
                          <td className="px-4 py-3 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{formatPrice(Number(listing.rent_per_room))}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 ${getListingStatusTone(listing.status)}`} style={{ fontSize: "11px", fontWeight: 500 }}>
                              {getListingStatusLabel(listing.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ListingVisibilitySwitch
                              isActive={isActive}
                              disabled={!isToggleable}
                              loading={togglingListing === listing.id}
                              onClick={() => void toggleListingVisibility(listing)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/landlord/properties/${propertyId}/listings/${listing.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-2.5 text-[#1B2D45]/80 transition-all hover:border-[#1B2D45]/25 hover:text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 800 }} title="Manage listing">
                                <Edit3 className="h-3.5 w-3.5" /> Manage
                              </Link>
                              <Link href={`/browse/${listing.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1B2D45]/70 transition-all hover:bg-[#1B2D45]/[0.06] hover:text-[#1B2D45]" title="Preview listing">
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <button type="button" onClick={() => void deleteListing(listing.id)} disabled={deleting === listing.id} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#E71D36]/75 transition-all hover:bg-[#E71D36]/[0.06] disabled:opacity-40" title="Delete listing">
                                {deleting === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          )}

        </section>

        {/* Messages & Inquiries — shared inline section, consistent across detail pages */}
        <div className="mt-5 rounded-2xl border border-[#1B2D45]/[0.08] bg-white p-5">
          <ListingMessagesCard conversations={propertyConversations} />
        </div>

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
                className="px-4 py-2 rounded-lg border border-black/[0.06] text-[#1B2D45]/65"
                style={{ fontSize: "12px", fontWeight: 500 }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {editing && property && (
        <EditPropertyModal
          property={property}
          initialTab={editTab}
          onClose={() => { setEditing(false); setEditTab("basics"); }}
          onSaved={(updated) => setProperty(updated)}
        />
      )}
      {lightboxIndex !== null && (
        <PhotoLightbox
          images={coverImages.map((img) => img.url)}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
