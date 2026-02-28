"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { PropertyResponse, ListingResponse, HealthScoreResponse } from "@/types";
import {
  Plus,
  Building2,
  Eye,
  TrendingUp,
  Shield,
  ShieldCheck,
  Clock,
  ChevronRight,
  Home,
  AlertCircle,
  Phone,
  Mail,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { getScoreColor } from "@/lib/utils";

/* ════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════ */

interface LandlordProfile {
  id: number;
  user_id: number;
  identity_verified: boolean;
  company_name: string | null;
  phone: string | null;
  email?: string | null;
}

interface PropertyWithListings extends PropertyResponse {
  listings: ListingResponse[];
  healthScore?: number | null;
  totalViews: number;
}

/* ════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════ */

function VerificationBanner({ profile }: { profile: LandlordProfile | null }) {
  if (!profile) return null;

  if (profile.identity_verified) {
    return (
      <div className="bg-[#4ADE80]/[0.08] border border-[#4ADE80]/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-[#4ADE80] shrink-0" />
        <div>
          <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Verified Landlord</span>
          <span className="text-[#1B2D45]/40 ml-2" style={{ fontSize: "12px" }}>Your listings are shown as trusted to students</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFB627]/[0.08] border border-[#FFB627]/20 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
      <Shield className="w-5 h-5 text-[#FFB627] shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Verification pending</span>
        <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px", lineHeight: 1.4 }}>
          Your listings will show as &quot;Unverified&quot; until your identity is confirmed. This usually takes 1-2 business days.
        </p>
      </div>
      <button
        className="px-4 py-2 rounded-lg border border-[#FFB627]/30 text-[#FFB627] hover:bg-[#FFB627]/5 transition-colors shrink-0"
        style={{ fontSize: "12px", fontWeight: 600 }}
      >
        Request Verification
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.04] p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>{label}</span>
      </div>
      <div className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>{value}</div>
      {sub && <div className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "11px", fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function PropertyCard({ property }: { property: PropertyWithListings }) {
  const activeListings = property.listings.filter(l => l.status === "active").length;
  const scoreColor = property.healthScore ? getScoreColor(property.healthScore) : "#1B2D45";

  return (
    <Link
      href={`/landlord/properties/${property.id}`}
      className="block bg-white rounded-xl border border-black/[0.04] p-4 hover:border-[#FF6B35]/20 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-[#1B2D45] truncate group-hover:text-[#FF6B35] transition-colors" style={{ fontSize: "15px", fontWeight: 700 }}>
            {property.title}
          </h3>
          <p className="text-[#1B2D45]/40 truncate mt-0.5" style={{ fontSize: "12px" }}>{property.address}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#1B2D45]/20 group-hover:text-[#FF6B35]/50 transition-colors shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="bg-[#1B2D45]/5 text-[#1B2D45]/60 px-2.5 py-1 rounded-lg" style={{ fontSize: "11px", fontWeight: 500 }}>
          {property.property_type} · {property.total_rooms} bed · {property.bathrooms} bath
        </span>
        <span className={`px-2.5 py-1 rounded-lg ${activeListings > 0 ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#1B2D45]/5 text-[#1B2D45]/40"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
          {activeListings} active listing{activeListings !== 1 ? "s" : ""}
        </span>
        {property.healthScore && (
          <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: "11px", fontWeight: 700, color: scoreColor, background: `${scoreColor}15` }}>
            CS {property.healthScore}
          </span>
        )}
        <span className="text-[#1B2D45]/30 flex items-center gap-1 ml-auto" style={{ fontSize: "11px" }}>
          <Eye className="w-3 h-3" /> {property.totalViews}
        </span>
      </div>

      {/* Amenity dots */}
      <div className="flex items-center gap-2 mt-2.5">
        {property.is_furnished && <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" title="Furnished" />}
        {property.has_parking && <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6]" title="Parking" />}
        {property.has_laundry && <span className="w-1.5 h-1.5 rounded-full bg-[#FFB627]" title="Laundry" />}
        {property.utilities_included && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" title="Utilities" />}
        <span className="text-[#1B2D45]/20 ml-1" style={{ fontSize: "9px" }}>
          {[property.is_furnished && "Furnished", property.has_parking && "Parking", property.has_laundry && "Laundry", property.utilities_included && "Utilities"].filter(Boolean).join(" · ") || "No amenities listed"}
        </span>
      </div>
    </Link>
  );
}

function EmptyProperties() {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-black/[0.06] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-3">
        <Home className="w-7 h-7 text-[#FF6B35]" />
      </div>
      <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No properties yet</h3>
      <p className="text-[#1B2D45]/40 mt-1 max-w-[300px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.5 }}>
        Add your first property to start creating listings for UofG students.
      </p>
      <Link
        href="/landlord/properties/new"
        className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors"
        style={{ fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
      >
        <Plus className="w-4 h-4" />
        Add Property
      </Link>
    </div>
  );
}

/* ── Contact Info Editor ───────────────────── */

function ContactInfoCard({
  profile,
  userEmail,
  onUpdate,
}: {
  profile: LandlordProfile | null;
  userEmail?: string;
  onUpdate: (data: { company_name?: string; phone?: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saved, setSaved] = useState(false);

  // Sync fields when profile updates
  useEffect(() => {
    setCompanyName(profile?.company_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        company_name: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCompanyName(profile?.company_name ?? "");
    setPhone(profile?.phone ?? "");
    setEditing(false);
  };

  const displayEmail = profile?.email ?? userEmail ?? null;

  return (
    <div className="bg-white rounded-xl border border-black/[0.04] p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Contact Information</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#FF6B35] hover:bg-[#FF6B35]/[0.04] transition-colors"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-colors"
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-colors"
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              {saving ? "Saving..." : <><Check className="w-3 h-3" /> Save</>}
            </button>
          </div>
        )}
      </div>

      <p className="text-[#1B2D45]/35 mb-4" style={{ fontSize: "11px", lineHeight: 1.5 }}>
        This is shown publicly on your listings so students can reach you directly.
      </p>

      <div className="space-y-3">
        {/* Company Name */}
        <div>
          <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
            Company / Realtor Name
          </label>
          {editing ? (
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Mitchell Property Management"
              className="w-full px-3 py-2 rounded-lg border border-[#1B2D45]/10 text-[#1B2D45] placeholder:text-[#1B2D45]/20 focus:border-[#FF6B35]/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10 transition-all"
              style={{ fontSize: "13px" }}
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
              <Building2 className="w-3.5 h-3.5 text-[#1B2D45]/30" />
              <span className={profile?.company_name ? "text-[#1B2D45]" : "text-[#1B2D45]/25 italic"} style={{ fontSize: "13px" }}>
                {profile?.company_name ?? "Not set"}
              </span>
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
            Phone Number
          </label>
          {editing ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (519) 555-0147"
              className="w-full px-3 py-2 rounded-lg border border-[#1B2D45]/10 text-[#1B2D45] placeholder:text-[#1B2D45]/20 focus:border-[#FF6B35]/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10 transition-all"
              style={{ fontSize: "13px" }}
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
              <Phone className="w-3.5 h-3.5 text-[#1B2D45]/30" />
              <span className={profile?.phone ? "text-[#1B2D45]" : "text-[#1B2D45]/25 italic"} style={{ fontSize: "13px" }}>
                {profile?.phone ?? "Not set"}
              </span>
            </div>
          )}
        </div>

        {/* Email (read-only — comes from account) */}
        <div>
          <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
            Email
          </label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4]">
            <Mail className="w-3.5 h-3.5 text-[#1B2D45]/30" />
            <span className={displayEmail ? "text-[#1B2D45]" : "text-[#1B2D45]/25 italic"} style={{ fontSize: "13px" }}>
              {displayEmail ?? "Not available"}
            </span>
            {displayEmail && (
              <span className="text-[#1B2D45]/20 ml-auto" style={{ fontSize: "10px" }}>from account</span>
            )}
          </div>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-1.5 mt-3 text-[#4ADE80]" style={{ fontSize: "12px", fontWeight: 600 }}>
          <Check className="w-3.5 h-3.5" /> Contact info updated
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Dashboard
   ════════════════════════════════════════════════════════ */

export default function LandlordDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [properties, setProperties] = useState<PropertyWithListings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "landlord") {
      router.replace("/landlord/onboarding");
      return;
    }

    async function load() {
      try {
        // Fetch landlord profile
        const landlordRes = await fetch("http://localhost:8000/api/landlords/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("cribb_token")}` },
        });
        if (landlordRes.ok) {
          setProfile(await landlordRes.json());
        }

        // Fetch properties
        const propsRes = await fetch("http://localhost:8000/api/properties/me/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("cribb_token")}` },
        });
        if (!propsRes.ok) { setIsLoading(false); return; }
        const props: PropertyResponse[] = await propsRes.json();

        // Fetch listings for each property
        const enriched: PropertyWithListings[] = await Promise.all(
          props.map(async (prop) => {
            let listings: ListingResponse[] = [];
            let healthScore: number | null = null;
            let totalViews = 0;

            try {
              const allListings = await api.listings.browse({ skip: 0, limit: 100 });
              listings = allListings.filter((l) => l.property_id === prop.id).map((l) => ({
                id: l.id,
                property_id: l.property_id,
                rent_per_room: l.rent_per_room,
                rent_total: l.rent_total,
                lease_type: l.lease_type,
                move_in_date: l.move_in_date,
                is_sublet: l.is_sublet,
                sublet_start_date: l.sublet_start_date,
                sublet_end_date: l.sublet_end_date,
                gender_preference: l.gender_preference,
                status: l.status,
                view_count: l.view_count,
                created_at: l.created_at,
                updated_at: l.created_at,
              }));
              totalViews = listings.reduce((sum, l) => sum + l.view_count, 0);

              // Get Cribb Score for first active listing
              const activeListing = listings.find(l => l.status === "active");
              if (activeListing) {
                try {
                  const hs = await api.healthScores.get(activeListing.id);
                  healthScore = hs?.overall_score ?? null;
                } catch { /* not computed yet */ }
              }
            } catch { /* no listings */ }

            return { ...prop, listings, healthScore, totalViews };
          })
        );

        setProperties(enriched);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, router]);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20" />
          <div className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const totalListings = properties.reduce((sum, p) => sum + p.listings.length, 0);
  const activeListings = properties.reduce((sum, p) => sum + p.listings.filter(l => l.status === "active").length, 0);
  const totalViews = properties.reduce((sum, p) => sum + p.totalViews, 0);
  const avgScore = properties.filter(p => p.healthScore).length > 0
    ? Math.round(properties.filter(p => p.healthScore).reduce((sum, p) => sum + (p.healthScore || 0), 0) / properties.filter(p => p.healthScore).length)
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900 }}>
              Landlord Dashboard
            </h1>
            <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "14px" }}>
              Welcome back, {user.first_name}.{" "}
              {profile?.company_name && (
                <span className="text-[#1B2D45]/30">({profile.company_name})</span>
              )}
            </p>
          </div>
          <Link
            href="/landlord/properties/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors shrink-0"
            style={{ fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
          >
            <Plus className="w-4 h-4" />
            Add Property
          </Link>
        </div>

        {/* Verification Banner */}
        <div className="mb-6">
          <VerificationBanner profile={profile} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={<Building2 className="w-4 h-4 text-[#FF6B35]" />}
            label="Properties"
            value={properties.length}
          />
          <StatCard
            icon={<Home className="w-4 h-4 text-[#2EC4B6]" />}
            label="Active Listings"
            value={activeListings}
            sub={totalListings > activeListings ? `${totalListings} total` : undefined}
          />
          <StatCard
            icon={<Eye className="w-4 h-4 text-[#FFB627]" />}
            label="Total Views"
            value={totalViews}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-[#4ADE80]" />}
            label="Avg Cribb Score"
            value={avgScore ?? "—"}
            sub={avgScore ? (avgScore >= 85 ? "Great" : avgScore >= 65 ? "Good" : "Needs work") : "No scores yet"}
          />
        </div>

        {/* Properties */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Your Properties</h2>
          {properties.length > 0 && (
            <span className="text-[#1B2D45]/30" style={{ fontSize: "12px", fontWeight: 500 }}>{properties.length} propert{properties.length === 1 ? "y" : "ies"}</span>
          )}
        </div>

        {properties.length === 0 ? (
          <EmptyProperties />
        ) : (
          <div className="space-y-3">
            {properties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-8">
          <ContactInfoCard
            profile={profile}
            userEmail={user.email}
            onUpdate={async (data) => {
              const updated = await api.landlords.updateProfile(data);
              setProfile((prev) => prev ? { ...prev, ...updated } : prev);
            }}
          />
        </div>

        {/* Quick actions */}
        {properties.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-black/[0.04] p-5">
            <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "14px", fontWeight: 700 }}>Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Link href="/landlord/properties/new" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FF6B35]/[0.03] border border-transparent hover:border-[#FF6B35]/10 transition-all">
                <Plus className="w-4 h-4 text-[#FF6B35]" />
                <div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Add new property</div>
                  <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Register another address</div>
                </div>
              </Link>
              {!profile?.identity_verified && (
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFB627]/[0.03] border border-transparent hover:border-[#FFB627]/10 transition-all text-left">
                  <Shield className="w-4 h-4 text-[#FFB627]" />
                  <div>
                    <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Get verified</div>
                    <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Increase student trust</div>
                  </div>
                </button>
              )}
              <Link href="/browse" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#2EC4B6]/[0.03] border border-transparent hover:border-[#2EC4B6]/10 transition-all">
                <Eye className="w-4 h-4 text-[#2EC4B6]" />
                <div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>View as student</div>
                  <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>See how your listings appear</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}