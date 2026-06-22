"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, Home, Sparkles, MapPin, Check, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { PropertyType } from "@/types";
import type { PetPolicy, SmokingPolicy } from "@/types";
import type { PropertyResponse, PropertyImageResponse } from "@/types";
import { PropertyImageManager } from "@/components/landlord/PropertyImageManager";

const PET_POLICIES: PetPolicy[] = ["allowed", "not_allowed", "case_by_case", "unknown"];
const SMOKING_POLICIES: SmokingPolicy[] = ["allowed", "not_allowed", "outside_only", "unknown"];

type Tab = "basics" | "amenities" | "location" | "photos";

interface EditPropertyModalProps {
  property: PropertyResponse;
  onClose: () => void;
  onSaved: (updated: PropertyResponse) => void;
  initialTab?: Tab;
}

export function EditPropertyModal({ property, onClose, onSaved, initialTab = "basics" }: EditPropertyModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<PropertyImageResponse[]>(property.images ?? []);

  // Basics
  const [title, setTitle] = useState(property.title);
  const [propertyType, setPropertyType] = useState<PropertyType>(property.property_type as PropertyType);
  const [totalRooms, setTotalRooms] = useState(String(property.total_rooms));
  const [bathrooms, setBathrooms] = useState(String(property.bathrooms));

  // Amenities
  const [isFurnished, setIsFurnished] = useState(property.is_furnished);
  const [hasParking, setHasParking] = useState(property.has_parking);
  const [hasLaundry, setHasLaundry] = useState(property.has_laundry);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(property.utilities_included);
  const [hasWifi, setHasWifi] = useState(property.has_wifi || false);
  const [hasAirConditioning, setHasAirConditioning] = useState(property.has_air_conditioning || false);
  const [hasDishwasher, setHasDishwasher] = useState(property.has_dishwasher || false);
  const [hasGym, setHasGym] = useState(property.has_gym || false);
  const [hasElevator, setHasElevator] = useState(property.has_elevator || false);
  const [hasBackyard, setHasBackyard] = useState(property.has_backyard || false);
  const [hasBalcony, setHasBalcony] = useState(property.has_balcony || false);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(property.wheelchair_accessible || false);
  const [petPolicy, setPetPolicy] = useState<PetPolicy>((property.pet_policy as PetPolicy) || "unknown");
const [smokingPolicy, setSmokingPolicy] = useState<SmokingPolicy>((property.smoking_policy as SmokingPolicy) || "unknown");
  const [estimatedUtilityCost, setEstimatedUtilityCost] = useState(
    property.estimated_utility_cost ? String(property.estimated_utility_cost) : ""
  );

  // Location
  const [address, setAddress] = useState(property.address);
  const [postalCode, setPostalCode] = useState(property.postal_code || "");
  const [distanceToCampus, setDistanceToCampus] = useState(
    property.distance_to_campus_km ? String(property.distance_to_campus_km) : ""
  );
  const [walkTime, setWalkTime] = useState(String(property.walk_time_minutes || 0));
  const [busTime, setBusTime] = useState(String(property.bus_time_minutes || 0));
  const [driveTime, setDriveTime] = useState(String(property.drive_time_minutes || 0));
  const [nearestBusRoute, setNearestBusRoute] = useState(property.nearest_bus_route || "");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await api.properties.update(property.id, {
        title: title.trim(),
        property_type: propertyType,
        total_rooms: Number(totalRooms),
        bathrooms: Number(bathrooms),
        is_furnished: isFurnished,
        has_parking: hasParking,
        has_laundry: hasLaundry,
        utilities_included: utilitiesIncluded,
        has_wifi: hasWifi,
        has_air_conditioning: hasAirConditioning,
        has_dishwasher: hasDishwasher,
        has_gym: hasGym,
        has_elevator: hasElevator,
        has_backyard: hasBackyard,
        has_balcony: hasBalcony,
        wheelchair_accessible: wheelchairAccessible,
        pet_policy: petPolicy,
        smoking_policy: smokingPolicy,
        estimated_utility_cost: estimatedUtilityCost ? Number(estimatedUtilityCost) : undefined,
        address: address.trim(),
        postal_code: postalCode.trim(),
        distance_to_campus_km: distanceToCampus ? Number(distanceToCampus) : undefined,
        walk_time_minutes: Number(walkTime),
        bus_time_minutes: Number(busTime),
        drive_time_minutes: Number(driveTime),
        nearest_bus_route: nearestBusRoute.trim() || undefined,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || "Failed to save changes");
      else setError("Failed to save changes");
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "basics", label: "Basics", icon: <Home className="w-3.5 h-3.5" /> },
    { id: "amenities", label: "Amenities", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "location", label: "Location", icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: "photos", label: "Photos", icon: <ImageIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: "560px", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/[0.05]">
          <div>
            <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Edit property</h3>
            <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "11px" }}>{property.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#1B2D45]/40" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                tab === t.id ? "bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "text-[#1B2D45]/45 hover:bg-black/[0.03]"
              }`}
              style={{ fontSize: "12px", fontWeight: tab === t.id ? 700 : 500 }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "basics" && (
            <div className="space-y-4">
              <Field label="Listing title">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "13px" }}
                />
              </Field>

              <Field label="Property type">
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PropertyType).map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setPropertyType(pt)}
                      className={`px-3 py-2 rounded-lg border text-left transition-all ${
                        propertyType === pt ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/15"
                      }`}
                      style={{ fontSize: "12px", fontWeight: propertyType === pt ? 600 : 500, textTransform: "capitalize" }}
                    >
                      {pt.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Total rooms">
                  <input
                    type="number"
                    min={1}
                    value={totalRooms}
                    onChange={(e) => setTotalRooms(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "13px" }}
                  />
                  <p className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "10px" }}>
                    Can&apos;t change while active/rented listings exist
                  </p>
                </Field>
                <Field label="Bathrooms">
                  <input
                    type="number"
                    min={1}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "13px" }}
                  />
                </Field>
              </div>
            </div>
          )}

          {tab === "amenities" && (
            <div className="space-y-4">
              <Field label="What's included">
                <div className="grid grid-cols-2 gap-2">
                  <ToggleChip on={isFurnished} setOn={setIsFurnished} label="Furnished" />
                  <ToggleChip on={hasParking} setOn={setHasParking} label="Parking" />
                  <ToggleChip on={hasLaundry} setOn={setHasLaundry} label="In-unit laundry" />
                  <ToggleChip on={utilitiesIncluded} setOn={setUtilitiesIncluded} label="Utilities included" />
                  <ToggleChip on={hasWifi} setOn={setHasWifi} label="WiFi" />
                  <ToggleChip on={hasAirConditioning} setOn={setHasAirConditioning} label="A/C" />
                  <ToggleChip on={hasDishwasher} setOn={setHasDishwasher} label="Dishwasher" />
                  <ToggleChip on={hasGym} setOn={setHasGym} label="Gym" />
                  <ToggleChip on={hasElevator} setOn={setHasElevator} label="Elevator" />
                  <ToggleChip on={hasBackyard} setOn={setHasBackyard} label="Backyard" />
                  <ToggleChip on={hasBalcony} setOn={setHasBalcony} label="Balcony" />
                  <ToggleChip on={wheelchairAccessible} setOn={setWheelchairAccessible} label="Wheelchair accessible" />
                </div>
              </Field>

              <Field label="Pet policy">
                <div className="grid grid-cols-3 gap-2">
                  {PET_POLICIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPetPolicy(p)}
                      className={`px-3 py-2 rounded-lg border text-left transition-all ${
                        petPolicy === p ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/15"
                      }`}
                      style={{ fontSize: "11px", fontWeight: petPolicy === p ? 600 : 500, textTransform: "capitalize" }}
                    >
                      {p.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Smoking policy">
                <div className="grid grid-cols-3 gap-2">
                  {SMOKING_POLICIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSmokingPolicy(p)}
                      className={`px-3 py-2 rounded-lg border text-left transition-all ${
                        smokingPolicy === p ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/15"
                      }`}
                      style={{ fontSize: "11px", fontWeight: smokingPolicy === p ? 600 : 500, textTransform: "capitalize" }}
                    >
                      {p.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Estimated utility cost ($/mo)">
                <input
                  type="number"
                  min={0}
                  value={estimatedUtilityCost}
                  onChange={(e) => setEstimatedUtilityCost(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "13px" }}
                />
              </Field>
            </div>
          )}

          {tab === "location" && (
            <div className="space-y-4">
              <Field label="Address">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "13px" }}
                />
                <p className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "10px" }}>
                  Map coordinates re-geocode automatically.
                </p>
              </Field>

              <Field label="Postal code">
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                  placeholder="N1G 2W1"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "13px" }}
                />
              </Field>

              <Field label="Distance to campus (km)">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={distanceToCampus}
                  onChange={(e) => setDistanceToCampus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "13px" }}
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Walk (min)">
                  <input
                    type="number"
                    min={0}
                    value={walkTime}
                    onChange={(e) => setWalkTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "13px" }}
                  />
                </Field>
                <Field label="Bus (min)">
                  <input
                    type="number"
                    min={0}
                    value={busTime}
                    onChange={(e) => setBusTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "13px" }}
                  />
                </Field>
                <Field label="Drive (min)">
                  <input
                    type="number"
                    min={0}
                    value={driveTime}
                    onChange={(e) => setDriveTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "13px" }}
                  />
                </Field>
              </div>

              <Field label="Nearest bus route">
                <input
                  type="text"
                  value={nearestBusRoute}
                  onChange={(e) => setNearestBusRoute(e.target.value)}
                  placeholder="e.g. Route 12"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "13px" }}
                />
              </Field>
            </div>
          )}

          {tab === "photos" && (
            <Field label="Property photos">
              <PropertyImageManager
                propertyId={property.id}
                initialImages={images}
                onChanged={(next) => {
                  // Photos persist immediately on the server. Keep both the modal and
                  // the parent property in sync so changes survive even if the landlord
                  // closes without clicking "Save changes".
                  setImages(next);
                  onSaved({ ...property, images: next });
                }}
              />
            </Field>
          )}
        </div>

        {/* Error + Footer */}
        {error && (
          <div className="px-5 pt-3">
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#E71D36]/[0.06] text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 600 }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-black/[0.05]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[#1B2D45]/55 hover:bg-black/[0.03] transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
            style={{ fontSize: "13px", fontWeight: 700 }}
          >
            {saving ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>) : (<><Check className="w-3.5 h-3.5" /> Save changes</>)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[#1B2D45]/55 block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleChip({ on, setOn, label }: { on: boolean; setOn: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className={`px-3 py-2 rounded-lg border text-left transition-all ${
        on ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/55 hover:border-[#FF6B35]/15"
      }`}
      style={{ fontSize: "12px", fontWeight: on ? 600 : 500 }}
    >
      {on ? "✓ " : ""}{label}
    </button>
  );
}