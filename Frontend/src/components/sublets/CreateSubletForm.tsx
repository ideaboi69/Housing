"use client";

import { useCallback, useState } from "react";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useIsMobile } from "@/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { GenderPreference, PetPolicy, SmokingPolicy } from "@/types";
import { MONTHS, type SubletListing } from "@/components/sublets/sublet-data";

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

const INITIAL_SUBLET_FORM = {
  title: "",
  address: "",
  postal_code: "",
  description: "",
  rent_per_month: "",
  estimated_utility_cost: "",
  sublet_start_date: "",
  sublet_end_date: "",
  move_in_date: "",
  room_type: "private" as "private" | "shared",
  total_rooms: "1",
  bathrooms: "1",
  beds_available: "1",
  distance_to_campus_km: "",
  walk_time_minutes: "",
  drive_time_minutes: "",
  bus_time_minutes: "",
  nearest_bus_route: "",
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
  gender_preference: "any" as "any" | "male" | "female" | "other",
};

export function CreateSubletForm({
  selectedRange,
  onCreated,
  onClose,
  redirectAfterCreate = true,
}: {
  selectedRange: [number, number];
  onCreated?: (listing: SubletListing) => void;
  onClose?: () => void;
  redirectAfterCreate?: boolean;
}) {
  const isMobile = useIsMobile();
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState(INITIAL_SUBLET_FORM);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const roommatesStaying = Math.max(0, Number(form.total_rooms) - Number(form.beds_available));

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45] placeholder:text-[#1B2D45]/30 focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";
  const labelClass = "text-[#1B2D45] block mb-1.5";
  const labelStyle = { fontSize: "12px" as const, fontWeight: 600 as const };

  const amenities = [
    { key: "is_furnished" as const, label: "Furnished", emoji: "🛋️" },
    { key: "utilities_included" as const, label: "Utilities Incl.", emoji: "💡" },
    { key: "has_parking" as const, label: "Parking", emoji: "🅿️" },
    { key: "has_laundry" as const, label: "Laundry", emoji: "🧺" },
    { key: "has_wifi" as const, label: "WiFi Included", emoji: "📶" },
    { key: "has_air_conditioning" as const, label: "A/C", emoji: "❄️" },
    { key: "has_dishwasher" as const, label: "Dishwasher", emoji: "🍽️" },
    { key: "has_gym" as const, label: "Gym", emoji: "🏋️" },
    { key: "has_elevator" as const, label: "Elevator", emoji: "🛗" },
    { key: "has_backyard" as const, label: "Backyard", emoji: "🌿" },
    { key: "has_balcony" as const, label: "Balcony", emoji: "☀️" },
    { key: "wheelchair_accessible" as const, label: "Accessible", emoji: "♿" },
  ];

  const steps = [
    {
      number: 1,
      eyebrow: "Step 1",
      title: "Basics",
      detail: "Title, address, description, and the core pricing window.",
    },
    {
      number: 2,
      eyebrow: "Step 2",
      title: "Dates and setup",
      detail: "Availability, room setup, and who the sublet is best for.",
    },
    {
      number: 3,
      eyebrow: "Step 3",
      title: "Commute and amenities",
      detail: "Getting to campus, wifi, laundry, pets, and house rules.",
    },
    {
      number: 4,
      eyebrow: "Step 4",
      title: "Photos and publish",
      detail: "Add images, review everything, and post it live.",
    },
  ] as const;

  const canGoNext = () => {
    if (step === 1) {
      return Boolean(form.title.trim() && form.address.trim() && form.postal_code.trim() && form.rent_per_month);
    }
    if (step === 2) {
      return Boolean(form.sublet_start_date && form.sublet_end_date && form.move_in_date && form.total_rooms && form.bathrooms);
    }
    if (step === 3) {
      return Boolean(
        form.distance_to_campus_km &&
        form.walk_time_minutes &&
        form.drive_time_minutes &&
        form.bus_time_minutes &&
        form.nearest_bus_route.trim()
      );
    }
    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (user?.role === "landlord") {
      toast.error("Landlord accounts can't post student sublets.");
      return;
    }

    if (!token) {
      toast.info("Please sign in to post a sublet.");
      router.push("/login?next=/sublets/create");
      return;
    }

    const requiredTextFields = [
      form.title.trim(),
      form.address.trim(),
      form.postal_code.trim(),
      form.sublet_start_date,
      form.sublet_end_date,
      form.move_in_date,
      form.nearest_bus_route.trim(),
    ];
    if (requiredTextFields.some((v) => !v)) {
      toast.error("Please fill in the required fields.");
      return;
    }

    const rent = Number(form.rent_per_month);
    const distance = Number(form.distance_to_campus_km);
    const walk = Number(form.walk_time_minutes);
    const drive = Number(form.drive_time_minutes);
    const bus = Number(form.bus_time_minutes);
    const rooms = Number(form.total_rooms);
    const baths = Number(form.bathrooms);
    const utilityCost = Number(form.estimated_utility_cost || 0);
    const bedsAvailable = Number(form.beds_available);

    if ([rent, distance, walk, drive, bus, rooms, baths, bedsAvailable].some((n) => Number.isNaN(n))) {
      toast.error("Please make sure all required numbers are filled in.");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Posting your sublet...");

    try {
      const response = await api.sublets.create({
        title: form.title.trim(),
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
        latitude: null,
        longitude: null,
        distance_to_campus_km: distance,
        walk_time_minutes: walk,
        drive_time_minutes: drive,
        bus_time_minutes: bus,
        nearest_bus_route: form.nearest_bus_route.trim(),
        room_type: form.room_type,
        total_rooms: rooms,
        bathrooms: baths,
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
        estimated_utility_cost: utilityCost,
        rent_per_month: rent,
        sublet_start_date: form.sublet_start_date,
        sublet_end_date: form.sublet_end_date,
        move_in_date: form.move_in_date,
        gender_preference: form.gender_preference === "any" ? null : (form.gender_preference as GenderPreference),
        description: form.description.trim() || null,
      });

      let coverImage = "/demo/listings/house.jpg";
      if (photos.length > 0) {
        try {
          const uploaded = await api.sublets.uploadImages(response.id, photos);
          if (uploaded.length > 0) {
            coverImage = uploaded[0].image_url;
          }
        } catch {
          coverImage = URL.createObjectURL(photos[0]);
        }
      }

      const availableMonths = MONTHS.map((_, i) => i >= selectedRange[0] && i <= selectedRange[1]);
      const flexibleDates = (selectedRange[1] - selectedRange[0]) >= 2;
      const scoreBase = 72
        + (distance <= 0.7 ? 12 : distance <= 1.5 ? 7 : 2)
        + (form.is_furnished ? 4 : 0)
        + (form.utilities_included ? 3 : 0)
        + (form.has_laundry ? 2 : 0)
        + (form.has_parking ? 1 : 0);
      const healthScore = Math.min(96, scoreBase);
      const roommates = Math.max(0, rooms - bedsAvailable);

      const createdListing: SubletListing = {
        id: String(response.id),
        title: response.title,
        street: response.address.split(",")[0],
        coverImage,
        subletPrice: rent,
        originalPrice: Math.round(rent * 1.22),
        healthScore,
        verified: true,
        posterType: user?.role === "landlord" ? "Landlord" : "Student poster",
        posterIsStudent: user?.role !== "landlord",
        availableMonths,
        neighborhood: distance <= 0.7 ? "Campus" : distance <= 1.5 ? "Near Campus" : "Guelph",
        furnished: form.is_furnished,
        negotiablePrice: form.utilities_included,
        flexibleDates,
        roommatesStaying: roommates > 0 ? roommates : null,
        roommateDesc: roommates > 0 ? `${roommates} roommate${roommates > 1 ? "s" : ""} staying` : null,
        bedsAvailable,
        bedsTotal: rooms,
        distance: `${distance.toFixed(1)} km`,
        walkTime: `${walk} min`,
        amenities: [
          form.is_furnished ? "Furnished" : null,
          form.utilities_included ? "Utilities Incl." : null,
          form.has_parking ? "Parking" : null,
          form.has_laundry ? "Laundry" : null,
          form.has_wifi ? "WiFi" : null,
          form.pet_policy === "allowed" ? "Pets Allowed" : form.pet_policy === "case_by_case" ? "Pets Case-by-case" : null,
        ].filter(Boolean) as string[],
        views: 0,
        saves: 0,
        rotation: response.id % 2 === 0 ? 1.2 : -1.2,
      };

      onCreated?.(createdListing);
      setForm(INITIAL_SUBLET_FORM);
      setPhotos([]);
      onClose?.();
      toast.success("Your sublet is live.");

      if (redirectAfterCreate) {
        router.push(`/sublets?created=${response.id}`);
      }
    } catch (error) {
      console.error("Failed to create sublet", error);
      toast.error("We couldn’t post your sublet. Please try again.");
    } finally {
      toast.dismiss(loadingToast);
      setSubmitting(false);
    }
  }, [form, onClose, onCreated, photos, redirectAfterCreate, router, selectedRange, submitting, token, user]);

  return (
    <div
      className="bg-white rounded-2xl border border-[#FF6B35]/20 p-5 md:p-7"
      style={{ boxShadow: "0 4px 24px rgba(255,107,53,0.06)" }}
    >
      <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>List your sublet ☀️</h3>
      <p className="text-[#1B2D45]/50 mt-1 mb-5" style={{ fontSize: "13px", fontWeight: 400 }}>
        Leaving Guelph for the summer? Every field here shows up on your listing — the more you fill, the better.
      </p>

      <div className="mb-5 grid gap-2 md:grid-cols-4">
        {steps.map((item) => {
          const active = item.number === step;
          const complete = item.number < step;
          return (
            <button
              key={item.number}
              type="button"
              onClick={() => setStep(item.number)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                active
                  ? "border-[#FF6B35]/25 bg-[#FF6B35]/[0.06]"
                  : complete
                    ? "border-[#2EC4B6]/20 bg-[#2EC4B6]/[0.05]"
                    : "border-black/[0.06] hover:border-[#FF6B35]/15"
              }`}
            >
              <div className={`${active ? "text-[#FF6B35]" : complete ? "text-[#2EC4B6]" : "text-[#1B2D45]/30"}`} style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em" }}>
                {item.eyebrow}
              </div>
              <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>{item.title}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-black/[0.05] bg-[#FAF8F4] px-4 py-3 mb-5">
        <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em" }}>
          {steps[step - 1].eyebrow}
        </div>
        <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "17px", fontWeight: 850 }}>
          {steps[step - 1].title}
        </div>
        <p className="mt-1 text-[#1B2D45]/55" style={{ fontSize: "12px", lineHeight: 1.6 }}>
          {steps[step - 1].detail}
        </p>
      </div>

      {step === 1 && (
        <>
          <div className="border-t border-black/[0.04] pt-5 mb-5">
            <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>LISTING INFO</div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <div className={isMobile ? "" : "col-span-2"}>
                <label className={labelClass} style={labelStyle}>Title *</label>
                <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Furnished Room in 4BR House" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Address *</label>
                <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. 78 College Ave W, Guelph" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Postal code *</label>
                <input type="text" value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} placeholder="e.g. N1G 2W1" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div className={isMobile ? "" : "col-span-2"}>
                <label className={labelClass} style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Anything else students should know — vibe, move-in flexibility, etc." rows={3} className={`${inputClass} resize-none`} style={{ fontSize: "13px" }} />
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.04] pt-5 mb-5">
            <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>PRICING</div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className={labelClass} style={labelStyle}>Monthly sublet rent *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                  <input type="number" value={form.rent_per_month} onChange={(e) => update("rent_per_month", e.target.value)} placeholder="550" className={`${inputClass} pl-7`} style={{ fontSize: "13px" }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Est. monthly utilities</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>$</span>
                  <input type="number" value={form.estimated_utility_cost} onChange={(e) => update("estimated_utility_cost", e.target.value)} placeholder="150" className={`${inputClass} pl-7`} style={{ fontSize: "13px" }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="border-t border-black/[0.04] pt-5 mb-5">
            <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>AVAILABILITY</div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              <div>
                <label className={labelClass} style={labelStyle}>Sublet start date *</label>
                <input type="date" value={form.sublet_start_date} onChange={(e) => update("sublet_start_date", e.target.value)} className={`${inputClass} bg-white`} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Sublet end date *</label>
                <input type="date" value={form.sublet_end_date} onChange={(e) => update("sublet_end_date", e.target.value)} className={`${inputClass} bg-white`} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Move-in date *</label>
                <input type="date" value={form.move_in_date} onChange={(e) => update("move_in_date", e.target.value)} className={`${inputClass} bg-white`} style={{ fontSize: "13px" }} />
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.04] pt-5 mb-5">
            <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>ROOM DETAILS</div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className={labelClass} style={labelStyle}>Room type *</label>
                <div className="flex gap-2">
                  {(["private", "shared"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => update("room_type", t)} className={`flex-1 py-2.5 rounded-xl border transition-all text-center ${form.room_type === t ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"}`} style={{ fontSize: "13px", fontWeight: form.room_type === t ? 600 : 500 }}>
                      {t === "private" ? "🚪 Private Room" : "🛏️ Shared Room"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Total rooms *</label>
                  <select value={form.total_rooms} onChange={(e) => update("total_rooms", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["1", "2", "3", "4", "5", "6"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Bathrooms *</label>
                  <select value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                    {["1", "2", "3", "4"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className={`grid gap-4 mt-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className={labelClass} style={labelStyle}>Beds you&apos;re subletting *</label>
                <select value={form.beds_available} onChange={(e) => update("beds_available", e.target.value)} className={`${inputClass} appearance-none bg-white`} style={{ fontSize: "13px" }}>
                  {Array.from({ length: Number(form.total_rooms) }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-2.5">
                <div className={`px-4 py-2.5 rounded-xl ${roommatesStaying > 0 ? "bg-[#FFB627]/[0.08] text-[#D4990F]" : "bg-[#4ADE80]/[0.08] text-[#4ADE80]"}`} style={{ fontSize: "12px", fontWeight: 600 }}>
                  {roommatesStaying > 0 ? `👥 ${roommatesStaying} roommate${roommatesStaying > 1 ? "s" : ""} staying` : "🏠 Place will be empty"}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClass} style={labelStyle}>Gender preference</label>
              <div className="flex gap-2 flex-wrap">
                {([{ v: "any", l: "Any" }, { v: "male", l: "Male" }, { v: "female", l: "Female" }, { v: "other", l: "Other" }] as const).map((g) => (
                  <button key={g.v} type="button" onClick={() => update("gender_preference", g.v)} className={`px-3.5 py-2 rounded-xl border transition-all ${form.gender_preference === g.v ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"}`} style={{ fontSize: "12px", fontWeight: form.gender_preference === g.v ? 600 : 500 }}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="border-t border-black/[0.04] pt-5 mb-5">
            <div className="text-[#1B2D45]/40 mb-1" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>GETTING TO CAMPUS</div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              <div>
                <label className={labelClass} style={labelStyle}>Distance to campus (km) *</label>
                <input type="number" step="0.1" value={form.distance_to_campus_km} onChange={(e) => update("distance_to_campus_km", e.target.value)} placeholder="1.2" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Walk time (min) *</label>
                <input type="number" value={form.walk_time_minutes} onChange={(e) => update("walk_time_minutes", e.target.value)} placeholder="15" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Drive time (min) *</label>
                <input type="number" value={form.drive_time_minutes} onChange={(e) => update("drive_time_minutes", e.target.value)} placeholder="5" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Bus time (min) *</label>
                <input type="number" value={form.bus_time_minutes} onChange={(e) => update("bus_time_minutes", e.target.value)} placeholder="8" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
              <div className={isMobile ? "" : "col-span-2"}>
                <label className={labelClass} style={labelStyle}>Nearest bus route *</label>
                <input type="text" value={form.nearest_bus_route} onChange={(e) => update("nearest_bus_route", e.target.value)} placeholder="e.g. Route 99" className={inputClass} style={{ fontSize: "13px" }} />
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.04] pt-5 mb-5">
            <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>AMENITIES & RULES</div>
            <p className="mb-3 text-[#1B2D45]/35" style={{ fontSize: "11px", lineHeight: 1.6 }}>
              These details show up directly on the listing, so students can see things like wifi, laundry, parking, pets, and smoking rules up front.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {amenities.map((a) => (
                <button
                  key={a.key}
                  onClick={() => update(a.key, !form[a.key])}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                    form[a.key]
                      ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                      : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"
                  }`}
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${form[a.key] ? "bg-[#FF6B35] border-[#FF6B35]" : "border-[#1B2D45]/15"}`}>
                    {form[a.key] && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span>{a.emoji}</span>
                  {a.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass} style={labelStyle}>Pets</label>
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
                <label className={labelClass} style={labelStyle}>Smoking</label>
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
        </>
      )}

      {step === 4 && (
        <div className="border-t border-black/[0.04] pt-5 mb-5">
          <div className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>PHOTOS & REVIEW</div>
          <div className="mb-4">
            <label className={labelClass} style={labelStyle}>Photos (up to 5)</label>
            <div className="flex gap-2 flex-wrap">
              {photos.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-black/[0.06] group">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700 }}>✕</span>
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-black/[0.08] flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.02] transition-all">
                  <span className="text-[#1B2D45]/20" style={{ fontSize: "20px" }}>+</span>
                  <span className="text-[#1B2D45]/20" style={{ fontSize: "8px", fontWeight: 500 }}>Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>

        </div>
      )}

      <div className="border-t border-black/[0.04] pt-5 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            className="px-5 py-3 rounded-xl border border-black/[0.08] text-[#1B2D45]/60 hover:bg-black/[0.02]"
            style={{ fontSize: "13px", fontWeight: 700 }}
          >
            Back
          </button>
        )}
        {step < steps.length ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(steps.length, current + 1))}
            disabled={!canGoNext()}
            className="flex-1 px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors active:scale-[0.98]"
            style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Posting..." : "Post Sublet →"}
          </button>
        )}
        <p className="text-[#1B2D45]/20 shrink-0" style={{ fontSize: "10px", maxWidth: "140px", lineHeight: 1.4 }}>
          * Required fields. You can edit after posting.
        </p>
      </div>
    </div>
  );
}
