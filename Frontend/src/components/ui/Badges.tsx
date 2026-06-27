"use client";

import { motion } from "framer-motion";

/**
 * EarlyAdopterBadge — the blue "OG" medallion for the first 100 users
 * (User.is_early_adopter, auto-granted on signup). Render beside the student's name.
 */
export function EarlyAdopterBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isSm = size === "sm";
  const coin = isSm ? 14 : 16;
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
      className="inline-flex items-center shrink-0 align-middle"
      title="OG — one of the first 100 students on Cribb"
      style={{
        gap: isSm ? "4px" : "5px",
        padding: isSm ? "1px 8px 1px 3px" : "2px 10px 2px 4px",
        borderRadius: "999px",
        background: "#E8F0FE",
        border: "1px solid #AEC9F5",
      }}
    >
      <svg width={coin} height={coin} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#2F6FED" />
        <path d="M12 6.6 L13.6 10.4 L17.7 10.7 L14.5 13.3 L15.6 17.4 L12 15.1 L8.4 17.4 L9.5 13.3 L6.3 10.7 L10.4 10.4 Z" fill="#fff" />
      </svg>
      <span style={{ fontSize: isSm ? "8px" : "10px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#1D4ED8", lineHeight: 1.5 }}>
        OG
      </span>
    </motion.span>
  );
}

/**
 * FoundingLandlordBadge — gold "founding member" badge for the first landlords on Cribb
 * (Landlord.is_early_adopter). Render beside the landlord's name.
 */
export function FoundingLandlordBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isSm = size === "sm";
  const coin = isSm ? 14 : 16;
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
      className="inline-flex items-center shrink-0 align-middle"
      title="Founding landlord — one of the first on Cribb"
      style={{
        gap: isSm ? "4px" : "5px",
        padding: isSm ? "1px 8px 1px 3px" : "2px 10px 2px 4px",
        borderRadius: "999px",
        background: "#FFF4DC",
        border: "1px solid #F0C766",
      }}
    >
      <svg width={coin} height={coin} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#EDA01A" />
        <path d="M12 6.6 L13.6 10.4 L17.7 10.7 L14.5 13.3 L15.6 17.4 L12 15.1 L8.4 17.4 L9.5 13.3 L6.3 10.7 L10.4 10.4 Z" fill="#fff" />
      </svg>
      <span style={{ fontSize: isSm ? "8px" : "10px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#A06800", lineHeight: 1.5 }}>
        Founding
      </span>
    </motion.span>
  );
}

/**
 * VerifiedWriterBadge — for approved Cribb writers. Render beside the writer's name.
 */
export function VerifiedWriterBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isSm = size === "sm";
  const coin = isSm ? 14 : 16;
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
      className="inline-flex items-center shrink-0 align-middle"
      title="Verified Cribb writer"
      style={{
        gap: isSm ? "4px" : "5px",
        padding: isSm ? "1px 8px 1px 3px" : "2px 10px 2px 4px",
        borderRadius: "999px",
        background: "#FFEAE0",
        border: "1px solid #F3AE91",
      }}
    >
      <svg width={coin} height={coin} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#F2622C" />
        <path d="M15.9 6.3 l1.8 1.8 -7.4 7.4 -2.6 0.8 0.8-2.6 7.4-7.4 z" fill="#fff" />
      </svg>
      <span style={{ fontSize: isSm ? "8px" : "10px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#B8431A", lineHeight: 1.5 }}>
        Writer
      </span>
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
      title="Verified student"
    >
      <svg width={isSm ? "8" : "10"} height={isSm ? "8" : "10"} viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
