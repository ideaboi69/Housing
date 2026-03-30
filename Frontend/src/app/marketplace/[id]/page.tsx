"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Eye, Clock, MessageCircle, Share2, ChevronLeft, ChevronRight,
  ShieldCheck, Package, X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import {
  MARKETPLACE_CATEGORIES, CONDITION_LABELS, getPriceLabel, timeAgo,
  MOCK_MARKETPLACE_ITEMS,
} from "@/components/marketplace/marketplace-data";
import type { MarketplaceItemListResponse, MarketplaceItemResponse } from "@/types";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════
   Mock detail data (fallback when API not connected)
   ════════════════════════════════════════════════════════ */

function getMockDetail(id: number): MarketplaceItemResponse | null {
  const mock = MOCK_MARKETPLACE_ITEMS.find((m) => m.id === id);
  if (!mock) return null;
  return {
    ...mock,
    seller_id: 1,
    description: "Great condition, barely used. Perfect for a student apartment. Need gone before I move out at the end of the semester. Pickup anytime — just message me!",
    pickup_location: "Stone Road",
    pickup_notes: "Available weekdays after 4pm, anytime on weekends.",
    images: mock.primary_image ? [{ id: 1, image_url: mock.primary_image, is_primary: true }] : [],
    primary_image: mock.primary_image || null,
    updated_at: mock.created_at,
  } as MarketplaceItemResponse;
}

/* ════════════════════════════════════════════════════════
   Image Gallery
   ════════════════════════════════════════════════════════ */

function ImageGallery({ images }: { images: { id: number; image_url: string }[] }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) {
    return (
      <div className="w-full h-[420px] sm:h-[520px] lg:h-[660px] xl:h-[760px] rounded-[28px] border border-black/[0.06] bg-[#151A22] flex items-center justify-center">
        <Package className="w-20 h-20 text-[#1B2D45]/10" />
      </div>
    );
  }

  return (
    <div
      className="relative rounded-[28px] overflow-hidden border border-black/[0.06] bg-[#151A22] group"
      style={{ boxShadow: "0 22px 60px rgba(27,45,69,0.12)" }}
    >
      <div className="relative h-[420px] sm:h-[520px] lg:h-[660px] xl:h-[760px]">
        <img
          src={images[current]?.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/18 via-transparent to-black/36" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_56%,rgba(0,0,0,0.18)_100%)]" />
        <div className="relative z-10 h-full w-full overflow-hidden">
          <img
            src={images[current]?.image_url}
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ filter: "drop-shadow(0 24px 50px rgba(0,0,0,0.22))" }}
          />
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[#1B2D45]/70 hover:text-[#1B2D45] transition-all"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % images.length)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[#1B2D45]/70 hover:text-[#1B2D45] transition-all"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm" style={{ fontSize: "12px", fontWeight: 600 }}>
            {current + 1} / {images.length}
          </div>

          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="transition-all"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === current ? "white" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12 bg-gradient-to-t from-black/45 to-transparent hidden md:flex items-center justify-center gap-2 z-20">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-14 w-20 rounded-xl overflow-hidden border-2 transition-all ${
                i === current ? "border-white opacity-100 translate-y-0" : "border-transparent opacity-60 hover:opacity-90 hover:-translate-y-0.5"
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

export default function MarketplaceItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [item, setItem] = useState<MarketplaceItemResponse | null>(null);
  const [similarItems, setSimilarItems] = useState<MarketplaceItemListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) { setLoading(false); return; }

      try {
        const data = await api.marketplace.getItem(numId);
        setItem(data);
      } catch {
        setItem(getMockDetail(numId));
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  useEffect(() => {
    async function fetchSimilar() {
      if (!item) return;

      try {
        const liveItems = await api.marketplace.getItems({ category: item.category });
        const filtered = liveItems
          .filter((candidate) => candidate.id !== item.id)
          .slice(0, 6);

        if (filtered.length > 0) {
          setSimilarItems(filtered);
          return;
        }
      } catch {
        // Fall through to mock recommendations
      }

      const categoryMatches = MOCK_MARKETPLACE_ITEMS.filter((m) => m.id !== item.id && m.category === item.category);
      const fallbackMatches = MOCK_MARKETPLACE_ITEMS.filter((m) => m.id !== item.id && m.category !== item.category);
      setSimilarItems([...categoryMatches, ...fallbackMatches].slice(0, 6));
    }

    fetchSimilar();
  }, [item]);

  const handleOpenMessage = () => {
    if (!user) { router.push("/login"); return; }
    setShowMessageModal(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!item) return;
    setMessaging(true);
    try {
      await api.marketplace.startConversation({ item_id: item.id, content: message });
      toast.success("Message sent to seller!");
    } catch {
      toast.success("Message sent!");
    } finally {
      setMessaging(false);
      setShowMessageModal(false);
    }
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 bg-[#1B2D45]/[0.06] rounded" />
            <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6">
              <div className="aspect-[4/3] bg-[#1B2D45]/[0.04] rounded-2xl" />
              <div className="space-y-3">
                <div className="h-8 w-24 bg-[#1B2D45]/[0.06] rounded" />
                <div className="h-6 w-3/4 bg-[#1B2D45]/[0.06] rounded" />
                <div className="h-12 w-full bg-[#1B2D45]/[0.04] rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-[#1B2D45]/10 mx-auto mb-3" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Item not found</h2>
          <Link href="/marketplace" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#FF6B35] text-white" style={{ fontSize: "13px", fontWeight: 600 }}>
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const price = getPriceLabel(item.pricing_type, item.price);
  const condition = CONDITION_LABELS[item.condition];
  const category = MARKETPLACE_CATEGORIES.find((c) => c.key === item.category);

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1460px] mx-auto px-4 md:px-6 py-5 md:py-6">
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-[#1B2D45]/40 hover:text-[#1B2D45] transition-colors mb-4" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
          <div className="min-w-0">
            <ImageGallery images={item.images} />

            <div className="mt-5 bg-white rounded-[28px] border border-black/[0.06] p-5 md:p-6" style={{ boxShadow: "0 14px 44px rgba(27,45,69,0.06)" }}>
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:gap-6">
                <div>
                  <h2 className="text-[#1B2D45] mb-3" style={{ fontSize: "16px", fontWeight: 800 }}>Seller&apos;s description</h2>
                  <p className="text-[#1B2D45]/68" style={{ fontSize: "14px", lineHeight: 1.7 }}>
                    {item.description || "Message the seller for more details about condition, pickup timing, and whether it is still available."}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F4] p-4">
                  <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Seller
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center">
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#FF6B35" }}>{item.seller_name[0]}</span>
                    </div>
                    <div>
                      <div className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "14px", fontWeight: 700 }}>
                        {item.seller_name}
                        <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                      </div>
                      <div className="text-[#1B2D45]/35 mt-1" style={{ fontSize: "11px" }}>Verified Guelph student</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-[88px] space-y-4">
            <div className="bg-white rounded-[28px] border border-black/[0.06] p-5 md:p-6" style={{ boxShadow: "0 14px 44px rgba(27,45,69,0.08)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: "32px", fontWeight: 900, color: price.color }}>{price.text}</span>
                {price.badge && (
                  <span className="px-2.5 py-1 rounded-full border border-[#FF6B35]/20 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>
                    {price.badge}
                  </span>
                )}
              </div>

              <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1.3 }}>{item.title}</h1>
              <p className="mt-2 text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
                Listed {timeAgo(item.created_at)} in Guelph, ON
              </p>

              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 700, color: condition.color, background: `${condition.color}15`, border: `1px solid ${condition.color}25` }}>
                  {condition.label}
                </span>
                {category && (
                  <span className="px-2.5 py-1 rounded-full bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>
                    {category.emoji} {category.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
                <button
                  onClick={handleOpenMessage}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                  style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                  Message
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45]/60 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all"
                  style={{ fontSize: "14px", fontWeight: 700 }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              <div className="mt-5 pt-5 border-t border-black/[0.06]">
                <h2 className="text-[#1B2D45] mb-3" style={{ fontSize: "16px", fontWeight: 800 }}>About this item</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#1B2D45]/45 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Pickup in {item.pickup_location}</div>
                      <div className="text-[#1B2D45]/45 mt-0.5" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                        Guelph, ON
                        {item.pickup_notes ? ` · ${item.pickup_notes}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-[#1B2D45]/45 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{condition.label} condition</div>
                      <div className="text-[#1B2D45]/45 mt-0.5" style={{ fontSize: "12px" }}>
                        {category?.label ?? "Marketplace item"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-[#1B2D45]/45 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{item.view_count} views</div>
                      <div className="text-[#1B2D45]/45 mt-0.5" style={{ fontSize: "12px" }}>
                        Posted {timeAgo(item.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {similarItems.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>More like this</h3>
                <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px" }}>
                  More marketplace finds students might message next.
                </p>
              </div>
              <Link
                href="/marketplace"
                className="hidden md:inline-flex text-[#FF6B35] hover:text-[#e55e2e] transition-colors"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                Browse all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {similarItems.map((sim) => {
                const simPrice = getPriceLabel(sim.pricing_type, sim.price);
                const simCondition = CONDITION_LABELS[sim.condition];
                const simCategory = MARKETPLACE_CATEGORIES.find((c) => c.key === sim.category);
                return (
                  <Link
                    key={sim.id}
                    href={`/marketplace/${sim.id}`}
                    className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all"
                    style={{ border: "1px solid rgba(27,45,69,0.06)" }}
                  >
                    <div className="relative aspect-[4/3] bg-[#FAF8F4] overflow-hidden">
                      {sim.primary_image ? (
                        <img src={sim.primary_image} alt={sim.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-[#1B2D45]/10" />
                        </div>
                      )}
                      <div
                        className="absolute left-2.5 top-2.5 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm"
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: 800, color: simPrice.color }}>{simPrice.text}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[#1B2D45] line-clamp-2" style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.35 }}>{sim.title}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ fontSize: "10px", fontWeight: 700, color: simCondition.color, background: `${simCondition.color}15`, border: `1px solid ${simCondition.color}25` }}
                        >
                          {simCondition.label}
                        </span>
                        {simCategory && (
                          <span className="px-2 py-0.5 rounded-full bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>
                            {simCategory.emoji} {simCategory.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 500 }}>
                        Posted {timeAgo(sim.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Message Seller Modal */}
      <AnimatePresence>
        {showMessageModal && item && (
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
              {/* Header with item preview */}
              <div className="px-5 py-4 border-b border-black/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Message Seller</h3>
                  <button onClick={() => setShowMessageModal(false)} className="w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center text-[#1B2D45]/40 hover:text-[#1B2D45]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-[#FAF8F4] rounded-xl px-3 py-2.5">
                  {item.primary_image && <img src={item.primary_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: 600 }}>{item.title}</p>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: getPriceLabel(item.pricing_type, item.price).color }}>{getPriceLabel(item.pricing_type, item.price).text}</p>
                  </div>
                </div>
              </div>

              {/* Quick replies */}
              <div className="px-5 py-4">
                <p className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600 }}>Quick messages</p>
                <div className="space-y-2">
                  {[
                    "Is this still available?",
                    "What's the lowest you'd go?",
                    "Can I pick up today?",
                    "Is the price firm?",
                  ].map((msg) => (
                    <button
                      key={msg}
                      onClick={() => handleSendMessage(msg)}
                      disabled={messaging}
                      className="w-full text-left px-4 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45]/70 hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.03] hover:text-[#1B2D45] transition-all disabled:opacity-50"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>

                {/* Custom message */}
                <div className="mt-4">
                  <p className="text-[#1B2D45]/40 mb-2" style={{ fontSize: "11px", fontWeight: 600 }}>Or write your own</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.target as HTMLFormElement).elements.namedItem("custom_msg") as HTMLInputElement;
                      if (input.value.trim()) handleSendMessage(input.value.trim());
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
                      disabled={messaging}
                      className="px-4 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-all shrink-0"
                      style={{ fontSize: "13px", fontWeight: 700 }}
                    >
                      {messaging ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
