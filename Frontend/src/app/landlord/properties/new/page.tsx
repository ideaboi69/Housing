"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { getLandlordClaimCode, setLandlordClaimCode, setLandlordClaimState } from "@/lib/landlord-claim";
import type { PetPolicy, SmokingPolicy } from "@/types";
import { PropertyType } from "@/types";
import { ArrowLeft, MapPin, Home, Check } from "lucide-react";

const propertyTypes = [
  { value: PropertyType.HOUSE, label: "House", emoji: "🏠" },
  { value: PropertyType.APARTMENT, label: "Apartment", emoji: "🏢" },
  { value: PropertyType.TOWNHOUSE, label: "Townhouse", emoji: "🏘️" },
  { value: PropertyType.ROOM, label: "Single Room", emoji: "🚪" },
];

const PET_POLICY_OPTIONS: { value: PetPolicy; label: string }[] = [
  { value: "allowed", label: "Allowed" },
  { value: "not_allowed", label: "Not allowed" },
  { value: "case_by_case", label: "Case by case" },
  { value: "unknown", label: "Not specified" },
];

const SMOKING_POLICY_OPTIONS: { value: SmokingPolicy; label: string }[] = [
  { value: "not_allowed", label: "Not allowed" },
  { value: "outside_only", label: "Outside only" },
  { value: "allowed", label: "Allowed" },
  { value: "unknown", label: "Not specified" },
];

function NewPropertyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [claimCode, setClaimCode] = useState("");

  const [form, setForm] = useState({
    title: "",
    address: "",
    postal_code: "",
    property_type: PropertyType.HOUSE,
    total_rooms: 1,
    bathrooms: 1,
    is_furnished: false,
    has_parking: false,
    has_laundry: false,
    utilities_included: false,
    has_wifi: false,
    has_air_conditioning: false,
    has_dishwasher: false,
    has_gym: false,
    has_elevator: false,
    has_backyard: false,
    has_balcony: false,
    wheelchair_accessible: false,
    pet_policy: "unknown" as PetPolicy,
    smoking_policy: "unknown" as SmokingPolicy,
    estimated_utility_cost: "",
    distance_to_campus_km: "",
    walk_time_minutes: "",
    drive_time_minutes: "",
    bus_time_minutes: "",
    nearest_bus_route: "",
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

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.address || !form.postal_code || !form.drive_time_minutes) {
      setError("Title, address, postal code, and drive time are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        title: form.title,
        address: form.address,
        postal_code: form.postal_code,
        property_type: form.property_type,
        total_rooms: form.total_rooms,
        bathrooms: form.bathrooms,
        is_furnished: form.is_furnished,
        has_parking: form.has_parking,
        has_laundry: form.has_laundry,
        utilities_included: form.utilities_included,
        has_wifi: form.has_wifi,
        has_air_conditioning: form.has_air_conditioning,
        has_dishwasher: form.has_dishwasher,
        has_gym: form.has_gym,
        has_elevator: form.has_elevator,
        has_backyard: form.has_backyard,
        has_balcony: form.has_balcony,
        wheelchair_accessible: form.wheelchair_accessible,
        pet_policy: form.pet_policy,
        smoking_policy: form.smoking_policy,
        estimated_utility_cost: form.estimated_utility_cost ? Number(form.estimated_utility_cost) : 0,
        distance_to_campus_km: form.distance_to_campus_km ? Number(form.distance_to_campus_km) : 0,
        walk_time_minutes: form.walk_time_minutes ? Number(form.walk_time_minutes) : 0,
        drive_time_minutes: Number(form.drive_time_minutes),
        bus_time_minutes: form.bus_time_minutes ? Number(form.bus_time_minutes) : 0,
        nearest_bus_route: form.nearest_bus_route || "",
      };

      const property = await api.properties.create(payload);
      if (claimCode) {
        setLandlordClaimCode(claimCode);
        setLandlordClaimState({
          claim_code: claimCode,
          status: "property_created",
          updated_at: new Date().toISOString(),
          property_id: property.id,
          property_title: property.title,
          property_address: property.address,
        });
      }
      const nextUrl = claimCode
        ? `/landlord/properties/${property.id}/listings/new?claim=${encodeURIComponent(claimCode)}`
        : `/landlord/properties/${property.id}/listings/new`;
      router.push(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property");
      setIsSubmitting(false);
    }
  }

  if (!user || user.role !== "landlord") {
    return null;
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

        <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>Add a Property</h1>
        <p className="text-[#1B2D45]/40 mt-1 mb-6" style={{ fontSize: "14px" }}>
          {claimCode
            ? "Add the property tied to the roommate-group verification request. You’ll create the matching listing in the next step."
            : "Enter your property details. You&apos;ll create a listing for it in the next step."}
        </p>

        {claimCode && (
          <div className="mb-6 rounded-xl border border-[#2EC4B6]/15 bg-[#2EC4B6]/[0.04] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-[#2EC4B6]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Claimed home setup</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#2EC4B6]/10 text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 700 }}>
                    Claim {claimCode}
                  </span>
                </div>
                <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  This property is being added as part of a roommate-group verification request. Use the exact home details that match the lease or ownership documents you submitted.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Home className="w-4 h-4 text-[#FF6B35]" /> Basic Info
            </h2>

            {claimCode && (
              <div className="rounded-xl bg-[#1B2D45]/[0.04] px-4 py-3">
                <p className="text-[#1B2D45]/55" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  After this, you&apos;ll create the listing that will eventually be connected to claim code <strong>{claimCode}</strong>.
                </p>
              </div>
            )}

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Property title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Cozy 4-Bedroom House Near Campus"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <MapPin className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="e.g. 78 College Ave W, Guelph, ON"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Postal code</label>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => update("postal_code", e.target.value)}
                placeholder="e.g. N1G 2W1"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            {/* Property type selection */}
            <div>
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>Property type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {propertyTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update("property_type", t.value)}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      form.property_type === t.value
                        ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06]"
                        : "border-black/[0.06] hover:border-[#FF6B35]/15"
                    }`}
                  >
                    <span style={{ fontSize: "20px" }}>{t.emoji}</span>
                    <div
                      className={form.property_type === t.value ? "text-[#FF6B35]" : "text-[#1B2D45]/60"}
                      style={{ fontSize: "12px", fontWeight: 600, marginTop: "4px" }}
                    >
                      {t.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Bedrooms</label>
                <select
                  value={form.total_rooms}
                  onChange={(e) => update("total_rooms", Number(e.target.value))}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all appearance-none"
                  style={{ fontSize: "14px" }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Bathrooms</label>
                <select
                  value={form.bathrooms}
                  onChange={(e) => update("bathrooms", Number(e.target.value))}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all appearance-none"
                  style={{ fontSize: "14px" }}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Amenities</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "is_furnished" as const, label: "Furnished", emoji: "🛋️" },
                { key: "has_parking" as const, label: "Parking", emoji: "🅿️" },
                { key: "has_laundry" as const, label: "In-unit Laundry", emoji: "🧺" },
                { key: "utilities_included" as const, label: "Utilities Included", emoji: "💡" },
                { key: "has_wifi" as const, label: "WiFi Included", emoji: "📶" },
                { key: "has_air_conditioning" as const, label: "Air Conditioning", emoji: "❄️" },
                { key: "has_dishwasher" as const, label: "Dishwasher", emoji: "🍽️" },
                { key: "has_gym" as const, label: "Gym", emoji: "🏋️" },
                { key: "has_elevator" as const, label: "Elevator", emoji: "🛗" },
                { key: "has_backyard" as const, label: "Backyard", emoji: "🌿" },
                { key: "has_balcony" as const, label: "Balcony", emoji: "☀️" },
                { key: "wheelchair_accessible" as const, label: "Accessible", emoji: "♿" },
              ].map((amenity) => (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => update(amenity.key, !form[amenity.key])}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    form[amenity.key]
                      ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06]"
                      : "border-black/[0.06] hover:border-[#FF6B35]/15"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    form[amenity.key] ? "bg-[#FF6B35] border-[#FF6B35]" : "border-[#1B2D45]/20"
                  }`}>
                    {form[amenity.key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span style={{ fontSize: "13px" }}>{amenity.emoji}</span>
                  <span
                    className={form[amenity.key] ? "text-[#FF6B35]" : "text-[#1B2D45]/60"}
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    {amenity.label}
                  </span>
                </button>
              ))}
            </div>

            {form.utilities_included === false && (
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Estimated monthly utilities</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "14px" }}>$</span>
                  <input
                    type="number"
                    value={form.estimated_utility_cost}
                    onChange={(e) => update("estimated_utility_cost", e.target.value)}
                    placeholder="150"
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>Pets</label>
                <div className="grid grid-cols-2 gap-2">
                  {PET_POLICY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update("pet_policy", option.value)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                        form.pet_policy === option.value
                          ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                          : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/15"
                      }`}
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>Smoking</label>
                <div className="grid grid-cols-2 gap-2">
                  {SMOKING_POLICY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update("smoking_policy", option.value)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                        form.smoking_policy === option.value
                          ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                          : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/15"
                      }`}
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Transit */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Getting to Campus</h2>
            <p className="text-[#1B2D45]/30" style={{ fontSize: "12px" }}>
              Helps students compare commute times. Drive time is required by the current backend; others can be left blank.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Distance to campus (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.distance_to_campus_km}
                  onChange={(e) => update("distance_to_campus_km", e.target.value)}
                  placeholder="1.2"
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Walk time (minutes)</label>
                <input
                  type="number"
                  value={form.walk_time_minutes}
                  onChange={(e) => update("walk_time_minutes", e.target.value)}
                  placeholder="15"
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Bus time (minutes)</label>
                <input
                  type="number"
                  value={form.bus_time_minutes}
                  onChange={(e) => update("bus_time_minutes", e.target.value)}
                  placeholder="8"
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Drive time (minutes)</label>
                <input
                  type="number"
                  value={form.drive_time_minutes}
                  onChange={(e) => update("drive_time_minutes", e.target.value)}
                  placeholder="5"
                  required
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Nearest bus route</label>
                <input
                  type="text"
                  value={form.nearest_bus_route}
                  onChange={(e) => update("nearest_bus_route", e.target.value)}
                  placeholder="e.g. Route 99"
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
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
              className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            >
              {isSubmitting ? "Creating..." : claimCode ? "Create Claimed Property →" : "Create Property & Add Listing →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPropertyPage() {
  return (
    <Suspense fallback={null}>
      <NewPropertyPageContent />
    </Suspense>
  );
}
