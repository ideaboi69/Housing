"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Users, Copy, Check, Link2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  type LifestyleProfile,
  type RoommateGroup,
  MOVE_IN_OPTIONS,
  GENDER_HOUSING_OPTIONS,
  getStoredRoommateGroupByOwner,
  upsertStoredRoommateGroup,
} from "@/components/roommates/roommate-data";

export default function CreateGroupPage() {
  const { user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [groupSize, setGroupSize] = useState(4);
  const [haveCount, setHaveCount] = useState(2);
  const [rentPerPerson, setRentPerPerson] = useState(650);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [moveIn, setMoveIn] = useState("Fall 2026");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("No preference");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);

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

  const buildLandlordSignupUrl = (code: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://cribb.ca";
    return `${base}/landlord/signup?claim=${encodeURIComponent(code)}`;
  };

  const copyText = (value: string, setter: (state: boolean) => void) => {
    navigator.clipboard.writeText(value);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleCreate = () => {
    // TODO: POST /api/groups { name, group_size, rent_per_person, move_in, address, gender_preference, description, is_visible }
    if (!user) return;
    if (existingGroup) return;

    const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const groupId = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const members = Array.from({ length: haveCount }, (_, index) => buildMember(index));
    const landlordUrl = buildLandlordSignupUrl(code);

    const group: RoommateGroup = {
      id: groupId,
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
      isVisible,
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
    setCreatedGroupId(groupId);
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
      year: "UofG student",
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
      <div className="max-w-[520px] mx-auto px-4 py-6 md:py-10">
        <Link href="/roommates" className="inline-flex items-center gap-1 text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        {/* Progress */}
        <div className="mb-8">
          <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#FF6B35] rounded-full" animate={{ width: `${((step + 1) / 4) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>Step {step + 1} of 4</span>
            {step > 0 && <button onClick={() => setStep(step - 1)} className="text-[#FF6B35] hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>← Back</button>}
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          {/* Step 1: Name */}
          {step === 0 && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>Name your group</h2>
              <p className="text-[#1B2D45]/40 mb-5" style={{ fontSize: "13px" }}>Something fun that people will remember</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Edinburgh Girls, CS House, Chill Roomies"
                className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-black/[0.04] focus:border-[#FF6B35]/30 focus:outline-none transition-all"
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
                    <button key={n} onClick={() => { setHaveCount(n); if (n >= groupSize) setGroupSize(n + 1); }} className={`py-3 rounded-xl border-2 transition-all ${haveCount === n ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "18px", fontWeight: haveCount === n ? 800 : 500 }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Total group size you&apos;re looking for</label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button key={n} onClick={() => setGroupSize(n)} disabled={n <= haveCount} className={`py-3 rounded-xl border-2 transition-all ${groupSize === n ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : n <= haveCount ? "border-black/[0.02] text-[#1B2D45]/15 cursor-not-allowed" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "18px", fontWeight: groupSize === n ? 800 : 500 }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {spotsNeeded > 0 && (
                <div className="bg-[#FF6B35]/[0.04] border border-[#FF6B35]/10 rounded-xl px-4 py-3 flex items-center gap-2">
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
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-black/[0.04] focus:border-[#FF6B35]/30 focus:outline-none mb-5"
                style={{ fontSize: "14px" }}
                placeholder="e.g. 725"
              />

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Utilities</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setUtilitiesIncluded(true)}
                  className={`px-3 py-2.5 rounded-xl border-2 transition-all ${utilitiesIncluded ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`}
                  style={{ fontSize: "13px", fontWeight: utilitiesIncluded ? 600 : 400 }}
                >
                  Included
                </button>
                <button
                  type="button"
                  onClick={() => setUtilitiesIncluded(false)}
                  className={`px-3 py-2.5 rounded-xl border-2 transition-all ${!utilitiesIncluded ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`}
                  style={{ fontSize: "13px", fontWeight: !utilitiesIncluded ? 600 : 400 }}
                >
                  Extra
                </button>
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Move-in timing</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {MOVE_IN_OPTIONS.map((m) => {
                  const sel = moveIn === m;
                  return <button key={m} onClick={() => setMoveIn(m)} className={`px-3 py-2.5 rounded-xl border-2 transition-all ${sel ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400 }}>{m}</button>;
                })}
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Home address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Wilson St, Guelph, ON"
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-black/[0.04] focus:border-[#FF6B35]/30 focus:outline-none mb-5"
                style={{ fontSize: "14px" }}
              />

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Gender preference</label>
              <div className="space-y-2">
                {GENDER_HOUSING_OPTIONS.map((opt) => {
                  const sel = gender === opt;
                  return <button key={opt} onClick={() => setGender(opt)} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${sel ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45" }}>{opt}</button>;
                })}
              </div>

              <div className="mt-5 rounded-xl px-4 py-3 bg-[#2EC4B6]/[0.04] border border-[#2EC4B6]/10">
                <div className="text-[#2EC4B6]" style={{ fontSize: "12px", fontWeight: 700 }}>Landlord verification link is generated automatically</div>
                <div className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  After you post, you&apos;ll get a second link to send your landlord so they can attach the home to Cribb.
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description + Visibility */}
          {step === 3 && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>Describe your group</h2>
              <p className="text-[#1B2D45]/40 mb-5" style={{ fontSize: "13px" }}>Help potential roommates know what you&apos;re about</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your group vibe, what you're looking for in a roommate, any house rules..."
                className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-black/[0.04] focus:border-[#FF6B35]/30 focus:outline-none resize-none transition-all"
                style={{ fontSize: "14px", lineHeight: 1.6, minHeight: 140 }}
              />
              <p className="text-[#1B2D45]/20 mt-1 text-right" style={{ fontSize: "10px" }}>{description.length} characters</p>

              <div className="mt-5">
                <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Who can find your group?</label>
                <div className="space-y-2">
                  <button onClick={() => setIsVisible(true)} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${isVisible ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`}>
                    <div style={{ fontSize: "13px", fontWeight: isVisible ? 600 : 400, color: isVisible ? "#FF6B35" : "#1B2D45" }}>Public</div>
                    <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Anyone browsing roommates can see your group</div>
                  </button>
                  <button onClick={() => setIsVisible(false)} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${!isVisible ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`}>
                    <div style={{ fontSize: "13px", fontWeight: !isVisible ? 600 : 400, color: !isVisible ? "#FF6B35" : "#1B2D45" }}>Invite only</div>
                    <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>Only people with your link can find and join</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="mt-6">
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canContinue()} className={`w-full py-3.5 rounded-xl text-white transition-all ${canContinue() ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`} style={{ fontSize: "14px", fontWeight: 700, boxShadow: canContinue() ? "0 4px 20px rgba(255,107,53,0.3)" : "none" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={!canContinue()} className={`w-full py-3.5 rounded-xl text-white transition-all ${canContinue() ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`} style={{ fontSize: "14px", fontWeight: 700, boxShadow: canContinue() ? "0 4px 20px rgba(255,107,53,0.3)" : "none" }}>
              Create Group 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
