"use client";

import { Suspense, useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { getLandlordClaimCode, setLandlordClaimCode, setLandlordClaimState } from "@/lib/landlord-claim";
import { LeaseType, GenderPreference } from "@/types";
import type { PropertyResponse } from "@/types";
import { ArrowLeft, DollarSign, Calendar, Users, Check, Home, Loader2 } from "lucide-react";

const leaseTypes = [
  { value: LeaseType.EIGHT_MONTH, label: "8-month", desc: "Sep – Apr", emoji: "📚" },
  { value: LeaseType.TEN_MONTH, label: "10-month", desc: "Sep – Jun", emoji: "📅" },
  { value: LeaseType.TWELVE_MONTH, label: "12-month", desc: "Full year", emoji: "🏠" },
  { value: LeaseType.FLEXIBLE, label: "Flexible", desc: "Custom dates", emoji: "🔄" },
];

function NewListingPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const propertyId = Number(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [claimCode, setClaimCode] = useState("");

  const [form, setForm] = useState({
    rent_per_room: "",
    rent_total: "",
    lease_type: LeaseType.TWELVE_MONTH,
    move_in_date: "",
    is_sublet: false,
    sublet_start_date: "",
    sublet_end_date: "",
    gender_preference: GenderPreference.ANY,
  });

  useEffect(() => {
    const queryClaim = searchParams.get("claim")?.trim() ?? "";
    if (queryClaim) {
      setClaimCode(queryClaim);
      setLandlordClaimCode(queryClaim);
      return;
    }

    setClaimCode(getLandlordClaimCode());
  }, [searchParams]);

  useEffect(() => {
    async function loadProperty() {
      try {
        const prop = await api.properties.getById(propertyId);
        setProperty(prop);
      } catch {
        setError("Property not found");
      } finally {
        setLoadingProperty(false);
      }
    }
    loadProperty();
  }, [propertyId]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Auto-calculate total rent
  function updateRentPerRoom(val: string) {
    setForm((prev) => ({
      ...prev,
      rent_per_room: val,
      rent_total: val && property ? String(Number(val) * property.total_rooms) : prev.rent_total,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rent_per_room || !form.move_in_date) {
      setError("Rent and move-in date are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        property_id: propertyId,
        rent_per_room: Number(form.rent_per_room),
        rent_total: Number(form.rent_total || form.rent_per_room),
        lease_type: form.lease_type,
        move_in_date: form.move_in_date,
        is_sublet: form.is_sublet,
        sublet_start_date: form.is_sublet && form.sublet_start_date ? form.sublet_start_date : undefined,
        sublet_end_date: form.is_sublet && form.sublet_end_date ? form.sublet_end_date : undefined,
        gender_preference: form.gender_preference !== GenderPreference.ANY ? form.gender_preference : undefined,
      };

      const createdListing = await api.listings.create(payload);
      if (claimCode) {
        setLandlordClaimCode(claimCode);
        setLandlordClaimState({
          claim_code: claimCode,
          status: "listing_created",
          updated_at: new Date().toISOString(),
          property_id: propertyId,
          property_title: property?.title,
          property_address: property?.address,
          listing_id: createdListing.id,
          listing_rent_per_room: createdListing.rent_per_room,
        });
      }

      // Compute Cribb Score
      try {
        const allListings = await api.listings.browse({ skip: 0, limit: 100 });
        const newListing = allListings.find(l => l.property_id === propertyId);
        if (newListing) {
          await api.healthScores.compute(newListing.id);
        }
      } catch { /* score computation is optional */ }

      router.push("/landlord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      setIsSubmitting(false);
    }
  }

  if (!user || user.role !== "landlord") return null;

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[640px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link
          href="/landlord"
          className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>Create a Listing</h1>
        {property && (
          <div className="flex items-center gap-2 mt-1 mb-6">
            <Home className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span className="text-[#FF6B35]" style={{ fontSize: "13px", fontWeight: 600 }}>{property.title}</span>
            <span className="text-[#1B2D45]/30" style={{ fontSize: "13px" }}>— {property.address}</span>
          </div>
        )}

        {claimCode && (
          <div className="mb-6 rounded-xl border border-[#2EC4B6]/15 bg-[#2EC4B6]/[0.04] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-[#2EC4B6]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Claimed home listing setup</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#2EC4B6]/10 text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 700 }}>
                    Claim {claimCode}
                  </span>
                </div>
                <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  This listing is being created as part of a roommate-group property verification flow. Use the real rent, lease, and availability details for the claimed home.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <DollarSign className="w-4 h-4 text-[#FF6B35]" /> Pricing
            </h2>

            {claimCode && (
              <div className="rounded-xl bg-[#1B2D45]/[0.04] px-4 py-3">
                <p className="text-[#1B2D45]/55" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  Once this listing is published, the dashboard can continue the claimed-home verification flow tied to <strong>{claimCode}</strong>.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Rent per room / month</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "14px" }}>$</span>
                  <input
                    type="number"
                    value={form.rent_per_room}
                    onChange={(e) => updateRentPerRoom(e.target.value)}
                    placeholder="650"
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Total rent / month</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "14px" }}>$</span>
                  <input
                    type="number"
                    value={form.rent_total}
                    onChange={(e) => update("rent_total", e.target.value)}
                    placeholder="2600"
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
                {property && form.rent_per_room && (
                  <div className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "11px" }}>
                    Auto-calculated: ${Number(form.rent_per_room) * property.total_rooms} for {property.total_rooms} rooms
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lease Details */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Calendar className="w-4 h-4 text-[#FF6B35]" /> Lease Details
            </h2>

            <div>
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>Lease type</label>
              <div className="grid grid-cols-2 gap-2">
                {leaseTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update("lease_type", t.value)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      form.lease_type === t.value
                        ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06]"
                        : "border-black/[0.06] hover:border-[#FF6B35]/15"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "16px" }}>{t.emoji}</span>
                      <span className={form.lease_type === t.value ? "text-[#FF6B35]" : "text-[#1B2D45]"} style={{ fontSize: "13px", fontWeight: 600 }}>{t.label}</span>
                    </div>
                    <div className="text-[#1B2D45]/30 mt-0.5 ml-7" style={{ fontSize: "11px" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Move-in date</label>
              <input
                type="date"
                value={form.move_in_date}
                onChange={(e) => update("move_in_date", e.target.value)}
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>
          </div>

          {/* Sublet toggle */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>☀️ Summer Sublet?</h2>
                <p className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "12px" }}>Mark this as a sublet listing on the sublet marketplace</p>
              </div>
              <button
                type="button"
                onClick={() => update("is_sublet", !form.is_sublet)}
                className={`w-12 h-7 rounded-full transition-all ${form.is_sublet ? "bg-[#FF6B35]" : "bg-[#1B2D45]/10"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.is_sublet ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {form.is_sublet && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/[0.04]">
                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Sublet start</label>
                  <input
                    type="date"
                    value={form.sublet_start_date}
                    onChange={(e) => update("sublet_start_date", e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Sublet end</label>
                  <input
                    type="date"
                    value={form.sublet_end_date}
                    onChange={(e) => update("sublet_end_date", e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gender preference */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-3">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Users className="w-4 h-4 text-[#FF6B35]" /> Tenant Preference
            </h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: GenderPreference.ANY, label: "Any" },
                { value: GenderPreference.MALE, label: "Male" },
                { value: GenderPreference.FEMALE, label: "Female" },
                { value: GenderPreference.OTHER, label: "Other" },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => update("gender_preference", g.value)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    form.gender_preference === g.value
                      ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                      : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#FF6B35]/15"
                  }`}
                  style={{ fontSize: "13px", fontWeight: form.gender_preference === g.value ? 600 : 500 }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-[#E71D36]/10 text-[#E71D36] px-4 py-3 rounded-xl" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/landlord"
              className="px-6 py-3 rounded-xl border border-black/[0.08] text-[#1B2D45]/60 hover:bg-black/[0.02] transition-all"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                claimCode ? "Publish Claimed Listing →" : "Publish Listing →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <NewListingPageContent params={params} />
    </Suspense>
  );
}
