"use client";

import { useState, useCallback } from "react";
import { Share2, Check, Link2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonProps {
  /** The URL path, e.g. "/browse/3" or "/sublets/summer-downtown" */
  path: string;
  title: string;
  /** Optional description for native share */
  description?: string;
  /** Visual style variant */
  variant?: "inline" | "sidebar";
}

export function ShareButton({ path, title, description, variant = "sidebar" }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${path}`;
  }, [path]);

  const handleCopyLink = useCallback(async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setShowMenu(false);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setShowToast(true);
      setShowMenu(false);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, [getUrl]);

  const handleNativeShare = useCallback(async () => {
    const url = getUrl();
    try {
      await navigator.share({
        title: `${title} — cribb`,
        text: description || `Check out this listing on cribb: ${title}`,
        url,
      });
      setShowMenu(false);
    } catch {
      // User cancelled or not supported — fall back to copy
      handleCopyLink();
    }
  }, [getUrl, title, description, handleCopyLink]);

  const handleClick = useCallback(() => {
    // If native share is available (mobile), use it directly
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      handleNativeShare();
    } else {
      // Desktop: show small menu or just copy
      handleCopyLink();
    }
  }, [handleNativeShare, handleCopyLink]);

  if (variant === "inline") {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[#1B2D45]/30 hover:text-[#1B2D45]/50 hover:bg-[#1B2D45]/[0.03] transition-all"
          style={{ fontSize: "11px", fontWeight: 500 }}
        >
          {showToast ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Share2 className="w-3 h-3" />}
          {showToast ? "Copied!" : "Share"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[#1B2D45]/30 hover:text-[#1B2D45]/50 hover:bg-[#1B2D45]/[0.03] transition-all"
        style={{ fontSize: "11px", fontWeight: 500 }}
      >
        {showToast ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Share2 className="w-3 h-3" />}
        {showToast ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
