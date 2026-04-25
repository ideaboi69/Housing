"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Users, User, Shield, ChevronRight, MessageCircle, Sparkles, MapPin, SlidersHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks";
import { EarlyAdopterBadge } from "@/components/ui/Badges";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { getLandlordClaimState, type LandlordClaimState } from "@/lib/landlord-claim";
import {
  type LifestyleProfile, type RoommateGroup,
  LIFESTYLE_CATEGORIES, TAG_SHORT_LABELS, BUDGET_OPTIONS, MOVE_IN_OPTIONS, GENDER_HOUSING_OPTIONS,
  computeCompatibility, computeGroupCompatibility,
  MOCK_PROFILES, getVisibleRoommateGroups,
} from "@/components/roommates/roommate-data";

/* ════════════════════════════════════════════════════════
   Shared Helpers
   ════════════════════════════════════════════════════════ */

function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay }}>{children}</motion.div>;
}

function CompatRing({ score, size = 36 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#FFB627" : "#FF6B35";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1B2D45" strokeOpacity={0.04} strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: size*0.28, fontWeight: 800, color }}>{score}</span>
    </div>
  );
}

/* ── Dossier Group Card ── */

function DossierGroupCard({
  group,
  compatibility,
  index = 0,
  claimState,
}: {
  group: RoommateGroup;
  compatibility?: number;
  index?: number;
  claimState?: LandlordClaimState | null;
}) {
  const filled = group.groupSize - group.spotsNeeded;
  const defaultGradient = "linear-gradient(135deg, #1B2D45 0%, #2a4060 100%)";
  const displayAddress = group.housing?.status === "linked"
    ? group.housing.linkedListingAddress
    : group.housing?.status === "pending"
      ? group.housing.selfReportedAddress
      : null;
  const displayRent = group.housing?.status === "linked"
    ? group.housing.linkedListingPrice
    : group.housing?.status === "pending"
      ? group.housing.selfReportedRent
      : null;
  const utilitiesIncluded = group.housing?.status === "linked"
    ? group.housing.linkedListingUtilitiesIncluded
    : group.housing?.status === "pending"
      ? group.housing.selfReportedUtilitiesIncluded
      : undefined;
  const matchingClaim = claimState?.claim_code === group.inviteCode ? claimState : null;
  const addressAccent = group.housing?.status === "linked" ? "#4ADE80" : "#FFB627";
  const addressBg = group.housing?.status === "linked" ? "rgba(74,222,128,0.08)" : "rgba(255,182,39,0.08)";
  const pendingBadge = matchingClaim?.status === "listing_created"
    ? "✅ Listing ready"
    : matchingClaim?.status === "property_created"
      ? "🏠 Property added"
      : "⏳ Has a place";
  const heroImage = (group as any).groupImage || group.housing?.linkedListingImage || group.housing?.selfReportedPhotos?.[0] || null;
  const compactMeta = [
    group.spotsNeeded === 1 ? "Need 1 more" : `Need ${group.spotsNeeded} more`,
    group.preferredArea,
    group.genderPreference && group.genderPreference !== "No preference" ? group.genderPreference : null,
  ].filter(Boolean).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 24 }}
    >
      <Link href={`/roommates/groups/${group.id}`} className="block group">
        <motion.div
          className="h-full rounded-[24px] border border-black/[0.08] bg-white p-3.5 cursor-pointer transition-all"
          style={{ boxShadow: "0 16px 34px rgba(27,45,69,0.06)" }}
          whileHover={{ y: -4, boxShadow: "0 18px 40px rgba(27,45,69,0.1)" }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {compactMeta.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[#FF6B35]/[0.08] px-2 py-1 text-[#FF6B35]"
                        style={{ fontSize: "9px", fontWeight: 700 }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-2 text-[#1B2D45] truncate" style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {group.name}
                  </h3>
                </div>
                {compatibility != null && compatibility > 0 && <CompatRing score={compatibility} size={36} />}
              </div>

              <div className="mt-2.5 flex items-center">
                <div className="flex items-center -space-x-2.5">
                  {group.members.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/18 to-[#FFB627]/18 flex items-center justify-center border-2 border-white overflow-hidden"
                      style={{ boxShadow: "0 2px 8px rgba(27,45,69,0.08)" }}
                    >
                      {(m as typeof m & { avatar?: string }).avatar ? (
                        <img src={(m as typeof m & { avatar?: string }).avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>{m.firstName[0]}</span>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: Math.min(group.spotsNeeded, 2) }, (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-9 h-9 rounded-full border-2 border-dashed border-[#1B2D45]/12 flex items-center justify-center bg-[#FAF8F4]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FF6B35]/45" />
                    </div>
                  ))}
                </div>
                <span className="ml-2.5 text-[#1B2D45]/45" style={{ fontSize: "10px", fontWeight: 700 }}>
                  {filled}/{group.groupSize}
                </span>
              </div>
            </div>

            <div
              className="shrink-0 h-[68px] w-[72px] rounded-2xl overflow-hidden border border-black/[0.05]"
              style={{ background: heroImage ? undefined : (group.bannerGradient || defaultGradient) }}
            >
              {heroImage ? (
                <img src={heroImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px)", backgroundSize: "10px 10px" }} />
              )}
            </div>
          </div>

          <div className="mt-2.5">
            <p
              className="text-[#1B2D45]/58"
              style={{
                fontSize: "12px",
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {group.description}
            </p>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-black/[0.05] bg-[#FCFAF7] px-3 py-2.5">
              <div className="text-[#1B2D45]/42" style={{ fontSize: "9px", fontWeight: 700 }}>Rent</div>
              <div className="mt-0.5 text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800 }}>
                {displayRent ? `$${displayRent}/mo` : `$${group.budgetMin}–$${group.budgetMax}`}
              </div>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-[#FCFAF7] px-3 py-2.5">
              <div className="text-[#1B2D45]/42" style={{ fontSize: "9px", fontWeight: 700 }}>Move-in</div>
              <div className="mt-0.5 text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800 }}>{group.moveIn}</div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {displayAddress ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{ background: addressBg, border: `1px solid ${addressAccent}20`, color: addressAccent, fontSize: "10px", fontWeight: 700 }}
              >
                <MapPin className="w-3 h-3" />
                Has a place
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB627]/[0.09] px-2.5 py-1 text-[#D4990F]" style={{ fontSize: "10px", fontWeight: 700 }}>
                {pendingBadge}
              </span>
            )}
            {displayAddress && (
              <div
                className="flex items-center gap-1.5 min-w-0 rounded-full bg-[#1B2D45]/[0.05] px-2.5 py-1"
                style={{ fontSize: "10px", fontWeight: 700, color: "#1B2D45" }}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {displayAddress}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[#1B2D45]/42" style={{ fontSize: "10px", fontWeight: 700 }}>
              {utilitiesIncluded == null ? "Utilities not listed" : utilitiesIncluded ? "Utilities included" : "Utilities extra"}
            </span>
            <span className="text-[#FF6B35] group-hover:translate-x-1 transition-transform flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 700 }}>
              View group <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ── Individual Card ── */

function IndividualCard({ profile }: { profile: LifestyleProfile }) {
  const topTags = Object.entries(profile.tags).slice(0, 3).map(([_, v]) => TAG_SHORT_LABELS[v] || v);
  const budgetLabel = profile.budget[1] >= 2000 ? `$${profile.budget[0]}+` : `$${profile.budget[0]}–$${profile.budget[1]}`;
  return (
    <motion.div
      className="rounded-[24px] border border-black/[0.08] bg-white p-3.5 transition-all hover:translate-y-[-3px]"
      style={{ boxShadow: "0 16px 34px rgba(27,45,69,0.06)" }}
      whileHover={{ boxShadow: "0 18px 40px rgba(27,45,69,0.1)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0 border border-[#1B2D45]/10 overflow-hidden" style={{ boxShadow: "0 8px 18px rgba(27,45,69,0.08)" }}>
          {(profile as typeof profile & { avatar?: string }).avatar ? (
            <img src={(profile as typeof profile & { avatar?: string }).avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#FF6B35" }}>{profile.firstName[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{profile.firstName} {profile.initial}</h3>
              {profile.isEarlyAdopter && <EarlyAdopterBadge size="sm" />}
            </div>
            {profile.compatibility != null && <CompatRing score={profile.compatibility} size={34} />}
          </div>
          <p className="text-[#1B2D45]/55" style={{ fontSize: "11px" }}>{profile.year} · {profile.program}</p>
        </div>
      </div>
      <p className="text-[#1B2D45]/60 mt-2" style={{ fontSize: "11px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{profile.bio}</p>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-lg bg-[#1B2D45]/[0.05] text-[#1B2D45]/60 border border-[#1B2D45]/[0.06]" style={{ fontSize: "9px", fontWeight: 600 }}>{budgetLabel}/mo</span>
        <span className="px-2 py-0.5 rounded-lg bg-[#1B2D45]/[0.05] text-[#1B2D45]/60 border border-[#1B2D45]/[0.06]" style={{ fontSize: "9px", fontWeight: 600 }}>{profile.moveIn}</span>
        {topTags.map((t) => <span key={t} className="px-2 py-0.5 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 border border-[#FF6B35]/10" style={{ fontSize: "9px", fontWeight: 500 }}>{t}</span>)}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button className="flex-1 py-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all flex items-center justify-center gap-1.5" style={{ fontSize: "11px", fontWeight: 700 }}>
          <MessageCircle className="w-3 h-3" /> Invite to Group
        </button>
        <button className="py-2 px-3 rounded-xl text-[#1B2D45]/55 hover:text-[#1B2D45] transition-all border border-black/[0.08] bg-[#FCFAF7]" style={{ fontSize: "11px", fontWeight: 600 }}>View</button>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   Profile Quiz
   ════════════════════════════════════════════════════════ */

function ProfileQuiz({ onComplete, skipKeys = [], skipGenderHousing = false }: { onComplete: (tags: Record<string, string>, budget: [number, number], moveIn: string, gender: string) => void; skipKeys?: string[]; skipGenderHousing?: boolean }) {
  const categories = LIFESTYLE_CATEGORIES.filter((c) => !skipKeys.includes(c.key));
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState<[number, number] | null>(null);
  const [moveIn, setMoveIn] = useState("");
  const [genderHousing, setGenderHousing] = useState("");
  const totalSteps = categories.length + (skipGenderHousing ? 1 : 2);
  const progress = ((step + 1) / totalSteps) * 100;
  const currentCat = step < categories.length ? categories[step] : null;
  const isBudgetStep = step === categories.length;
  const isGenderStep = !skipGenderHousing && step === categories.length + 1;
  const canNext = currentCat ? !!tags[currentCat.key] : isBudgetStep ? !!budget && !!moveIn : !!genderHousing;
  function next() { if (step < totalSteps - 1) setStep(step + 1); else onComplete(tags, budget!, moveIn, skipGenderHousing ? "" : genderHousing); }

  return (
    <div className="max-w-[520px] mx-auto">
      <div className="mb-6">
        <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(27,45,69,0.04)" }}>
          <motion.div className="h-full bg-[#FF6B35] rounded-full" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 500 }}>Step {step + 1} of {totalSteps}</span>
          {step > 0 && <button onClick={() => setStep(step - 1)} className="text-[#FF6B35] hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>← Back</button>}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
          {currentCat && (
            <div>
              <div className="flex items-center gap-3 mb-2"><span style={{ fontSize: "28px" }}>{currentCat.emoji}</span><h2 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>{currentCat.label}</h2></div>
              <p className="text-[#1B2D45]/55 mb-5" style={{ fontSize: "13px" }}>Pick what describes you best</p>
              <div className="space-y-2.5">
                {currentCat.options.map((opt) => {
                  const sel = tags[currentCat.key] === opt;
                  return <motion.button key={opt} onClick={() => setTags(p => ({ ...p, [currentCat.key]: opt }))} className={`w-full text-left px-4 py-3.5 rounded-xl transition-all ${sel ? "bg-[#FF6B35]/[0.04]" : "bg-white hover:translate-y-[-1px]"}`} style={{ fontSize: "14px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45", border: sel ? "2.5px solid #FF6B35" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: sel ? "3px 3px 0px rgba(255,107,53,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.98 }}>{opt}</motion.button>;
                })}
              </div>
            </div>
          )}
          {isBudgetStep && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>💰 Budget &amp; Timeline</h2>
              <p className="text-[#1B2D45]/55 mb-5" style={{ fontSize: "13px" }}>Helps match you with students in the same range</p>
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Monthly budget</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {BUDGET_OPTIONS.map((b) => { const sel = budget && budget[0] === b.range[0] && budget[1] === b.range[1]; return <motion.button key={b.label} onClick={() => setBudget(b.range)} className={`px-3 py-3 rounded-xl transition-all ${sel ? "bg-[#FF6B35]/[0.04]" : "bg-white"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45aa", border: sel ? "2.5px solid #FF6B35" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: sel ? "3px 3px 0px rgba(255,107,53,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.98 }}>{b.label}</motion.button>; })}
              </div>
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>When do you need a roommate?</label>
              <div className="grid grid-cols-2 gap-2">
                {MOVE_IN_OPTIONS.map((m) => { const sel = moveIn === m; return <motion.button key={m} onClick={() => setMoveIn(m)} className={`px-3 py-3 rounded-xl transition-all ${sel ? "bg-[#FF6B35]/[0.04]" : "bg-white"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45aa", border: sel ? "2.5px solid #FF6B35" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: sel ? "3px 3px 0px rgba(255,107,53,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.98 }}>{m}</motion.button>; })}
              </div>
            </div>
          )}
          {isGenderStep && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>🏠 Housing Preference</h2>
              <p className="text-[#1B2D45]/55 mb-5" style={{ fontSize: "13px" }}>Used to filter matches — never shown on your profile</p>
              <div className="space-y-2.5 mb-6">
                {GENDER_HOUSING_OPTIONS.map((opt) => { const sel = genderHousing === opt; return <motion.button key={opt} onClick={() => setGenderHousing(opt)} className={`w-full text-left px-4 py-3.5 rounded-xl transition-all ${sel ? "bg-[#FF6B35]/[0.04]" : "bg-white"}`} style={{ fontSize: "14px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45", border: sel ? "2.5px solid #FF6B35" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: sel ? "3px 3px 0px rgba(255,107,53,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.98 }}>{opt}</motion.button>; })}
              </div>
              <div className="rounded-xl p-4 flex items-start gap-2.5" style={{ background: "rgba(46,196,182,0.04)", border: "2px solid rgba(46,196,182,0.15)" }}>
                <Shield className="w-4 h-4 text-[#2EC4B6] shrink-0 mt-0.5" />
                <div><p className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>Your privacy is protected</p><p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>Only your first name and lifestyle tags are visible. Contact info is never shared publicly.</p></div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <motion.button onClick={next} disabled={!canNext} className={`mt-6 w-full py-3.5 rounded-xl text-white transition-all ${canNext ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`} style={{ fontSize: "14px", fontWeight: 700, border: canNext ? "2px solid #e55e2e" : "none", boxShadow: canNext ? "4px 4px 0px rgba(255,107,53,0.2)" : "none" }} whileTap={canNext ? { scale: 0.97 } : undefined}>
        {step < totalSteps - 1 ? "Next →" : "Find Roommates 🎯"}
      </motion.button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Getting Started
   ════════════════════════════════════════════════════════ */

type LookingMode = null | "solo" | "with-friends";

function GettingStarted({ onSelect, allowGroupCreation }: { onSelect: (mode: Exclude<LookingMode, null>, count: number, need: number) => void; allowGroupCreation: boolean }) {
  const [mode, setMode] = useState<LookingMode>(null);
  const [haveCount, setHaveCount] = useState(2);
  const [needCount, setNeedCount] = useState(1);

  return (
    <div className="max-w-[480px] mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[#FF6B35] mb-4" style={{ fontSize: "11px", fontWeight: 700, background: "rgba(255,107,53,0.08)", border: "2px solid rgba(255,107,53,0.12)" }}><Sparkles className="w-3 h-3" /> Find your people</div>
        <h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1.2 }}>How are you looking<br />for roommates?</h1>
        <p className="text-[#1B2D45]/55 mt-2" style={{ fontSize: "13px" }}>We&apos;ll set you up based on your situation</p>
      </motion.div>

      {!mode && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <motion.button onClick={() => setMode("solo")} className="w-full bg-white rounded-2xl p-5 text-left transition-all group" style={{ border: "2.5px solid rgba(27,45,69,0.06)", boxShadow: "4px 4px 0px rgba(27,45,69,0.06)" }} whileHover={{ y: -2, boxShadow: "6px 6px 0px rgba(27,45,69,0.1)" }} whileTap={{ y: 1, boxShadow: "2px 2px 0px rgba(27,45,69,0.06)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,53,0.08)", border: "2px solid rgba(255,107,53,0.12)" }}><User className="w-6 h-6 text-[#FF6B35]" /></div>
              <div><h3 className="text-[#1B2D45] group-hover:text-[#FF6B35] transition-colors" style={{ fontSize: "15px", fontWeight: 700 }}>I&apos;m on my own</h3><p className="text-[#1B2D45]/55" style={{ fontSize: "12px" }}>Looking to join a house with availability</p></div>
              <ChevronRight className="w-4 h-4 text-[#1B2D45]/15 ml-auto shrink-0" />
            </div>
          </motion.button>
          {allowGroupCreation ? (
            <motion.button onClick={() => setMode("with-friends")} className="w-full bg-white rounded-2xl p-5 text-left transition-all group" style={{ border: "2.5px solid rgba(27,45,69,0.06)", boxShadow: "4px 4px 0px rgba(27,45,69,0.06)" }} whileHover={{ y: -2, boxShadow: "6px 6px 0px rgba(27,45,69,0.1)" }} whileTap={{ y: 1, boxShadow: "2px 2px 0px rgba(27,45,69,0.06)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(46,196,182,0.08)", border: "2px solid rgba(46,196,182,0.12)" }}><Users className="w-6 h-6 text-[#2EC4B6]" /></div>
                <div><h3 className="text-[#1B2D45] group-hover:text-[#2EC4B6] transition-colors" style={{ fontSize: "15px", fontWeight: 700 }}>I have friends already</h3><p className="text-[#1B2D45]/55" style={{ fontSize: "12px" }}>We already have a place and need to fill a room</p></div>
                <ChevronRight className="w-4 h-4 text-[#1B2D45]/15 ml-auto shrink-0" />
              </div>
            </motion.button>
          ) : (
            <div className="w-full bg-white rounded-2xl p-5 text-left" style={{ border: "2.5px solid rgba(27,45,69,0.06)", boxShadow: "4px 4px 0px rgba(27,45,69,0.06)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(27,45,69,0.05)", border: "2px solid rgba(27,45,69,0.08)" }}><Users className="w-6 h-6 text-[#1B2D45]/45" /></div>
                <div><h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Group creation is student-only</h3><p className="text-[#1B2D45]/55" style={{ fontSize: "12px" }}>Landlord accounts can browse roommate availability, but can&apos;t create groups.</p></div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {mode === "solo" && (
          <motion.div key="solo" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="text-left">
            <button onClick={() => setMode(null)} className="text-[#FF6B35] mb-4 hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>← Back</button>
            <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "20px", fontWeight: 800 }}>How many roommates do you need?</h2>
            <p className="text-[#1B2D45]/55 mb-5" style={{ fontSize: "12px" }}>We&apos;ll show you groups that have room</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4].map((n) => <motion.button key={n} onClick={() => setNeedCount(n)} className="py-3 rounded-xl transition-all" style={{ fontSize: "18px", fontWeight: needCount === n ? 800 : 500, color: needCount === n ? "#FF6B35" : "#1B2D45aa", background: needCount === n ? "rgba(255,107,53,0.04)" : "white", border: needCount === n ? "2.5px solid #FF6B35" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: needCount === n ? "3px 3px 0px rgba(255,107,53,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.97 }}>{n}{n === 4 ? "+" : ""}</motion.button>)}
            </div>
            <motion.button onClick={() => onSelect("solo", 1, needCount)} className="w-full py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "14px", fontWeight: 700, border: "2px solid #e55e2e", boxShadow: "4px 4px 0px rgba(255,107,53,0.2)" }} whileTap={{ scale: 0.97 }}>Continue →</motion.button>
          </motion.div>
        )}
        {mode === "with-friends" && (
          <motion.div key="friends" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="text-left">
            <button onClick={() => setMode(null)} className="text-[#FF6B35] mb-4 hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>← Back</button>
            <h2 className="text-[#1B2D45] mb-5" style={{ fontSize: "20px", fontWeight: 800 }}>Tell us about your group</h2>
            <div className="mb-5">
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>How many people do you have? (including you)</label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((n) => <motion.button key={n} onClick={() => setHaveCount(n)} className="py-3 rounded-xl transition-all" style={{ fontSize: "18px", fontWeight: haveCount === n ? 800 : 500, color: haveCount === n ? "#2EC4B6" : "#1B2D45aa", background: haveCount === n ? "rgba(46,196,182,0.04)" : "white", border: haveCount === n ? "2.5px solid #2EC4B6" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: haveCount === n ? "3px 3px 0px rgba(46,196,182,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.97 }}>{n}</motion.button>)}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>How many more do you need?</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => <motion.button key={n} onClick={() => setNeedCount(n)} className="py-3 rounded-xl transition-all" style={{ fontSize: "18px", fontWeight: needCount === n ? 800 : 500, color: needCount === n ? "#2EC4B6" : "#1B2D45aa", background: needCount === n ? "rgba(46,196,182,0.04)" : "white", border: needCount === n ? "2.5px solid #2EC4B6" : "2.5px solid rgba(27,45,69,0.06)", boxShadow: needCount === n ? "3px 3px 0px rgba(46,196,182,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)" }} whileTap={{ scale: 0.97 }}>{n}{n === 4 ? "+" : ""}</motion.button>)}
              </div>
            </div>
            <motion.button onClick={() => onSelect("with-friends", haveCount, needCount)} className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white hover:bg-[#28b0a3] transition-all" style={{ fontSize: "14px", fontWeight: 700, border: "2px solid #28b0a3", boxShadow: "4px 4px 0px rgba(46,196,182,0.2)" }} whileTap={{ scale: 0.97 }}>Create Group →</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Filter Bar
   ════════════════════════════════════════════════════════ */

const FILTER_OPTIONS = [
  { key: "all", label: "All Groups" },
  { key: "1more", label: "Open Room" },
  { key: "girls", label: "Women Only" },
  { key: "coed", label: "Co-ed" },
  { key: "campus", label: "Near Campus" },
  { key: "downtown", label: "Downtown" },
];

function FilterBar({ active, onFilter }: { active: string; onFilter: (key: string) => void }) {
  const activeLabel = FILTER_OPTIONS.find((option) => option.key === active)?.label ?? "All Groups";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2"
      style={{ boxShadow: "0 10px 22px rgba(27,45,69,0.04)" }}
    >
      <div className="flex items-center gap-2 text-[#1B2D45]/55 shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span style={{ fontSize: "11px", fontWeight: 700 }}>Filter</span>
      </div>
      <div className="relative">
        <select
          value={active}
          onChange={(event) => onFilter(event.target.value)}
          aria-label="Filter roommate groups"
          className="appearance-none rounded-lg border border-black/[0.06] bg-[#FCFAF7] py-2 pl-3 pr-9 text-[#1B2D45] outline-none transition-all hover:border-black/[0.12] focus:border-[#FF6B35]/30"
          style={{ fontSize: "11px", fontWeight: 700, minWidth: "150px" }}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-[#1B2D45]/30" />
      </div>
      {active !== "all" && (
        <motion.button
          type="button"
          onClick={() => onFilter("all")}
          className="rounded-lg px-2.5 py-2 text-[#FF6B35] hover:bg-[#FF6B35]/[0.05] transition-colors"
          style={{ fontSize: "10px", fontWeight: 700 }}
          whileTap={{ scale: 0.97 }}
        >
          Clear
        </motion.button>
      )}
      <span className="hidden md:inline text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>
        {activeLabel}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

const STORAGE_KEY = "cribb_roommate_profile";

interface SavedProfile {
  tags: Record<string, string>;
  budget: [number, number];
  moveIn: string;
  genderHousing: string;
  mode: "solo" | "with-friends";
  defaultTab: "groups" | "individuals";
}

function loadProfile(): SavedProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.tags && data.budget && data.mode) return data as SavedProfile;
  } catch { /* corrupted — ignore */ }
  return null;
}

function saveProfile(profile: SavedProfile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* quota — ignore */ }
}

function clearRoommateProfile() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export default function RoommatesPage() {
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const isLandlord = user?.role === "landlord";
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [myMode, setMyMode] = useState<"solo" | "with-friends" | null>(null);
  const [myTags, setMyTags] = useState<Record<string, string>>({});
  const [myBudget, setMyBudget] = useState<[number, number]>([500, 650]);
  const [tab, setTab] = useState<"groups" | "individuals">("groups");
  const [activeFilter, setActiveFilter] = useState("all");
  const [apiGroups, setApiGroups] = useState<RoommateGroup[] | null>(null);
  const [apiIndividuals, setApiIndividuals] = useState<LifestyleProfile[] | null>(null);
  const [tenantSkipKeys, setTenantSkipKeys] = useState<string[]>([]);
  const [tenantGender, setTenantGender] = useState<string | null>(null);
  const [tenantValues, setTenantValues] = useState<Record<string, string>>({});
  const visibleGroups = useMemo(() => (hydrated ? (apiGroups !== null ? [] : getVisibleRoommateGroups()) : []), [hydrated, apiGroups]);
  const claimState = useMemo(() => (hydrated ? getLandlordClaimState() : null), [hydrated]);

  // Hydrate: try API quiz profile first, fall back to localStorage
  useEffect(() => {
    async function init() {
      if (user) {
        try {
          const profile = await api.roommates.getMyQuiz();
          if (profile && profile.quiz_completed) {
            // Map backend profile to local tag format
            const tags: Record<string, string> = {};
            const fieldMap: Record<string, string> = {
              sleep_schedule: "sleep", cleanliness: "cleanliness", noise_level: "noise",
              guests: "guests", study_habits: "study", smoking: "smoking",
              pets: "pets", kitchen_use: "cooking",
            };
            for (const [backendField, localKey] of Object.entries(fieldMap)) {
              const val = (profile as unknown as Record<string, unknown>)[backendField];
              if (val) {
                // Find the matching display label from LIFESTYLE_CATEGORIES
                const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === localKey);
                if (cat) {
                  // Try to match enum value to display option
                  const matchedOption = cat.options.find((opt) => {
                    const normalized = String(val).toLowerCase().replace(/_/g, " ");
                    return opt.toLowerCase().includes(normalized) || normalized.includes(opt.toLowerCase().split(" ")[0]);
                  });
                  if (matchedOption) tags[localKey] = matchedOption;
                }
              }
            }

            const budgetMap: Record<string, [number, number]> = {
              under_500: [0, 500], "500_650": [500, 650], "650_800": [650, 800], "800_plus": [800, 2000],
            };
            const budget = profile.budget_range ? (budgetMap[profile.budget_range] || [500, 650]) : [500, 650];
            const mode = profile.search_type === "have_friends" ? "with-friends" : "solo";
            const defaultTab = mode === "solo" ? "groups" : "individuals";

            setMyTags(tags);
            setMyBudget(budget as [number, number]);
            setMyMode(mode);
            setStarted(true);
            setHasProfile(true);
            setSetupDone(true);
            setTab(defaultTab);

            // Cache locally too
            saveProfile({ tags, budget: budget as [number, number], moveIn: "", genderHousing: "", mode, defaultTab });

            // Try fetching API groups and individuals
            try {
              const groups = await api.roommates.browseGroups();
              if (groups && groups.length > 0) {
                // Convert API groups to local RoommateGroup format for display
                setApiGroups(groups as unknown as RoommateGroup[]);
              }
            } catch { /* use mock */ }

            try {
              const individuals = await api.roommates.browseIndividuals();
              if (individuals && individuals.length > 0) {
                setApiIndividuals(individuals.map((p) => ({
                  id: String(p.user_id),
                  firstName: p.first_name,
                  initial: p.last_initial,
                  year: p.year || "",
                  program: p.program || "",
                  budget: [0, 0] as [number, number],
                  moveIn: p.roommate_timing || "",
                  leaseLength: "",
                  bio: p.bio || "",
                  tags: {},
                  compatibility: p.compatibility_score,
                  avatar: p.profile_photo_url || undefined,
                })));
              }
            } catch { /* use mock */ }

            setHydrated(true);
            return;
          }
        } catch { /* no API profile — check localStorage */ }

        // Check for partial tenant profile (tenant card filled, quiz not done)
        try {
          const profile = await api.roommates.getMyQuiz();
          if (profile && !profile.quiz_completed) {
            const skip: string[] = [];
            const vals: Record<string, string> = {};
            if (profile.cleanliness) { skip.push("cleanliness"); vals.cleanliness = profile.cleanliness; }
            if (profile.smoking) { skip.push("smoking"); vals.smoking = profile.smoking; }
            if (profile.pets) { skip.push("pets"); vals.pets = profile.pets; }
            if (skip.length > 0) { setTenantSkipKeys(skip); setTenantValues(vals); }
            if (profile.gender_housing_pref) { setTenantGender(profile.gender_housing_pref); vals.gender_housing_pref = profile.gender_housing_pref; setTenantValues(vals); }
          }
        } catch { /* no profile at all */ }
      }

      // Fallback to localStorage
      const saved = loadProfile();
      if (saved) {
        setMyTags(saved.tags);
        setMyBudget(saved.budget);
        setMyMode(saved.mode);
        setStarted(true);
        setHasProfile(true);
        setSetupDone(true);
        setTab(saved.defaultTab);
      }
      setHydrated(true);
    }
    init();
  }, [user]);

  const handleQuizComplete = useCallback(async (tags: Record<string, string>, budget: [number, number], moveIn: string, genderHousing: string) => {
    setMyTags(tags);
    setMyBudget(budget);
    setHasProfile(true);

    // Try submitting to API
    if (user) {
      try {
        const tagToEnum: Record<string, Record<string, string>> = {
          sleep: { "Early Bird (before 10pm)": "early_bird", "Night Owl (after midnight)": "night_owl", "Flexible": "flexible" },
          cleanliness: { "Very Tidy": "very_tidy", "Reasonably Clean": "reasonably_clean", "Relaxed": "relaxed" },
          noise: { "Quiet — I need silence": "quiet", "Moderate — music at a normal volume": "moderate", "Loud — I play music / have people over": "loud" },
          guests: { "Rarely / Never": "rarely", "Sometimes (weekends)": "sometimes", "Often — I'm social": "often" },
          study: { "Study at home": "at_home", "Library / campus mostly": "library", "Mix of both": "mix" },
          smoking: { "No smoking at all": "no_smoking", "Outside only": "outside_only", "I smoke / vape": "i_smoke" },
          pets: { "No pets please": "no_pets", "I'm fine with pets": "fine_with_pets", "I have a pet": "i_have_a_pet" },
          cooking: { "I cook daily": "cook_daily", "A few times a week": "few_times_week", "Mostly takeout / meal plan": "takeout" },
        };

        const budgetToEnum = (b: [number, number]) => {
          if (b[1] <= 500) return "under_500";
          if (b[1] <= 650) return "500_650";
          if (b[1] <= 800) return "650_800";
          return "800_plus";
        };

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

        await api.roommates.submitQuiz({
          sleep_schedule: tagToEnum.sleep?.[tags.sleep] || "flexible",
          cleanliness: tagToEnum.cleanliness?.[tags.cleanliness] || tenantValues.cleanliness || "reasonably_clean",
          noise_level: tagToEnum.noise?.[tags.noise] || "moderate",
          guests: tagToEnum.guests?.[tags.guests] || "sometimes",
          study_habits: tagToEnum.study?.[tags.study] || "mix",
          smoking: tagToEnum.smoking?.[tags.smoking] || tenantValues.smoking || "no_smoking",
          pets: tagToEnum.pets?.[tags.pets] || tenantValues.pets || "fine_with_pets",
          kitchen_use: tagToEnum.cooking?.[tags.cooking] || "few_times_week",
          budget_range: budgetToEnum(budget),
          roommate_timing: moveInToEnum(moveIn),
          gender_housing_pref: genderHousing ? genderToEnum(genderHousing) : (tenantGender || "no_preference"),
          search_type: "on_my_own",
        });
      } catch { /* API failed — quiz still works locally */ }
    }
  }, [user, tenantValues, tenantGender]);

  const handleSetupSelect = (mode: Exclude<LookingMode, null>, have: number, need: number) => {
    setMyMode(mode);
    setSetupDone(true);
    const defaultTab = mode === "solo" ? "groups" : "individuals";
    setTab(defaultTab as "groups" | "individuals");
    saveProfile({ tags: myTags, budget: myBudget, moveIn: "", genderHousing: "", mode, defaultTab: defaultTab as "groups" | "individuals" });
  };

  const handleResetProfile = () => {
    clearRoommateProfile();
    setStarted(false);
    setHasProfile(false);
    setSetupDone(false);
    setMyMode(null);
    setMyTags({});
    setMyBudget([500, 650]);
    setTab("groups");
    setActiveFilter("all");
    setApiGroups(null);
    setApiIndividuals(null);
  };

  const groupsWithCompat = useMemo(() => {
    let groups = hasProfile
      ? visibleGroups.map((g) => ({ ...g, _compat: computeGroupCompatibility(myTags, myBudget, g.members) })).sort((a, b) => b._compat - a._compat)
      : visibleGroups.map((g) => ({ ...g, _compat: 0 }));

    // Apply filters
    if (activeFilter === "1more") groups = groups.filter((g) => g.spotsNeeded === 1);
    else if (activeFilter === "girls") groups = groups.filter((g) => g.genderPreference === "Same gender preferred");
    else if (activeFilter === "coed") groups = groups.filter((g) => g.genderPreference === "Mixed gender fine" || g.genderPreference === "No preference");
    else if (activeFilter === "campus") groups = groups.filter((g) => g.preferredArea === "Near Campus");
    else if (activeFilter === "downtown") groups = groups.filter((g) => g.preferredArea === "Downtown");

    return groups;
  }, [hasProfile, myTags, myBudget, activeFilter, visibleGroups]);

  const individualsWithCompat = useMemo(() => {
    if (apiIndividuals && apiIndividuals.length > 0) return apiIndividuals;
    if (!hasProfile) return MOCK_PROFILES;
    return MOCK_PROFILES.map((p) => ({ ...p, compatibility: computeCompatibility(myTags, p.tags, myBudget, p.budget) })).sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0));
  }, [hasProfile, myTags, myBudget, apiIndividuals]);

  /* ── Loading while hydrating from localStorage ── */
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Landing page ── */
  if (!started) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] relative overflow-hidden">
        {/* Dot grid backdrop */}
        <div className="absolute inset-0 h-[55%] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(27,45,69,0.06) 1.2px, transparent 1.2px)", backgroundSize: "20px 20px" }} />

        <div className="relative max-w-[860px] mx-auto px-4 py-10 md:py-14">
          {/* Hero — clean centered */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-14 md:mb-18 pt-4 md:pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ fontSize: "11px", fontWeight: 700, color: "#FF6B35", background: "rgba(255,107,53,0.08)", border: "2px solid rgba(255,107,53,0.12)" }}>
              <Sparkles className="w-3 h-3" /> Built for student roommates
            </div>
            <h1 className="text-[#1B2D45] mx-auto" style={{ fontSize: isMobile ? "34px" : "48px", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.025em", maxWidth: "560px" }}>
              Find your perfect roommates
            </h1>
            <p className="text-[#1B2D45]/55 mt-4 mx-auto" style={{ fontSize: "16px", lineHeight: 1.6, maxWidth: "420px" }}>
              Post your availability, share the student invite link, and find someone who fits the house vibe.
            </p>
            <motion.button
              onClick={() => setStarted(true)}
              className="mt-7 px-9 py-4 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "16px", fontWeight: 700, border: "2.5px solid #e55e2e", boxShadow: "5px 5px 0px rgba(255,107,53,0.2)" }}
              whileHover={{ y: -2, boxShadow: "7px 7px 0px rgba(255,107,53,0.25)" }}
              whileTap={{ y: 2, boxShadow: "2px 2px 0px rgba(255,107,53,0.15)" }}
            >
              Get Started →
            </motion.button>
          </motion.div>

          {/* How it works — tactile bento cards */}
          <RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
              {[
                { step: "1", emoji: "📝", title: "Take the quiz", desc: "2-minute lifestyle quiz so we know your vibe — sleep, cleanliness, budget, the essentials.", color: "#FF6B35" },
                { step: "2", emoji: "🏠", title: "Post the availability", desc: "Already have a lease? Create a group for your current place and share the student invite link.", color: "#2EC4B6" },
                { step: "3", emoji: "🤝", title: "Review requests and fill it", desc: "Message, vet, and choose the right person to take the available room. No more DM chaos.", color: "#FFB627" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white rounded-2xl p-5 text-center cursor-default"
                  style={{ border: "2.5px solid #1B2D45", boxShadow: "5px 5px 0px rgba(27,45,69,0.08)" }}
                  whileHover={{ y: -4, boxShadow: "7px 7px 0px rgba(27,45,69,0.12)" }}
                >
                  <motion.div whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }} transition={{ duration: 0.3 }}>
                    <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ background: `${item.color}15`, border: `2px solid ${item.color}25` }}>
                      <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                    </div>
                  </motion.div>
                  <div className="inline-block px-2 py-0.5 rounded-md mb-2" style={{ background: `${item.color}12`, border: `1.5px solid ${item.color}20`, fontSize: "9px", fontWeight: 800, color: item.color }}>STEP {item.step}</div>
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{item.title}</h3>
                  <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "12px", lineHeight: 1.5 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>

          {/* Group preview */}
          <RevealSection delay={0.1}>
            <div className="text-center mb-5">
              <h2 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 900 }}>Availability right now</h2>
              <p className="text-[#1B2D45]/50 mt-1" style={{ fontSize: "12px" }}>Take the quiz to see your compatibility score</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
              {visibleGroups.slice(0, 4).map((g, i) => (
                <DossierGroupCard key={g.id} group={g} index={i} claimState={claimState} />
              ))}
            </div>
          </RevealSection>

          {/* Bottom CTA */}
          <RevealSection delay={0.15}>
            <div className="text-center py-8 bg-white rounded-2xl" style={{ border: "2.5px solid #1B2D45", boxShadow: "6px 6px 0px rgba(27,45,69,0.08)" }}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#2EC4B6]" />
                <span className="text-[#2EC4B6]" style={{ fontSize: "12px", fontWeight: 700 }}>Verified student email only</span>
              </div>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 900 }}>Ready to find your people?</h3>
              <p className="text-[#1B2D45]/55 mt-1 mb-4" style={{ fontSize: "12px" }}>Takes 2 minutes. Your info stays private.</p>
              <motion.button
                onClick={() => setStarted(true)}
                className="px-7 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                style={{ fontSize: "14px", fontWeight: 700, border: "2.5px solid #e55e2e", boxShadow: "4px 4px 0px rgba(255,107,53,0.2)" }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
              >
                Take the Quiz →
              </motion.button>
            </div>
          </RevealSection>
        </div>
      </div>
    );
  }

  if (!hasProfile) return <div className="min-h-screen bg-[#FAF8F4]"><div className="max-w-[700px] mx-auto px-4 py-8 md:py-12"><ProfileQuiz onComplete={handleQuizComplete} skipKeys={tenantSkipKeys} skipGenderHousing={!!tenantGender} /></div></div>;
  if (!setupDone) return <div className="min-h-screen bg-[#FAF8F4]"><div className="max-w-[700px] mx-auto px-4 py-8 md:py-12"><GettingStarted onSelect={handleSetupSelect} allowGroupCreation={!isLandlord} /></div></div>;

  /* ── Browse page ── */
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1320px] mx-auto px-4 py-6 md:py-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>Roommates</h1>
            <p className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "12px" }}>{myMode === "solo" ? "Browse houses with availability" : "Find someone for your current place"}</p>
          </div>
          {!isLandlord ? (
            <Link href="/roommates/groups/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 12px 24px rgba(255,107,53,0.18)" }}>
              <Plus className="w-3.5 h-3.5" /> Create Group
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#1B2D45]/10 bg-white text-[#1B2D45]/55" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Users className="w-3.5 h-3.5" /> Browse only
            </div>
          )}
        </div>

        {/* Edit profile bar */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-white border border-black/[0.06]" style={{ boxShadow: "0 10px 22px rgba(27,45,69,0.04)" }}>
          <Shield className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0" />
          <span className="text-[#1B2D45]/55 flex-1" style={{ fontSize: "11px" }}>Your roommate profile is active</span>
          <button onClick={handleResetProfile} className="text-[#FF6B35] hover:underline shrink-0" style={{ fontSize: "11px", fontWeight: 600 }}>✏️ Redo Quiz</button>
        </div>

        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-black/[0.08]" style={{ boxShadow: "0 10px 22px rgba(27,45,69,0.04)" }}>
              <button onClick={() => setTab("groups")} className={`px-4 py-2 rounded-lg transition-all ${tab === "groups" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/55 hover:text-[#1B2D45]"}`} style={{ fontSize: "12px", fontWeight: 600 }}><Users className="w-3.5 h-3.5 inline mr-1.5" />Groups</button>
              <button onClick={() => setTab("individuals")} className={`px-4 py-2 rounded-lg transition-all ${tab === "individuals" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/55 hover:text-[#1B2D45]"}`} style={{ fontSize: "12px", fontWeight: 600 }}><User className="w-3.5 h-3.5 inline mr-1.5" />Individuals</button>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-black/[0.06]" style={{ boxShadow: "0 10px 22px rgba(27,45,69,0.04)" }}>
              <span className="text-[#1B2D45]/42" style={{ fontSize: "11px", fontWeight: 700 }}>
                {tab === "groups" ? `${groupsWithCompat.length} groups` : `${individualsWithCompat.length} people`}
              </span>
            </div>
          </div>

          {tab === "groups" && <FilterBar active={activeFilter} onFilter={setActiveFilter} />}
        </div>

        <AnimatePresence mode="wait">
          {tab === "groups" && (
            <motion.div key="groups" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {groupsWithCompat.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "2.5px dashed rgba(27,45,69,0.12)" }}>
                  <Users className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-2" />
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>No groups match this filter</h3>
                  <p className="text-[#1B2D45]/50 mt-1" style={{ fontSize: "12px" }}>Try another filter or create your own group.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupsWithCompat.map((g, i) => <DossierGroupCard key={g.id} group={g} compatibility={hasProfile ? g._compat : undefined} index={i} claimState={claimState} />)}
                </div>
              )}
            </motion.div>
          )}
          {tab === "individuals" && (
            <motion.div key="individuals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {individualsWithCompat.map((p) => <IndividualCard key={p.id} profile={p} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}