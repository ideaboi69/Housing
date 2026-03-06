"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { clearLandlordClaim, getLandlordClaimCode, getLandlordClaimState, type LandlordClaimState } from "@/lib/landlord-claim";
import type { PropertyResponse, ListingResponse, ConversationResponse, MessageResponse } from "@/types";
import {
  Plus, Building2, Eye, TrendingUp, Shield, ShieldCheck,
  ChevronRight, Home, Phone, Mail, Pencil, Check, X,
  MessageCircle, Settings, LayoutDashboard, Send,
  ToggleLeft, ToggleRight, Calendar, Loader2,
  ArrowRight, Inbox, Clock, AlertCircle, Image, CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getScoreColor } from "@/lib/utils";
import { EditListingModal } from "@/components/landlord/EditListingModal";
import { ListingImageUpload } from "@/components/landlord/ListingImageUpload";
import { ShowingsManager } from "@/components/landlord/ShowingsManager";
import { ProfilePhotoUpload } from "@/components/landlord/ProfilePhotoUpload";

/* ════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════ */

interface PropertyWithListings extends PropertyResponse {
  listings: ListingResponse[];
  healthScore?: number | null;
  totalViews: number;
}

type Tab = "overview" | "properties" | "messages" | "settings";

/* ════════════════════════════════════════════════════════
   Sidebar
   ════════════════════════════════════════════════════════ */

function Sidebar({ active, onChange, unreadCount }: { active: Tab; onChange: (t: Tab) => void; unreadCount: number }) {
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "properties", label: "Properties", icon: <Building2 className="w-4 h-4" /> },
    { key: "messages", label: "Messages", icon: <MessageCircle className="w-4 h-4" />, badge: unreadCount },
    { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav className="w-[220px] shrink-0 hidden md:block">
      <div className="sticky top-6 space-y-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all text-left ${
              active === t.key
                ? "bg-[#1B2D45] text-white"
                : "text-[#1B2D45]/50 hover:bg-[#1B2D45]/[0.04] hover:text-[#1B2D45]"
            }`}
            style={{ fontSize: "13px", fontWeight: active === t.key ? 700 : 500 }}
          >
            {t.icon}
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span
                className={`ml-auto px-1.5 py-0.5 rounded-full ${
                  active === t.key ? "bg-white/20 text-white" : "bg-[#E71D36] text-white"
                }`}
                style={{ fontSize: "9px", fontWeight: 700, minWidth: 18, textAlign: "center" }}
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
    { key: "messages", icon: <MessageCircle className="w-5 h-5" />, label: "Messages", badge: unreadCount },
    { key: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.06] z-50 px-2 py-1.5 flex justify-around">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all relative ${
            active === t.key ? "text-[#1B2D45]" : "text-[#1B2D45]/30"
          }`}
        >
          {t.icon}
          <span style={{ fontSize: "9px", fontWeight: active === t.key ? 700 : 500 }}>{t.label}</span>
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
   Stat Card
   ════════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>{label}</span>
      </div>
      <div className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>{value}</div>
      {sub && <div className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "11px", fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Overview Tab
   ════════════════════════════════════════════════════════ */

function OverviewTab({
  user,
  properties,
  conversations,
  unreadCount,
  claimCode,
  claimState,
  onClearClaim,
  onSwitchTab,
}: {
  user: { first_name: string; identity_verified?: boolean; company_name?: string | null };
  properties: PropertyWithListings[];
  conversations: ConversationResponse[];
  unreadCount: number;
  claimCode: string;
  claimState: LandlordClaimState | null;
  onClearClaim: () => void;
  onSwitchTab: (t: Tab) => void;
}) {
  const totalListings = properties.reduce((sum, p) => sum + p.listings.length, 0);
  const activeListings = properties.reduce((sum, p) => sum + p.listings.filter(l => l.status === "active").length, 0);
  const totalViews = properties.reduce((sum, p) => sum + p.totalViews, 0);
  const scores = properties.filter(p => p.healthScore).map(p => p.healthScore!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  // Recent conversations (last 3)
  const recentConvos = conversations.slice(0, 3);
  const claimStage = claimState?.claim_code === claimCode ? claimState.status : "claim_started";
  const primaryClaimHref =
    claimStage === "listing_created" && claimState?.property_id
      ? `/landlord/properties/${claimState.property_id}`
      : claimStage === "property_created" && claimState?.property_id
      ? `/landlord/properties/${claimState.property_id}/listings/new?claim=${encodeURIComponent(claimCode)}`
      : "/landlord/properties/new?claim=" + encodeURIComponent(claimCode);
  const primaryClaimLabel =
    claimStage === "property_created"
      ? "Create Claimed Listing"
      : claimStage === "listing_created"
        ? "Claimed Listing Ready"
        : "Add Claimed Property";
  const claimDescription =
    claimStage === "property_created"
      ? `The property has been added${claimState?.property_title ? ` as ${claimState.property_title}` : ""}. Create the listing next so the claimed home is ready to attach.`
      : claimStage === "listing_created"
        ? `The claimed listing has been published${claimState?.listing_rent_per_room ? ` at $${claimState.listing_rent_per_room}/room` : ""}. Frontend flow is complete; backend still needs to attach it to the roommate group.`
        : "A roommate group invited you to verify their home on cribb. Add the property details next, then create the matching listing.";

  return (
    <div className="space-y-6">
      {claimCode && (
        <div className="bg-[#2EC4B6]/[0.05] border border-[#2EC4B6]/15 rounded-xl px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#2EC4B6]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Finish verifying a claimed home</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#2EC4B6]/10 text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 700 }}>
                  Claim {claimCode}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-[#1B2D45]/55" style={{ fontSize: "9px", fontWeight: 700 }}>
                  {claimStage === "property_created" ? "Property Added" : claimStage === "listing_created" ? "Listing Published" : "Needs Property"}
                </span>
              </div>
              <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                {claimDescription}
              </p>
              {claimState?.property_address && (
                <div className="mt-2 text-[#1B2D45]/30" style={{ fontSize: "11px" }}>
                  {claimState.property_address}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Link
                  href={primaryClaimHref}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  {primaryClaimLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => onSwitchTab("properties")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1B2D45]/10 text-[#1B2D45]/55 hover:text-[#1B2D45] hover:border-[#1B2D45]/20 transition-all"
                  style={{ fontSize: "11px", fontWeight: 600 }}
                >
                  View Properties
                </button>
                <button
                  onClick={onClearClaim}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#1B2D45]/25 hover:text-[#1B2D45]/45 transition-all"
                  style={{ fontSize: "11px", fontWeight: 600 }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Banner */}
      {user.identity_verified === false && (
        <div className="bg-[#FFB627]/[0.08] border border-[#FFB627]/20 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <Shield className="w-5 h-5 text-[#FFB627] shrink-0" />
          <div className="flex-1 min-w-[200px]">
            <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Verification pending</span>
            <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px", lineHeight: 1.4 }}>
              Your listings will show as &quot;Unverified&quot; until your identity is confirmed (1-2 business days).
            </p>
          </div>
        </div>
      )}
      {user.identity_verified === true && (
        <div className="bg-[#4ADE80]/[0.06] border border-[#4ADE80]/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#4ADE80] shrink-0" />
          <div>
            <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Verified Landlord</span>
            <span className="text-[#1B2D45]/40 ml-2" style={{ fontSize: "12px" }}>Your listings are shown as trusted</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Building2 className="w-4 h-4 text-[#1B2D45]" />} label="Properties" value={properties.length} />
        <StatCard icon={<Home className="w-4 h-4 text-[#2EC4B6]" />} label="Active Listings" value={activeListings} sub={totalListings > activeListings ? `${totalListings} total` : undefined} />
        <StatCard icon={<MessageCircle className="w-4 h-4 text-[#FF6B35]" />} label="Unread Messages" value={unreadCount} />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-[#4ADE80]" />} label="Avg Cribb Score" value={avgScore ?? "—"} sub={avgScore ? (avgScore >= 85 ? "Great" : avgScore >= 65 ? "Good" : "Needs work") : "No scores yet"} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/landlord/properties/new" className="flex items-center gap-3 bg-white rounded-xl border border-black/[0.04] p-4 hover:border-[#1B2D45]/15 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-[#1B2D45]/[0.06] flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-[#1B2D45]/60" />
          </div>
          <div>
            <div className="text-[#1B2D45] group-hover:text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Add Property</div>
            <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Register a new address</div>
          </div>
        </Link>
        <button onClick={() => onSwitchTab("messages")} className="flex items-center gap-3 bg-white rounded-xl border border-black/[0.04] p-4 hover:border-[#1B2D45]/15 transition-all group text-left">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/[0.06] flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-[#FF6B35]/60" />
          </div>
          <div>
            <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>View Messages</div>
            <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>{unreadCount > 0 ? `${unreadCount} unread` : "No new messages"}</div>
          </div>
        </button>
        <Link href="/browse" className="flex items-center gap-3 bg-white rounded-xl border border-black/[0.04] p-4 hover:border-[#1B2D45]/15 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/[0.06] flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-[#2EC4B6]/60" />
          </div>
          <div>
            <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>View as Student</div>
            <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>See how your listings appear</div>
          </div>
        </Link>
      </div>

      {/* Recent Messages */}
      {recentConvos.length > 0 && (
        <div className="bg-white rounded-xl border border-black/[0.04] p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Recent Messages</h3>
            <button onClick={() => onSwitchTab("messages")} className="text-[#1B2D45]/30 hover:text-[#1B2D45] transition-colors" style={{ fontSize: "11px", fontWeight: 600 }}>
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentConvos.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FAF8F4] transition-all cursor-pointer" onClick={() => onSwitchTab("messages")}>
                <div className="w-8 h-8 rounded-full bg-[#1B2D45]/[0.06] flex items-center justify-center shrink-0">
                  <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 700 }}>
                    {(c.user_name ?? "S")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 600 }}>{c.user_name ?? "Student"}</span>
                    <span className="text-[#1B2D45]/20 shrink-0" style={{ fontSize: "10px" }}>· {c.listing_title}</span>
                  </div>
                  {c.last_message && (
                    <p className="text-[#1B2D45]/35 truncate" style={{ fontSize: "11px" }}>{c.last_message.content}</p>
                  )}
                </div>
                {c.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shrink-0" style={{ fontSize: "9px", fontWeight: 700 }}>
                    {c.unread_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="bg-white rounded-xl border-2 border-dashed border-black/[0.06] p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-3">
            <Home className="w-7 h-7 text-[#1B2D45]/40" />
          </div>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No properties yet</h3>
          <p className="text-[#1B2D45]/40 mt-1 max-w-[320px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            Add your first property to start creating listings for UofG students.
          </p>
          <Link href="/landlord/properties/new"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-colors"
            style={{ fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 16px rgba(27,45,69,0.2)" }}>
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Properties Tab
   ════════════════════════════════════════════════════════ */

function PropertiesTab({ properties, onListingUpdated }: { properties: PropertyWithListings[]; onListingUpdated?: (listingId: number, updated: ListingResponse) => void }) {
  const [editListing, setEditListing] = useState<ListingResponse | null>(null);
  const [photosListing, setPhotosListing] = useState<{ id: number; title: string } | null>(null);
  const [showingsListing, setShowingsListing] = useState<{ id: number; title: string } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Your Properties</h2>
        <Link href="/landlord/properties/new" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-all" style={{ fontSize: "12px", fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" /> Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-black/[0.06] p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-3">
            <Home className="w-7 h-7 text-[#1B2D45]/40" />
          </div>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No properties yet</h3>
          <p className="text-[#1B2D45]/40 mt-1 max-w-[320px] mx-auto" style={{ fontSize: "13px" }}>Add your first property to get started.</p>
          <Link href="/landlord/properties/new" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-colors" style={{ fontSize: "14px", fontWeight: 600 }}>
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((prop) => {
            const scoreColor = prop.healthScore ? getScoreColor(prop.healthScore) : null;

            return (
              <div key={prop.id} className="bg-white rounded-xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                {/* Property header */}
                <Link href={`/landlord/properties/${prop.id}`} className="block p-4 hover:bg-[#FAF8F4]/50 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#1B2D45] truncate group-hover:text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>{prop.title}</h3>
                        {scoreColor && (
                          <span className="px-2 py-0.5 rounded-md shrink-0" style={{ fontSize: "10px", fontWeight: 700, color: scoreColor, background: `${scoreColor}15` }}>
                            CS {prop.healthScore}
                          </span>
                        )}
                      </div>
                      <p className="text-[#1B2D45]/40 truncate mt-0.5" style={{ fontSize: "12px" }}>{prop.address}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>
                          {prop.property_type} · {prop.total_rooms} bed · {prop.bathrooms} bath
                        </span>
                        {prop.is_furnished && <span className="px-2 py-0.5 rounded-md bg-[#4ADE80]/[0.06] text-[#4ADE80]" style={{ fontSize: "9px", fontWeight: 600 }}>Furnished</span>}
                        {prop.has_parking && <span className="px-2 py-0.5 rounded-md bg-[#2EC4B6]/[0.06] text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 600 }}>Parking</span>}
                        <span className="text-[#1B2D45]/20 flex items-center gap-1 ml-auto" style={{ fontSize: "10px" }}>
                          <Eye className="w-3 h-3" /> {prop.totalViews} views
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#1B2D45]/15 shrink-0 mt-1" />
                  </div>
                </Link>

                {/* Listings under this property */}
                {prop.listings.length > 0 && (
                  <div className="border-t border-black/[0.04] px-4 py-3 bg-[#FAF8F4]/30">
                    <div className="text-[#1B2D45]/30 mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>
                      LISTINGS ({prop.listings.length})
                    </div>
                    <div className="space-y-2">
                      {prop.listings.map((listing) => (
                        <div key={listing.id} className="bg-white rounded-lg border border-black/[0.03] overflow-hidden">
                          {/* Listing info row */}
                          <div className="flex items-center gap-3 px-3 py-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${listing.status === "active" ? "bg-[#4ADE80]" : listing.status === "leased" ? "bg-[#2EC4B6]" : "bg-[#1B2D45]/15"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
                                  ${listing.rent_per_room}/rm
                                </span>
                                <span className="text-[#1B2D45]/25" style={{ fontSize: "10px" }}>
                                  · {listing.lease_type}
                                </span>
                                {listing.move_in_date && (
                                  <span className="text-[#1B2D45]/25 flex items-center gap-0.5" style={{ fontSize: "10px" }}>
                                    <Calendar className="w-2.5 h-2.5" /> {new Date(listing.move_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                                {listing.is_sublet && <span className="px-1.5 py-0.5 rounded bg-[#2EC4B6]/10 text-[#2EC4B6]" style={{ fontSize: "8px", fontWeight: 700 }}>Sublet</span>}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md ${
                              listing.status === "active" ? "bg-[#4ADE80]/10 text-[#4ADE80]" :
                              listing.status === "leased" ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" :
                              "bg-[#1B2D45]/[0.04] text-[#1B2D45]/30"
                            }`} style={{ fontSize: "9px", fontWeight: 700 }}>
                              {listing.status}
                            </span>
                          </div>

                          {/* Action buttons row */}
                          <div className="flex items-center gap-1 px-3 py-1.5 border-t border-black/[0.02] bg-[#FAF8F4]/50">
                            <button
                              onClick={() => setEditListing(listing)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[#1B2D45]/35 hover:text-[#1B2D45] hover:bg-white transition-all"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => setPhotosListing({ id: listing.id, title: `${prop.title} — $${listing.rent_per_room}/rm` })}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[#1B2D45]/35 hover:text-[#1B2D45] hover:bg-white transition-all"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              <Image className="w-3 h-3" /> Photos
                            </button>
                            <button
                              onClick={() => setShowingsListing({ id: listing.id, title: `${prop.title} — $${listing.rent_per_room}/rm` })}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[#1B2D45]/35 hover:text-[#1B2D45] hover:bg-white transition-all"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              <CalendarDays className="w-3 h-3" /> Showings
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href={`/landlord/properties/${prop.id}/listings/new`}
                      className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-[#1B2D45]/30 hover:text-[#1B2D45] hover:bg-white transition-all"
                      style={{ fontSize: "11px", fontWeight: 600 }}>
                      <Plus className="w-3 h-3" /> Add listing
                    </Link>
                  </div>
                )}

                {prop.listings.length === 0 && (
                  <div className="border-t border-black/[0.04] px-4 py-3 bg-[#FAF8F4]/30">
                    <Link href={`/landlord/properties/${prop.id}/listings/new`}
                      className="flex items-center gap-2 text-[#1B2D45]/30 hover:text-[#1B2D45] transition-all"
                      style={{ fontSize: "11px", fontWeight: 600 }}>
                      <Plus className="w-3.5 h-3.5" /> Create first listing for this property
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editListing && (
          <EditListingModal
            listing={editListing}
            onClose={() => setEditListing(null)}
            onSaved={(updated) => {
              onListingUpdated?.(updated.id, updated);
              setEditListing(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {photosListing && (
          <ListingImageUpload
            listingId={photosListing.id}
            onClose={() => setPhotosListing(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showingsListing && (
          <ShowingsManager
            listingId={showingsListing.id}
            listingTitle={showingsListing.title}
            onClose={() => setShowingsListing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Messages Tab
   ════════════════════════════════════════════════════════ */

function MessagesTab({ conversations }: { conversations: ConversationResponse[] }) {
  const [activeConvo, setActiveConvo] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async (convoId: number) => {
    setActiveConvo(convoId);
    setLoadingMessages(true);
    try {
      const detail = await api.messages.getConversation(convoId);
      setMessages(detail.messages);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  async function handleSendReply() {
    if (!replyText.trim() || !activeConvo) return;
    setSending(true);
    try {
      const msg = await api.messages.landlordReply(activeConvo, { content: replyText.trim() });
      setMessages((prev) => [...prev, msg]);
      setReplyText("");
    } catch { /* failed */ }
    finally { setSending(false); }
  }

  const activeConvoData = conversations.find(c => c.id === activeConvo);

  return (
    <div className="space-y-4">
      <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Messages</h2>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/[0.04] p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7 text-[#1B2D45]/30" />
          </div>
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No messages yet</h3>
          <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "13px" }}>Student inquiries will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden flex" style={{ minHeight: 500 }}>
          {/* Conversation list */}
          <div className={`w-full md:w-[280px] shrink-0 border-r border-black/[0.04] overflow-y-auto ${activeConvo ? "hidden md:block" : ""}`}>
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadMessages(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-black/[0.03] hover:bg-[#FAF8F4] transition-all ${activeConvo === c.id ? "bg-[#FAF8F4]" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1B2D45]/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 700 }}>{(c.user_name ?? "S")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 600 }}>{c.user_name ?? "Student"}</span>
                      {c.unread_count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shrink-0" style={{ fontSize: "8px", fontWeight: 700 }}>{c.unread_count}</span>
                      )}
                    </div>
                    <span className="text-[#1B2D45]/25 truncate block" style={{ fontSize: "10px" }}>{c.listing_title}</span>
                  </div>
                </div>
                {c.last_message && (
                  <p className="text-[#1B2D45]/30 truncate mt-1 ml-9" style={{ fontSize: "10px" }}>{c.last_message.content}</p>
                )}
              </button>
            ))}
          </div>

          {/* Message view */}
          <div className={`flex-1 flex flex-col ${!activeConvo ? "hidden md:flex" : "flex"}`}>
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center text-[#1B2D45]/20" style={{ fontSize: "13px" }}>
                Select a conversation
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-black/[0.04] flex items-center gap-2">
                  <button onClick={() => setActiveConvo(null)} className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04]">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <div>
                    <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{activeConvoData?.user_name ?? "Student"}</div>
                    <div className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>Re: {activeConvoData?.listing_title}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1B2D45]/20" /></div>
                  ) : messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === "landlord" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-xl ${
                        m.sender_type === "landlord"
                          ? "bg-[#1B2D45] text-white"
                          : "bg-[#FAF8F4] text-[#1B2D45]"
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
                <div className="px-4 py-3 border-t border-black/[0.04] flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                    placeholder="Type a reply..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#FAF8F4] border border-transparent focus:border-[#1B2D45]/15 focus:outline-none transition-all"
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

function SettingsTab({ user }: { user: { email: string; first_name: string; last_name: string; identity_verified?: boolean; company_name?: string | null; phone?: string | null } }) {
  const router = useRouter();
  const { logout } = useAuthStore();

  // Contact info
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

  // Notifications (stored locally for now — no backend support yet)
  const [notifInquiries, setNotifInquiries] = useState(true);
  const [notifReviews, setNotifReviews] = useState(true);

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
        company_name: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
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
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#1B2D45]/40 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setEditing(false); setCompanyName(user.company_name ?? ""); setPhone(user.phone ?? ""); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                <X className="w-3 h-3" /> Cancel
              </button>
              <button onClick={handleSaveContact} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-50 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                {saving ? "Saving..." : <><Check className="w-3 h-3" /> Save</>}
              </button>
            </div>
          )}
        </div>
        <p className="text-[#1B2D45]/30 mb-4" style={{ fontSize: "11px" }}>Shown publicly on your listings so students can reach you.</p>
        <div className="space-y-3">
          <div>
            <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Company / Realtor Name</label>
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
            <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Phone Number</label>
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
            <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Email</label>
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
            <button onClick={() => setShowPassword(true)} className="text-[#1B2D45]/40 hover:text-[#1B2D45] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
              Change
            </button>
          )}
        </div>
        {pwSuccess && <div className="flex items-center gap-1.5 text-[#4ADE80] mb-2" style={{ fontSize: "12px", fontWeight: 600 }}><Check className="w-3.5 h-3.5" /> Password updated</div>}
        {!showPassword ? (
          <p className="text-[#1B2D45]/30" style={{ fontSize: "12px" }}>••••••••••</p>
        ) : (
          <div className="space-y-3 mt-3">
            <div>
              <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Current password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputCls} style={{ fontSize: "13px" }} />
            </div>
            <div>
              <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" className={inputCls} style={{ fontSize: "13px" }} />
            </div>
            <div>
              <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Confirm new password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} style={{ fontSize: "13px" }} />
            </div>
            {pwError && <div className="text-[#E71D36] flex items-center gap-1.5" style={{ fontSize: "12px" }}><AlertCircle className="w-3.5 h-3.5" /> {pwError}</div>}
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowPassword(false); setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                className="px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
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

      {/* ─── Notification Preferences ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Notifications</h3>
        <p className="text-[#1B2D45]/30 mb-4" style={{ fontSize: "11px" }}>Choose what email notifications you receive.</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>New student inquiries</div>
              <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Get notified when a student messages you about a listing</div>
            </div>
            <Toggle on={notifInquiries} onToggle={() => setNotifInquiries(!notifInquiries)} />
          </div>
          <div className="h-px bg-black/[0.04]" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>New reviews</div>
              <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Get notified when a student leaves a review</div>
            </div>
            <Toggle on={notifReviews} onToggle={() => setNotifReviews(!notifReviews)} />
          </div>
        </div>
      </div>

      {/* ─── Listing Defaults ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Listing Defaults</h3>
        <p className="text-[#1B2D45]/30 mb-4" style={{ fontSize: "11px" }}>Pre-fill these values when creating new listings to save time.</p>
        <div className="space-y-4">
          <div>
            <label className="text-[#1B2D45]/40 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Default lease type</label>
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
                      : "border-black/[0.06] text-[#1B2D45]/35 hover:border-[#1B2D45]/15"
                  }`}
                  style={{ fontSize: "11px", fontWeight: defaultLeaseType === opt.key ? 600 : 500 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#1B2D45]/40 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Default move-in month</label>
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
                      : "border-black/[0.06] text-[#1B2D45]/35 hover:border-[#1B2D45]/15"
                  }`}
                  style={{ fontSize: "11px", fontWeight: defaultMoveIn === opt.key ? 600 : 500 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#1B2D45]/40 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Default gender preference</label>
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
                      : "border-black/[0.06] text-[#1B2D45]/35 hover:border-[#1B2D45]/15"
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
            <Shield className="w-5 h-5 text-[#FFB627]" />
            <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Pending review (1-2 business days)</span>
          </div>
        )}
      </div>

      {/* ─── Public Profile Preview ─── */}
      <div className={sectionCls} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "14px", fontWeight: 700 }}>Public Profile</h3>
        <p className="text-[#1B2D45]/30 mb-3" style={{ fontSize: "11px" }}>Preview how students see your profile on listing pages.</p>
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
                {user.phone && <span className="text-[#1B2D45]/30 flex items-center gap-1" style={{ fontSize: "10px" }}><Phone className="w-2.5 h-2.5" /> {user.phone}</span>}
                <span className="text-[#1B2D45]/30 flex items-center gap-1" style={{ fontSize: "10px" }}><Mail className="w-2.5 h-2.5" /> {user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="bg-white rounded-xl border border-[#E71D36]/10 p-5">
        <h3 className="text-[#E71D36]" style={{ fontSize: "14px", fontWeight: 700 }}>Danger Zone</h3>
        <p className="text-[#1B2D45]/30 mt-1 mb-3" style={{ fontSize: "11px" }}>Permanent actions that cannot be undone.</p>

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
              <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E71D36]/20 text-[#1B2D45] focus:border-[#E71D36]/40 focus:outline-none transition-all" style={{ fontSize: "13px" }} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
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

export default function LandlordDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [properties, setProperties] = useState<PropertyWithListings[]>([]);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [claimCode, setClaimCode] = useState("");
  const [claimState, setClaimState] = useState<LandlordClaimState | null>(null);

  useEffect(() => {
    setClaimCode(getLandlordClaimCode());
    setClaimState(getLandlordClaimState());
  }, []);

  const handleClearClaim = useCallback(() => {
    clearLandlordClaim();
    setClaimCode("");
    setClaimState(null);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/landlord/login"); return; }
    if (user.role !== "landlord") { router.replace("/"); return; }

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
            let listings: ListingResponse[] = [];
            let healthScore: number | null = null;
            let totalViews = 0;

            try {
              const allListings = await api.listings.browse({ skip: 0, limit: 100 });
              listings = allListings.filter((l) => l.property_id === prop.id).map((l) => ({
                id: l.id, property_id: l.property_id, rent_per_room: l.rent_per_room,
                rent_total: l.rent_total, lease_type: l.lease_type, move_in_date: l.move_in_date,
                is_sublet: l.is_sublet, sublet_start_date: l.sublet_start_date,
                sublet_end_date: l.sublet_end_date, gender_preference: l.gender_preference,
                status: l.status, view_count: l.view_count, created_at: l.created_at,
                updated_at: l.created_at,
              }));
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

        // Fetch conversations
        try {
          const convos = await api.messages.getLandlordConversations();
          setConversations(convos);
        } catch { /* */ }

        // Fetch unread count
        try {
          const { unread_count } = await api.messages.getLandlordUnreadCount();
          setUnreadCount(unread_count);
        } catch { /* */ }

      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, authLoading, router]);

  if (!user || authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#1B2D45]/15 border-t-[#1B2D45] rounded-full animate-spin" />
          <div className="text-[#1B2D45]/30" style={{ fontSize: "13px" }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 900 }}>
              {user.company_name ?? `${user.first_name}'s Dashboard`}
            </h1>
            <p className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "12px" }}>
              Landlord Dashboard
            </p>
          </div>
          <Link href="/landlord/properties/new"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-all"
            style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 4px 16px rgba(27,45,69,0.15)" }}>
            <Plus className="w-3.5 h-3.5" /> Add Property
          </Link>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="flex gap-6">
          <Sidebar active={tab} onChange={setTab} unreadCount={unreadCount} />

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
                    properties={properties}
                    conversations={conversations}
                    unreadCount={unreadCount}
                    claimCode={claimCode}
                    claimState={claimState}
                    onClearClaim={handleClearClaim}
                    onSwitchTab={setTab}
                  />
                )}
                {tab === "properties" && <PropertiesTab properties={properties} onListingUpdated={(lid, updated) => {
                  setProperties(prev => prev.map(p => ({
                    ...p,
                    listings: p.listings.map(l => l.id === lid ? updated : l),
                  })));
                }} />}
                {tab === "messages" && <MessagesTab conversations={conversations} />}
                {tab === "settings" && <SettingsTab user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MobileTabBar active={tab} onChange={setTab} unreadCount={unreadCount} />
    </div>
  );
}
