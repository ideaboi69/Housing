"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, Eye, Clock, MapPin, Package, SlidersHorizontal } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { MARKETPLACE_CATEGORIES, CONDITION_LABELS, getPriceLabel, timeAgo, MOCK_ITEMS_WITH_ZONES } from "@/components/marketplace/marketplace-data";
import type { MarketplaceItemListResponse, MarketplaceCategory, ItemCondition } from "@/types";

function ItemCard({ item, pickupZone }: { item: MarketplaceItemListResponse; pickupZone?: string }) {
  const price = getPriceLabel(item.pricing_type, item.price);
  const condition = CONDITION_LABELS[item.condition];
  return (
    <Link href={`/marketplace/${item.id}`}>
      <motion.div className="bg-white rounded-2xl overflow-hidden cursor-pointer group" style={{ border: "1px solid rgba(27,45,69,0.06)", boxShadow: "0 2px 8px rgba(27,45,69,0.04)" }} whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(27,45,69,0.08)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
        <div className="relative aspect-[4/3] bg-[#FAF8F4] overflow-hidden">
          {item.primary_image ? (<img src={item.primary_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />) : (<div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-[#1B2D45]/10" /></div>)}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: price.color }}>{price.text}</span>
            {price.badge && <span className="ml-1.5 text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 700 }}>{price.badge}</span>}
          </div>
        </div>
        <div className="p-3.5">
          <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{item.title}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 700, color: condition.color, background: condition.color + "15", border: "1px solid " + condition.color + "25" }}>{condition.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>{MARKETPLACE_CATEGORIES.find((c) => c.key === item.category)?.emoji} {MARKETPLACE_CATEGORIES.find((c) => c.key === item.category)?.label}</span>
          </div>
          <div className="flex items-center justify-between mt-2.5">
            {pickupZone && <span className="flex items-center gap-1 text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 500 }}><MapPin className="w-3 h-3" /> {pickupZone}</span>}
            <span className="flex items-center gap-2 text-[#1B2D45]/30 ml-auto" style={{ fontSize: "10px", fontWeight: 500 }}>
              <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.view_count}</span>
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {timeAgo(item.created_at)}</span>
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function SeasonalBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="relative rounded-2xl overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FFB627 100%)", border: "2.5px solid #1B2D45", boxShadow: "5px 5px 0px #1B2D45" }}>
      <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "28px" }}>📦</span>
          <div>
            <h3 className="text-white" style={{ fontSize: "16px", fontWeight: 800 }}>Moving out? Sell your stuff before you leave!</h3>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "12px" }}>Spring move-out season is here. List items in 60 seconds.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/marketplace/create" className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#FF6B35] hover:bg-white/90 transition-all" style={{ fontSize: "13px", fontWeight: 700 }}><Plus className="w-4 h-4" /> Sell Something</Link>
          <button onClick={onDismiss} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
      </div>
    </motion.div>
  );
}

type SortOption = "newest" | "price_low" | "price_high" | "most_viewed";
interface FilterState { priceMin: string; priceMax: string; conditions: ItemCondition[]; sort: SortOption; }

function FilterModal({ isOpen, onClose, filters, onApply }: { isOpen: boolean; onClose: () => void; filters: FilterState; onApply: (f: FilterState) => void }) {
  const [local, setLocal] = useState<FilterState>(filters);
  useEffect(() => { if (isOpen) setLocal(filters); }, [isOpen, filters]);
  const toggleCondition = (c: ItemCondition) => setLocal((prev) => ({ ...prev, conditions: prev.conditions.includes(c) ? prev.conditions.filter((x) => x !== c) : [...prev.conditions, c] }));
  const handleReset = () => setLocal({ ...local, priceMin: "", priceMax: "", conditions: [] });
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-[480px] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden" style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Filters</h3>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 600 }}>Reset</button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center text-[#1B2D45]/40 hover:text-[#1B2D45]"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="px-5 py-5 max-h-[60vh] overflow-y-auto space-y-6">
          <div>
            <label className="text-[#1B2D45]/50 block mb-2" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Price Range</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px" }}>$</span><input type="number" placeholder="Min" value={local.priceMin} onChange={(e) => setLocal({ ...local, priceMin: e.target.value })} className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:outline-none" style={{ fontSize: "13px" }} /></div>
              <span className="text-[#1B2D45]/20" style={{ fontSize: "12px" }}>to</span>
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px" }}>$</span><input type="number" placeholder="Max" value={local.priceMax} onChange={(e) => setLocal({ ...local, priceMax: e.target.value })} className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:outline-none" style={{ fontSize: "13px" }} /></div>
            </div>
          </div>
          <div>
            <label className="text-[#1B2D45]/50 block mb-2" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Condition</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CONDITION_LABELS) as [ItemCondition, { label: string; color: string }][]).map(([key, val]) => (
                <button key={key} onClick={() => toggleCondition(key)} className={`px-3.5 py-2 rounded-xl border transition-all ${local.conditions.includes(key) ? "border-[#FF6B35] bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/45 hover:border-[#1B2D45]/15"}`} style={{ fontSize: "12px", fontWeight: local.conditions.includes(key) ? 700 : 500 }}>{val.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-black/[0.06]">
          <button onClick={() => { onApply(local); onClose(); }} className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}>Apply Filters</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<(MarketplaceItemListResponse & { pickup_zone?: string })[]>(MOCK_ITEMS_WITH_ZONES);
  const [isLoading, setIsLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory | "all">("all");
  const [showBanner, setShowBanner] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({ priceMin: "", priceMax: "", conditions: [], sort: "newest" });

  useEffect(() => { try { if (localStorage.getItem("cribb_marketplace_banner_dismissed")) setShowBanner(false); } catch {} }, []);
  const dismissBanner = () => { setShowBanner(false); try { localStorage.setItem("cribb_marketplace_banner_dismissed", "1"); } catch {} };

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (activeCategory !== "all") filters.category = activeCategory;
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      const data = await api.marketplace.getItems(filters);
      if (data && data.length > 0) { setItems(data.map((item) => ({ ...item, pickup_zone: undefined }))); setUseMock(false); }
      else { setItems(MOCK_ITEMS_WITH_ZONES); setUseMock(true); }
    } catch { setItems(MOCK_ITEMS_WITH_ZONES); setUseMock(true); }
    finally { setIsLoading(false); }
  }, [activeCategory, searchQuery]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (useMock && activeCategory !== "all") result = result.filter((item) => item.category === activeCategory);
    if (useMock && searchQuery.trim()) { const q = searchQuery.toLowerCase(); result = result.filter((item) => item.title.toLowerCase().includes(q)); }
    if (advancedFilters.priceMin) result = result.filter((i) => i.pricing_type === "free" || (i.price != null && i.price >= parseFloat(advancedFilters.priceMin)));
    if (advancedFilters.priceMax) result = result.filter((i) => i.pricing_type === "free" || (i.price != null && i.price <= parseFloat(advancedFilters.priceMax)));
    if (advancedFilters.conditions.length > 0) result = result.filter((i) => advancedFilters.conditions.includes(i.condition));
    if (advancedFilters.sort === "price_low") result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (advancedFilters.sort === "price_high") result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (advancedFilters.sort === "most_viewed") result = [...result].sort((a, b) => b.view_count - a.view_count);
    return result;
  }, [items, useMock, activeCategory, searchQuery, advancedFilters]);
  const hasActiveAdvancedFilters = advancedFilters.priceMin || advancedFilters.priceMax || advancedFilters.conditions.length > 0 || advancedFilters.sort !== "newest";
  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "price_low", label: "Price: Low to High" },
    { key: "price_high", label: "Price: High to Low" },
    { key: "most_viewed", label: "Most Viewed" },
  ];
  const activeFilterChips = [
    advancedFilters.priceMin ? {
      key: "priceMin",
      label: `Min $${advancedFilters.priceMin}`,
      onClear: () => setAdvancedFilters((prev) => ({ ...prev, priceMin: "" })),
    } : null,
    advancedFilters.priceMax ? {
      key: "priceMax",
      label: `Max $${advancedFilters.priceMax}`,
      onClear: () => setAdvancedFilters((prev) => ({ ...prev, priceMax: "" })),
    } : null,
    ...advancedFilters.conditions.map((condition) => ({
      key: `condition-${condition}`,
      label: CONDITION_LABELS[condition].label,
      onClear: () => setAdvancedFilters((prev) => ({ ...prev, conditions: prev.conditions.filter((c) => c !== condition) })),
    })),
  ].filter(Boolean) as { key: string; label: string; onClear: () => void }[];

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900 }}>Marketplace</h1><p className="text-[#1B2D45]/45 mt-0.5" style={{ fontSize: "13px" }}>Buy &amp; sell student essentials at UoG</p></div>
        <div className="flex items-center gap-2 shrink-0">
          {user && <Link href="/marketplace/my" className="px-4 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all" style={{ fontSize: "13px", fontWeight: 600 }}>Your Listings</Link>}
          <Link href={user ? "/marketplace/create" : "/login"} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}><Plus className="w-4 h-4" /> Sell Something</Link>
        </div>
        </div>
        <AnimatePresence>{showBanner && <SeasonalBanner onDismiss={dismissBanner} />}</AnimatePresence>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 mb-4">
          <button onClick={() => setActiveCategory("all")} className={`px-3.5 py-2 rounded-full border transition-all shrink-0 ${activeCategory === "all" ? "border-[#FF6B35] bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#1B2D45]/15"}`} style={{ fontSize: "12px", fontWeight: activeCategory === "all" ? 700 : 500 }}>All</button>
          {MARKETPLACE_CATEGORIES.map((cat) => (<button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all shrink-0 ${activeCategory === cat.key ? "border-[#FF6B35] bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#1B2D45]/15"}`} style={{ fontSize: "12px", fontWeight: activeCategory === cat.key ? 700 : 500 }}><span style={{ fontSize: "14px" }}>{cat.emoji}</span> {cat.label}</button>))}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2D45]/25" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:outline-none transition-all" style={{ fontSize: "13px" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/20 hover:text-[#1B2D45]/50"><X className="w-4 h-4" /></button>}
          </div>
          <div className="hidden md:block shrink-0">
            <select
              value={advancedFilters.sort}
              onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, sort: e.target.value as SortOption }))}
              className="px-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-[#1B2D45]/70 focus:border-[#FF6B35]/30 focus:outline-none transition-all"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowFilters(true)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all shrink-0 ${hasActiveAdvancedFilters ? "border-[#FF6B35] bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#1B2D45]/15"}`} style={{ fontSize: "13px", fontWeight: 600 }}><SlidersHorizontal className="w-4 h-4" /> Filters{hasActiveAdvancedFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />}</button>
        </div>
        {activeFilterChips.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 mb-5">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.onClear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/[0.08] text-[#FF6B35] shrink-0"
                style={{ fontSize: "11px", fontWeight: 700 }}
              >
                <span>{chip.label}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={() => setAdvancedFilters((prev) => ({ ...prev, priceMin: "", priceMax: "", conditions: [] }))}
              className="px-3 py-1.5 rounded-full text-[#1B2D45]/40 hover:text-[#1B2D45]/65 shrink-0"
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              Clear all
            </button>
          </div>
        )}
        <p className="text-[#1B2D45]/35 mb-4" style={{ fontSize: "12px", fontWeight: 500 }}>{filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found</p>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }, (_, i) => (<div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ border: "1px solid rgba(27,45,69,0.04)" }}><div className="aspect-[4/3] bg-[#1B2D45]/[0.04]" /><div className="p-3.5 space-y-2"><div className="h-4 bg-[#1B2D45]/[0.06] rounded w-3/4" /><div className="h-3 bg-[#1B2D45]/[0.04] rounded w-1/2" /></div></div>))}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16"><Package className="w-12 h-12 text-[#1B2D45]/10 mx-auto mb-3" /><h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No items found</h3><p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "13px" }}>{searchQuery ? "Try a different search term" : "Be the first to list something!"}</p><Link href={user ? "/marketplace/create" : "/login"} className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}><Plus className="w-4 h-4" /> Sell Something</Link></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{filteredItems.map((item, i) => (<motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}><ItemCard item={item} pickupZone={(item as typeof item & { pickup_zone?: string }).pickup_zone} /></motion.div>))}</div>
        )}
      </div>
      <AnimatePresence>{showFilters && <FilterModal isOpen={showFilters} onClose={() => setShowFilters(false)} filters={advancedFilters} onApply={setAdvancedFilters} />}</AnimatePresence>
    </div>
  );
}
