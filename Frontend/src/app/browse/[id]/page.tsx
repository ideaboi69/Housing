"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import { useSavedStore } from "@/lib/saved-store";
import { useAuthStore } from "@/lib/auth-store";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { ReportModal } from "@/components/ui/ReportModal";
import { ReviewModal } from "@/components/ui/ReviewModal";
import { ShareButton } from "@/components/ui/ShareButton";
import { LandlordContactCard } from "@/components/ui/LandlordContactCard";
import { SmartBackLink } from "@/components/ui/SmartBackLink";
import { BedBath } from "@/components/ui/BedBath";
import { DetailPageSkeleton } from "@/components/ui/Skeletons";
import { BookShowingModal } from "@/components/landlord/BookShowingModal";
import { TenantProfilePrompt } from "@/components/ui/TenantProfilePrompt";
import {
  formatPrice, formatLeaseType, formatPropertyType, formatDate, getScoreColor, getScoreLabel,
} from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, Bus, Heart, Check, X, ChevronLeft, ChevronRight,
  Bed, Calendar, MessageCircle, Share2, Flag, Zap, Ruler, AlertCircle, Star,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { getAmenityChecklist } from "@/lib/amenities";
import { FloorPlanSection } from "@/components/listing/FloorPlanSection";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { CribbMap } from "@/components/ui/CribbMap";
import { getProximityFromKm, getProximityLabel } from "@/lib/proximity";
import type { ListingDetailResponse, HealthScoreResponse, ReviewResponse } from "@/types";
import { isSampleListing } from "@/lib/sample-data";
import { SampleNote } from "@/components/ui/SampleBadge";
import { FirstVisitTip } from "@/components/ui/FirstVisitTip";

/* ── Animation helpers ─────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
};

function hasMessagingProfile(status: { has_tenant_profile: boolean; roommate_quiz_completed: boolean }) {
  return status.has_tenant_profile || status.roommate_quiz_completed;
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

/* ── Image Gallery ─────────────────────────────── */

function ImageGallery({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, images.length]);

  if (images.length === 0) {
    return (
      <div className="h-[300px] md:h-[420px] bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] rounded-xl flex items-center justify-center">
        <span style={{ fontSize: "64px" }}>🏠</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden group">
        <div
          className="h-[300px] md:h-[420px] relative cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={images[current]}
              alt={`Photo ${current + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Hint */}
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ fontSize: "10px", fontWeight: 600 }}>
            Click to expand
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrent((current - 1 + images.length) % images.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#1B2D45]/70 opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-md z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrent((current + 1) % images.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#1B2D45]/70 opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-md z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`rounded-full transition-all ${i === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"}`}
                />
              ))}
            </div>
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-full pointer-events-none"
              style={{ fontSize: "11px", fontWeight: 600 }}>
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all z-[210]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-full z-[210]"
                style={{ fontSize: "12px", fontWeight: 600 }}>
                {current + 1} / {images.length}
              </div>
            )}

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={current}
                src={images[current]}
                alt={`Photo ${current + 1}`}
                className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrent((current - 1 + images.length) % images.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all z-[210]"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrent((current + 1) % images.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all z-[210]"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[90vw] overflow-x-auto px-4 py-2 z-[210]">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${i === current ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"
                      }`}
                  >
                    <img src={cloudinaryUrl(src, { w: 200 })} alt={`Thumb ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Review Card ───────────────────────────────── */

function ReviewCard({ review, index }: { review: ReviewResponse; index: number }) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <motion.div className="bg-[#FAF8F4] rounded-xl p-4"
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>
            {new Date(review.created_at).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}
          </p>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-full ${review.would_rent_again ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#E71D36]/10 text-[#E71D36]"}`}
              style={{ fontSize: "10px", fontWeight: 600 }}>
              {review.would_rent_again ? "Would rent again ✓" : "Would not rent again"}
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[#1B2D45]/28 transition-colors hover:bg-[#E71D36]/[0.06] hover:text-[#E71D36]"
              style={{ fontSize: "10px", fontWeight: 700 }}
            >
              <Flag className="h-3 w-3" />
              Report
            </button>
          </div>
        </div>
        {/* Star ratings only — no comments for legal reasons */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Response", val: review.responsiveness },
            { label: "Maintenance", val: review.maintenance_speed },
            { label: "Privacy", val: review.respect_privacy },
            { label: "Fairness", val: review.fairness_of_charges },
          ].map((r) => (
            <div key={r.label} className="text-center">
              <div className="text-[#1B2D45]/30" style={{ fontSize: "9px", fontWeight: 600 }}>{r.label}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ fontSize: "12px", color: star <= r.val ? "#FFB627" : "#1B2D45" + "15" }}>★</span>
                ))}
              </div>
              <div className="text-[#1B2D45]/50 mt-0.5" style={{ fontSize: "11px", fontWeight: 700 }}>{r.val}/5</div>
            </div>
          ))}
        </div>
      </motion.div>
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reviewId={review.id}
        targetType="review"
        targetTitle={`Review from ${new Date(review.created_at).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}`}
      />
    </>
  );
}

/* ════════════════════════════════════════════════════
   LISTING DETAIL PAGE
   ════════════════════════════════════════════════════ */

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listingId = parseInt(id, 10);
  const router = useRouter();

  const isInvalidId = isNaN(listingId) || listingId <= 0;

  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [floorPlans, setFloorPlans] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [activeQuickMessage, setActiveQuickMessage] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showingOpen, setShowingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [showTenantPrompt, setShowTenantPrompt] = useState(false);
  const [hasTenantProfile, setHasTenantProfile] = useState<boolean | null>(null);
  const [pendingAction, setPendingAction] = useState<"contact" | "showing" | "quick-message" | null>(null);
  const [pendingMessage, setPendingMessage] = useState<{ content: string; quickKey?: string } | null>(null);
  // If the student already has a thread for this listing, we skip the compose
  // popup and jump straight into it. null = none yet (or not checked).
  const [existingConversationId, setExistingConversationId] = useState<number | null>(null);
  const tenantChecked = useRef(false);

  const user = useAuthStore((s) => s.user);
  const isLandlord = user?.role === "landlord";

  // Saved store — syncs with PolaroidCard hearts
  const isSaved = useSavedStore((s) => s.savedIds.has(listingId));
  const saveBusy = useSavedStore((s) => s.togglingIds.has(listingId));
  const toggleSave = useSavedStore((s) => s.toggleSave);

  const handleToggleSave = useCallback(async () => {
    try {
      await toggleSave(listingId);
    } catch (err) {
      if (err instanceof Error && err.message === "auth_required") {
        router.push("/login");
      }
    }
  }, [listingId, toggleSave, router]);

  // Fetch listing from backend
  useEffect(() => {
    if (isInvalidId) {
      setError("Invalid listing ID");
      setIsLoading(false);
      return;
    }

    async function load() {
      setIsLoading(true);
      try {
        const data = await api.listings.getById(listingId);
        if (data && data.id) {
          setListing(data);
          // Cribb Score
          try {
            const hs = await api.healthScores.get(listingId);
            setHealthScore(hs);
          } catch {
            setHealthScore(null);
          }
          // Reviews
          try {
            const rv = await api.reviews.browse({ property_id: data.property_id });
            setReviews(rv);
          } catch {
            setReviews([]);
          }
          const realImages = data.images?.filter(img => !img.is_floor_plan).map(img => img.image_url) || [];
          setImages(realImages);
          const plans = data.images?.filter(img => img.is_floor_plan).map(img => img.image_url) || [];
          setFloorPlans(plans);
        } else {
          setError("Listing not found");
        }
      } catch {
        setError("Listing not found");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [listingId, isInvalidId]);

  // Check if student has already answered roommate/tenant fit questions
  useEffect(() => {
    if (!user || user.role !== "student" || tenantChecked.current) return;
    tenantChecked.current = true;
    api.auth.getTenantStatus()
      .then((res) => setHasTenantProfile(hasMessagingProfile(res)))
      .catch(() => setHasTenantProfile(true));
  }, [user]);

  // Does the student already have a conversation about this listing? If so, the
  // "Message landlord" button jumps straight into that thread instead of opening
  // the compose popup.
  useEffect(() => {
    if (!user || user.role !== "student" || isInvalidId) {
      setExistingConversationId(null);
      return;
    }
    let cancelled = false;
    api.messages.getConversations()
      .then((convos) => {
        if (cancelled) return;
        const existing = convos.find((c) => c.listing_id === listingId);
        setExistingConversationId(existing ? existing.id : null);
      })
      .catch(() => { if (!cancelled) setExistingConversationId(null); });
    return () => { cancelled = true; };
  }, [user, listingId, isInvalidId]);

  const handleTenantComplete = () => {
    setShowTenantPrompt(false);
    setHasTenantProfile(true);
    if (pendingAction === "contact") {
      setShowMessageModal(true);
    }
    else if (pendingAction === "showing") {
      setShowingOpen(true);
    }
    else if (pendingAction === "quick-message" && pendingMessage) {
      void openConversation(pendingMessage.content, pendingMessage.quickKey);
    }
    setPendingAction(null);
    setPendingMessage(null);
  };

  const needsTenantProfilePrompt = async () => {
    if (!user || user.role !== "student") return false;
    if (hasTenantProfile === true) return false;
    if (hasTenantProfile === false) return true;

    try {
      const status = await api.auth.getTenantStatus();
      const isComplete = hasMessagingProfile(status);
      setHasTenantProfile(isComplete);
      return !isComplete;
    } catch {
      setHasTenantProfile(true);
      return false;
    }
  };

  const openConversation = async (content: string, quickKey?: string) => {
    if (contactSending || contactSent) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/browse/${listingId}`)}`);
      return;
    }
    setContactSending(true);
    setActiveQuickMessage(quickKey ?? null);
    try {
      const conversation = await api.messages.startConversation({
        listing_id: listingId,
        content,
      });
      setContactSent(true);
      setShowMessageModal(false);
      // First message: confirm and keep them on the listing rather than yanking
      // them into the thread. The landlord's reply lands in their inbox, and the
      // button now deep-links to this conversation on the next click.
      setExistingConversationId(conversation.id);
      toast.success("Message sent \u2014 the landlord will reply in your inbox.");
    } catch (err) {
      if (err instanceof Error && "status" in err && (err as { status?: number }).status === 409) {
        // A thread already exists \u2014 open it.
        router.push("/messages?type=housing");
      } else {
        toast.error("We couldn\u2019t send your message right now. Please try again.");
      }
    } finally {
      setContactSending(false);
      setActiveQuickMessage(null);
    }
  };

  const handleContact = async () => {
    if (contactSending || contactSent) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/browse/${listingId}`)}`);
      return;
    }
    // Already chatting about this listing → skip the compose popup and open the
    // existing thread directly.
    if (existingConversationId != null) {
      router.push(`/messages?type=housing&conversation=${existingConversationId}`);
      return;
    }
    if (await needsTenantProfilePrompt()) {
      setPendingAction("contact");
      setShowTenantPrompt(true);
      return;
    }
    setShowMessageModal(true);
  };

  const handleBookShowing = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/browse/${listingId}`)}`);
      return;
    }
    if (await needsTenantProfilePrompt()) {
      setPendingAction("showing");
      setShowTenantPrompt(true);
      return;
    }
    setShowingOpen(true);
  };

  const quickMessageOptions = [
    {
      key: "available",
      label: "Still available?",
      content: `Hi, I'm interested in "${listing?.title}". Is it still available?`,
    },
    {
      key: "tour",
      label: "Can I tour it?",
      content: `Hi, I'd love to book a showing for "${listing?.title}". What times are available?`,
    },
    {
      key: "rent",
      label: "What's included?",
      content: `Hi, I'm interested in "${listing?.title}". Can you let me know what's included in the rent?`,
    },
  ] as const;

  const handleSendMessage = async (content: string, quickKey?: string) => {
    if (contactSending || contactSent) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/browse/${listingId}`)}`);
      return;
    }
    if (await needsTenantProfilePrompt()) {
      setPendingAction(quickKey ? "quick-message" : "contact");
      setPendingMessage({ content, quickKey });
      setShowTenantPrompt(true);
      return;
    }
    await openConversation(content, quickKey);
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#E71D36]" style={{ fontSize: "16px", fontWeight: 600 }}>Listing not found</p>
          <Link href="/browse" className="mt-4 inline-block text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 600 }}>← Back to Browse</Link>
        </motion.div>
      </div>
    );
  }

  const overallScore = healthScore?.overall_score ?? 0;
  const campusAccess = listing.walk_time_minutes != null
    ? getProximityLabel(listing.walk_time_minutes)
    : getProximityFromKm(listing.distance_to_campus_km != null ? Number(listing.distance_to_campus_km) : null);
  const userReview = user ? reviews.find((review) => review.student_id === user.id) : null;

  const amenities = getAmenityChecklist(listing as unknown as Record<string, unknown>);
  const hasAmenities = amenities.filter((a) => a.has);
  const noAmenities = amenities.filter((a) => !a.has);

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <motion.div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6" variants={stagger} initial="hidden" animate="visible">
        {/* Back link */}
        <motion.div variants={fadeUp}>
          <SmartBackLink
            fallback="/browse"
            iconClassName="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-5 group"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            Back to listings
          </SmartBackLink>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-[1fr_360px] gap-6"
        >
          {/* ─── Main Content ─── */}
          <div>
            {/* Image gallery */}
            <motion.div variants={fadeUp}>
              <ImageGallery images={images} />
            </motion.div>

            {user && !isLandlord && (
              <div className="mt-6">
                <FirstVisitTip tipKey="listing-intro" title="What you can do here">
                  Tap the heart to save a place and compare your picks, message the landlord with questions, and book a showing — all from the sidebar.
                </FirstVisitTip>
              </div>
            )}

            {/* Title + address + score */}
            <motion.div variants={fadeUp} className="mt-6 bg-white rounded-xl border border-black/[0.04] p-5 md:p-6"
              style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.03)" }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.3px" }}>
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 text-[#1B2D45]/50">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span style={{ fontSize: "13px" }}>{listing.address}</span>
                  </div>
                  <div className="mt-2.5">
                    <BedBath beds={listing.beds ?? listing.total_rooms} baths={listing.baths ?? listing.bathrooms} size="md" />
                  </div>
                </div>
                {overallScore > 0 && (
                  <div className="shrink-0 text-center">
                    <ScoreRing score={overallScore} size={56} />
                    <p className="mt-1" style={{ fontSize: "9px", fontWeight: 700, color: getScoreColor(overallScore) }}>
                      {getScoreLabel(overallScore)}
                    </p>
                  </div>
                )}
              </div>

              {isSampleListing(listingId) && <SampleNote className="mt-4" />}

              {/* Quick facts */}
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-5" variants={stagger} initial="hidden" animate="visible">
                {[
                  { label: "Type", value: listing.unit_label ? `${formatPropertyType(listing.property_type)} · ${listing.unit_label}` : formatPropertyType(listing.property_type), icon: Ruler },
                  { label: "Rooms", value: `${listing.beds ?? listing.total_rooms} bed · ${listing.baths ?? listing.bathrooms} bath${listing.sqft ? ` · ${listing.sqft} sq ft` : ""}`, icon: Bed },
                  { label: "Lease", value: formatLeaseType(listing.lease_type, listing.custom_lease_type), icon: Calendar },
                  { label: "Move-in", value: listing.has_flexible_move_in ? "Any move-in date" : formatDate(listing.move_in_date), icon: Clock },
                ].map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <motion.div key={fact.label} variants={fadeUp} className="bg-[#FAF8F4] rounded-xl p-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[#FF6B35]/50" />
                        <span className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>{fact.label}</span>
                      </div>
                      <div className="text-[#1B2D45] mt-1" style={{ fontSize: "13px", fontWeight: 700 }}>{fact.value}</div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Getting to campus */}
              <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Getting to Campus</h3>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                  style={{ fontSize: "11px", fontWeight: 700, color: campusAccess.color, background: campusAccess.bg, borderColor: `${campusAccess.color}25` }}
                >
                  <span>{campusAccess.emoji}</span>
                  <span>{campusAccess.label}</span>
                </div>
              </div>
              <p className="mt-2 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>
                Campus access uses the same proximity labels shown across Cribb.
              </p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {listing.drive_time_minutes && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]">
                    <span style={{ fontSize: "16px" }}>🚗</span>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{listing.drive_time_minutes} min</p>
                      <p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>by car</p>
                    </div>
                  </div>
                )}
                {listing.bus_time_minutes && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]">
                    <span style={{ fontSize: "16px" }}>🚌</span>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{listing.bus_time_minutes} min</p>
                      <p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>by bus</p>
                    </div>
                  </div>
                )}
                {listing.distance_to_campus_km && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]">
                    <span style={{ fontSize: "16px" }}>📍</span>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{Number(listing.distance_to_campus_km).toFixed(1)} km</p>
                      <p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>to campus</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {hasAmenities.map((a) => {
                  const Icon = a.icon;
                  return (
                    <motion.div key={a.key} className="flex items-center gap-2.5 py-2"
                      initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ type: "spring", stiffness: 200 }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#4ADE80]/10">
                        <Icon className="w-3.5 h-3.5 text-[#4ADE80]" />
                      </div>
                      <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{a.label}</span>
                    </motion.div>
                  );
                })}
                {noAmenities.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.key} className="flex items-center gap-2.5 py-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1B2D45]/[0.03]">
                        <Icon className="w-3.5 h-3.5 text-[#1B2D45]/15" />
                      </div>
                      <span className="text-[#1B2D45]/25 line-through" style={{ fontSize: "13px", fontWeight: 500 }}>{a.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Estimated utility cost */}
              {listing.estimated_utility_cost && !listing.utilities_included && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFB627]/[0.06] border border-[#FFB627]/10">
                  <Zap className="w-3.5 h-3.5 text-[#FFB627]" />
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "11px" }}>
                    Estimated utilities: <strong className="text-[#1B2D45]">${listing.estimated_utility_cost}/mo</strong> per person
                  </span>
                </div>
              )}

              {/* Floor Plan */}
              <FloorPlanSection images={floorPlans} />

              {/* Cribb Score Breakdown */}
              {healthScore && (
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                  <h3 className="mt-8 text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                    Cribb Score Breakdown
                    {overallScore > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: getScoreColor(overallScore) }}>
                        {overallScore}/100
                      </span>
                    )}
                  </h3>
                  <div className="space-y-3 mt-3">
                    {[
                      { label: "Price", score: healthScore.price_vs_market_score, emoji: "📊", pending: false },
                      { label: "Location", score: healthScore.proximity_score ?? healthScore.lease_clarity_score, emoji: "📍", pending: false },
                      { label: "Amenities", score: healthScore.amenity_score ?? 50, emoji: "🏠", pending: false },
                      { label: "Tenant Reviews", score: healthScore.landlord_reputation_score, emoji: "⭐", pending: (healthScore.review_count ?? 0) === 0 },
                    ].map((item, i) => (
                      <motion.div key={item.label} className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}>
                        <span style={{ fontSize: "14px" }}>{item.emoji}</span>
                        <span className="text-[#1B2D45]/60 w-[120px] shrink-0" style={{ fontSize: "12px", fontWeight: 500 }}>{item.label}</span>
                        {item.pending ? (
                          <span className="flex-1 text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 600 }}>No reviews yet</span>
                        ) : (
                          <>
                            <AnimatedBar score={item.score ?? 0} color={getScoreColor(item.score ?? 0)} />
                            <span className="w-8 text-right shrink-0" style={{ fontSize: "13px", fontWeight: 800, color: getScoreColor(item.score ?? 0) }}>
                              {item.score ?? "—"}
                            </span>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  {(healthScore.review_count ?? 0) === 0 && (
                    <p className="text-[#1B2D45]/30 mt-2" style={{ fontSize: "10px", fontStyle: "italic" }}>Tenant reviews don&apos;t count toward the score until students start rating — the score above is based on price, location & amenities.</p>
                  )}
                </motion.div>
              )}

              {/* Reviews */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                    Student Reviews
                    {reviews.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1B2D45]/5 text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 700 }}>
                        {reviews.length}
                      </span>
                    )}
                  </h3>
                  {user ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (!userReview) setReviewOpen(true);
                      }}
                      disabled={Boolean(userReview)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        userReview
                          ? "bg-[#1B2D45]/[0.05] text-[#1B2D45]/35 cursor-default"
                          : "bg-[#FFB627]/10 text-[#FFB627] hover:bg-[#FFB627]/15"
                      }`}
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      <Star className="w-3.5 h-3.5" /> {userReview ? "Review submitted" : "Leave a Review"}
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
                  <div className="space-y-3 mt-3">
                    {reviews.map((review, i) => (
                      <ReviewCard key={review.id} review={review} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 py-8 text-center rounded-xl border border-dashed border-[#1B2D45]/10 bg-[#FAF8F4]/50">
                    <span style={{ fontSize: "28px" }}>⭐</span>
                    <p className="text-[#1B2D45]/40 mt-2" style={{ fontSize: "13px", fontWeight: 500 }}>
                      No reviews yet
                    </p>
                    <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "12px" }}>
                      Lived here? Be the first to rate this property.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ─── Sidebar ─── */}
          <motion.div className="space-y-4 lg:sticky lg:top-[80px] lg:self-start" variants={fadeUp}>
            {/* Price card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-black/[0.04] p-5"
              style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.04)" }}>
              <div className="flex items-baseline gap-1">
                <span className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 800 }}>
                  {listing.per_room_pricing
                      ? `From ${formatPrice(Number(listing.rent_min))}`
                      : formatPrice(Number(listing.rent_per_room))}
                </span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>/room/mo</span>
              </div>
              <div className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px" }}>
                {listing.per_room_pricing
                    ? `${formatPrice(Number(listing.rent_min))}–${formatPrice(Number(listing.rent_max))}/room · ${formatPrice(Number(listing.rent_total))} total`
                    : `${formatPrice(Number(listing.rent_total))} total rent`}
              </div>

              {/* Rooms */}
              {listing.per_room_pricing && listing.rooms && listing.rooms.length > 0 && (
                <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
                  <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "14px", fontWeight: 700 }}>Rooms in this house</h3>
                  <div className="space-y-2">
                    {listing.rooms.map((room) => (
                      <div key={room.id} className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                            {room.label || `Room ${room.display_order + 1}`}
                          </span>
                          {!room.is_available && (
                            <span className="px-2 py-0.5 rounded-full bg-[#E71D36]/[0.08] text-[#E71D36]" style={{ fontSize: "10px", fontWeight: 700 }}>
                              Taken
                            </span>
                          )}
                        </div>
                        <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                          {formatPrice(Number(room.rent))}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            
              {/* Verified badge */}
              {listing.landlord_verified && (
                <motion.div className="relative flex items-center gap-1.5 mt-4 bg-[#4ADE80]/10 text-[#4ADE80] px-3 py-1.5 rounded-lg overflow-hidden"
                  style={{ fontSize: "12px", fontWeight: 600 }}>
                  <motion.div className="absolute inset-0 rounded-lg" style={{ background: "rgba(74,222,128,0.08)" }}
                    animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                  <Check className="w-3.5 h-3.5 relative z-[1]" />
                  <span className="relative z-[1]">Verified Landlord</span>
                </motion.div>
              )}

              {isLandlord ? (
                /* Landlords can browse read-only — student actions don't apply to them. */
                <div className="mt-5 rounded-xl border border-[#1B2D45]/10 bg-[#1B2D45]/[0.03] px-4 py-3.5 text-center">
                  <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>You&apos;re viewing as a landlord</p>
                  <p className="mt-1 text-[#1B2D45]/55" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    Saving, messaging, and booking viewings are student features.
                  </p>
                  <Link href="/landlord" className="mt-2 inline-block text-[#1B2D45] underline" style={{ fontSize: "12px", fontWeight: 600 }}>
                    Back to your dashboard
                  </Link>
                </div>
              ) : user ? (
                <>
                  {/* Contact Landlord */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleContact} disabled={contactSending || contactSent}
                    className="relative w-full mt-5 py-3 rounded-xl bg-[#FF6B35] text-white overflow-hidden hover:bg-[#e55e2e] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}>
                    {contactSent ? (
                      <><Check className="w-4 h-4" /> Message Sent</>
                    ) : contactSending ? (
                      "Sending..."
                    ) : existingConversationId != null ? (
                      <><MessageCircle className="w-4 h-4" /> Open Chat</>
                    ) : (
                      <><MessageCircle className="w-4 h-4" /> Contact Landlord</>
                    )}
                  </motion.button>

                  {/* Book Showing */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleBookShowing}
                    className="w-full mt-2 py-3 rounded-xl border border-[#FF6B35]/20 text-[#FF6B35] bg-[#FF6B35]/[0.04] hover:bg-[#FF6B35]/[0.08] transition-all flex items-center justify-center gap-2"
                    style={{ fontSize: "14px", fontWeight: 600 }}>
                    <Calendar className="w-4 h-4" /> Book a Showing
                  </motion.button>

                  {/* Save */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleToggleSave} disabled={saveBusy}
                    className={`w-full mt-2 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      isSaved
                        ? "border-[#E71D36]/20 bg-[#E71D36]/[0.04] text-[#E71D36]"
                        : "border-black/[0.06] text-[#1B2D45]/60 hover:bg-[#1B2D45]/[0.03]"
                    }`}
                    style={{ fontSize: "14px", fontWeight: 500 }}>
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-[#E71D36]" : ""}`} />
                    {isSaved ? "Saved" : "Save Listing"}
                  </motion.button>

                  {/* Sharing a place to vet with parents or potential roommates */}
                  <div className="mt-2">
                    <ShareButton path={`/browse/${listingId}`} title={listing.title} variant="outline" label="Share listing" />
                    <p className="mt-1.5 text-center text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>
                      Send it to your parents or roommates
                    </p>
                  </div>
                </>
              ) : (
                /* Logged-out — often a parent the student sent the link to. Clean read, no dead-end CTAs. */
                <div className="mt-5 rounded-xl border border-[#FF6B35]/15 bg-[#FF6B35]/[0.04] px-4 py-4">
                  <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Helping someone find a place?</p>
                  <p className="mt-1 text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.55 }}>
                    See the full listing here — no account needed. Cribb only lets <strong>verified Guelph students</strong> and <strong>verified landlords</strong> in, so what you&apos;re looking at is real.
                  </p>
                  <div className="mt-3">
                    <ShareButton path={`/browse/${listingId}`} title={listing.title} variant="primary" label="Share this place" />
                  </div>
                  <Link href="/login" className="mt-3 block text-center text-[#1B2D45]/55 hover:text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
                    Students: sign in to message the landlord →
                  </Link>
                </div>
              )}

              {/* Report (sharing lives in the prominent contextual button above) */}
              <div className="mt-3">
                <button
                  onClick={() => setReportOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[#1B2D45]/30 hover:text-[#E71D36]/50 hover:bg-[#E71D36]/[0.03] transition-all"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                >
                  <Flag className="w-3 h-3" /> Report
                </button>
              </div>

              <div className="text-[#1B2D45]/25 text-center mt-4" style={{ fontSize: "11px" }}>
                {listing.view_count} views · Listed {formatDate(listing.created_at)}
              </div>
            </div>

            {/* Landlord Contact Card */}
            <LandlordContactCard
              landlordId={listing.landlord_id}
              landlordName={listing.landlord_name}
              landlordVerified={listing.landlord_verified}
              landlordIsEarlyAdopter={listing.landlord_is_early_adopter}
            />

            {/* Map */}
            <div className="rounded-xl border border-black/[0.04] overflow-hidden bg-white/90 backdrop-blur-xl"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <CribbMap
                lat={listing.latitude != null ? Number(listing.latitude) : undefined}
                lng={listing.longitude != null ? Number(listing.longitude) : undefined}
                address={listing.address}
                height="200px"
                zoom={15}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Book Showing Modal */}
      <AnimatePresence>
        {showingOpen && (
          <BookShowingModal
            listingId={listing.id}
            listingTitle={listing.title}
            landlordName={listing.landlord_name}
            onClose={() => setShowingOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        listingId={listingId}
        listingTitle={listing.title}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        propertyId={listing.property_id}
        propertyTitle={listing.title}
        onReviewSubmitted={(newReview) => {
          setReviews((prev) => [newReview, ...prev]);
        }}
      />

      {/* Message Landlord Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setShowMessageModal(false); }}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-[440px] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
            >
              <div className="px-5 py-4 border-b border-black/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Message Landlord</h3>
                  <button onClick={() => setShowMessageModal(false)} className="w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center text-[#1B2D45]/40 hover:text-[#1B2D45]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-[#FAF8F4] rounded-xl px-3 py-2.5">
                  {images[0] && <img src={cloudinaryUrl(images[0], { w: 96 })} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: 600 }}>{listing.title}</p>
                    <p className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 800 }}>{formatPrice(Number(listing.rent_min ?? listing.rent_per_room ?? listing.rent_total))}/mo</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600 }}>Quick messages</p>
                <div className="space-y-2">
                  {quickMessageOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => void handleSendMessage(option.content, option.key)}
                      disabled={contactSending}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                        activeQuickMessage === option.key
                          ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.03] text-[#1B2D45]"
                          : "border-black/[0.06] text-[#1B2D45]/70 hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.03] hover:text-[#1B2D45]"
                      }`}
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      {option.content}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-[#1B2D45]/40 mb-2" style={{ fontSize: "11px", fontWeight: 600 }}>Or write your own</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.elements.namedItem("custom_msg") as HTMLInputElement);
                      if (input.value.trim()) void handleSendMessage(input.value.trim());
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="custom_msg"
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF8F4] border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:outline-none transition-all"
                      style={{ fontSize: "13px" }}
                    />
                    <button
                      type="submit"
                      disabled={contactSending}
                      className="px-4 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-all shrink-0"
                      style={{ fontSize: "13px", fontWeight: 700 }}
                    >
                      {contactSending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tenant Profile Prompt */}
      <TenantProfilePrompt
        isOpen={showTenantPrompt}
        onClose={() => { setShowTenantPrompt(false); setPendingAction(null); setPendingMessage(null); }}
        onComplete={handleTenantComplete}
      />
    </div>
  );
}
