"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { useBack } from "@/lib/use-back";
import type {
  ListingDetailResponse,
  HealthScoreResponse,
  ViewingBookingResponse,
  ConversationResponse,
} from "@/types";
import { formatPrice, formatDate, formatLeaseType } from "@/lib/utils";
import { getListingStatusLabel, getListingStatusTone } from "@/lib/listing-status";
import { getListingImages, getMockHealthScore, mockListings } from "@/lib/mock-data";
import { EditListingModal } from "@/components/landlord/EditListingModal";
import { ListingImageUpload } from "@/components/landlord/ListingImageUpload";
import { ShowingsManager } from "@/components/landlord/ShowingsManager";
import { ListingMessagesCard } from "@/components/landlord/ListingMessagesCard";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  ArrowLeft, Loader2, AlertTriangle, FileText, Image as ImageIcon, CalendarDays,
  BarChart3, MessageCircle, ShieldAlert, Eye, Camera, Edit3,
  Clock, CheckCircle2, Trash2,
} from "lucide-react";

const SECTIONS = [
  { id: "details", label: "Listing Details", icon: FileText },
  { id: "photos", label: "Photographs", icon: ImageIcon },
  { id: "viewings", label: "Viewings & Inquiries", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "danger", label: "Danger Zone", icon: ShieldAlert },
] as const;

function SectionCard({ id, icon: Icon, title, description, action, children }: { id: string; icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border border-[#1B2D45]/[0.08] bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B2D45]/[0.05] text-[#1B2D45]/70">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <h2 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 600 }}>{title}</h2>
            {description && <p className="mt-0.5 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function buildMockListing(listingId: number): ListingDetailResponse | null {
  const m = mockListings.find((l) => l.id === listingId);
  if (!m) return null;
  return {
    ...m,
    images: m.images ?? getListingImages(m.id).map((image_url, i) => ({ id: m.id * 100 + i, image_url, display_order: i })),
  } as unknown as ListingDetailResponse;
}

export default function ManageListingPage({ params }: { params: Promise<{ id: string; listingId: string }> }) {
  const { id, listingId: listingIdParam } = use(params);
  const propertyId = Number(id);
  const listingId = Number(listingIdParam);
  const router = useRouter();
  const goBack = useBack(`/landlord/properties/${propertyId}`);
  const { user } = useAuthStore();

  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [score, setScore] = useState<HealthScoreResponse | null>(null);
  const [bookings, setBookings] = useState<ViewingBookingResponse[]>([]);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [showingsOpen, setShowingsOpen] = useState(false);
  const [hasShowingTimes, setHasShowingTimes] = useState<boolean | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshListing = useCallback(async () => {
    try {
      const updated = await api.listings.getById(listingId);
      setListing(updated);
    } catch { /* keep current */ }
  }, [listingId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let l: ListingDetailResponse | null = null;
        try { l = await api.listings.getById(listingId); }
        catch { l = buildMockListing(listingId); }
        if (cancelled) return;
        setListing(l);

        const [s, b, c, a] = await Promise.allSettled([
          api.healthScores.get(listingId),
          api.viewings.getLandlordBookings(listingId),
          api.messages.getLandlordConversations(),
          api.viewings.getListingAvailability(listingId),
        ]);
        if (cancelled) return;
        setScore(s.status === "fulfilled" ? s.value : (getMockHealthScore(listingId) ?? null));
        setBookings(b.status === "fulfilled" ? b.value : []);
        setConversations(c.status === "fulfilled" ? c.value : []);
        setHasShowingTimes(a.status === "fulfilled" ? a.value.length > 0 : null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [listingId]);

  async function runAction(key: string, fn: () => Promise<unknown>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoading(key);
    try {
      await fn();
      if (key === "delete") { router.push(`/landlord/properties/${propertyId}`); return; }
      await refreshListing();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
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

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-[#1B2D45] mx-auto mb-2" />
          <p className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Listing not found</p>
          <button onClick={goBack} className="text-[#1B2D45] mt-2 inline-block" style={{ fontSize: "13px", fontWeight: 600 }}>← Back to property</button>
        </div>
      </div>
    );
  }

  const status = listing.status.toLowerCase();
  // Photos: real listing images, else demo placeholders so the page is previewable.
  const realImages = Boolean(listing.images && listing.images.length > 0);
  const photoImages = realImages
    ? listing.images!.map((img) => ({ key: String(img.id), url: img.image_url }))
    : ["/demo/listings/apartment.jpg", "/demo/listings/studio.jpg", "/demo/listings/townhouse.jpg", "/demo/listings/house.jpg"].map((url, i) => ({ key: `demo-${i}`, url }));
  const coverImage = photoImages[0]?.url;
  const listingConversations = conversations.filter((c) => c.listing_id === listingId);
  const upcomingViewings = bookings.filter((b) => b.status === "confirmed").length;
  const roomLabel = listing.rooms?.[0]?.label ?? (listing.rooms && listing.rooms.length > 1 ? `${listing.rooms.length} rooms` : "Whole unit");
  const overall = score?.overall_score ?? null;

  const headerStats = [
    { label: "per room", value: formatPrice(Number(listing.rent_per_room)), icon: null },
    { label: "lease", value: formatLeaseType(listing.lease_type, listing.custom_lease_type), icon: null },
    { label: "views", value: String(listing.view_count), icon: Eye },
    { label: "move-in", value: listing.has_flexible_move_in ? "Flexible" : formatDate(listing.move_in_date), icon: null },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-10">
        <button type="button" onClick={goBack} className="mb-4 inline-flex items-center gap-1.5 text-[#1B2D45]/70 hover:text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to property
        </button>

        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-[#E9EEF7]">
            {coverImage
              ? <img src={coverImage} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-[#1B2D45]/30"><ImageIcon className="h-6 w-6" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", lineHeight: 1.15, fontWeight: 600 }}>{listing.title}</h1>
              <span className={`rounded-full px-2 py-0.5 ${getListingStatusTone(listing.status)}`} style={{ fontSize: "11px", fontWeight: 500 }}>
                {getListingStatusLabel(listing.status)}
              </span>
            </div>
            <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>{roomLabel} · {listing.address}</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              {headerStats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-1.5">
                  <span className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 600 }}>{s.value}</span>
                  <span className="text-[#1B2D45]/45" style={{ fontSize: "12px" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status banners */}
        {status === "under_review" && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-[#FFB627]/10 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#A66A00]" />
            <div>
              <div className="text-[#A66A00]" style={{ fontSize: "13px", fontWeight: 500 }}>Not published yet</div>
              <p className="text-[#1B2D45]/60" style={{ fontSize: "12px" }}>This listing isn&apos;t visible to students. Publish it below to make it live.</p>
            </div>
          </div>
        )}
        {status === "draft" && listing.rejection_reason && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-[#E71D36]/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E71D36]" />
            <div>
              <div className="text-[#E71D36]" style={{ fontSize: "13px", fontWeight: 500 }}>Changes needed before this can go live</div>
              <p className="text-[#1B2D45]/70" style={{ fontSize: "12px" }}>{listing.rejection_reason}</p>
            </div>
          </div>
        )}

        {/* Sticky section nav */}
        <nav className="sticky top-0 z-20 mb-8 flex gap-1 overflow-x-auto border-b border-[#1B2D45]/[0.08] bg-[#FAF8F4]/90 py-2 backdrop-blur-sm">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[#1B2D45]/55 transition-colors hover:bg-[#1B2D45]/[0.05] hover:text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 400 }}>
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-4">
          {/* Listing Details */}
          <SectionCard
            id="details"
            icon={FileText}
            title="Listing details"
            description="Pricing, lease, and availability."
            action={
              <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-3 py-1.5 text-[#1B2D45] transition-colors hover:border-[#1B2D45]/25" style={{ fontSize: "12px", fontWeight: 500 }}>
                <Edit3 className="h-3.5 w-3.5" /> Edit details
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {[
                { label: "Rent / room", value: formatPrice(Number(listing.rent_per_room)) },
                { label: "Lease type", value: formatLeaseType(listing.lease_type, listing.custom_lease_type) },
                { label: "Move-in", value: listing.has_flexible_move_in ? "Flexible" : formatDate(listing.move_in_date) },
                { label: "Gender pref.", value: listing.gender_preference ? listing.gender_preference[0].toUpperCase() + listing.gender_preference.slice(1) : "Any" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 400 }}>{f.label}</div>
                  <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Photographs */}
          <SectionCard
            id="photos"
            icon={ImageIcon}
            title="Photographs"
            description="Upload, reorder, or remove photos."
            action={
              <button onClick={() => setPhotosOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-3 py-1.5 text-[#1B2D45] transition-colors hover:border-[#1B2D45]/25" style={{ fontSize: "12px", fontWeight: 500 }}>
                <Camera className="h-3.5 w-3.5" /> Manage photos
              </button>
            }
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photoImages.map((img, i) => (
                <div key={img.key} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#FAF8F4]">
                  <img src={img.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-white" style={{ fontSize: "9px", fontWeight: 500 }}>{realImages ? "Cover" : "Sample"}</div>}
                </div>
              ))}
            </div>
            {!realImages && (
              <p className="mt-2 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>Sample photos — add your own with “Manage photos”.</p>
            )}
          </SectionCard>

          {/* Viewings & Inquiries */}
          <SectionCard
            id="viewings"
            icon={CalendarDays}
            title="Viewings & inquiries"
            description="Scheduled viewings and student interest."
            action={
              <button onClick={() => setShowingsOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-3 py-1.5 text-[#1B2D45] transition-colors hover:border-[#1B2D45]/25" style={{ fontSize: "12px", fontWeight: 500 }}>
                <CalendarDays className="h-3.5 w-3.5" /> Manage slots
              </button>
            }
          >
            {hasShowingTimes === false && listing.status?.toLowerCase() === "active" && (
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-[#FFB627]/35 bg-[#FFFBEB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#A66A00]" />
                  <p className="text-[#1B2D45]/80" style={{ fontSize: "12.5px", lineHeight: 1.5, fontWeight: 500 }}>
                    No showing times set yet — students can&apos;t book a viewing until you add availability.
                  </p>
                </div>
                <button onClick={() => setShowingsOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1B2D45] px-3 py-1.5 text-white transition-colors hover:bg-[#152438]" style={{ fontSize: "12px", fontWeight: 600 }}>
                  <CalendarDays className="h-3.5 w-3.5" /> Set showing times
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1 }}>{upcomingViewings}</div>
                <div className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>Confirmed viewings</div>
              </div>
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1 }}>{listingConversations.length}</div>
                <div className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>Student inquiries</div>
              </div>
            </div>
          </SectionCard>

          {/* Analytics */}
          <SectionCard id="analytics" icon={BarChart3} title="Analytics" description="Views, saves, and engagement over time.">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-wrap gap-x-10 gap-y-3">
                <div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1 }}>{listing.view_count}</div>
                  <div className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>Views</div>
                </div>
                <div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1 }}>{listingConversations.length}</div>
                  <div className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>Inquiries</div>
                </div>
              </div>
              {overall != null && (
                <div className="flex items-center gap-2.5">
                  <ScoreRing score={Math.round(overall)} size={44} />
                  <div>
                    <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 500 }}>Cribb Score</div>
                    <div className="text-[#1B2D45]/45" style={{ fontSize: "11px" }}>price · location · amenities</div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Messages */}
          <div id="messages" className="scroll-mt-20 rounded-2xl border border-[#1B2D45]/[0.08] bg-white p-5">
            <ListingMessagesCard
              conversations={listingConversations}
              subtitle="Student questions about this listing."
              emptyHint="Messages from students about this listing will appear here."
            />
          </div>

          {/* Danger Zone */}
          <section id="danger" className="scroll-mt-20 rounded-2xl border border-[#E71D36]/15 bg-[#E71D36]/[0.02] p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#E71D36]/70" />
              <h2 className="text-[#E71D36]/80" style={{ fontSize: "16px", fontWeight: 600 }}>Danger zone</h2>
            </div>
            <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "12px" }}>Status changes and permanent actions for this listing.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(status === "draft" || status === "under_review") && (
                <button onClick={() => runAction("publish", () => api.listings.publish(listingId))} disabled={actionLoading === "publish"} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2D45] px-4 py-2 text-white transition-colors hover:bg-[#152438] disabled:opacity-50" style={{ fontSize: "12px", fontWeight: 600 }}>
                  {actionLoading === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Publish listing
                </button>
              )}
              {status === "active" && (
                <button onClick={() => runAction("unpublish", () => api.listings.unpublish(listingId))} disabled={actionLoading === "unpublish"} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2D45]/15 px-4 py-2 text-[#1B2D45] transition-all hover:border-[#1B2D45]/30 disabled:opacity-50" style={{ fontSize: "12px", fontWeight: 800 }}>
                  {actionLoading === "unpublish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Unpublish (take down)
                </button>
              )}
              <button onClick={() => runAction("delete", () => api.listings.delete(listingId), "Delete this listing? This cannot be undone.")} disabled={actionLoading === "delete"} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E71D36]/25 px-4 py-2 text-[#E71D36] transition-all hover:bg-[#E71D36]/5 disabled:opacity-50" style={{ fontSize: "12px", fontWeight: 800 }}>
                {actionLoading === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete Listing
              </button>
            </div>
          </section>
        </div>
      </div>

      {editOpen && (
        <EditListingModal
          listing={listing}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => { setListing((prev) => prev ? { ...prev, ...updated } : prev); setEditOpen(false); }}
        />
      )}
      {photosOpen && (
        <ListingImageUpload
          listingId={listingId}
          existingImages={listing.images}
          onClose={() => setPhotosOpen(false)}
          onUploaded={() => void refreshListing()}
        />
      )}
      {showingsOpen && (
        <ShowingsManager
          listingId={listingId}
          listingTitle={listing.title}
          onClose={() => {
            setShowingsOpen(false);
            api.viewings.getListingAvailability(listingId).then((a) => setHasShowingTimes(a.length > 0)).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
