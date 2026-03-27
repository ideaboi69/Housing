"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchAndFiltersProps {
  onSearchChange?: (query: string) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
  placeholder?: string;
}

export function SearchAndFilters({
  onSearchChange,
  onOpenFilters,
  activeFilterCount = 0,
  placeholder = "Search by address, neighborhood...",
}: SearchAndFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  return (
    <div className="sticky top-[56px] md:top-[64px] z-20 bg-white/70 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2D45]/30" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/80 border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/30 focus:border-[#FF6B35]/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10 transition-all"
              style={{ fontSize: "13px" }}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/30 hover:text-[#1B2D45]/60"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            onClick={onOpenFilters}
            className="relative flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/80 border border-black/[0.06] text-[#1B2D45]/60 hover:border-[#1B2D45]/20 transition-all shrink-0 w-full sm:w-auto"
            style={{ fontSize: "13px", fontWeight: 500 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {/* Active filter count badge */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF6B35] text-white flex items-center justify-center"
                  style={{ fontSize: "10px", fontWeight: 700 }}
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
