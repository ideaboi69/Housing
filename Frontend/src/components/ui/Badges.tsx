"use client";

import { motion } from "framer-motion";

/**
 * EarlyAdopterBadge — shown next to user's name across the platform.
 * Blue badge for the first 100 users who signed up.
 * 
 * Usage: <EarlyAdopterBadge /> next to any user name display.
 * Only render if user.is_early_adopter is true.
 * 
 * Backend: OJ needs to add `is_early_adopter = Column(Boolean, default=False)` 
 * to the User table, and set it to True for the first 100 signups.
 */

export function EarlyAdopterBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isSm = size === "sm";

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
      className="inline-flex items-center gap-0.5 shrink-0"
      style={{
        padding: isSm ? "1px 6px" : "2px 8px",
        borderRadius: "6px",
        background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
        boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
        fontSize: isSm ? "8px" : "10px",
        fontWeight: 800,
        color: "white",
        letterSpacing: "0.02em",
        lineHeight: 1.5,
        textTransform: "uppercase" as const,
      }}
    >
      <svg width={isSm ? "8" : "10"} height={isSm ? "8" : "10"} viewBox="0 0 16 16" fill="none">
        <path d="M8 1L10.2 5.5L15 6.2L11.5 9.6L12.3 14.4L8 12.1L3.7 14.4L4.5 9.6L1 6.2L5.8 5.5L8 1Z" fill="white" />
      </svg>
      OG
    </motion.span>
  );
}

/**
 * VerifiedStudentBadge — shown for all verified @uoguelph.ca students.
 * Green checkmark badge.
 */
export function VerifiedStudentBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isSm = size === "sm";
  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: isSm ? "14px" : "18px",
        height: isSm ? "14px" : "18px",
        borderRadius: "50%",
        background: "#4ADE80",
      }}
      title="Verified UofG Student"
    >
      <svg width={isSm ? "8" : "10"} height={isSm ? "8" : "10"} viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}