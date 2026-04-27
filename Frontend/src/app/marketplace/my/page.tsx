"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Package, Eye, Clock, Edit3, Trash2, CheckCircle2, ArchiveRestore,
  Upload, ChevronLeft, MoreHorizontal, ShoppingBag, FileText, Tag,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { MARKETPLACE_CATEGORIES, CONDITION_LABELS, getPriceLabel, timeAgo, MOCK_ITEMS_WITH_ZONES } from "@/components/marketplace/marketplace-data";
import type { MarketplaceItemListResponse } from "@/types";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════
   Listing Row
   ════════════════════════════════════════════════════════ */

function ListingRow({ item, onMarkSold, onPublish, onUnpublish, onDelete }: {
  item: MarketplaceItemListResponse;
  onMarkSold: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const price = getPriceLabel(item.pricing_type, item.price);
  const condition = CONDITION_LABELS[item.condition];
  const category = MARKETPLACE_CATEGORIES.find((c) => c.key === item.category);

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <Link href={`/marketplace/${item.id}`} className="shrink-0">
          {item.primary_image ? (
            <img src={item.primary_image} alt={item.title} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#FAF8F4] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#1B2D45]/10" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/marketplace/${item.id}`}>
            <h3 className="text-[#1B2D45] hover:text-[#FF6B35] transition-colors truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{item.title}</h3>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ fontSize: "14px", fontWeight: 800, color: price.color }}>{price.text}</span>
            {price.badge && <span className="text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 700 }}>{price.badge}</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 700, color: condition.color, background: `${condition.color}15` }}>{condition.label}</span>
            {category && <span className="px-2 py-0.5 rounded-full bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 600 }}>{category.emoji} {category.label}</span>}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[#1B2D45]/30" style={{ fontSize: "10px" }}>
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.view_count} views</span>
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {timeAgo(item.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 relative">
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-1.5">
            {item.status === "available" && (
              <button onClick={onMarkSold} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#4ADE80] hover:bg-[#4ADE80]/[0.06] transition-all" style={{ fontSize: "11px", fontWeight: 600 }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Sold
              </button>
            )}
            {item.status === "available" && (
              <button onClick={onUnpublish} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#FFB627] hover:bg-[#FFB627]/[0.06] transition-all" style={{ fontSize: "11px", fontWeight: 600 }}>
                <ArchiveRestore className="w-3.5 h-3.5" /> Unpublish
              </button>
            )}
            {item.status === "draft" && (
              <button onClick={onPublish} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#FF6B35] hover:bg-[#FF6B35]/[0.06] transition-all" style={{ fontSize: "11px", fontWeight: 600 }}>
                <Upload className="w-3.5 h-3.5" /> Publish
              </button>
            )}
            <Link href={`/marketplace/${item.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-all" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Edit3 className="w-3.5 h-3.5" /> View
            </Link>
            <button onClick={onDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#E71D36]/50 hover:bg-[#E71D36]/[0.06] hover:text-[#E71D36] transition-all" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>

          {/* Mobile: three dots */}
          <div className="md:hidden">
            <button onClick={() => setShowActions(!showActions)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.04]">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile action bar */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-black/[0.04]"
          >
            <div className="flex items-center gap-1 px-3 py-2">
              {item.status === "available" && (
                <button onClick={() => { onMarkSold(); setShowActions(false); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[#4ADE80] hover:bg-[#4ADE80]/[0.06]" style={{ fontSize: "11px", fontWeight: 600 }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sold
                </button>
              )}
              {item.status === "available" && (
                <button onClick={() => { onUnpublish(); setShowActions(false); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[#FFB627] hover:bg-[#FFB627]/[0.06]" style={{ fontSize: "11px", fontWeight: 600 }}>
                  <ArchiveRestore className="w-3.5 h-3.5" /> Unpublish
                </button>
              )}
              {item.status === "draft" && (
                <button onClick={() => { onPublish(); setShowActions(false); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[#FF6B35] hover:bg-[#FF6B35]/[0.06]" style={{ fontSize: "11px", fontWeight: 600 }}>
                  <Upload className="w-3.5 h-3.5" /> Publish
                </button>
              )}
              <button onClick={() => { onDelete(); setShowActions(false); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[#E71D36]/50 hover:bg-[#E71D36]/[0.06]" style={{ fontSize: "11px", fontWeight: 600 }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

type ListingTab = "active" | "drafts" | "sold";

export default function MyListingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<ListingTab>("active");
  const [items, setItems] = useState<MarketplaceItemListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.marketplace.getMyItems();
      if (data && data.length > 0) {
        setItems(data);
        setUseMock(false);
      } else {
        // Use some mock items as "mine" for demo
        setItems(MOCK_ITEMS_WITH_ZONES.slice(0, 4).map((item, i) => ({
          ...item,
          status: i === 3 ? "draft" as const : i === 2 ? "sold" as const : "available" as const,
        })));
        setUseMock(true);
      }
    } catch {
      setItems(MOCK_ITEMS_WITH_ZONES.slice(0, 4).map((item, i) => ({
        ...item,
        status: i === 3 ? "draft" as const : i === 2 ? "sold" as const : "available" as const,
      })));
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleMarkSold = async (id: number) => {
    try { await api.marketplace.markSold(id); toast.success("Marked as sold"); } catch { toast.success("Marked as sold"); }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "sold" as const } : i));
  };

  const handlePublish = async (id: number) => {
    try { await api.marketplace.publishItem(id); toast.success("Published"); } catch { toast.success("Published"); }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "available" as const } : i));
  };

  const handleUnpublish = async (id: number) => {
    try { await api.marketplace.unpublishItem(id); toast.success("Moved to drafts"); } catch { toast.success("Moved to drafts"); }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "draft" as const } : i));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    try { await api.marketplace.deleteItem(id); toast.success("Deleted"); } catch { toast.success("Deleted"); }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-3" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Log in to see your listings</h2>
          <p className="text-[#1B2D45]/40 mt-1 mb-4" style={{ fontSize: "13px" }}>You need a cribb account to sell items.</p>
          <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white" style={{ fontSize: "13px", fontWeight: 700 }}>Log In</Link>
        </div>
      </div>
    );
  }

  if (user.role === "landlord") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="max-w-[420px] text-center">
          <ShoppingBag className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-3" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Marketplace listings are for student sellers</h2>
          <p className="text-[#1B2D45]/40 mt-1 mb-5" style={{ fontSize: "13px", lineHeight: 1.6 }}>
            Landlord accounts can browse marketplace items, but they don&apos;t get seller tools or personal listings here.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/marketplace" className="px-5 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/60 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Browse Marketplace
            </Link>
            <Link href="/landlord" className="px-5 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#142235] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Landlord Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeItems = items.filter((i) => i.status === "available");
  const draftItems = items.filter((i) => i.status === "draft");
  const soldItems = items.filter((i) => i.status === "sold");

  const displayItems = tab === "active" ? activeItems : tab === "drafts" ? draftItems : soldItems;

  const tabs: { key: ListingTab; label: string; count: number; icon: typeof ShoppingBag }[] = [
    { key: "active", label: "Active", count: activeItems.length, icon: ShoppingBag },
    { key: "drafts", label: "Drafts", count: draftItems.length, icon: FileText },
    { key: "sold", label: "Sold", count: soldItems.length, icon: Tag },
  ];

  const emptyMessages: Record<ListingTab, { icon: typeof ShoppingBag; title: string; desc: string }> = {
    active: { icon: ShoppingBag, title: "No active listings", desc: "Items you publish will show up here." },
    drafts: { icon: FileText, title: "No drafts", desc: "Unpublished items will appear here." },
    sold: { icon: Tag, title: "Nothing sold yet", desc: "Items you mark as sold will appear here." },
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/marketplace" className="text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>Marketplace Listings</h1>
            <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px" }}>Manage your marketplace items</p>
          </div>
          <Link
            href="/marketplace/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
          >
            <Plus className="w-4 h-4" /> New Listing
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-black/[0.06] p-1 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                  tab === t.key
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"
                }`}
                style={{ fontSize: "13px", fontWeight: tab === t.key ? 700 : 500 }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? "bg-white/20 text-white" : "bg-[#1B2D45]/[0.06] text-[#1B2D45]/40"
                    }`}
                    style={{ fontSize: "10px", fontWeight: 700, minWidth: 18, textAlign: "center" }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-black/[0.04] p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#1B2D45]/[0.04]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#1B2D45]/[0.06] rounded w-1/2" />
                    <div className="h-3 bg-[#1B2D45]/[0.04] rounded w-1/3" />
                    <div className="h-3 bg-[#1B2D45]/[0.04] rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-16">
            {(() => {
              const empty = emptyMessages[tab];
              const Icon = empty.icon;
              return (
                <>
                  <Icon className="w-12 h-12 text-[#1B2D45]/10 mx-auto mb-3" />
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>{empty.title}</h3>
                  <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "13px" }}>{empty.desc}</p>
                  {tab === "active" && (
                    <Link
                      href="/marketplace/create"
                      className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                      style={{ fontSize: "13px", fontWeight: 700 }}
                    >
                      <Plus className="w-4 h-4" /> List Something
                    </Link>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ListingRow
                  item={item}
                  onMarkSold={() => handleMarkSold(item.id)}
                  onPublish={() => handlePublish(item.id)}
                  onUnpublish={() => handleUnpublish(item.id)}
                  onDelete={() => handleDelete(item.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
