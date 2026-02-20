"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

const quickFilters = [
  { label: "All", value: "all" },
  { label: "Furnished", value: "furnished" },
  { label: "Parking", value: "parking" },
  { label: "Utilities Incl.", value: "utilities" },
  { label: "8-month", value: "8_month" },
  { label: "Under $700", value: "under700" },
  { label: "Near Campus", value: "near" },
];

export function SearchAndFilters() {
  const [active, setActive] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="sticky top-[56px] md:top-[64px] z-20 bg-white/70 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2D45]/30" />
            <input
              type="text"
              placeholder="Search by address, neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/80 border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/30 focus:border-[#FF6B35]/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10 transition-all"
              style={{ fontSize: "13px" }}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/30 hover:text-[#1B2D45]/60"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/80 border border-black/[0.06] text-[#1B2D45]/60 hover:border-[#1B2D45]/20 transition-all shrink-0"
            style={{ fontSize: "13px", fontWeight: 500 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </motion.button>
        </div>

        {/* Quick filter pills with layout animation */}
        <LayoutGroup>
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActive(filter.value)}
                className="relative px-3.5 py-1.5 rounded-full border shrink-0 transition-colors"
                style={{
                  fontSize: "12px",
                  fontWeight: active === filter.value ? 600 : 500,
                  color: active === filter.value ? "white" : "rgba(27,45,69,0.5)",
                  borderColor: active === filter.value ? "#FF6B35" : "rgba(0,0,0,0.06)",
                  background: active === filter.value ? "transparent" : "white",
                }}
              >
                {/* Animated background pill */}
                {active === filter.value && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 rounded-full bg-[#FF6B35]"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-[1]">{filter.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
