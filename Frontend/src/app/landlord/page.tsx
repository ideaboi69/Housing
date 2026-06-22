"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { PropertyResponse, ListingResponse, ConversationResponse, MessageResponse, ReviewResponse, LandlordFlagResponse, ListingDetailResponse, SecurityEvent } from "@/types";
import {
  Plus, Building2, Eye, EyeOff, Trash2, Shield, ShieldCheck,
  ChevronDown, ChevronRight, Home, Phone, Mail, Pencil, Check, X,
  MessageCircle, LayoutDashboard, Send,
  Loader2,
  Archive, Inbox, Clock, AlertCircle, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatLeaseType, formatPropertyType } from "@/lib/utils";
import { getListingStatusBucket, getListingStatusLabel, getListingStatusTone, isToggleableStatus } from "@/lib/listing-status";
import { useMessagesSocket } from "@/lib/use-messages-socket";
import {
  getListingImages,
  type LandlordAnalyticsPeriod,
  mockListings,
  mockLandlordAnalyticsUpdatedAt,
  mockLandlordAttention,
  mockLandlordDailyMetrics,
  mockLandlordListingDailyMetrics,
  mockLandlordListingPerformance,
} from "@/lib/mock-data";
import { ListingVisibilitySwitch } from "@/components/landlord/ListingVisibilitySwitch";
import { ProfilePhotoUpload } from "@/components/landlord/ProfilePhotoUpload";
import { LandlordOverviewSkeleton } from "@/components/ui/Skeletons";
import { TenantCardModal } from "@/components/ui/TenantCardModal";

/* ════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════ */

interface PropertyWithListings extends PropertyResponse {
  listings: ListingResponse[];
  healthScore?: number | null;
  totalViews: number;
}

type Tab = "overview" | "properties" | "listings" | "reviews" | "messages" | "settings";

const LANDLORD_TABS: Tab[] = ["overview", "properties", "listings", "reviews", "messages", "settings"];

function getTabFromQuery(value: string | null): Tab {
  return LANDLORD_TABS.includes(value as Tab) ? (value as Tab) : "overview";
}

function getReportStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "Open";
  if (normalized === "resolved") return "Resolved";
  return normalized.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getLandlordScoreTone(score: number) {
  if (score >= 85) return { color: "#16784F", bg: "#E8F7EF" };
  if (score >= 70) return { color: "#1B2D45", bg: "#E9EEF7" };
  return { color: "#B42318", bg: "#FEECEC" };
}

function getListingTypeLabel(listing: Pick<ListingResponse, "is_sublet" | "per_room_pricing" | "rooms">): string {
  if (listing.is_sublet) return "Sublet";
  if (listing.per_room_pricing || listing.rooms?.length > 0) return "Private room";
  return "Full unit";
}

function getListingRoomLabel(listing: ListingResponse, property?: PropertyWithListings): string {
  const firstRoom = listing.rooms?.[0];
  if (firstRoom?.label) return firstRoom.label;
  if (listing.rooms?.length === 1) return "Room 1";
  if (listing.per_room_pricing) return "Private room";
  return property?.total_rooms === 1 ? "Unit" : "Whole property";
}

function daysSince(date: string, now = new Date("2026-06-07T12:00:00-04:00")) {
  return Math.max(0, Math.ceil((now.getTime() - new Date(date).getTime()) / 86400000));
}

function relativeActivity(date: string, now = new Date("2026-06-07T12:00:00-04:00")) {
  const minutes = Math.max(1, Math.round((now.getTime() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/* ════════════════════════════════════════════════════════
   Sidebar
   ════════════════════════════════════════════════════════ */

function Sidebar({ active, onChange, unreadCount }: { active: Tab; onChange: (t: Tab) => void; unreadCount: number }) {
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "properties", label: "Properties", icon: <Building2 className="w-4 h-4" /> },
    { key: "listings", label: "Listings", icon: <Home className="w-4 h-4" /> },
    { key: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
    { key: "messages", label: "Messages", icon: <MessageCircle className="w-4 h-4" />, badge: unreadCount },
  ];

  return (
    <nav className="w-[200px] shrink-0 hidden md:block">
      <div className="sticky top-6 space-y-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left ${
              active === t.key
                ? "bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                : "text-[#1B2D45]/55 hover:bg-[#1B2D45]/[0.035] hover:text-[#1B2D45]"
            }`}
            style={{ fontSize: "13px", fontWeight: active === t.key ? 500 : 400 }}
          >
            <span className={active === t.key ? "text-[#1B2D45]" : "text-[#1B2D45]/45"}>{t.icon}</span>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span
                className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E71D36] px-1 text-white"
                style={{ fontSize: "9px", fontWeight: 500 }}
              >
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* Mobile tab bar */
function MobileTabBar({ active, onChange, unreadCount }: { active: Tab; onChange: (t: Tab) => void; unreadCount: number }) {
  const tabs: { key: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: "overview", icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview" },
    { key: "properties", icon: <Building2 className="w-5 h-5" />, label: "Properties" },
    { key: "listings", icon: <Home className="w-5 h-5" />, label: "Listings" },
    { key: "reviews", icon: <Star className="w-5 h-5" />, label: "Reviews" },
    { key: "messages", icon: <MessageCircle className="w-5 h-5" />, label: "Messages", badge: unreadCount },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.06] z-50 px-2 py-1.5 flex justify-around">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all relative ${
            active === t.key ? "text-[#1B2D45]" : "text-[#1B2D45]/58"
          }`}
        >
          {t.icon}
          <span style={{ fontSize: "9px", fontWeight: active === t.key ? 800 : 700 }}>{t.label}</span>
          {t.badge != null && t.badge > 0 && (
            <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-[#E71D36] text-white flex items-center justify-center" style={{ fontSize: "8px", fontWeight: 700 }}>
              {t.badge > 9 ? "9+" : t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}


/* ════════════════════════════════════════════════════════
   Overview Tab
   ════════════════════════════════════════════════════════ */

function OverviewTab({
  user,
  conversations,
  unreadCount,
  onSwitchTab,
}: {
  user: { first_name: string; identity_verified?: boolean; company_name?: string | null };
  conversations: ConversationResponse[];
  unreadCount: number;
  onSwitchTab: (t: Tab) => void;
}) {
  type SortKey = "listing" | "status" | "views" | "saves" | "inquiries" | "daysListed" | "lastActivity";

  const [period, setPeriod] = useState<LandlordAnalyticsPeriod>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("inquiries");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const periodConfig: Record<LandlordAnalyticsPeriod, { label: string; days: number; compare: string }> = {
    "7d": { label: "Last 7 days", days: 7, compare: "vs last week" },
    "30d": { label: "Last 30 days", days: 30, compare: "vs previous 30 days" },
    "90d": { label: "Last 90 days", days: 90, compare: "vs previous 90 days" },
    all: { label: "All time", days: mockLandlordDailyMetrics.length, compare: "vs earlier period" },
  };

  const now = new Date("2026-06-07T12:00:00-04:00");
  const selectedDays = periodConfig[period].days;
  const chartSeries = mockLandlordDailyMetrics.slice(-selectedDays);
  const previousSeries = mockLandlordDailyMetrics.slice(
    Math.max(0, mockLandlordDailyMetrics.length - selectedDays * 2),
    Math.max(0, mockLandlordDailyMetrics.length - selectedDays)
  );
  const responseSeries = mockLandlordDailyMetrics.slice(-30);
  const recentConvos = conversations.slice(0, 3);

  const total = (series: typeof mockLandlordDailyMetrics, key: "views" | "saves" | "inquiries") =>
    series.reduce((sum, item) => sum + item[key], 0);
  const avg = (series: typeof mockLandlordDailyMetrics, key: "responseRate" | "responseMinutes") =>
    series.length ? series.reduce((sum, item) => sum + item[key], 0) / series.length : 0;
  const percentDelta = (current: number, previous: number) => {
    if (!previous) return current ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  const daysBetween = (date: string) => Math.max(0, Math.ceil((now.getTime() - new Date(date).getTime()) / 86400000));
  const daysUntil = (date: string) => Math.ceil((new Date(`${date}T12:00:00-04:00`).getTime() - now.getTime()) / 86400000);
  const relativeTime = (date: string) => {
    const minutes = Math.max(1, Math.round((now.getTime() - new Date(date).getTime()) / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.round(hours / 24)} days ago`;
  };

  const activeListings = mockLandlordListingPerformance.filter((listing) => listing.status === "active").length;
  const draftListings = mockLandlordListingPerformance.filter((listing) => listing.status === "draft").length;
  const totalListings = mockLandlordListingPerformance.length;
  const currentViews = total(chartSeries, "views");
  const previousViews = total(previousSeries, "views");
  const currentInquiries = total(chartSeries, "inquiries");
  const previousInquiries = total(previousSeries, "inquiries");
  const currentResponseRate = Math.round(avg(responseSeries, "responseRate"));
  const currentResponseMinutes = Math.round(avg(responseSeries, "responseMinutes"));

  const approachingMoveIns = mockLandlordListingPerformance.filter((listing) => {
    const remaining = daysUntil(listing.moveInDate);
    return listing.status === "active" && remaining >= 0 && remaining <= 45;
  });

  const attentionItems = [
    unreadCount > 0
      ? { key: "messages", label: `${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`, sub: "Reply while students are still warm", tab: "messages" as Tab }
      : null,
    draftListings > 0
      ? { key: "drafts", label: `${draftListings} draft listing${draftListings === 1 ? "" : "s"}`, sub: "Publish or clean up inactive rooms", tab: "listings" as Tab }
      : null,
    mockLandlordAttention.viewingsThisWeek > 0
      ? { key: "viewings", label: `${mockLandlordAttention.viewingsThisWeek} viewing${mockLandlordAttention.viewingsThisWeek === 1 ? "" : "s"} this week`, sub: "Confirm times and prep instructions", tab: "listings" as Tab }
      : null,
    approachingMoveIns.length > 0
      ? { key: "moveins", label: `${approachingMoveIns.length} move-in date approaching`, sub: `${approachingMoveIns[0].room} is ${daysUntil(approachingMoveIns[0].moveInDate)} days out`, tab: "listings" as Tab }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; sub: string; tab: Tab }>;

  const listingMetricTotals = useMemo(() => {
    return mockLandlordListingDailyMetrics.reduce<Record<number, { views: number; saves: number; inquiries: number }>>((totals, item) => {
      totals[item.listingId] ??= { views: 0, saves: 0, inquiries: 0 };
      totals[item.listingId].views += item.views;
      totals[item.listingId].saves += item.saves;
      totals[item.listingId].inquiries += item.inquiries;
      return totals;
    }, {});
  }, []);

  const sortedListings = useMemo(() => {
    return [...mockLandlordListingPerformance].sort((a, b) => {
      const value = (item: typeof mockLandlordListingPerformance[number]) => {
        const totals = listingMetricTotals[item.listingId] ?? { views: 0, saves: 0, inquiries: 0 };
        if (sortKey === "listing") return `${item.title} ${item.room}`;
        if (sortKey === "daysListed") return daysBetween(item.listedAt);
        if (sortKey === "lastActivity") return new Date(item.lastActivityAt).getTime();
        if (sortKey === "views" || sortKey === "saves" || sortKey === "inquiries") return totals[sortKey];
        return item[sortKey];
      };
      const aValue = value(a);
      const bValue = value(b);
      const result = typeof aValue === "number" && typeof bValue === "number"
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue));
      return sortDir === "asc" ? result : -result;
    });
  }, [listingMetricTotals, sortDir, sortKey]);

  const sortableHeader = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === key) {
          setSortDir((current) => current === "asc" ? "desc" : "asc");
        } else {
          setSortKey(key);
          setSortDir(key === "listing" || key === "status" ? "asc" : "desc");
        }
      }}
      className="inline-flex items-center gap-1 text-[#1B2D45]/75 hover:text-[#1B2D45]"
      style={{ fontSize: "10px", fontWeight: 950 }}
    >
      {label} {sortKey === key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 500 }}>Landlord</p>
          <h1 className="mt-1 text-[#1B2D45]" style={{ fontSize: "24px", lineHeight: 1.15, fontWeight: 600 }}>
            {user.company_name ?? `${user.first_name}'s portfolio`}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[#1B2D45]/50" style={{ fontSize: "13px", fontWeight: 400 }}>
            <span><span className="text-[#1B2D45]/80" style={{ fontWeight: 500 }}>{totalListings}</span> listing{totalListings === 1 ? "" : "s"}</span>
            <span className="text-[#1B2D45]/25">·</span>
            <span><span className="text-[#239B55]" style={{ fontWeight: 500 }}>{activeListings}</span> active</span>
            <span className="text-[#1B2D45]/25">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" /> updated {relativeTime(mockLandlordAnalyticsUpdatedAt)}
            </span>
          </p>
        </div>
        <Link href="/landlord/properties/new" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1B2D45] px-4 py-2.5 text-white transition-colors hover:bg-[#152438]" style={{ fontSize: "13px", fontWeight: 600 }}>
          <Plus className="h-4 w-4" /> Add property
        </Link>
      </div>

      {(unreadCount > 0 || draftListings > 0) && (
        <button
          type="button"
          onClick={() => onSwitchTab(unreadCount > 0 ? "messages" : "listings")}
          className="flex w-full items-center gap-2.5 rounded-lg bg-[#1B2D45]/[0.04] px-3.5 py-2.5 text-left transition-colors hover:bg-[#1B2D45]/[0.07]"
        >
          <Clock className="h-4 w-4 shrink-0 text-[#A66A00]" />
          <span className="flex-1 text-[#1B2D45]/70" style={{ fontSize: "13px", fontWeight: 400 }}>
            {[draftListings > 0 ? `${draftListings} draft listing${draftListings === 1 ? "" : "s"}` : null, unreadCount > 0 ? `${unreadCount} unread message${unreadCount === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}
          </span>
          <span className="shrink-0 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>Review →</span>
        </button>
      )}

      {/* Metric strip */}
      <div>
        <div className="mb-3 flex items-center justify-end gap-1">
          {(Object.keys(periodConfig) as LandlordAnalyticsPeriod[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-md px-2.5 py-1 transition-colors ${period === key ? "bg-[#1B2D45]/[0.06] text-[#1B2D45]" : "text-[#1B2D45]/45 hover:text-[#1B2D45]/70"}`}
              style={{ fontSize: "12px", fontWeight: period === key ? 500 : 400 }}
            >
              {periodConfig[key].label.replace("Last ", "")}
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#1B2D45]/[0.08] bg-white shadow-[0_1px_2px_rgba(27,45,69,0.03)]">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              { label: "Views", value: currentViews.toLocaleString(), delta: percentDelta(currentViews, previousViews), onClick: () => onSwitchTab("listings") },
              { label: "Inquiries", value: currentInquiries.toLocaleString(), delta: percentDelta(currentInquiries, previousInquiries), onClick: () => onSwitchTab("messages") },
              { label: "Active listings", value: `${activeListings} of ${totalListings}`, sub: draftListings > 0 ? `${draftListings} draft` : "all live", onClick: () => onSwitchTab("listings") },
              { label: "Avg reply", value: `${currentResponseMinutes}m`, sub: `${currentResponseRate}% response`, onClick: () => onSwitchTab("messages") },
            ].map((m, i) => (
              <button
                key={m.label}
                type="button"
                onClick={m.onClick}
                className={`group p-4 text-left transition-colors hover:bg-[#1B2D45]/[0.02] sm:p-5 border-[#1B2D45]/[0.08] ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i > 0 ? "sm:border-l" : ""}`}
              >
                <div className="text-[#1B2D45]/50" style={{ fontSize: "12px", fontWeight: 400 }}>{m.label}</div>
                <div className="mt-1.5 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 600, lineHeight: 1 }}>{m.value}</div>
                <div className="mt-1.5" style={{ fontSize: "12px", fontWeight: 400 }}>
                  {typeof m.delta === "number"
                    ? <span className={m.delta >= 0 ? "text-[#239B55]" : "text-[#B42318]"}>{m.delta >= 0 ? "↑" : "↓"} {Math.abs(m.delta)}%</span>
                    : <span className="text-[#1B2D45]/40">{m.sub}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Per-listing performance</h2>
          <span className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>{sortedListings.length} listings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-[#1B2D45]/[0.08] text-left">
                <th className="pb-2.5 pr-4">{sortableHeader("listing", "Listing")}</th>
                <th className="px-4 pb-2.5">{sortableHeader("status", "Status")}</th>
                <th className="px-4 pb-2.5">{sortableHeader("views", "Views")}</th>
                <th className="px-4 pb-2.5">{sortableHeader("saves", "Saves")}</th>
                <th className="px-4 pb-2.5">{sortableHeader("inquiries", "Inquiries")}</th>
                <th className="pl-4 pb-2.5">{sortableHeader("lastActivity", "Activity")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedListings.map((listing) => {
                const totals = listingMetricTotals[listing.listingId] ?? { views: 0, saves: 0, inquiries: 0 };
                return (
                  <tr key={listing.listingId} className="border-b border-[#1B2D45]/[0.05] transition-colors hover:bg-[#1B2D45]/[0.02]">
                    <td className="py-3 pr-4">
                      <Link href={`/landlord/properties/${listing.propertyId}`} className="block text-[#1B2D45] hover:underline" style={{ fontSize: "13px", fontWeight: 500 }}>
                        {listing.title}
                      </Link>
                      <div className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>{listing.room}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 ${getListingStatusTone(listing.status)}`} style={{ fontSize: "11px", fontWeight: 500 }}>
                        {getListingStatusLabel(listing.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1B2D45]/70" style={{ fontSize: "13px" }}>{totals.views}</td>
                    <td className="px-4 py-3 text-[#1B2D45]/70" style={{ fontSize: "13px" }}>{totals.saves}</td>
                    <td className="px-4 py-3 text-[#1B2D45]/70" style={{ fontSize: "13px" }}>{totals.inquiries}</td>
                    <td className="pl-4 py-3 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>{relativeTime(listing.lastActivityAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Recent messages</h2>
          <button type="button" onClick={() => onSwitchTab("messages")} className="text-[#1B2D45]/55 hover:text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>View all →</button>
        </div>
        {recentConvos.length > 0 ? (
          <div className="divide-y divide-[#1B2D45]/[0.06]">
            {recentConvos.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => onSwitchTab("messages")} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[#1B2D45]/[0.02]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2D45]/[0.07] text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 500 }}>
                  {(conversation.user_name ?? "S")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{conversation.user_name ?? "Student"}</span>
                    {conversation.unread_count > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E71D36]" />}
                  </div>
                  <p className="mt-0.5 truncate text-[#1B2D45]/50" style={{ fontSize: "12px" }}>{conversation.last_message?.content ?? conversation.listing_title}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#1B2D45]/30" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[#1B2D45]/45" style={{ fontSize: "13px" }}>No new student messages in this period.</p>
        )}
      </div>
    </div>
  );
}
/* ════════════════════════════════════════════════════════
   Properties Tab
   ════════════════════════════════════════════════════════ */

function PropertiesTab({ properties }: { properties: PropertyWithListings[] }) {
  const hasProperties = properties.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 600 }}>Properties</h2>
        {hasProperties && (
          <Link href="/landlord/properties/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2D45] px-4 py-2.5 text-white transition-colors hover:bg-[#152438]" style={{ fontSize: "13px", fontWeight: 600 }}>
            <Plus className="w-3.5 h-3.5" /> Add property
          </Link>
        )}
      </div>

      {!hasProperties ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1B2D45]/[0.05]">
            <Home className="h-6 w-6 text-[#1B2D45]/50" />
          </div>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>No properties yet</h3>
          <p className="mx-auto mt-1 max-w-[320px] text-[#1B2D45]/50" style={{ fontSize: "13px" }}>Add an address once, then manage its rooms and listings.</p>
          <Link href="/landlord/properties/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B2D45] px-5 py-2.5 text-white transition-colors hover:bg-[#152438]" style={{ fontSize: "13px", fontWeight: 600 }}>
            <Plus className="w-4 h-4" /> Add property
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#1B2D45]/[0.06] border-y border-[#1B2D45]/[0.08]">
          {properties.map((prop) => {
            const scoreTone = prop.healthScore ? getLandlordScoreTone(prop.healthScore) : null;
            const activeCount = prop.listings.filter((listing) => getListingStatusBucket(listing.status) === "active").length;

            return (
              <Link
                key={prop.id}
                href={`/landlord/properties/${prop.id}`}
                className="group flex items-center gap-4 py-4 transition-colors hover:bg-[#1B2D45]/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 500 }}>{prop.title}</h3>
                    {scoreTone && (
                      <span className="shrink-0 rounded-md px-1.5 py-0.5" style={{ fontSize: "10px", fontWeight: 500, color: scoreTone.color, background: scoreTone.bg }}>
                        {prop.healthScore}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[#1B2D45]/50" style={{ fontSize: "12px" }}>
                    {prop.address} · {formatPropertyType(prop.property_type)} · {prop.total_rooms} bed · {prop.bathrooms} bath
                  </p>
                </div>
                <div className="hidden items-center gap-7 sm:flex">
                  {[
                    { v: prop.listings.length, l: "listings" },
                    { v: activeCount, l: "active" },
                    { v: prop.totalViews, l: "views" },
                  ].map((s) => (
                    <div key={s.l} className="text-right">
                      <div className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 500 }}>{s.v}</div>
                      <div className="text-[#1B2D45]/45" style={{ fontSize: "11px" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#1B2D45]/30 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1B2D45]/60" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Listings Tab
   ════════════════════════════════════════════════════════ */

function ListingsTab({
  properties,
  onListingUpdated,
  onListingDeleted,
}: {
  properties: PropertyWithListings[];
  onListingUpdated?: (listingId: number, updated: ListingResponse) => void;
  onListingDeleted?: (listingId: number) => void;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "review" | "draft" | "archived">("all");
  const [deletingListingId, setDeletingListingId] = useState<number | null>(null);
  const [togglingListingId, setTogglingListingId] = useState<number | null>(null);
  const [showCreatePicker, setShowCreatePicker] = useState(false);

  const allListings = properties.flatMap((property) =>
    property.listings.map((listing) => ({
      listing,
      property,
    }))
  );

  const filteredListings = allListings.filter(({ listing }) =>
    statusFilter === "all" ? true : getListingStatusBucket(listing.status) === statusFilter
  );

  const counts = {
    all: allListings.length,
    active: allListings.filter(({ listing }) => getListingStatusBucket(listing.status) === "active").length,
    review: allListings.filter(({ listing }) => getListingStatusBucket(listing.status) === "review").length,
    draft: allListings.filter(({ listing }) => getListingStatusBucket(listing.status) === "draft").length,
    archived: allListings.filter(({ listing }) => getListingStatusBucket(listing.status) === "archived").length,
  };
  const filterLabels: Record<typeof statusFilter, string> = {
    all: `All listings (${counts.all})`,
    active: `Active (${counts.active})`,
    review: `Under review (${counts.review})`,
    draft: `Draft (${counts.draft})`,
    archived: `Archived (${counts.archived})`,
  };

  async function handleDeleteListing(listingId: number) {
    const confirmed = window.confirm("Delete this listing? This cannot be undone.");
    if (!confirmed) return;

    setDeletingListingId(listingId);
    try {
      await api.listings.delete(listingId);
      onListingDeleted?.(listingId);
    } catch {
      // keep the UI stable if deletion fails
    } finally {
      setDeletingListingId(null);
    }
  }

  async function handleToggleListing(listing: ListingResponse) {
    const status = listing.status.toLowerCase();
    // Active → take down (unpublish). Otherwise → publish live.
    if (!isToggleableStatus(status) || togglingListingId === listing.id) return;

    setTogglingListingId(listing.id);
    try {
      const updated = status === "active"
        ? await api.listings.unpublish(listing.id)
        : await api.listings.publish(listing.id);
      onListingUpdated?.(listing.id, updated);
    } catch {
      window.alert("Could not update this listing. Please try again.");
    } finally {
      setTogglingListingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 600 }}>Listings</h2>
            <p className="mt-1 max-w-[560px] text-[#1B2D45]/50" style={{ fontSize: "13px", lineHeight: 1.5 }}>
              Every active, draft, and archived listing in one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:justify-end">
            <label className="flex min-w-[200px] flex-col gap-1.5">
              <span className="text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 500 }}>Status</span>
              <span className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                  className="h-9 w-full appearance-none rounded-lg border border-[#1B2D45]/12 bg-transparent px-3 pr-9 text-[#1B2D45] outline-none transition-colors hover:border-[#1B2D45]/25 focus:border-[#1B2D45]/40"
                  style={{ fontSize: "13px", fontWeight: 400 }}
                >
                  {(Object.keys(filterLabels) as Array<typeof statusFilter>).map((key) => (
                    <option key={key} value={key}>{filterLabels[key]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B2D45]/55" />
              </span>
            </label>
            {properties.length > 0 && (
              properties.length === 1 ? (
                <Link
                  href={`/landlord/properties/${properties[0].id}/listings/new`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B2D45] px-4 text-white transition-colors hover:bg-[#152438]"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <Plus className="h-3.5 w-3.5" /> Create listing
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreatePicker((value) => !value)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B2D45] px-4 text-white transition-colors hover:bg-[#152438]"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <Plus className="h-3.5 w-3.5" /> Create listing
                </button>
              )
            )}
          </div>
        </div>
        {showCreatePicker && properties.length > 1 && (
          <div className="mt-4 rounded-xl border border-[#1B2D45]/10 bg-[#F7F9FC] p-3 shadow-[0_10px_30px_rgba(27,45,69,0.06)] lg:ml-auto lg:max-w-[460px]">
            <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 850 }}>
              Choose a property for the new listing
            </div>
            <div className="mt-2 grid gap-2">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/landlord/properties/${property.id}/listings/new`}
                  className="flex items-center justify-between rounded-lg border border-[#1B2D45]/10 bg-white px-3 py-2.5 text-[#1B2D45] transition-all hover:border-[#1B2D45]/20 hover:bg-white"
                  style={{ fontSize: "12px", fontWeight: 800 }}
                >
                  <span className="truncate pr-3">{property.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#1B2D45]/65" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-black/[0.06] p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-3">
            <Home className="w-7 h-7 text-[#1B2D45]/65" />
          </div>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
            {statusFilter === "all" ? "No listings yet" : `No ${statusFilter} listings`}
          </h3>
          <p className="text-[#1B2D45]/65 mt-1 max-w-[340px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            {properties.length === 0
              ? "Add a property first, then create your first listing."
              : "Use the properties tab to add a new listing to one of your homes."}
          </p>
          <Link
            href={properties[0] ? `/landlord/properties/${properties[0].id}/listings/new` : "/landlord/properties/new"}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-colors"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" /> {properties.length === 0 ? "Add Property" : "Create Listing"}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] table-fixed">
              <thead>
                <tr className="border-y border-[#1B2D45]/[0.08] text-left text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 500 }}>
                  <th className="w-[17%] px-4 py-2.5">Property</th>
                  <th className="w-[14%] px-4 py-2.5">Listing / room</th>
                  <th className="w-[10%] px-4 py-2.5">Type</th>
                  <th className="w-[10%] px-4 py-2.5">Rent</th>
                  <th className="w-[10%] px-4 py-2.5">Status</th>
                  <th className="w-[10%] px-4 py-2.5">On / off</th>
                  <th className="w-[8%] px-4 py-2.5">Views</th>
                  <th className="w-[10%] px-4 py-2.5">Days live</th>
                  <th className="w-[10%] px-4 py-2.5">Activity</th>
                  <th className="w-[11%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2D45]/[0.05]">
                {filteredListings.map(({ listing, property }) => {
                  const statusBucket = getListingStatusBucket(listing.status);
                  const isActive = statusBucket === "active";
                  const isToggleable = isToggleableStatus(listing.status);
                  const roomLabel = getListingRoomLabel(listing, property);
                  const typeLabel = getListingTypeLabel(listing);

                  return (
                    <tr
                      key={listing.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/landlord/properties/${property.id}/listings/${listing.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") router.push(`/landlord/properties/${property.id}/listings/${listing.id}`);
                      }}
                      className="cursor-pointer transition-colors hover:bg-[#F7F9FC]"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/landlord/properties/${property.id}`} className="block text-[#1B2D45] hover:text-[#2F6FED]" style={{ fontSize: "12px", fontWeight: 850 }} onClick={(event) => event.stopPropagation()}>
                          {property.title}
                        </Link>
                        <div className="mt-0.5 truncate text-[#1B2D45]/58" style={{ fontSize: "10px", fontWeight: 750 }}>{property.address}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 850 }}>{roomLabel}</div>
                        <div className="mt-0.5 text-[#1B2D45]/58" style={{ fontSize: "10px", fontWeight: 750 }}>{formatLeaseType(listing.lease_type, listing.custom_lease_type)}</div>
                      </td>
                      <td className="px-4 py-3 text-[#1B2D45]/78" style={{ fontSize: "11px", fontWeight: 800 }}>{typeLabel}</td>
                      <td className="px-4 py-3 text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 850 }}>
                        ${listing.rent_per_room}/room
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 ${getListingStatusTone(listing.status)}`}
                          style={{ fontSize: "10px", fontWeight: 850 }}
                        >
                          {getListingStatusLabel(listing.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ListingVisibilitySwitch
                          isActive={isActive}
                          disabled={!isToggleable}
                          loading={togglingListingId === listing.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleListing(listing);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-[#1B2D45]/78" style={{ fontSize: "11px", fontWeight: 850 }}>{listing.view_count}</td>
                      <td className="px-4 py-3 text-[#1B2D45]/78" style={{ fontSize: "11px", fontWeight: 800 }}>{daysSince(listing.created_at)} days</td>
                      <td className="px-4 py-3 text-[#1B2D45]/78" style={{ fontSize: "11px", fontWeight: 800 }}>{relativeActivity(listing.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/landlord/properties/${property.id}/listings/${listing.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#1B2D45]/12 px-2.5 text-[#1B2D45]/80 transition-all hover:border-[#1B2D45]/25 hover:text-[#1B2D45]"
                            style={{ fontSize: "11px", fontWeight: 800 }}
                            title="Manage listing"
                            aria-label="Manage listing"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Manage
                          </Link>
                          <Link
                            href={`/browse/${listing.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1B2D45]/70 transition-all hover:bg-[#1B2D45]/[0.06] hover:text-[#1B2D45]"
                            title="Preview listing"
                            aria-label="Preview listing"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteListing(listing.id);
                            }}
                            disabled={deletingListingId === listing.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#E71D36]/75 transition-all hover:bg-[#E71D36]/[0.06] disabled:opacity-40"
                            title="Delete listing"
                            aria-label="Delete listing"
                          >
                            {deletingListingId === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}

    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Reviews Tab
   ════════════════════════════════════════════════════════ */

function ReviewsTab({ reviews, flags }: { reviews: ReviewResponse[]; flags: LandlordFlagResponse[] }) {
  const [viewMode, setViewMode] = useState<"all" | "reviews" | "reports">("all");
  const avg =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => {
            const reviewAvg =
              (review.responsiveness +
                review.maintenance_speed +
                review.respect_privacy +
                review.fairness_of_charges) /
              4;
            return sum + reviewAvg;
          }, 0) / reviews.length
        ).toFixed(1)
      : null;

  const wouldRentAgain =
    reviews.length > 0
      ? Math.round((reviews.filter((review) => review.would_rent_again).length / reviews.length) * 100)
      : null;
  const pendingFlags = flags.filter((flag) => flag.status !== "resolved").length;
  const resolvedFlags = flags.filter((flag) => flag.status === "resolved").length;
  const showReports = viewMode === "all" || viewMode === "reports";
  const showReviews = viewMode === "all" || viewMode === "reviews";
  const shouldShowReviewsEmpty = showReviews && reviews.length === 0 && (viewMode === "reviews" || !showReports || flags.length === 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 600 }}>Reviews &amp; reports</h2>
        <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
          Anonymous student feedback across your properties, plus reports submitted on your listings.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1B2D45]/[0.08] bg-white shadow-[0_1px_2px_rgba(27,45,69,0.03)]">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Average rating", value: avg ?? "—", sub: avg ? "all categories" : "No ratings yet" },
            { label: "Would rent again", value: wouldRentAgain != null ? `${wouldRentAgain}%` : "—", sub: wouldRentAgain != null ? "of students" : "No ratings yet" },
            { label: "Total reviews", value: String(reviews.length), sub: "all properties", onClick: () => setViewMode("reviews") },
            { label: "Open reports", value: String(pendingFlags), sub: flags.length > 0 ? `${resolvedFlags} resolved` : "none yet", onClick: () => setViewMode("reports") },
          ].map((m, i) => {
            const cls = `p-4 text-left sm:p-5 border-[#1B2D45]/[0.08] ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i > 0 ? "sm:border-l" : ""}`;
            const inner = (
              <>
                <div className="text-[#1B2D45]/50" style={{ fontSize: "12px" }}>{m.label}</div>
                <div className="mt-1.5 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 600, lineHeight: 1 }}>{m.value}</div>
                <div className="mt-1.5 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>{m.sub}</div>
              </>
            );
            return m.onClick
              ? <button key={m.label} type="button" onClick={m.onClick} className={`transition-colors hover:bg-[#1B2D45]/[0.02] ${cls}`}>{inner}</button>
              : <div key={m.label} className={cls}>{inner}</div>;
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All feedback" },
          { key: "reviews", label: `Reviews (${reviews.length})` },
          { key: "reports", label: `Reports (${flags.length})` },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setViewMode(option.key as typeof viewMode)}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              viewMode === option.key
                ? "bg-[#1B2D45] text-white"
                : "text-[#1B2D45]/55 hover:bg-[#1B2D45]/[0.05] hover:text-[#1B2D45]"
            }`}
            style={{ fontSize: "12px", fontWeight: 500 }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showReports && (flags.length === 0 ? (
        viewMode === "reports" ? (
          <p className="text-[#1B2D45]/45" style={{ fontSize: "13px" }}>
            No listing reports. If a student flags one of your listings, it shows up here with the reason.
          </p>
        ) : null
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <div key={flag.id} className="rounded-xl border border-[#1B2D45]/[0.08] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 500 }}>{flag.property_title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${flag.status === "resolved" ? "bg-[#239B55]/10 text-[#239B55]" : "bg-[#FFB627]/15 text-[#A66A00]"}`}
                      style={{ fontSize: "11px", fontWeight: 500 }}
                    >
                      {getReportStatusLabel(flag.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>{flag.property_address}</p>
                </div>
                <span className="shrink-0 text-[#1B2D45]/35" style={{ fontSize: "12px" }}>
                  {new Date(flag.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="mt-2.5 text-[#1B2D45]/70" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                <span className="text-[#1B2D45]/40">Reported issue — </span>{flag.reason}
              </p>
            </div>
          ))}
        </div>
      ))}

      {shouldShowReviewsEmpty ? (
        <p className="text-[#1B2D45]/45" style={{ fontSize: "13px" }}>
          No reviews yet — they appear here once students complete a stay and leave feedback.
        </p>
      ) : showReviews && reviews.length > 0 ? (
        <div className="space-y-2">
          {reviews.map((review) => {
            const reviewAvg = (
              (review.responsiveness +
                review.maintenance_speed +
                review.respect_privacy +
                review.fairness_of_charges) /
              4
            ).toFixed(1);

            return (
              <div key={review.id} className="rounded-xl border border-[#1B2D45]/[0.08] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 500 }}>Anonymous tenant review</span>
                      <span className="text-[#1B2D45]/45" style={{ fontSize: "12px" }}>· avg {reviewAvg}</span>
                    </div>
                    <p className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "12px" }}>
                      Property #{review.property_id} · {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 ${review.would_rent_again ? "bg-[#239B55]/10 text-[#239B55]" : "bg-[#E71D36]/10 text-[#B42318]"}`}
                    style={{ fontSize: "11px", fontWeight: 500 }}
                  >
                    {review.would_rent_again ? "Would rent again" : "Would not rent again"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
                  {[
                    ["Responsiveness", review.responsiveness],
                    ["Maintenance", review.maintenance_speed],
                    ["Privacy", review.respect_privacy],
                    ["Charges", review.fairness_of_charges],
                  ].map(([label, value]) => (
                    <span key={label} style={{ fontSize: "13px" }}>
                      <span className="text-[#1B2D45]" style={{ fontWeight: 500 }}>{value}/5</span>{" "}
                      <span className="text-[#1B2D45]/45">{label}</span>
                    </span>
                  ))}
                </div>

                {review.comment && (
                  <p className="mt-4 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                    “{review.comment}”
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Messages Tab
   ════════════════════════════════════════════════════════ */

function MessagesTab({
  conversations,
  onRefreshConversations,
}: {
  conversations: ConversationResponse[];
  onRefreshConversations: () => Promise<void>;
}) {
  const [activeConvo, setActiveConvo] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [tenantCardOpen, setTenantCardOpen] = useState(false);
  const [threadFilter, setThreadFilter] = useState<"all" | "unread">("all");
  const [listingFilter, setListingFilter] = useState<number | "all">("all");
  const [markingUnavailable, setMarkingUnavailable] = useState(false);
  const unreadTotal = conversations.reduce((sum, convo) => sum + convo.unread_count, 0);
  const uniqueStudents = new Set(conversations.map((convo) => convo.user_id)).size;
  const recentInquiry = conversations[0]?.last_message?.created_at;
  const listingOptions = useMemo(() => {
    const seen = new Set<number>();
    return conversations.reduce<Array<{ id: number; title: string }>>((items, conversation) => {
      if (seen.has(conversation.listing_id)) return items;
      seen.add(conversation.listing_id);
      items.push({ id: conversation.listing_id, title: conversation.listing_title || `Listing ${conversation.listing_id}` });
      return items;
    }, []);
  }, [conversations]);
  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    if (threadFilter === "unread" && conversation.unread_count === 0) return false;
    if (listingFilter !== "all" && conversation.listing_id !== listingFilter) return false;
    return true;
  }), [conversations, listingFilter, threadFilter]);
  const getConversationListing = useCallback((conversation?: ConversationResponse | null) => {
    if (!conversation) return null;
    const listing = mockListings.find((item) => item.id === conversation.listing_id);
    const performance = mockLandlordListingPerformance.find((item) => item.listingId === conversation.listing_id);
    const image = getListingImages(conversation.listing_id)[0] ?? "/demo/listings/apartment.jpg";
    return {
      id: conversation.listing_id,
      title: listing?.title ?? performance?.title ?? conversation.listing_title ?? `Listing ${conversation.listing_id}`,
      room: performance?.room ?? (listing ? getListingRoomLabel(listing) : "Listing inquiry"),
      propertyId: listing?.property_id ?? performance?.propertyId,
      address: listing?.address,
      status: getListingStatusLabel(listing?.status ?? performance?.status ?? "active"),
      statusBucket: getListingStatusBucket(listing?.status ?? performance?.status ?? "active"),
      image,
    };
  }, []);

  // `silent` background refreshes (WebSocket / poll) update the thread in place without
  // flipping the loading spinner or clearing messages — so the view doesn't flicker while
  // you're reading. Only an explicit open (silent=false) shows the spinner.
  const loadMessages = useCallback(async (convoId: number, silent = false) => {
    setActiveConvo(convoId);
    if (!silent) setLoadingMessages(true);
    try {
      const detail = await api.messages.getConversation(convoId);
      setMessages((prev) => {
        // Avoid a re-render (and scroll jump) when nothing actually changed.
        if (prev.length === detail.messages.length && prev[prev.length - 1]?.id === detail.messages[detail.messages.length - 1]?.id) {
          return prev;
        }
        return detail.messages;
      });
      // Opening the thread marks it read server-side — refresh the inbox so the
      // unread badge clears immediately instead of waiting for the next poll.
      void onRefreshConversations();
    } catch {
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [onRefreshConversations]);

  useEffect(() => {
    if (filteredConversations.length === 0) {
      setActiveConvo(null);
      setMessages([]);
      return;
    }

    const activeStillExists = activeConvo != null && filteredConversations.some((conversation) => conversation.id === activeConvo);
    if (!activeStillExists) {
      void loadMessages(filteredConversations[0].id);
    }
  }, [activeConvo, filteredConversations, loadMessages]);

  // Real-time: the backend pushes { type: "new_message", conversation_id } over the
  // WebSocket. Refresh the inbox on any new message, and reload the open thread if it's
  // the one that changed. The interval below stays only as a low-frequency safety net.
  useMessagesSocket((event) => {
    if (event.type !== "new_message") return;
    void onRefreshConversations();
    if (event.conversation_id != null && event.conversation_id === activeConvo) {
      void loadMessages(activeConvo, true);
    }
  });

  useEffect(() => {
    if (!activeConvo) return;

    const interval = window.setInterval(() => {
      void loadMessages(activeConvo, true);
      void onRefreshConversations();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [activeConvo, loadMessages, onRefreshConversations]);

  async function handleSendReply() {
    if (!replyText.trim() || !activeConvo) return;
    setSending(true);
    try {
      const msg = await api.messages.landlordReply(activeConvo, { content: replyText.trim() });
      setMessages((prev) => [...prev, msg]);
      setReplyText("");
      await onRefreshConversations();
      await loadMessages(activeConvo);
    } catch { /* failed */ }
    finally { setSending(false); }
  }

  async function handleArchiveActiveConversation() {
    if (!activeConvo || !activeConvoData) return;

    const confirmed = window.confirm(
      `Archive this conversation with ${activeConvoData.user_name ?? "this student"}? The message history will be preserved.`
    );
    if (!confirmed) return;

    try {
      await api.messages.landlordDeleteConversation(activeConvo);
      setActiveConvo(null);
      setMessages([]);
      await onRefreshConversations();
    } catch {
      window.alert("Could not archive this conversation. Please try again.");
    }
  }

  async function handleMarkUnavailable() {
    if (!activeConvoData) return;
    if (!window.confirm("Take this listing down so students can no longer inquire? You can republish it anytime from the listing.")) return;
    setMarkingUnavailable(true);
    try {
      await api.listings.unpublish(activeConvoData.listing_id);
      window.alert("Listing taken down. Republish it from the listing's Manage page when it's available again.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Couldn't update the listing — it may already be inactive.");
    } finally {
      setMarkingUnavailable(false);
    }
  }

  const activeConvoData = conversations.find(c => c.id === activeConvo);
  const activeListingContext = getConversationListing(activeConvoData);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 600 }}>Messages</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
            <span><span className="text-[#1B2D45]/80" style={{ fontWeight: 500 }}>{conversations.length}</span> thread{conversations.length === 1 ? "" : "s"}</span>
            <span className="text-[#1B2D45]/25">·</span>
            <span>{uniqueStudents} student{uniqueStudents === 1 ? "" : "s"}</span>
            {unreadTotal > 0 && <><span className="text-[#1B2D45]/25">·</span><span className="text-[#E71D36]" style={{ fontWeight: 500 }}>{unreadTotal} unread</span></>}
          </p>
        </div>
        <div className="flex gap-1.5">
          {([["all", "All"], ["unread", "Unread"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setThreadFilter(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${threadFilter === key ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/55 hover:bg-[#1B2D45]/[0.05] hover:text-[#1B2D45]"}`}
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              {label}
              {key === "unread" && unreadTotal > 0 && (
                <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 ${threadFilter === "unread" ? "bg-white/20 text-white" : "bg-[#E71D36] text-white"}`} style={{ fontSize: "9px", fontWeight: 600 }}>{unreadTotal}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.04] p-10 text-center shadow-[0_10px_30px_rgba(27,45,69,0.04)]">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-3 shadow-[0_8px_18px_rgba(27,45,69,0.08)]">
            <Inbox className="w-7 h-7 text-[#1B2D45]/58" />
          </div>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No messages yet</h3>
          <p className="text-[#1B2D45]/65 mt-1 max-w-[360px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.55 }}>
            Student inquiries will appear here once someone reaches out from one of your listings.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_10px_30px_rgba(27,45,69,0.04)] md:flex" style={{ minHeight: 560 }}>
          {/* Conversation list */}
          <div className={`w-full md:w-[340px] shrink-0 border-r border-black/[0.04] overflow-y-auto bg-[#F7F9FC] ${activeConvo ? "hidden md:block" : ""}`}>
            <div className="border-b border-black/[0.04] px-4 py-3">
              <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Inbox</div>
              <div className="text-[#1B2D45]/58 mt-1" style={{ fontSize: "10px" }}>
                {recentInquiry
                  ? `Latest inquiry ${new Date(recentInquiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : "Student listing inquiries"}
              </div>
              <label className="mt-3 block">
                <span className="text-[#1B2D45]/60" style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.08em" }}>LISTING</span>
                <span className="relative mt-1 block">
                  <select
                    value={listingFilter}
                    onChange={(event) => setListingFilter(event.target.value === "all" ? "all" : Number(event.target.value))}
                    className="h-9 w-full appearance-none rounded-lg border border-[#1B2D45]/12 bg-white px-3 pr-8 text-[#1B2D45] outline-none transition-all hover:border-[#1B2D45]/25 focus:border-[#1B2D45]/35"
                    style={{ fontSize: "11px", fontWeight: 800 }}
                  >
                    <option value="all">All listings</option>
                    {listingOptions.map((listing) => (
                      <option key={listing.id} value={listing.id}>{listing.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1B2D45]/55" />
                </span>
              </label>
            </div>
            {filteredConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#1B2D45]/65" style={{ fontSize: "12px", fontWeight: 700 }}>
                No threads match this filter.
              </div>
            ) : filteredConversations.map((c) => {
              const context = getConversationListing(c);
              return (
                <button
                  key={c.id}
                  onClick={() => loadMessages(c.id)}
                  className={`w-full cursor-pointer border-b border-black/[0.03] px-4 py-3 text-left transition-all hover:bg-white ${activeConvo === c.id ? "bg-white shadow-[inset_3px_0_0_#1B2D45]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#E9EEF7]">
                      <img src={context?.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 850 }}>{c.user_name ?? "Student"}</span>
                        {c.unread_count > 0 && (
                          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#1B2D45] px-1 text-white" style={{ fontSize: "8px", fontWeight: 800 }}>{c.unread_count}</span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 800 }}>{context?.title ?? c.listing_title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[#1B2D45]/58" style={{ fontSize: "10px", fontWeight: 700 }}>
                        <span className="truncate">{context?.room}</span>
                        <span className="shrink-0 rounded-full bg-[#E9EEF7] px-1.5 py-0.5 text-[#1B2D45]">{context?.status}</span>
                      </div>
                    </div>
                  </div>
                  {c.last_message && (
                    <p className="mt-2 truncate text-[#1B2D45]/62" style={{ fontSize: "10px", fontWeight: 700 }}>{c.last_message.content}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Message view */}
          <div className={`flex-1 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(27,45,69,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(47,111,237,0.08),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] ${!activeConvo ? "hidden md:flex" : "flex"}`}>
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center px-8">
                <div className="max-w-[320px] text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 shadow-[0_10px_30px_rgba(27,45,69,0.08)]">
                    <MessageCircle className="h-6 w-6 text-[#1B2D45]/58" />
                  </div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Open a student thread</div>
                  <p className="mt-2 text-[#1B2D45]/62" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                    Review listing questions, reply quickly, and keep every inquiry in one calm workspace.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="border-b border-black/[0.04] bg-white/85 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                  <button onClick={() => setActiveConvo(null)} className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/65 hover:bg-[#1B2D45]/[0.04]">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  {/* Clickable student avatar with pulse */}
                  <button onClick={() => setTenantCardOpen(true)} className="relative shrink-0 group" title="View student profile">
                    <div className="w-8 h-8 rounded-full bg-[#1B2D45]/[0.06] flex items-center justify-center group-hover:bg-[#1B2D45]/10 transition-colors">
                      <span className="text-[#1B2D45]/65 group-hover:text-[#1B2D45] transition-colors" style={{ fontSize: "11px", fontWeight: 700 }}>{(activeConvoData?.user_name ?? "S")[0].toUpperCase()}</span>
                    </div>
                    <span className="absolute inset-0 rounded-full animate-ping bg-[#1B2D45]/15" style={{ animationDuration: "2s", animationIterationCount: 3 }} />
                  </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 850 }}>{activeConvoData?.user_name ?? "Student"}</div>
                      {activeListingContext && (
                        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-[#1B2D45]/[0.07] bg-[#F7F9FC] p-3 sm:flex-row sm:items-center">
                          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-[#E9EEF7]">
                            <img src={activeListingContext.image} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{activeListingContext.title}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 400 }}>
                              <span>{activeListingContext.room}</span>
                              {activeListingContext.address && <span className="truncate">{activeListingContext.address}</span>}
                              <span className="rounded-full bg-[#1B2D45]/[0.06] px-2 py-0.5 text-[#1B2D45]/70">{activeListingContext.status}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Link
                              href={activeListingContext.propertyId ? `/landlord/properties/${activeListingContext.propertyId}` : `/browse/${activeListingContext.id}`}
                              className="inline-flex h-8 items-center justify-center rounded-lg bg-[#1B2D45] px-3 text-white transition-colors hover:bg-[#152438]"
                              style={{ fontSize: "11px", fontWeight: 600 }}
                            >
                              View listing
                            </Link>
                            <button
                              type="button"
                              onClick={handleMarkUnavailable}
                              disabled={markingUnavailable}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#1B2D45]/12 bg-white px-3 text-[#1B2D45] transition-colors hover:border-[#1B2D45]/25 disabled:opacity-50"
                              style={{ fontSize: "11px", fontWeight: 600 }}
                              title="Take this listing down"
                            >
                              {markingUnavailable && <Loader2 className="h-3 w-3 animate-spin" />}
                              Mark unavailable
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleArchiveActiveConversation}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.04] bg-white px-2.5 text-[#1B2D45]/70 transition-all hover:border-[#1B2D45]/10 hover:text-[#1B2D45]"
                      style={{ fontSize: "11px", fontWeight: 700 }}
                      title="Archive conversation"
                      aria-label="Archive conversation"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Archive</span>
                    </button>
                  </div>
                </div>

                {/* Tenant Card Modal */}
                {activeConvoData && (
                  <TenantCardModal
                    isOpen={tenantCardOpen}
                    onClose={() => setTenantCardOpen(false)}
                    userId={activeConvoData.user_id}
                  />
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1B2D45]/20" /></div>
                  ) : messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === "landlord" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-xl ${
                        m.sender_type === "landlord"
                          ? "bg-[#1B2D45] text-white"
                          : "bg-[#F7F9FC] text-[#1B2D45]"
                      }`} style={{ fontSize: "12px", lineHeight: 1.5 }}>
                        {m.content}
                        <div className={`mt-1 ${m.sender_type === "landlord" ? "text-white/30" : "text-[#1B2D45]/20"}`} style={{ fontSize: "9px" }}>
                          {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="px-4 py-3 border-t border-black/[0.04] bg-white/85 backdrop-blur-sm flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                    placeholder="Type a reply..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#F7F9FC] border border-transparent focus:border-[#1B2D45]/15 focus:outline-none transition-all"
                    style={{ fontSize: "12px" }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="w-9 h-9 rounded-lg bg-[#1B2D45] text-white flex items-center justify-center hover:bg-[#152438] disabled:opacity-40 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Settings Tab
   ════════════════════════════════════════════════════════ */

const LL_EVENT_LABELS: Record<string, string> = {
  sign_in: "Sign in",
  sign_in_failed: "Failed sign-in",
  sign_out: "Sign out",
  sign_out_all: "Sign out all devices",
  password_changed: "Password changed",
  password_reset_requested: "Password reset requested",
  password_reset_completed: "Password reset",
  email_verified: "Email verified",
  email_changed: "Email changed",
  token_reuse_detected: "Token reuse detected",
  account_created: "Account created",
};

function llParseBrowser(ua: string | null): string {
  if (!ua) return "—";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Other";
}

function llParseOS(ua: string | null): string {
  if (!ua) return "—";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "—";
}

function llFormatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function LandlordSecurityLog() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.landlords.getSecurityLog(20, 0);
        if (cancelled) return;
        setEvents(data);
        setHasMore(data.length === 20);
      } catch {
        // API not available
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await api.landlords.getSecurityLog(20, events.length);
      setEvents((prev) => [...prev, ...data]);
      setHasMore(data.length === 20);
    } catch { /* ignore */ }
    finally { setLoadingMore(false); }
  };

  const sectionCls = "bg-white rounded-xl border border-black/[0.04] p-5";
  const thStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 12px", textAlign: "left", whiteSpace: "nowrap" };
  const tdStyle: React.CSSProperties = { fontSize: "12px", padding: "10px 12px", whiteSpace: "nowrap" };

  return (
    <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Recent activity</h3>
      <p className="text-[#1B2D45]/58 mb-4" style={{ fontSize: "11px" }}>Security events on your account</p>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-[#FAF8F4] animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-[#1B2D45]/40 py-4 text-center" style={{ fontSize: "13px" }}>No activity yet</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="text-[#1B2D45]/40" style={thStyle}>Event</th>
                  <th className="text-[#1B2D45]/40" style={thStyle}>IP address</th>
                  <th className="text-[#1B2D45]/40" style={thStyle}>Browser</th>
                  <th className="text-[#1B2D45]/40" style={thStyle}>OS</th>
                  <th className="text-[#1B2D45]/40" style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="border-b border-black/[0.03] last:border-0">
                    <td style={tdStyle}>
                      <span className={`font-medium ${evt.event_type === "sign_in_failed" || evt.event_type === "token_reuse_detected" ? "text-[#E71D36]" : "text-[#1B2D45]"}`}>
                        {LL_EVENT_LABELS[evt.event_type] || evt.event_type}
                      </span>
                    </td>
                    <td className="text-[#1B2D45]/60 font-mono" style={tdStyle}>{evt.ip_address || "—"}</td>
                    <td className="text-[#1B2D45]/60" style={tdStyle}>{llParseBrowser(evt.user_agent)}</td>
                    <td className="text-[#1B2D45]/60" style={tdStyle}>{llParseOS(evt.user_agent)}</td>
                    <td className="text-[#1B2D45]/40" style={tdStyle}>{llFormatDate(evt.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="pt-3 flex justify-center">
              <button onClick={loadMore} disabled={loadingMore}
                className="text-[#1B2D45]/60 hover:text-[#1B2D45] transition-colors disabled:opacity-50"
                style={{ fontSize: "12px", fontWeight: 600 }}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SettingsTab({ user }: { user: { email: string; first_name: string; last_name: string; identity_verified?: boolean; company_name?: string | null; phone?: string | null } }) {
  const router = useRouter();
  const { logout, loadUser } = useAuthStore();

  // Contact info
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [companyName, setCompanyName] = useState(user.company_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");

  // Password
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Notification preferences (synced with backend)
  const [notifInquiries, setNotifInquiries] = useState(true);
  const [notifReviews, setNotifReviews] = useState(true);
  const [notifFlags, setNotifFlags] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // Listing defaults (stored locally)
  const [defaultLeaseType, setDefaultLeaseType] = useState("12_months");
  const [defaultMoveIn, setDefaultMoveIn] = useState("september");
  const [defaultGender, setDefaultGender] = useState("any");

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await api.landlords.updateProfile({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        company_name: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      await loadUser(); // refresh navbar / header with the new name
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* fail */ }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
    setPwSaving(true);
    try {
      await api.auth.changePassword({ current_password: currentPw, new_password: newPw });
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPassword(false);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password");
    } finally { setPwSaving(false); }
  };

  // Load landlord notification preferences
  useEffect(() => {
    let cancelled = false;
    async function loadNotifPrefs() {
      try {
        const prefs = await api.landlords.getNotificationPreferences();
        if (cancelled) return;
        setNotifInquiries(prefs.notify_new_messages);
        setNotifReviews(prefs.notify_new_reviews);
        setNotifFlags(prefs.notify_new_flags);
      } catch { /* keep defaults */ }
      finally { if (!cancelled) setNotifLoading(false); }
    }
    loadNotifPrefs();
    return () => { cancelled = true; };
  }, []);

  const handleSaveNotifPrefs = async () => {
    setNotifSaving(true);
    try {
      await api.landlords.updateNotificationPreferences({
        notify_new_messages: notifInquiries,
        notify_new_reviews: notifReviews,
        notify_new_flags: notifFlags,
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save notification preferences");
    } finally { setNotifSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    try {
      await api.auth.deleteAccount();
      logout();
      router.push("/");
    } catch { /* fail */ }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-[#1B2D45]/10 text-[#1B2D45] focus:border-[#1B2D45]/25 focus:outline-none transition-all";
  const sectionCls = "bg-white rounded-xl border border-black/[0.04] p-5";

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="relative w-10 h-5.5 rounded-full transition-all shrink-0" style={{ width: 40, height: 22, background: on ? "#1B2D45" : "rgba(27,45,69,0.12)" }}>
        <div className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 18, height: 18, left: on ? 20 : 2 }} />
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Settings</h2>

      {/* ─── Profile Photo ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "14px", fontWeight: 700 }}>Profile Photo</h3>
        <ProfilePhotoUpload
          initials={`${user.first_name[0]}${user.last_name[0]}`}
        />
      </div>

      {/* ─── Contact Information ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Contact Information</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#1B2D45]/65 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setEditing(false); setFirstName(user.first_name ?? ""); setLastName(user.last_name ?? ""); setCompanyName(user.company_name ?? ""); setPhone(user.phone ?? ""); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#1B2D45]/65 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                <X className="w-3 h-3" /> Cancel
              </button>
              <button onClick={handleSaveContact} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-50 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                {saving ? "Saving..." : <><Check className="w-3 h-3" /> Save</>}
              </button>
            </div>
          )}
        </div>
        <p className="text-[#1B2D45]/58 mb-4" style={{ fontSize: "11px" }}>Shown publicly on your listings so students can reach you.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>First Name</label>
              {editing ? (
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputCls} style={{ fontSize: "13px" }} />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
                  <span className="text-[#1B2D45]" style={{ fontSize: "13px" }}>{user.first_name || "Not set"}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Last Name</label>
              {editing ? (
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputCls} style={{ fontSize: "13px" }} />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
                  <span className="text-[#1B2D45]" style={{ fontSize: "13px" }}>{user.last_name || "Not set"}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Company / Realtor Name</label>
            {editing ? (
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Mitchell Property Management" className={inputCls} style={{ fontSize: "13px" }} />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
                <Building2 className="w-3.5 h-3.5 text-[#1B2D45]/25" />
                <span className={user.company_name ? "text-[#1B2D45]" : "text-[#1B2D45]/25 italic"} style={{ fontSize: "13px" }}>{user.company_name ?? "Not set"}</span>
              </div>
            )}
          </div>
          <div>
            <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Phone Number</label>
            {editing ? (
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. (519) 555-0147" className={inputCls} style={{ fontSize: "13px" }} />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
                <Phone className="w-3.5 h-3.5 text-[#1B2D45]/25" />
                <span className={user.phone ? "text-[#1B2D45]" : "text-[#1B2D45]/25 italic"} style={{ fontSize: "13px" }}>{user.phone ?? "Not set"}</span>
              </div>
            )}
          </div>
          <div>
            <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Email</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
              <Mail className="w-3.5 h-3.5 text-[#1B2D45]/25" />
              <span className="text-[#1B2D45]" style={{ fontSize: "13px" }}>{user.email || "Not available"}</span>
              <span className="text-[#1B2D45]/15 ml-auto" style={{ fontSize: "10px" }}>from account</span>
            </div>
          </div>
        </div>
        {saved && <div className="flex items-center gap-1.5 mt-3 text-[#4ADE80]" style={{ fontSize: "12px", fontWeight: 600 }}><Check className="w-3.5 h-3.5" /> Contact info updated</div>}
      </div>

      {/* ─── Password ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Password</h3>
          {!showPassword && (
            <button onClick={() => setShowPassword(true)} className="text-[#1B2D45]/65 hover:text-[#1B2D45] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
              Change
            </button>
          )}
        </div>
        {pwSuccess && <div className="flex items-center gap-1.5 text-[#4ADE80] mb-2" style={{ fontSize: "12px", fontWeight: 600 }}><Check className="w-3.5 h-3.5" /> Password updated</div>}
        {!showPassword ? (
          <p className="text-[#1B2D45]/58" style={{ fontSize: "12px" }}>••••••••••</p>
        ) : (
          <div className="space-y-3 mt-3">
            <div>
              <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Current password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={`${inputCls} pr-10`} style={{ fontSize: "13px" }} />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/58 hover:text-[#1B2D45]/55 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>New password</label>
              <input type={showPassword ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" className={inputCls} style={{ fontSize: "13px" }} />
            </div>
            <div>
              <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Confirm new password</label>
              <input type={showPassword ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} style={{ fontSize: "13px" }} />
            </div>
            <p className="text-[#1B2D45]/58" style={{ fontSize: "11px", lineHeight: 1.5 }}>
              Strong passwords usually include an uppercase letter, a number, and a symbol.
            </p>
            {pwError && <div className="text-[#E71D36] flex items-center gap-1.5" style={{ fontSize: "12px" }}><AlertCircle className="w-3.5 h-3.5" /> {pwError}</div>}
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowPassword(false); setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                className="px-3 py-1.5 rounded-lg text-[#1B2D45]/65 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleChangePassword} disabled={pwSaving}
                className="px-4 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-50 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                {pwSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Security Log ─── */}
      <LandlordSecurityLog />

      {/* ─── Notification Preferences ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Notifications</h3>
        <p className="text-[#1B2D45]/58 mb-4" style={{ fontSize: "11px" }}>Choose what email notifications you receive.</p>
        {notifLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[46px] rounded-xl bg-[#FAF8F4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>New student inquiries</div>
                <div className="text-[#1B2D45]/58" style={{ fontSize: "11px" }}>Get notified when a student messages you about a listing</div>
              </div>
              <Toggle on={notifInquiries} onToggle={() => setNotifInquiries(!notifInquiries)} />
            </div>
            <div className="h-px bg-black/[0.04]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>New reviews</div>
                <div className="text-[#1B2D45]/58" style={{ fontSize: "11px" }}>Get notified when a student leaves a review</div>
              </div>
              <Toggle on={notifReviews} onToggle={() => setNotifReviews(!notifReviews)} />
            </div>
            <div className="h-px bg-black/[0.04]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Listing flags</div>
                <div className="text-[#1B2D45]/58" style={{ fontSize: "11px" }}>Get notified when one of your listings is flagged</div>
              </div>
              <Toggle on={notifFlags} onToggle={() => setNotifFlags(!notifFlags)} />
            </div>
            <div className="pt-2">
              <button
                onClick={handleSaveNotifPrefs}
                disabled={notifSaving}
                className="px-5 py-2 rounded-lg text-white text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#FF6B35" }}
              >
                {notifSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Listing Defaults ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Listing Defaults</h3>
        <p className="text-[#1B2D45]/58 mb-4" style={{ fontSize: "11px" }}>Pre-fill these values when creating new listings to save time.</p>
        <div className="space-y-4">
          <div>
            <label className="text-[#1B2D45]/65 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Default lease type</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "12_months", label: "12 months" },
                { key: "8_months", label: "8 months" },
                { key: "4_months", label: "4 months (sublet)" },
                { key: "month_to_month", label: "Month-to-month" },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setDefaultLeaseType(opt.key)}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    defaultLeaseType === opt.key
                      ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                      : "border-black/[0.06] text-[#1B2D45]/62 hover:border-[#1B2D45]/15"
                  }`}
                  style={{ fontSize: "11px", fontWeight: defaultLeaseType === opt.key ? 600 : 500 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#1B2D45]/65 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Default move-in month</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "september", label: "September" },
                { key: "may", label: "May" },
                { key: "january", label: "January" },
                { key: "flexible", label: "Flexible" },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setDefaultMoveIn(opt.key)}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    defaultMoveIn === opt.key
                      ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                      : "border-black/[0.06] text-[#1B2D45]/62 hover:border-[#1B2D45]/15"
                  }`}
                  style={{ fontSize: "11px", fontWeight: defaultMoveIn === opt.key ? 600 : 500 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#1B2D45]/65 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Default gender preference</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "any", label: "Any" },
                { key: "female", label: "Female only" },
                { key: "male", label: "Male only" },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setDefaultGender(opt.key)}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    defaultGender === opt.key
                      ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                      : "border-black/[0.06] text-[#1B2D45]/62 hover:border-[#1B2D45]/15"
                  }`}
                  style={{ fontSize: "11px", fontWeight: defaultGender === opt.key ? 600 : 500 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Verification ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "14px", fontWeight: 700 }}>Verification</h3>
        {user.identity_verified ? (
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4ADE80]" />
            <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Identity verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2F6FED]" />
            <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Pending review (1-2 business days)</span>
          </div>
        )}
      </div>

      {/* ─── Public Profile Preview ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Public Profile</h3>
        <p className="text-[#1B2D45]/58 mb-3" style={{ fontSize: "11px" }}>Preview how students see your profile on listing pages.</p>
        <div className="bg-[#FAF8F4] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B2D45]/[0.08] flex items-center justify-center">
              <span className="text-[#1B2D45]/50" style={{ fontSize: "14px", fontWeight: 700 }}>{user.first_name[0]}{user.last_name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{user.company_name || `${user.first_name} ${user.last_name}`}</span>
                {user.identity_verified && <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {user.phone && <span className="text-[#1B2D45]/58 flex items-center gap-1" style={{ fontSize: "10px" }}><Phone className="w-2.5 h-2.5" /> {user.phone}</span>}
                <span className="text-[#1B2D45]/58 flex items-center gap-1" style={{ fontSize: "10px" }}><Mail className="w-2.5 h-2.5" /> {user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="bg-white rounded-xl border border-[#E71D36]/10 p-5">
        <h3 className="text-[#E71D36]" style={{ fontSize: "14px", fontWeight: 700 }}>Danger Zone</h3>
        <p className="text-[#1B2D45]/58 mt-1 mb-3" style={{ fontSize: "11px" }}>Permanent actions that cannot be undone.</p>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 rounded-lg border border-[#E71D36]/20 text-[#E71D36] hover:bg-[#E71D36]/[0.04] transition-colors"
            style={{ fontSize: "12px", fontWeight: 600 }}>
            Delete Account
          </button>
        ) : (
          <div className="bg-[#E71D36]/[0.04] rounded-xl p-4 space-y-3">
            <p className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.5 }}>
              This will permanently delete your account, all properties, listings, and messages. This action cannot be undone.
            </p>
            <div>
              <label className="text-[#1B2D45]/65 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E71D36]/20 text-[#1B2D45] focus:border-[#E71D36]/40 focus:outline-none transition-all" style={{ fontSize: "13px" }} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="px-3 py-1.5 rounded-lg text-[#1B2D45]/65 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE"}
                className="px-4 py-1.5 rounded-lg bg-[#E71D36] text-white hover:bg-[#c4162d] disabled:opacity-30 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Dashboard
   ════════════════════════════════════════════════════════ */

function LandlordDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>(() => getTabFromQuery(searchParams.get("tab")));
  const [properties, setProperties] = useState<PropertyWithListings[]>([]);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [flags, setFlags] = useState<LandlordFlagResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const nextTab = getTabFromQuery(searchParams.get("tab"));
    setTab((current) => (current === nextTab ? current : nextTab));
  }, [searchParams]);

  const handleTabChange = useCallback((nextTab: Tab) => {
    setTab(nextTab);
    const target = nextTab === "overview" ? "/landlord" : `/landlord?tab=${nextTab}`;
    router.replace(target, { scroll: false });
  }, [router]);

  const refreshConversationState = useCallback(async () => {
    try {
      const [convos, unread] = await Promise.all([
        api.messages.getLandlordConversations(),
        api.messages.getLandlordUnreadCount(),
      ]);
      setConversations(convos);
      setUnreadCount(unread.unread_count);
    } catch {
      // Ignore refresh failures and keep the current inbox visible.
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== "landlord") return;

    const interval = window.setInterval(() => {
      void refreshConversationState();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [authLoading, refreshConversationState, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const query = searchParams.toString();
      const nextTarget = `${pathname}${query ? `?${query}` : ""}`;
      router.replace(`/landlord/login?next=${encodeURIComponent(nextTarget)}`);
      return;
    }
    if (user.role !== "landlord") { router.replace("/"); return; }
    const landlordUser = user;

    async function load() {
      const token = localStorage.getItem("cribb_token");
      const headers = { Authorization: `Bearer ${token}` };
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      try {
        // Fetch properties
        let props: PropertyResponse[] = [];
        try {
          const res = await fetch(`${API_URL}/api/properties/me/all`, { headers });
          if (res.ok) props = await res.json();
        } catch { /* backend down */ }

        // Enrich with listings
        const enriched: PropertyWithListings[] = await Promise.all(
          props.map(async (prop) => {
            let listings: ListingDetailResponse[] = [];
            let healthScore: number | null = null;
            let totalViews = 0;

            try {
              const listingResults = await Promise.allSettled(
                ["active", "draft", "rented", "expired"].map((status) =>
                  api.listings.browse({ skip: 0, limit: 100, status })
                )
              );
              const allListings = listingResults.flatMap((result) => (
                result.status === "fulfilled" ? result.value : []
              ));
              listings = allListings.filter((l) => l.property_id === prop.id);
              totalViews = listings.reduce((sum, l) => sum + l.view_count, 0);

              const active = listings.find(l => l.status === "active");
              if (active) {
                try { const hs = await api.healthScores.get(active.id); healthScore = hs?.overall_score ?? null; } catch { /* */ }
              }
            } catch { /* */ }

            return { ...prop, listings, healthScore, totalViews };
          })
        );
        setProperties(enriched);

        try {
          const reviewData = await api.reviews.browse({ landlord_id: landlordUser.id, limit: 100 });
          setReviews(reviewData);
        } catch { /* */ }

        try {
          const flagData = await api.landlords.getMyFlags();
          setFlags(flagData);
        } catch { /* */ }

        await refreshConversationState();

      } catch {
        // Dashboard load failed — will use fallback/empty state
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, authLoading, pathname, refreshConversationState, router, searchParams]);

  if (!user || authLoading || (isLoading && tab !== "overview")) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex gap-6">
            {/* Sidebar skeleton */}
            <div className="w-[220px] shrink-0 hidden md:block space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-[#1B2D45]/[0.04] animate-pulse" />
              ))}
            </div>
            {/* Main content skeleton */}
            <div className="flex-1">
              <LandlordOverviewSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Layout: Sidebar + Content */}
        <div className="flex gap-6">
          <Sidebar active={tab} onChange={handleTabChange} unreadCount={unreadCount} />

          <div className="flex-1 min-w-0 pb-20 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {tab === "overview" && (
                  <OverviewTab
                    user={user}
                    conversations={conversations}
                    unreadCount={unreadCount}
                    onSwitchTab={handleTabChange}
                  />
                )}
                {tab === "properties" && <PropertiesTab properties={properties} />}
                {tab === "listings" && <ListingsTab properties={properties} onListingUpdated={(lid, updated) => {
                  setProperties(prev => prev.map(p => ({
                    ...p,
                    listings: p.listings.map(l => l.id === lid ? updated : l),
                  })));
                }} onListingDeleted={(lid) => {
                  setProperties(prev => prev.map((p) => ({
                    ...p,
                    listings: p.listings.filter((l) => l.id !== lid),
                  })));
                }} />}
                {tab === "reviews" && <ReviewsTab reviews={reviews} flags={flags} />}
                {tab === "messages" && (
                  <MessagesTab
                    conversations={conversations}
                    onRefreshConversations={refreshConversationState}
                  />
                )}
                {tab === "settings" && <SettingsTab user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MobileTabBar active={tab} onChange={handleTabChange} unreadCount={unreadCount} />
    </div>
  );
}

export default function LandlordDashboard() {
  return (
    <Suspense fallback={null}>
      <LandlordDashboardContent />
    </Suspense>
  );
}
