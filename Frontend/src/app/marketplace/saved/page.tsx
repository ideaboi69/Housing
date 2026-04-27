"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Package, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useMarketplaceSavedStore } from "@/lib/marketplace-saved-store";
import { api } from "@/lib/api";
import { MOCK_ITEMS_WITH_ZONES } from "@/components/marketplace/marketplace-data";
import type { MarketplaceItemListResponse } from "@/types";

function SavedMarketplaceCard({ item }: { item: MarketplaceItemListResponse & { pickup_zone?: string } }) {
  return (
    <Link
      href={`/marketplace/${item.id}`}
      className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ border: "1px solid rgba(27,45,69,0.06)", boxShadow: "0 2px 8px rgba(27,45,69,0.04)" }}
    >
      <div className="relative aspect-[4/3] bg-[#FAF8F4] overflow-hidden">
        {item.primary_image ? (
          <img src={item.primary_image} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-[#1B2D45]/10" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 800 }}>
          Saved item
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{item.title}</h2>
        <p className="mt-1 text-[#1B2D45]/42" style={{ fontSize: "12px" }}>
          {item.pickup_zone ? `${item.pickup_zone} pickup` : "Student marketplace item"}
        </p>
      </div>
    </Link>
  );
}

export default function SavedMarketplacePage() {
  const { user } = useAuthStore();
  const savedIds = useMarketplaceSavedStore((s) => s.savedIds);
  const isLoaded = useMarketplaceSavedStore((s) => s.isLoaded);
  const [items, setItems] = useState<(MarketplaceItemListResponse & { pickup_zone?: string })[]>(MOCK_ITEMS_WITH_ZONES);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const liveItems = await api.marketplace.getItems({});
      if (liveItems.length > 0) {
        setItems(liveItems.map((item) => ({ ...item, pickup_zone: undefined })));
      } else {
        setItems(MOCK_ITEMS_WITH_ZONES);
      }
    } catch {
      setItems(MOCK_ITEMS_WITH_ZONES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const savedItems = useMemo(
    () => items.filter((item) => savedIds.has(item.id)),
    [items, savedIds]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-[820px] mx-auto px-4 md:px-6 py-10">
          <Link href="/marketplace" className="inline-flex items-center gap-1 text-[#1B2D45]/40 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "12px", fontWeight: 600 }}>
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
          <div className="bg-white rounded-[28px] border border-black/[0.06] px-6 py-12 text-center" style={{ boxShadow: "0 14px 44px rgba(27,45,69,0.06)" }}>
            <Heart className="w-10 h-10 text-[#FF6B35]/25 mx-auto mb-4" />
            <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>Save marketplace finds for later</h1>
            <p className="text-[#1B2D45]/45 mt-2 max-w-[460px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.65 }}>
              Sign in to keep track of furniture, electronics, and other student finds you want to revisit.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/login" className="px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
                Log in
              </Link>
              <Link href="/marketplace" className="px-5 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/55 hover:text-[#1B2D45] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-[#1B2D45]/40 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900 }}>Saved Items</h1>
            <p className="text-[#1B2D45]/45 mt-1" style={{ fontSize: "13px" }}>
              Keep marketplace finds organized while you decide what to message on next.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/[0.06] text-[#1B2D45]/55 w-fit" style={{ fontSize: "12px", fontWeight: 700 }}>
            <Heart className="w-4 h-4 text-[#FF6B35]" />
            {savedItems.length} saved item{savedItems.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading || !isLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ border: "1px solid rgba(27,45,69,0.04)" }}>
                <div className="aspect-[4/3] bg-[#1B2D45]/[0.04]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#1B2D45]/[0.06] rounded w-2/3" />
                  <div className="h-3 bg-[#1B2D45]/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-black/[0.06] px-6 py-14 text-center" style={{ boxShadow: "0 14px 44px rgba(27,45,69,0.06)" }}>
            <ShoppingBag className="w-11 h-11 text-[#1B2D45]/10 mx-auto mb-4" />
            <h2 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>No saved marketplace items yet</h2>
            <p className="text-[#1B2D45]/45 mt-2 max-w-[460px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.65 }}>
              Save chairs, lamps, fridges, or anything else you want to revisit while you compare student marketplace options.
            </p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedItems.map((item) => (
              <SavedMarketplaceCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
