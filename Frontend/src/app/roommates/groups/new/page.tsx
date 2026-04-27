"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Users, Copy, Check, Link2, Sparkles, Camera, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import {
  type LifestyleProfile,
  type RoommateGroup,
  MOVE_IN_OPTIONS,
  GENDER_HOUSING_OPTIONS,
  getStoredRoommateGroupByOwner,
  upsertStoredRoommateGroup,
} from "@/components/roommates/roommate-data";

const STEP_DETAILS = [
  {
    eyebrow: "Step 1",
    title: "Name the group",
    description: "Start with a memorable group name and an optional photo.",
  },
  {
    eyebrow: "Step 2",
    title: "Size and spots",
    description: "Tell people how many of you there are and how many rooms are still open.",
  },
  {
    eyebrow: "Step 3",
    title: "Availability",
    description: "Set the rent, move-in timing, address, and who the place is best for.",
  },
  {
    eyebrow: "Step 4",
    title: "Final details",
    description: "Share the vibe and the final details people should know before they join.",
  },
] as const;

const GROUP_SHOWCASE = [
  {
    name: "The Edinburgh Girls",
    subtitle: "3 of 4 filled",
    summary: "Quiet during the week, movie nights on weekends, looking for one more.",
    accent: "linear-gradient(135deg, #FF7A45 0%, #FFB627 100%)",
    chips: ["Fall 2026", "$690/mo", "Near Campus"],
    people: ["J", "M", "A"],
  },
  {
    name: "South End House",
    subtitle: "2 of 5 filled",
    summary: "Signed lease, sunny place, looking for easygoing roommates to fill open rooms.",
    accent: "linear-gradient(135deg, #1B2D45 0%, #2C4565 100%)",
    chips: ["Utilities incl.", "$610/mo", "Need 3"],
    people: ["R", "T"],
  },
  {
    name: "Downtown 2BR",
    subtitle: "1 of 2 filled",
    summary: "One open room in a quieter setup for someone tidy who likes a calmer space.",
    accent: "linear-gradient(135deg, #FFB86B 0%, #FFE0B3 100%)",
    chips: ["Winter 2027", "$775/mo", "Invite Only"],
    people: ["Q"],
  },
] as const;

export default function CreateGroupPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
<<<<<<< Updated upstream

  // Pre-fill counts from the quiz setup if they came in via "I have friends already"
  const initialHave = (() => {
    const raw = parseInt(searchParams.get("have") || "", 10);
    return !isNaN(raw) && raw >= 2 && raw <= 6 ? raw : 2;
  })();
  const initialNeed = (() => {
    const raw = parseInt(searchParams.get("need") || "", 10);
    return !isNaN(raw) && raw >= 1 && raw <= 4 ? raw : 2;
  })();
=======
>>>>>>> Stashed changes

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [groupSize, setGroupSize] = useState(initialHave + initialNeed);
  const [haveCount, setHaveCount] = useState(initialHave);
  const [rentPerPerson, setRentPerPerson] = useState(650);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [moveIn, setMoveIn] = useState("Fall 2026");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("No preference");
  const [description, setDescription] = useState("");
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  // Result
  const [created, setCreated] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [landlordInviteUrl, setLandlordInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [landlordCopied, setLandlordCopied] = useState(false);
  const [existingGroup, setExistingGroup] = useState<RoommateGroup | null | undefined>(undefined);
  const spotsNeeded = groupSize - haveCount;
  const ownerKey = user ? `user:${user.id}` : "";

  const canContinue = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return haveCount > 0 && groupSize > haveCount;
    if (step === 2) return !!moveIn && address.trim().length >= 8 && rentPerPerson > 0;
    if (step === 3) return description.trim().length >= 10;
    return true;
  };

  useEffect(() => {
    const haveParam = Number(searchParams.get("have"));
    const needParam = Number(searchParams.get("need"));

    if (Number.isFinite(haveParam) && haveParam >= 2 && haveParam <= 6) {
      setHaveCount(haveParam);
    }

    if (Number.isFinite(needParam) && needParam >= 1 && needParam <= 4) {
      setGroupSize(Math.max(haveParam || haveCount, 2) + needParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      setExistingGroup(null);
      return;
    }

    setExistingGroup(
      getStoredRoommateGroupByOwner(`user:${user.id}`) ??
      getStoredRoommateGroupByOwner(`${user.id}-member-1`) ??
      null
    );
  }, [user]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShowcaseIndex((current) => (current + 1) % GROUP_SHOWCASE.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  const buildLandlordSignupUrl = (code: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://cribb.ca";
    return `${base}/landlord/signup?claim=${encodeURIComponent(code)}`;
  };

  const copyText = (value: string, setter: (state: boolean) => void) => {
    navigator.clipboard.writeText(value);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleCreate = async () => {
    if (!user) return;
    if (existingGroup) return;

    const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const landlordUrl = buildLandlordSignupUrl(code);

    // Try API first
    try {
      const moveInToEnum = (m: string) => {
        if (m.includes("Fall")) return "fall_2026";
        if (m.includes("Winter")) return "winter_2027";
        if (m.includes("Summer")) return "summer_2026";
        return "flexible";
      };
      const genderToEnum = (g: string) => {
        if (g.includes("Mixed")) return "mixed_gender";
        if (g.includes("Same")) return "same_gender";
        return "no_preference";
      };

      const apiGroup = await api.roommates.createGroup({
        name: name.trim(),
        description: description.trim(),
        current_size: haveCount,
        spots_needed: spotsNeeded,
        rent_per_person: rentPerPerson,
        utilities_included: utilitiesIncluded,
        move_in_timing: moveInToEnum(moveIn),
        gender_preference: genderToEnum(gender),
        has_place: address.trim().length > 0,
        address: address.trim() || undefined,
      });

      setCreatedGroupId(String(apiGroup.id));
      setInviteCode(code);
      setLandlordInviteUrl(landlordUrl);
      setCreated(true);
    } catch {
      // API failed — fall back to localStorage
    }

    // Always save locally as cache/fallback
    const groupId = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const members = Array.from({ length: haveCount }, (_, index) => buildMember(index));

    const group: RoommateGroup = {
      id: createdGroupId || groupId,
      name: name.trim(),
      createdBy: ownerKey || `${user.id}-member-1`,
      members,
      groupSize,
      spotsNeeded,
      budgetMin: rentPerPerson,
      budgetMax: rentPerPerson,
      preferredArea: null,
      targetListingId: null,
      targetListingTitle: null,
      description: description.trim(),
      inviteCode: code,
      isVisible: true,
      genderPreference: gender,
      moveIn,
      createdAt: new Date().toISOString(),
      housing: {
        status: "pending",
        selfReportedAddress: address.trim(),
        selfReportedRent: rentPerPerson,
        selfReportedUtilitiesIncluded: utilitiesIncluded,
        landlordInviteUrl: landlordUrl,
      },
      bannerGradient: "linear-gradient(135deg, #FF6B35 0%, #FFB627 100%)",
    };

    upsertStoredRoommateGroup(group);
    if (!createdGroupId) setCreatedGroupId(groupId);
    setInviteCode(code);
    setLandlordInviteUrl(landlordUrl);
    setCreated(true);
    setExistingGroup(group);
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/roommates/groups/join/${inviteCode}` : `cribb.ca/join/${inviteCode}`;

  const handleCopy = () => copyText(shareUrl, setCopied);
  const handleLandlordCopy = () => copyText(landlordInviteUrl, setLandlordCopied);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center">
          <Users className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-3" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Log in to create a group</h2>
          <p className="text-[#1B2D45]/35 mt-1 mb-4" style={{ fontSize: "13px" }}>You need a cribb account first.</p>
          <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white" style={{ fontSize: "13px", fontWeight: 700 }}>Log In</Link>
        </div>
      </div>
    );
  }

  if (user.role === "landlord") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="max-w-[460px] text-center">
          <Users className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-3" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Roommate groups are for students</h2>
          <p className="text-[#1B2D45]/40 mt-1 mb-5" style={{ fontSize: "13px", lineHeight: 1.6 }}>
            Landlord accounts can browse roommate availability, but they can&apos;t create or manage student roommate groups.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/roommates" className="px-5 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/60 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Browse Roommates
            </Link>
            <Link href="/landlord" className="px-5 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#142235] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Landlord Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const buildMember = (index: number): LifestyleProfile => {
    const firstName = index === 0
      ? user.first_name || "You"
      : `Roommate ${index + 1}`;
    const lastInitial = index === 0
      ? (user.last_name ? `${user.last_name.charAt(0)}.` : "")
      : `${index + 1}.`;

    return {
      id: `${user.id}-member-${index + 1}`,
      firstName,
      initial: lastInitial,
      year: "Student member",
      program: index === 0 ? "Group organizer" : "Current housemate",
      budget: [rentPerPerson, rentPerPerson],
      moveIn,
      leaseLength: "Flexible",
      bio: index === 0
        ? "Created this group on Cribb to fill an available room."
        : "Current housemate in the group.",
      tags: {
        sleep: "Flexible",
        cleanliness: "Reasonably Clean",
        noise: "Moderate — music at a normal volume",
        guests: "Sometimes (weekends)",
        study: "Mix of both",
        smoking: "No smoking at all",
        pets: "I'm fine with pets",
        cooking: "A few times a week",
      },
    };
  };

  if (!created && existingGroup === undefined) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (!created && existingGroup) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-[520px] mx-auto px-4 py-10">
          <Link href="/roommates" className="inline-flex items-center gap-1 text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "12px", fontWeight: 600 }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
          <div className="bg-white rounded-2xl border border-black/[0.04] p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div className="w-14 h-14 rounded-2xl bg-[#FFB627]/10 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-[#FFB627]" />
            </div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>You already have a live group</h1>
            <p className="text-[#1B2D45]/40 mt-2" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              You can only keep one active roommate group at a time. Update or delete your current group before creating another one.
            </p>
            <div className="mt-4 px-4 py-3 rounded-xl bg-[#FAF8F4] border border-black/[0.04]">
              <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{existingGroup.name}</div>
              <div className="text-[#1B2D45]/35 mt-1" style={{ fontSize: "11px" }}>
                {existingGroup.housing?.selfReportedAddress || existingGroup.housing?.linkedListingAddress || "Current availability post"}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Link href={`/roommates/groups/${existingGroup.id}`} className="flex-1 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all text-center" style={{ fontSize: "13px", fontWeight: 600 }}>
                View Group
              </Link>
              <Link href={`/roommates/groups/${existingGroup.id}/manage`} className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all text-center" style={{ fontSize: "13px", fontWeight: 700 }}>
                Manage Group
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (created) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <div className="w-16 h-16 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#4ADE80]" />
            </div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>{name}</h1>
            <p className="text-[#1B2D45]/40 mt-1 mb-6" style={{ fontSize: "13px" }}>
              Your availability post is live. Share the student link with potential roommates and the landlord link so your place can be verified on Cribb.
            </p>

            {/* Invite link */}
            <div className="bg-white rounded-xl border border-black/[0.04] p-4 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <label className="text-[#1B2D45]/40 block mb-2 text-left" style={{ fontSize: "11px", fontWeight: 600 }}>Student invite link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FAF8F4] border border-black/[0.04]">
                  <Link2 className="w-3.5 h-3.5 text-[#1B2D45]/25 shrink-0" />
                  <span className="text-[#1B2D45]/50 truncate" style={{ fontSize: "12px", fontWeight: 500 }}>{shareUrl}</span>
                </div>
                <button onClick={handleCopy} className="px-4 py-2.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all flex items-center gap-1.5 shrink-0" style={{ fontSize: "12px", fontWeight: 600 }}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-[#1B2D45]/20 mt-2 text-left" style={{ fontSize: "10px" }}>
                Anyone with this link can view your post and request the available room.
              </p>
            </div>

            {/* Landlord invite link */}
            <div className="bg-white rounded-xl border border-[#2EC4B6]/10 p-4 mb-4" style={{ boxShadow: "0 2px 12px rgba(46,196,182,0.05)" }}>
              <label className="text-[#2EC4B6] block mb-2 text-left" style={{ fontSize: "11px", fontWeight: 700 }}>Landlord verification link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FAF8F4] border border-[#2EC4B6]/10">
                  <Link2 className="w-3.5 h-3.5 text-[#2EC4B6]/40 shrink-0" />
                  <span className="text-[#2EC4B6]/60 truncate" style={{ fontSize: "12px", fontWeight: 500 }}>{landlordInviteUrl}</span>
                </div>
                <button onClick={handleLandlordCopy} className="px-4 py-2.5 rounded-lg bg-[#2EC4B6] text-white hover:bg-[#28b0a3] transition-all flex items-center gap-1.5 shrink-0" style={{ fontSize: "12px", fontWeight: 600 }}>
                  {landlordCopied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-[#1B2D45]/25 mt-2 text-left" style={{ fontSize: "10px" }}>
                Send this to your landlord so they can sign up and attach the home to Cribb.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-black/[0.04] p-4 text-left mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>{haveCount} of {groupSize} filled</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>Need {spotsNeeded} more</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>${rentPerPerson}/mo</span>
                <span className={`px-2.5 py-1 rounded-lg ${utilitiesIncluded ? "bg-[#4ADE80]/[0.08] text-[#4ADE80]" : "bg-[#1B2D45]/[0.04] text-[#1B2D45]/50"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
                  {utilitiesIncluded ? "Utilities included" : "Utilities extra"}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#2EC4B6]/[0.06] text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 600 }}>{address}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/roommates" className="flex-1 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all" style={{ fontSize: "13px", fontWeight: 600 }}>
                Browse Roommates
              </Link>
              <Link href={`/roommates/groups/${createdGroupId}`} className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
                View Group Page
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-4 py-6 md:py-10">
        <Link href="/roommates" className="inline-flex items-center gap-1 text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="relative space-y-5 lg:sticky lg:top-24">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-8 top-20 h-32 w-32 rounded-full bg-[#FF6B35]/[0.08] blur-3xl"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute right-6 top-[22rem] h-24 w-24 rounded-full bg-[#FFB627]/[0.08] blur-3xl"
              animate={{ opacity: [0.3, 0.55, 0.3], y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/12 bg-[#FF6B35]/[0.06] px-3 py-1.5 text-[#FF6B35]"
                style={{ fontSize: "11px", fontWeight: 700 }}
              >
                <Users className="w-3.5 h-3.5" />
                Roommate groups
              </span>
              <h1 className="mt-4 text-[#1B2D45]" style={{ fontSize: "34px", lineHeight: 1.05, fontWeight: 900 }}>
                Build a group that feels easy to join.
              </h1>
              <p className="mt-3 max-w-[520px] text-[#1B2D45]/48" style={{ fontSize: "15px", lineHeight: 1.75 }}>
                Keep the first look simple: clear name, who you still need, what the place costs, and what kind of house dynamic people should expect.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5, ease: "easeOut" }}
              className="overflow-hidden rounded-[34px] border border-black/[0.05] bg-[linear-gradient(180deg,#FFF8F3_0%,#FFFFFF_100%)]"
              style={{ boxShadow: "0 24px 56px rgba(15, 23, 42, 0.07)" }}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Browse feel
                    </div>
                    <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                      What students will scan first
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {GROUP_SHOWCASE.map((_, index) => (
                      <span
                        key={index}
                        className={`h-2 rounded-full transition-all ${index === showcaseIndex ? "w-6 bg-[#FF6B35]" : "w-2 bg-[#1B2D45]/10"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="relative h-[340px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_45%),linear-gradient(180deg,#FFFFFF_0%,#FFF8F3_100%)]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showcaseIndex}
                      initial={{ opacity: 0, x: 28, rotate: 2 }}
                      animate={{ opacity: 1, x: 0, rotate: 0 }}
                      exit={{ opacity: 0, x: -28, rotate: -2 }}
                      transition={{ duration: 0.42, ease: "easeOut" }}
                      className="absolute inset-0 px-4 pt-8"
                    >
                      <div className="relative mx-auto max-w-[360px] rounded-[30px] border border-black/[0.05] bg-white p-4" style={{ boxShadow: "0 22px 50px rgba(15, 23, 42, 0.10)" }}>
                        <div
                          className="h-[88px] rounded-[22px]"
                          style={{ background: GROUP_SHOWCASE[showcaseIndex].accent }}
                        />

                        <div className="mt-4 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                              {GROUP_SHOWCASE[showcaseIndex].name}
                            </div>
                            <div className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 700 }}>
                              {GROUP_SHOWCASE[showcaseIndex].subtitle}
                            </div>
                          </div>
                          <motion.span
                            className="rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.08] px-3 py-1 text-[#FF6B35]"
                            style={{ fontSize: "11px", fontWeight: 700 }}
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            Need {Math.max(spotsNeeded, 0)}
                          </motion.span>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          {GROUP_SHOWCASE[showcaseIndex].people.map((person, index) => (
                            <motion.div
                              key={`${GROUP_SHOWCASE[showcaseIndex].name}-${person}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.08 + index * 0.04, duration: 0.25 }}
                              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#FFE3D3_0%,#FFF7F0_100%)] text-[#FF6B35]"
                              style={{ fontSize: "13px", fontWeight: 800, marginLeft: index === 0 ? 0 : -10 }}
                            >
                              {person}
                            </motion.div>
                          ))}
                        </div>

                        <p className="mt-4 text-[#1B2D45]/52" style={{ fontSize: "13px", lineHeight: 1.7 }}>
                          {GROUP_SHOWCASE[showcaseIndex].summary}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {GROUP_SHOWCASE[showcaseIndex].chips.map((chip) => (
                            <span key={chip} className="rounded-full bg-[#1B2D45]/[0.05] px-3 py-1.5 text-[#1B2D45]/58" style={{ fontSize: "11px", fontWeight: 700 }}>
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-4 rounded-[20px] border border-black/[0.05] bg-white/80 px-4 py-3 backdrop-blur-sm">
                  <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Your live preview
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                      {name.trim() || "Your group name"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#1B2D45]/18" />
                    <span className="text-[#1B2D45]/48" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {haveCount} of {groupSize} filled
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#1B2D45]/18" />
                    <span className="text-[#1B2D45]/48" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {moveIn}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div
            className="rounded-[32px] border border-black/[0.05] bg-white p-5 sm:p-7"
            style={{ boxShadow: "0 24px 60px rgba(15, 23, 42, 0.07)" }}
          >
            <div className="mb-7">
              <div className="grid gap-2 sm:grid-cols-4">
                {STEP_DETAILS.map((item, index) => {
                  const isActive = index === step;
                  const isDone = index < step;
                  return (
                    <div
                      key={item.title}
                      className={`rounded-[20px] border px-3 py-3 transition-all ${
                        isActive
                          ? "border-[#FF6B35]/18 bg-[#FF6B35]/[0.08]"
                          : isDone
                            ? "border-[#1B2D45]/10 bg-[#1B2D45]/[0.04]"
                            : "border-black/[0.05] bg-[#FCFBF8]"
                      }`}
                    >
                      <div className={isActive ? "text-[#FF6B35]" : "text-[#1B2D45]/32"} style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {item.eyebrow}
                      </div>
                      <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                        {item.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/[0.05]">
                <motion.div className="h-full rounded-full bg-[#FF6B35]" animate={{ width: `${((step + 1) / 4) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {STEP_DETAILS[step].eyebrow}
                  </div>
                  <div className="mt-1 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                    {STEP_DETAILS[step].description}
                  </div>
                </div>
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="shrink-0 rounded-full border border-black/[0.06] px-3.5 py-2 text-[#1B2D45]/58 transition-all hover:border-[#1B2D45]/14 hover:text-[#1B2D45]"
                    style={{ fontSize: "12px", fontWeight: 700 }}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          {/* Step 1: Name */}
          {step === 0 && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "24px", fontWeight: 800 }}>Name your group</h2>
              <p className="text-[#1B2D45]/42 mb-6" style={{ fontSize: "14px" }}>Something easy to recognize when people are scanning a long list of groups.</p>

              {/* Group photo (optional) */}
              <div className="mb-6 rounded-[24px] border border-black/[0.05] bg-[#FCFBF8] p-4 sm:p-5">
                <label className="text-[#1B2D45]/50 block mb-3" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Group photo <span className="text-[#1B2D45]/25 normal-case">(optional)</span></label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-[108px] w-full overflow-hidden rounded-[22px] border border-black/[0.05] bg-white sm:w-[132px]">
                    {groupImage ? (
                      <>
                        <img src={groupImage} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => { setGroupImage(null); setGroupImageFile(null); }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 transition-colors hover:bg-black/65"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#FFF1E9_0%,#FFFFFF_100%)] text-[#FF6B35]/55">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Use a quick group snapshot if you have one.</div>
                    <p className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                      It should help people recognize the group, not dominate the card. A casual living-room or friend photo works best.
                    </p>
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-4 py-2 text-[#FF6B35] transition-all hover:bg-[#FF6B35]/[0.09]" style={{ fontSize: "12px", fontWeight: 700 }}>
                      <Camera className="h-3.5 w-3.5" />
                      {groupImage ? "Replace photo" : "Upload photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setGroupImageFile(file);
                            const reader = new FileReader();
                            reader.onload = (ev) => setGroupImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Edinburgh Girls, CS House, Chill Roomies"
                className="w-full rounded-[20px] border border-black/[0.07] bg-[#FCFBF8] px-4 py-4 text-[#1B2D45] outline-none transition-all focus:border-[#FF6B35]/30 focus:bg-white"
                style={{ fontSize: "15px", fontWeight: 500 }}
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Size */}
          {step === 1 && (
            <div>
              <h2 className="text-[#1B2D45] mb-5" style={{ fontSize: "22px", fontWeight: 800 }}>How big is the group?</h2>
              <div className="mb-5">
                <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>How many people do you have right now? (including you)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => { setHaveCount(n); if (n >= groupSize) setGroupSize(n + 1); }} className={`py-3 rounded-[18px] border transition-all ${haveCount === n ? "border-[#FF6B35]/24 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] bg-[#FCFBF8] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:bg-white"}`} style={{ fontSize: "18px", fontWeight: haveCount === n ? 800 : 500 }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Total group size you&apos;re looking for</label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button key={n} onClick={() => setGroupSize(n)} disabled={n <= haveCount} className={`py-3 rounded-[18px] border transition-all ${groupSize === n ? "border-[#FF6B35]/24 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : n <= haveCount ? "border-black/[0.04] bg-[#FCFBF8] text-[#1B2D45]/18 cursor-not-allowed" : "border-black/[0.06] bg-[#FCFBF8] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:bg-white"}`} style={{ fontSize: "18px", fontWeight: groupSize === n ? 800 : 500 }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {spotsNeeded > 0 && (
                <div className="bg-[#FF6B35]/[0.05] border border-[#FF6B35]/10 rounded-[20px] px-4 py-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 600 }}>Looking for {spotsNeeded} more roommate{spotsNeeded > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Availability details */}
          {step === 2 && (
            <div>
              <h2 className="text-[#1B2D45] mb-5" style={{ fontSize: "22px", fontWeight: 800 }}>Availability details</h2>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Rent (per person/month)</label>
              <input
                type="number"
                min={0}
                value={rentPerPerson}
                onChange={(e) => setRentPerPerson(Number(e.target.value))}
                className="w-full rounded-[20px] border border-black/[0.07] bg-[#FCFBF8] px-4 py-3.5 outline-none transition-all focus:border-[#FF6B35]/30 focus:bg-white mb-5"
                style={{ fontSize: "14px" }}
                placeholder="e.g. 725"
              />

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Utilities</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setUtilitiesIncluded(true)}
                  className={`px-3 py-2.5 rounded-[18px] border transition-all ${utilitiesIncluded ? "border-[#FF6B35]/24 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] bg-[#FCFBF8] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:bg-white"}`}
                  style={{ fontSize: "13px", fontWeight: utilitiesIncluded ? 600 : 400 }}
                >
                  Included
                </button>
                <button
                  type="button"
                  onClick={() => setUtilitiesIncluded(false)}
                  className={`px-3 py-2.5 rounded-[18px] border transition-all ${!utilitiesIncluded ? "border-[#FF6B35]/24 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] bg-[#FCFBF8] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:bg-white"}`}
                  style={{ fontSize: "13px", fontWeight: !utilitiesIncluded ? 600 : 400 }}
                >
                  Extra
                </button>
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Move-in timing</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {MOVE_IN_OPTIONS.map((m) => {
                  const sel = moveIn === m;
                  return <button key={m} onClick={() => setMoveIn(m)} className={`px-3 py-2.5 rounded-[18px] border transition-all ${sel ? "border-[#FF6B35]/24 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] bg-[#FCFBF8] text-[#1B2D45]/50 hover:border-[#FF6B35]/20 hover:bg-white"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400 }}>{m}</button>;
                })}
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Home address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Wilson St, Guelph, ON"
                className="w-full rounded-[20px] border border-black/[0.07] bg-[#FCFBF8] px-4 py-3.5 outline-none transition-all focus:border-[#FF6B35]/30 focus:bg-white mb-5"
                style={{ fontSize: "14px" }}
              />

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Gender preference</label>
              <div className="space-y-2">
                {GENDER_HOUSING_OPTIONS.map((opt) => {
                  const sel = gender === opt;
                  return <button key={opt} onClick={() => setGender(opt)} className={`w-full text-left px-4 py-3 rounded-[18px] border transition-all ${sel ? "border-[#FF6B35]/24 bg-[#FF6B35]/[0.08]" : "border-black/[0.06] hover:border-[#FF6B35]/20 bg-[#FCFBF8] hover:bg-white"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45" }}>{opt}</button>;
                })}
              </div>

              <div className="mt-5 rounded-[20px] px-4 py-3 bg-[#2EC4B6]/[0.04] border border-[#2EC4B6]/10">
                <div className="text-[#2EC4B6]" style={{ fontSize: "12px", fontWeight: 700 }}>Landlord verification link is generated automatically</div>
                <div className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  After you post, you&apos;ll get a second link to send your landlord so they can attach the home to Cribb.
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description */}
          {step === 3 && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>Describe your group</h2>
              <p className="text-[#1B2D45]/40 mb-5" style={{ fontSize: "13px" }}>Help potential roommates know what you&apos;re about</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your group vibe, what you're looking for in a roommate, any house rules..."
                className="w-full resize-none rounded-[22px] border border-black/[0.07] bg-[#FCFBF8] px-4 py-4 outline-none transition-all focus:border-[#FF6B35]/30 focus:bg-white"
                style={{ fontSize: "14px", lineHeight: 1.6, minHeight: 140 }}
              />
              <p className="text-[#1B2D45]/20 mt-1 text-right" style={{ fontSize: "10px" }}>{description.length} characters</p>
            </div>
          )}
            </motion.div>

            {/* Actions */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[#1B2D45]/34" style={{ fontSize: "12px", fontWeight: 600 }}>
                {step < 3 ? "You can edit this after publishing." : "Publishing makes your group visible right away."}
              </div>
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} disabled={!canContinue()} className={`w-full rounded-full px-6 py-3.5 text-white transition-all sm:w-auto ${canContinue() ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`} style={{ fontSize: "14px", fontWeight: 700, boxShadow: canContinue() ? "0 10px 28px rgba(255,107,53,0.28)" : "none" }}>
                  Continue
                </button>
              ) : (
                <button onClick={handleCreate} disabled={!canContinue()} className={`w-full rounded-full px-6 py-3.5 text-white transition-all sm:w-auto ${canContinue() ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`} style={{ fontSize: "14px", fontWeight: 700, boxShadow: canContinue() ? "0 10px 28px rgba(255,107,53,0.28)" : "none" }}>
                  Create Group
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
