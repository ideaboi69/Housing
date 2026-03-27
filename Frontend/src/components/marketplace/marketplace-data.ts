/* ════════════════════════════════════════════════════════
   Marketplace Data, Constants & Mock Items
   ════════════════════════════════════════════════════════ */

import type { MarketplaceItemListResponse, MarketplaceCategory, ItemCondition, PricingType } from "@/types";

export const MARKETPLACE_CATEGORIES: { key: MarketplaceCategory; label: string; emoji: string }[] = [
  { key: "furniture", label: "Furniture", emoji: "🪑" },
  { key: "electronics", label: "Electronics", emoji: "💻" },
  { key: "kitchenware", label: "Kitchenware", emoji: "🍳" },
  { key: "bedding", label: "Bedding", emoji: "🛏️" },
  { key: "appliances", label: "Appliances", emoji: "🧊" },
  { key: "decor", label: "Decor", emoji: "🖼️" },
  { key: "storage", label: "Storage", emoji: "📦" },
  { key: "bathroom", label: "Bathroom", emoji: "🚿" },
  { key: "cleaning", label: "Cleaning", emoji: "🧹" },
  { key: "lighting", label: "Lighting", emoji: "💡" },
  { key: "other", label: "Other", emoji: "📎" },
];

export const PICKUP_ZONES = ["Campus UC", "South Residences", "Stone Road", "Downtown", "East End"];

export const CONDITION_LABELS: Record<ItemCondition, { label: string; color: string }> = {
  new: { label: "New", color: "#4ADE80" },
  like_new: { label: "Like New", color: "#4ADE80" },
  good: { label: "Good", color: "#FFB627" },
  fair: { label: "Fair", color: "#98A3B0" },
  poor: { label: "Poor", color: "#98A3B0" },
};

export function getPriceLabel(pricingType: PricingType, price?: number): { text: string; badge?: string; color: string } {
  if (pricingType === "free") return { text: "FREE", color: "#4ADE80" };
  if (pricingType === "negotiable") return { text: `$${price ?? 0}`, badge: "Negotiable", color: "#FF6B35" };
  return { text: `$${price ?? 0}`, color: "#1B2D45" };
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export const MOCK_MARKETPLACE_ITEMS: MarketplaceItemListResponse[] = [
  {
    id: 9001, title: "IKEA KALLAX Bookshelf", category: "furniture", condition: "like_new",
    pricing_type: "negotiable", price: 45, status: "available", seller_name: "Priya S.",
    primary_image: "/demo/marketplace/bookshelf.jpg",
    view_count: 34, created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 9002, title: 'Dell 24" Monitor', category: "electronics", condition: "good",
    pricing_type: "fixed", price: 120, status: "available", seller_name: "Alex T.",
    primary_image: "/demo/marketplace/monitor.jpg",
    view_count: 67, created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 9003, title: "Cookware Set (Pots & Pans)", category: "kitchenware", condition: "good",
    pricing_type: "free", status: "available", seller_name: "Morgan L.",
    primary_image: "/demo/marketplace/cookware.jpg",
    view_count: 91, created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 9004, title: "Ergonomic Desk Chair", category: "furniture", condition: "good",
    pricing_type: "negotiable", price: 80, status: "available", seller_name: "Quinn B.",
    primary_image: "/demo/marketplace/chair.jpg",
    view_count: 45, created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 9005, title: "Mini Fridge", category: "appliances", condition: "like_new",
    pricing_type: "fixed", price: 60, status: "available", seller_name: "Riley M.",
    primary_image: "/demo/marketplace/fridge.jpg",
    view_count: 112, created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 9006, title: "Desk Lamp (LED)", category: "lighting", condition: "new",
    pricing_type: "fixed", price: 15, status: "available", seller_name: "Taylor R.",
    primary_image: "/demo/marketplace/lamp.jpg",
    view_count: 23, created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 9007, title: "Full Bedding Set (Queen)", category: "bedding", condition: "like_new",
    pricing_type: "negotiable", price: 35, status: "available", seller_name: "Jordan K.",
    primary_image: "/demo/marketplace/bedding.jpg",
    view_count: 56, created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 9008, title: "Bathroom Essentials Bundle", category: "bathroom", condition: "new",
    pricing_type: "free", status: "available", seller_name: "Sam W.",
    primary_image: "/demo/marketplace/bathroom.jpg",
    view_count: 78, created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

// Assign pickup zones to mock items
const MOCK_PICKUP_ZONES = ["Stone Road", "Campus UC", "South Residences", "Downtown", "Campus UC", "East End", "Stone Road", "South Residences"];
export const MOCK_ITEMS_WITH_ZONES = MOCK_MARKETPLACE_ITEMS.map((item, i) => ({
  ...item,
  pickup_zone: MOCK_PICKUP_ZONES[i] || "Campus UC",
}));
