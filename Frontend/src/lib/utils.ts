import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Cribb Score Helpers ────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 85) return "#4ADE80";
  if (score >= 65) return "#FFB627";
  return "#E71D36";
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return "Great";
  if (score >= 65) return "Good";
  return "Caution";
}

// ── Formatting Helpers ──────────────────────────────────

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatLeaseType(type: string, custom?: string | null): string {
  if (type === "custom") return custom || "Custom";
  const labels: Record<string, string> = {
    "8_month": "8-month",
    "10_month": "10-month",
    "12_month": "12-month",
    flexible: "Flexible",
  };
  return labels[type] || type;
}

export function formatPropertyType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function propertyTypeEmoji(type: string): string {
  switch (type) {
    case "apartment": return "🏢";
    case "townhouse": return "🏘️";
    case "room": return "🚪";
    case "house":
    default: return "🏠";
  }
}

export function formatDate(dateStr?: string | null, fallback = "Any move-in date"): string {
  if (!dateStr) return fallback;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-CA", {
    month: "short",
    year: "numeric",
  });
}
