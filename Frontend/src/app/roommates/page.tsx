"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Check, Shield, Flag, X } from "lucide-react";
import { useIsMobile } from "@/hooks";

/* ════════════════════════════════════════════════════════
   Types & Constants
   ════════════════════════════════════════════════════════ */

interface LifestyleProfile {
  id: string;
  firstName: string;
  initial: string; // last name initial only
  program: string;
  budget: [number, number]; // min, max
  moveIn: string;
  tags: Record<string, string>; // category → value
  compatibility?: number;
}

const LIFESTYLE_CATEGORIES = [
  {
    key: "sleep",
    label: "Sleep Schedule",
    emoji: "🌙",
    options: ["Early Bird (before 10pm)", "Night Owl (after midnight)", "Flexible"],
  },
  {
    key: "cleanliness",
    label: "Cleanliness",
    emoji: "✨",
    options: ["Very Tidy", "Reasonably Clean", "Relaxed"],
  },
  {
    key: "noise",
    label: "Noise Level",
    emoji: "🔊",
    options: ["Quiet — I need silence", "Moderate — music at a normal volume", "Loud — I play music / have people over"],
  },
  {
    key: "guests",
    label: "Guests",
    emoji: "👥",
    options: ["Rarely / Never", "Sometimes (weekends)", "Often — I'm social"],
  },
  {
    key: "study",
    label: "Study Habits",
    emoji: "📚",
    options: ["Study at home", "Library / campus mostly", "Mix of both"],
  },
  {
    key: "smoking",
    label: "Smoking / Vaping",
    emoji: "🚭",
    options: ["No smoking at all", "Outside only", "I smoke / vape"],
  },
  {
    key: "pets",
    label: "Pets",
    emoji: "🐾",
    options: ["No pets please", "I'm fine with pets", "I have a pet"],
  },
  {
    key: "cooking",
    label: "Kitchen Use",
    emoji: "🍳",
    options: ["I cook daily", "A few times a week", "Mostly takeout / meal plan"],
  },
];

const BUDGET_OPTIONS = [
  { label: "Under $500", range: [0, 500] as [number, number] },
  { label: "$500–$650", range: [500, 650] as [number, number] },
  { label: "$650–$800", range: [650, 800] as [number, number] },
  { label: "$800+", range: [800, 2000] as [number, number] },
];

const MOVE_IN_OPTIONS = ["Fall 2026", "Winter 2027", "Summer 2026", "Flexible"];

const GENDER_HOUSING_OPTIONS = ["Mixed gender fine", "Same gender preferred", "No preference"];

/* ════════════════════════════════════════════════════════
   Mock Profiles (demo data — will come from backend)
   ════════════════════════════════════════════════════════ */

const mockProfiles: LifestyleProfile[] = [
  {
    id: "r1", firstName: "Alex", initial: "T.", program: "Computer Science",
    budget: [500, 650], moveIn: "Fall 2026",
    tags: { sleep: "Night Owl (after midnight)", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Mix of both", smoking: "No smoking at all", pets: "I'm fine with pets", cooking: "I cook daily" },
  },
  {
    id: "r2", firstName: "Jordan", initial: "K.", program: "Business Administration",
    budget: [650, 800], moveIn: "Fall 2026",
    tags: { sleep: "Early Bird (before 10pm)", cleanliness: "Very Tidy", noise: "Quiet — I need silence", guests: "Rarely / Never", study: "Library / campus mostly", smoking: "No smoking at all", pets: "No pets please", cooking: "A few times a week" },
  },
  {
    id: "r3", firstName: "Sam", initial: "W.", program: "Engineering",
    budget: [500, 650], moveIn: "Fall 2026",
    tags: { sleep: "Night Owl (after midnight)", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Often — I'm social", study: "Study at home", smoking: "Outside only", pets: "I'm fine with pets", cooking: "Mostly takeout / meal plan" },
  },
  {
    id: "r4", firstName: "Riley", initial: "M.", program: "Kinesiology",
    budget: [650, 800], moveIn: "Winter 2027",
    tags: { sleep: "Early Bird (before 10pm)", cleanliness: "Very Tidy", noise: "Quiet — I need silence", guests: "Sometimes (weekends)", study: "Library / campus mostly", smoking: "No smoking at all", pets: "I have a pet", cooking: "I cook daily" },
  },
  {
    id: "r5", firstName: "Taylor", initial: "R.", program: "Environmental Science",
    budget: [500, 650], moveIn: "Fall 2026",
    tags: { sleep: "Flexible", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Mix of both", smoking: "No smoking at all", pets: "I'm fine with pets", cooking: "A few times a week" },
  },
  {
    id: "r6", firstName: "Morgan", initial: "L.", program: "Psychology",
    budget: [800, 2000], moveIn: "Fall 2026",
    tags: { sleep: "Night Owl (after midnight)", cleanliness: "Relaxed", noise: "Loud — I play music / have people over", guests: "Often — I'm social", study: "Mix of both", smoking: "Outside only", pets: "I'm fine with pets", cooking: "Mostly takeout / meal plan" },
  },
  {
    id: "r7", firstName: "Quinn", initial: "B.", program: "Arts",
    budget: [500, 650], moveIn: "Summer 2026",
    tags: { sleep: "Flexible", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Study at home", smoking: "No smoking at all", pets: "No pets please", cooking: "I cook daily" },
  },
];

/* ════════════════════════════════════════════════════════
   Compatibility Engine
   ════════════════════════════════════════════════════════ */

function computeCompatibility(myTags: Record<string, string>, theirTags: Record<string, string>, myBudget: [number, number], theirBudget: [number, number]): number {
  let score = 0;
  let total = 0;

  // Lifestyle matches (weighted)
  const weights: Record<string, number> = { sleep: 3, cleanliness: 3, noise: 2, guests: 2, smoking: 3, study: 1, pets: 2, cooking: 1 };

  for (const key of Object.keys(weights)) {
    const w = weights[key];
    total += w;
    if (myTags[key] === theirTags[key]) {
      score += w;
    } else {
      // Partial credit for adjacent options
      const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
      if (cat) {
        const myIdx = cat.options.indexOf(myTags[key]);
        const theirIdx = cat.options.indexOf(theirTags[key]);
        if (myIdx >= 0 && theirIdx >= 0 && Math.abs(myIdx - theirIdx) === 1) {
          score += w * 0.5;
        }
      }
    }
  }

  // Budget overlap bonus (2 points)
  total += 2;
  const overlap = Math.min(myBudget[1], theirBudget[1]) - Math.max(myBudget[0], theirBudget[0]);
  if (overlap > 0) score += 2;
  else if (Math.abs(myBudget[0] - theirBudget[0]) <= 100) score += 1;

  return Math.round((score / total) * 100);
}

/* ════════════════════════════════════════════════════════
   Profile Creation Form
   ════════════════════════════════════════════════════════ */

function ProfileForm({ onComplete }: { onComplete: (tags: Record<string, string>, budget: [number, number], moveIn: string, genderHousing: string) => void }) {
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState<[number, number] | null>(null);
  const [moveIn, setMoveIn] = useState("");
  const [genderHousing, setGenderHousing] = useState("");

  const totalSteps = LIFESTYLE_CATEGORIES.length + 2; // lifestyle + budget/movein + gender/confirm
  const progress = ((step + 1) / totalSteps) * 100;

  const currentCat = step < LIFESTYLE_CATEGORIES.length ? LIFESTYLE_CATEGORIES[step] : null;
  const canNext = currentCat ? !!tags[currentCat.key] : step === LIFESTYLE_CATEGORIES.length ? !!budget && !!moveIn : !!genderHousing;

  function next() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete(tags, budget!, moveIn, genderHousing);
    }
  }

  return (
    <div className="max-w-[560px] mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#FF6B35] rounded-full" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>Step {step + 1} of {totalSteps}</span>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="text-[#FF6B35] hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>
              ← Back
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
        >
          {/* Lifestyle question steps */}
          {currentCat && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize: "28px" }}>{currentCat.emoji}</span>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>{currentCat.label}</h2>
              </div>
              <p className="text-[#1B2D45]/40 mb-5" style={{ fontSize: "13px" }}>Pick what describes you best</p>
              <div className="space-y-2.5">
                {currentCat.options.map((opt) => {
                  const selected = tags[currentCat.key] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setTags((prev) => ({ ...prev, [currentCat.key]: opt }))}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`}
                      style={{ fontSize: "14px", fontWeight: selected ? 600 : 400, color: selected ? "#FF6B35" : "#1B2D45" }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget + Move-in step */}
          {step === LIFESTYLE_CATEGORIES.length && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>💰 Budget &amp; Timeline</h2>
              <p className="text-[#1B2D45]/40 mb-5" style={{ fontSize: "13px" }}>Helps match you with students in the same range</p>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Monthly budget</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {BUDGET_OPTIONS.map((b) => {
                  const selected = budget && budget[0] === b.range[0] && budget[1] === b.range[1];
                  return (
                    <button
                      key={b.label}
                      onClick={() => setBudget(b.range)}
                      className={`px-3 py-3 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/60 hover:border-[#FF6B35]/20 bg-white"}`}
                      style={{ fontSize: "13px", fontWeight: selected ? 600 : 400 }}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>When do you need a roommate?</label>
              <div className="grid grid-cols-2 gap-2">
                {MOVE_IN_OPTIONS.map((m) => {
                  const selected = moveIn === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMoveIn(m)}
                      className={`px-3 py-3 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/60 hover:border-[#FF6B35]/20 bg-white"}`}
                      style={{ fontSize: "13px", fontWeight: selected ? 600 : 400 }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gender housing preference + safety note */}
          {step === LIFESTYLE_CATEGORIES.length + 1 && (
            <div>
              <h2 className="text-[#1B2D45] mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>🏠 Housing Preference</h2>
              <p className="text-[#1B2D45]/40 mb-5" style={{ fontSize: "13px" }}>Used to filter matches — never shown on your profile</p>

              <div className="space-y-2.5 mb-6">
                {GENDER_HOUSING_OPTIONS.map((opt) => {
                  const selected = genderHousing === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setGenderHousing(opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`}
                      style={{ fontSize: "14px", fontWeight: selected ? 600 : 400, color: selected ? "#FF6B35" : "#1B2D45" }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Safety notice */}
              <div className="bg-[#2EC4B6]/[0.06] border border-[#2EC4B6]/20 rounded-xl p-4">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#2EC4B6] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>Your privacy is protected</p>
                    <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                      Only your first name and lifestyle tags are visible. Your last name, contact info, and housing preferences are never shared. Messaging only unlocks after a mutual match.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      <motion.button
        onClick={next}
        disabled={!canNext}
        className={`mt-6 w-full py-3.5 rounded-xl text-white transition-all ${canNext ? "bg-[#FF6B35] hover:bg-[#e55e2e] active:scale-[0.98]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`}
        style={{ fontSize: "14px", fontWeight: 700, boxShadow: canNext ? "0 4px 20px rgba(255,107,53,0.3)" : "none" }}
        whileTap={canNext ? { scale: 0.97 } : undefined}
      >
        {step < totalSteps - 1 ? "Next →" : "Find Roommates 🎯"}
      </motion.button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Compatibility Badge
   ════════════════════════════════════════════════════════ */

function CompatBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#FFB627" : "#FF6B35";
  const label = score >= 80 ? "Great Match" : score >= 60 ? "Good Match" : "Some Differences";
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1B2D45" strokeOpacity="0.04" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${score * 0.942} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "10px", fontWeight: 800, color }}>{score}</span>
      </div>
      <span style={{ fontSize: "10px", fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Profile Card (swipeable on mobile, clickable on desktop)
   ════════════════════════════════════════════════════════ */

function ProfileCard({
  profile, onInterested, onPass, onReport, isTop,
}: {
  profile: LifestyleProfile; onInterested: () => void; onPass: () => void; onReport: () => void; isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const passOpacity = useTransform(x, [-100, -30], [1, 0]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 100) onInterested();
    else if (info.offset.x < -100) onPass();
  }

  // Group tags for display
  const tagEntries = Object.entries(profile.tags);
  const budgetLabel = profile.budget[1] >= 2000 ? `$${profile.budget[0]}+` : `$${profile.budget[0]}–$${profile.budget[1]}`;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.6 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.6 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Swipe indicators */}
      {isTop && (
        <>
          <motion.div className="absolute top-6 left-6 z-20 px-3 py-1.5 rounded-lg bg-[#E71D36] text-white" style={{ opacity: passOpacity, fontSize: "14px", fontWeight: 800 }}>
            PASS
          </motion.div>
          <motion.div className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-lg bg-[#4ADE80] text-white" style={{ opacity: likeOpacity, fontSize: "14px", fontWeight: 800 }}>
            INTERESTED
          </motion.div>
        </>
      )}

      <div className="h-full bg-white rounded-2xl border border-black/[0.06] overflow-hidden flex flex-col" style={{ boxShadow: isTop ? "0 8px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.04)" }}>
        {/* Header */}
        <div className="p-5 pb-3 border-b border-black/[0.04]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center">
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#FF6B35" }}>{profile.firstName[0]}</span>
                </div>
                <div>
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>{profile.firstName} {profile.initial}</h3>
                  <p className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>{profile.program}</p>
                </div>
              </div>
            </div>
            <CompatBadge score={profile.compatibility ?? 0} />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>{budgetLabel}/mo</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>{profile.moveIn}</span>
          </div>
        </div>

        {/* Lifestyle tags */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {tagEntries.map(([key, value]) => {
            const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
            if (!cat) return null;
            return (
              <div key={key} className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5" style={{ fontSize: "14px" }}>{cat.emoji}</span>
                <div>
                  <span className="text-[#1B2D45]/30 block" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat.label}</span>
                  <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        {isTop && (
          <div className="p-4 border-t border-black/[0.04] flex items-center gap-3">
            <button onClick={onPass} className="flex-1 py-3 rounded-xl border-2 border-black/[0.06] text-[#1B2D45]/40 hover:border-[#E71D36]/20 hover:text-[#E71D36] transition-all active:scale-[0.97]" style={{ fontSize: "13px", fontWeight: 700 }}>
              Pass
            </button>
            <button onClick={onInterested} className="flex-[2] py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all active:scale-[0.97]" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}>
              I&apos;m Interested 👋
            </button>
            <button onClick={onReport} className="w-10 h-10 rounded-xl border border-black/[0.04] flex items-center justify-center text-[#1B2D45]/20 hover:text-[#E71D36] hover:border-[#E71D36]/20 transition-all" title="Report profile">
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   Grid Card (desktop view)
   ════════════════════════════════════════════════════════ */

function GridProfileCard({ profile, onInterested, onReport }: { profile: LifestyleProfile; onInterested: () => void; onReport: () => void }) {
  const budgetLabel = profile.budget[1] >= 2000 ? `$${profile.budget[0]}+` : `$${profile.budget[0]}–$${profile.budget[1]}`;
  const topTags = Object.entries(profile.tags).slice(0, 4);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden hover:shadow-lg hover:border-[#FF6B35]/15 transition-all group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center">
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#FF6B35" }}>{profile.firstName[0]}</span>
            </div>
            <div>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>{profile.firstName} {profile.initial}</h3>
              <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>{profile.program}</p>
            </div>
          </div>
          <button onClick={onReport} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/10 hover:text-[#E71D36] hover:bg-[#E71D36]/5 opacity-0 group-hover:opacity-100 transition-all" title="Report">
            <Flag className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Compat + Budget row */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <CompatBadge score={profile.compatibility ?? 0} />
        <span className="ml-auto px-2 py-0.5 rounded-md bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 600 }}>{budgetLabel}</span>
        <span className="px-2 py-0.5 rounded-md bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 600 }}>{profile.moveIn}</span>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 space-y-1.5">
        {topTags.map(([key, value]) => {
          const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
          if (!cat) return null;
          return (
            <div key={key} className="flex items-center gap-2">
              <span style={{ fontSize: "12px" }}>{cat.emoji}</span>
              <span className="text-[#1B2D45]/60 truncate" style={{ fontSize: "11px", fontWeight: 500 }}>{value}</span>
            </div>
          );
        })}
        {Object.keys(profile.tags).length > 4 && (
          <span className="text-[#1B2D45]/20" style={{ fontSize: "10px", fontWeight: 500 }}>+{Object.keys(profile.tags).length - 4} more</span>
        )}
      </div>

      {/* Action */}
      <div className="p-3 pt-0">
        <button onClick={onInterested} className="w-full py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all active:scale-[0.97]" style={{ fontSize: "12px", fontWeight: 700 }}>
          I&apos;m Interested 👋
        </button>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   Matches Tray
   ════════════════════════════════════════════════════════ */

function MatchesTray({ matches, showSheet, onCloseSheet }: { matches: LifestyleProfile[]; showSheet: boolean; onCloseSheet: () => void }) {
  const isMobile = useIsMobile();

  if (matches.length === 0) return null;

  if (!isMobile) {
    return (
      <div className="fixed top-[64px] right-0 w-[260px] h-[calc(100vh-64px)] bg-white/90 backdrop-blur-xl border-l border-black/[0.04] z-30 flex flex-col">
        <div className="p-4 border-b border-black/[0.04]">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>🤝 Interested ({matches.length})</h3>
          <p className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "10px" }}>Waiting for mutual match to unlock chat</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {matches.map((p) => (
            <div key={p.id} className="bg-[#FAF8F4] rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center">
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF6B35" }}>{p.firstName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 600 }}>{p.firstName} {p.initial}</div>
                  <div className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>{p.program}</div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: (p.compatibility ?? 0) >= 80 ? "#4ADE80" : (p.compatibility ?? 0) >= 60 ? "#FFB627" : "#FF6B35" }}>{p.compatibility}%</span>
              </div>
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[#FFB627]/[0.08] text-center" style={{ fontSize: "10px", fontWeight: 600, color: "#D4990F" }}>
                ⏳ Pending — waiting for them
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mobile bottom sheet
  return (
    <AnimatePresence>
      {showSheet && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseSheet} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[70vh] flex flex-col"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 border-b border-black/[0.04] flex items-center justify-between">
              <div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>🤝 Interested ({matches.length})</h3>
                <p className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>Mutual match unlocks messaging</p>
              </div>
              <button onClick={onCloseSheet} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {matches.map((p) => (
                <div key={p.id} className="bg-[#FAF8F4] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>{p.firstName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{p.firstName} {p.initial} · <span style={{ color: (p.compatibility ?? 0) >= 80 ? "#4ADE80" : "#FFB627" }}>{p.compatibility}%</span></div>
                    <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>{p.program} · ⏳ Pending</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

type RoommateView = "cards" | "grid";

export default function RoommatesPage() {
  const isMobile = useIsMobile();
  const [hasProfile, setHasProfile] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [myTags, setMyTags] = useState<Record<string, string>>({});
  const [myBudget, setMyBudget] = useState<[number, number]>([500, 700]);
  const [viewMode, setViewMode] = useState<RoommateView>("cards");
  const [interestedIds, setInterestedIds] = useState<string[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [showMatchesSheet, setShowMatchesSheet] = useState(false);

  const profiles = useMemo(() => {
    if (!hasProfile) return [];
    return mockProfiles
      .map((p) => ({
        ...p,
        compatibility: computeCompatibility(myTags, p.tags, myBudget, p.budget),
      }))
      .sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0));
  }, [hasProfile, myTags, myBudget]);

  const remainingProfiles = useMemo(
    () => profiles.filter((p) => !interestedIds.includes(p.id) && !passedIds.includes(p.id)),
    [profiles, interestedIds, passedIds]
  );

  const interestedProfiles = useMemo(
    () => profiles.filter((p) => interestedIds.includes(p.id)),
    [profiles, interestedIds]
  );

  const handleInterested = useCallback((id: string) => {
    setInterestedIds((prev) => [...prev, id]);
  }, []);

  const handlePass = useCallback((id: string) => {
    setPassedIds((prev) => [...prev, id]);
  }, []);

  function handleProfileComplete(tags: Record<string, string>, budget: [number, number]) {
    setMyTags(tags);
    setMyBudget(budget);
    setHasProfile(true);
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F4" }}>
      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, letterSpacing: "-0.02em" }}>
              Find Roommates 🤝
            </h1>
            <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
              {hasProfile ? `${remainingProfiles.length} students to review · ${interestedIds.length} interested` : showForm ? "Build your lifestyle profile to start matching" : "Match with compatible roommates based on lifestyle"}
            </p>
          </div>
          {hasProfile && (
            <div className="flex items-center gap-2">
              {!isMobile && (
                <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5">
                  {(["cards", "grid"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 rounded-md transition-all duration-200 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      {mode === "cards" ? "🃏 Cards" : "▦ Grid"}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setHasProfile(false); setShowForm(true); }} className="px-3 py-1.5 rounded-lg border border-black/[0.06] text-[#1B2D45]/40 hover:text-[#FF6B35] hover:border-[#FF6B35]/20 transition-all" style={{ fontSize: "12px", fontWeight: 600 }}>
                ✏️ Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Safety banner */}
      {hasProfile && (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2EC4B6]/[0.06] border border-[#2EC4B6]/10">
            <Shield className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0" />
            <span className="text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 500 }}>Profiles are anonymous — first name &amp; lifestyle only. Messaging unlocks after mutual match.</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!hasProfile && !showForm ? (
        /* ─── Welcome Screen ─── */
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
            {/* Hero */}
            <div className="relative px-6 md:px-10 pt-10 md:pt-14 pb-8 text-center overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.04) 0%, transparent 70%)" }} />
              <div className="absolute top-4 left-[15%] text-[#1B2D45]/[0.03] select-none" style={{ fontSize: "80px" }}>🌙</div>
              <div className="absolute top-8 right-[12%] text-[#1B2D45]/[0.03] select-none" style={{ fontSize: "60px" }}>✨</div>
              <div className="absolute bottom-2 left-[25%] text-[#1B2D45]/[0.03] select-none" style={{ fontSize: "50px" }}>🍳</div>
              <div className="absolute bottom-6 right-[20%] text-[#1B2D45]/[0.03] select-none" style={{ fontSize: "65px" }}>🎵</div>

              <div className="relative z-10">
                <span style={{ fontSize: "48px" }}>🤝</span>
                <h2 className="text-[#1B2D45] mt-4" style={{ fontSize: isMobile ? "26px" : "34px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Stop rolling the dice<br />on roommates.
                </h2>
                <p className="text-[#1B2D45]/50 mt-3 max-w-[460px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.7 }}>
                  Answer 10 quick lifestyle questions and we&apos;ll match you with UofG students who actually live like you. No awkward surprises in September.
                </p>
              </div>
            </div>

            {/* Feature cards */}
            <div className={`px-6 md:px-10 pb-8 grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {[
                { emoji: "🎯", title: "Compatibility Matching", desc: "We compare 8 lifestyle habits — sleep, cleanliness, noise, guests, and more — to find people you'll actually get along with." },
                { emoji: "🔒", title: "Anonymous Until Match", desc: "Only your first name and lifestyle tags are visible. No photos, no last name, no contact info shared until you both say yes." },
                { emoji: "💬", title: "Chat After Match", desc: "When both students express interest, messaging unlocks. All conversations stay on cribb — your contact info stays private." },
              ].map((f) => (
                <div key={f.title} className="bg-[#FAF8F4] rounded-xl p-4 border border-black/[0.02]">
                  <span style={{ fontSize: "24px" }}>{f.emoji}</span>
                  <h3 className="text-[#1B2D45] mt-2" style={{ fontSize: "14px", fontWeight: 700 }}>{f.title}</h3>
                  <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="px-6 md:px-10 pb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-black/[0.04]" />
                <span className="text-[#1B2D45]/30 shrink-0" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>HOW IT WORKS</span>
                <div className="h-px flex-1 bg-black/[0.04]" />
              </div>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
                {[
                  { step: "1", label: "Take the quiz", sub: "2 min, 10 questions" },
                  { step: "2", label: "Browse matches", sub: "Sorted by compatibility" },
                  { step: "3", label: "Express interest", sub: "Swipe or tap" },
                  { step: "4", label: "Match & chat", sub: "When it's mutual" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B35]/[0.08] flex items-center justify-center shrink-0">
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF6B35" }}>{s.step}</span>
                    </div>
                    <div>
                      <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{s.label}</div>
                      <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 md:px-10 pb-10 text-center">
              <motion.button
                onClick={() => setShowForm(true)}
                className="px-8 py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors active:scale-[0.98]"
                style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 24px rgba(255,107,53,0.3)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Create My Profile →
              </motion.button>
              <p className="text-[#1B2D45]/20 mt-3" style={{ fontSize: "11px" }}>Takes about 2 minutes · Requires verified UofG email</p>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {["A", "J", "S", "R", "T"].map((letter, i) => (
                <div key={letter} className="w-7 h-7 rounded-full border-2 border-[#FAF8F4] bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center" style={{ zIndex: 5 - i }}>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#FF6B35" }}>{letter}</span>
                </div>
              ))}
            </div>
            <span className="text-[#1B2D45]/30" style={{ fontSize: "12px", fontWeight: 500 }}>47 students matched this semester</span>
          </div>
        </div>
      ) : !hasProfile && showForm ? (
        /* ─── Profile Form ─── */
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 md:p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
            <ProfileForm onComplete={handleProfileComplete} />
          </div>
        </div>
      ) : remainingProfiles.length === 0 ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-black/[0.06]">
            <span style={{ fontSize: "48px" }}>🎉</span>
            <h3 className="text-[#1B2D45] mt-4 text-center" style={{ fontSize: "20px", fontWeight: 800 }}>You&apos;ve reviewed everyone!</h3>
            <p className="text-[#1B2D45]/40 mt-2 text-center max-w-[360px]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              {interestedIds.length > 0 ? `You expressed interest in ${interestedIds.length} student${interestedIds.length !== 1 ? "s" : ""}. We'll notify you when there's a mutual match.` : "Check back soon — new students are joining daily."}
            </p>
            <button onClick={() => { setPassedIds([]); }} className="mt-5 px-5 py-2.5 rounded-xl border-2 border-[#FF6B35]/20 text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Review Passed Profiles
            </button>
          </div>
        </div>
      ) : viewMode === "cards" || isMobile ? (
        <div className={`max-w-[420px] mx-auto px-4 md:px-6 py-4 ${interestedIds.length > 0 && !isMobile ? "mr-[280px] ml-auto" : ""}`}>
          <div className="relative" style={{ height: "520px" }}>
            <AnimatePresence>
              {remainingProfiles.slice(0, 2).map((profile, i) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isTop={i === 0}
                  onInterested={() => handleInterested(profile.id)}
                  onPass={() => handlePass(profile.id)}
                  onReport={() => {/* TODO: report modal */}}
                />
              ))}
            </AnimatePresence>
          </div>
          <p className="text-center text-[#1B2D45]/20 mt-3" style={{ fontSize: "11px" }}>
            {isMobile ? "Swipe right if interested, left to pass" : "Drag card or use buttons below"}
          </p>
        </div>
      ) : (
        <div className={`max-w-[1200px] mx-auto px-4 md:px-6 py-4 ${interestedIds.length > 0 ? "mr-[260px]" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {remainingProfiles.map((profile) => (
              <GridProfileCard
                key={profile.id}
                profile={profile}
                onInterested={() => handleInterested(profile.id)}
                onReport={() => {/* TODO */}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Matches tray */}
      <MatchesTray matches={interestedProfiles} showSheet={showMatchesSheet} onCloseSheet={() => setShowMatchesSheet(false)} />

      {/* Mobile floating matches badge */}
      <AnimatePresence>
        {isMobile && hasProfile && interestedIds.length > 0 && !showMatchesSheet && (
          <motion.div
            className="fixed bottom-4 right-4 z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <button
              onClick={() => setShowMatchesSheet(true)}
              className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(255,107,53,0.4)] active:scale-95 transition-transform"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              🤝 {interestedIds.length} interested
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
