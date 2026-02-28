"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useInView } from "framer-motion";
import { Check, Shield, Flag, X, Target, Lock, MessageCircle, Footprints, Bookmark, MessageCircleMore } from "lucide-react";
import { useIsMobile } from "@/hooks";
import Image from "next/image";

/* ════════════════════════════════════════════════════════
   Types & Constants
   ════════════════════════════════════════════════════════ */

interface LifestyleProfile {
  id: string;
  firstName: string;
  initial: string;
  year: string;
  program: string;
  budget: [number, number];
  moveIn: string;
  leaseLength: string;
  bio: string;
  tags: Record<string, string>;
  compatibility?: number;
  saved?: boolean;
}

const TAG_SUBTITLES: Record<string, string> = {
  "Early Bird (before 10pm)": "Up by 7–8am",
  "Night Owl (after midnight)": "Up past midnight",
  "Flexible": "Goes with the flow",
  "Very Tidy": "Tidies daily",
  "Reasonably Clean": "Weekly tidying",
  "Relaxed": "Easygoing about mess",
  "Quiet — I need silence": "Prefers calm space",
  "Moderate — music at a normal volume": "Casual background noise",
  "Loud — I play music / have people over": "Loves energy",
  "Rarely / Never": "Values quiet space",
  "Sometimes (weekends)": "Social on weekends",
  "Often — I'm social": "Loves having guests",
  "Study at home": "Studies at home",
  "Library / campus mostly": "Studies on campus",
  "Mix of both": "Flexible study spots",
  "No smoking at all": "Smoke-free",
  "Outside only": "Outdoors only",
  "I smoke / vape": "Smokes / vapes",
  "No pets please": "No pets",
  "I'm fine with pets": "Open to pets",
  "I have a pet": "Has a pet",
  "I cook daily": "Shares kitchen a lot",
  "A few times a week": "Occasional cook",
  "Mostly takeout / meal plan": "Rarely cooks",
};

const TAG_SHORT_LABELS: Record<string, string> = {
  "Early Bird (before 10pm)": "Early Bird",
  "Night Owl (after midnight)": "Night Owl",
  "Flexible": "Flexible",
  "Very Tidy": "Very Clean",
  "Reasonably Clean": "Relaxed Clean",
  "Relaxed": "Easy Going",
  "Quiet — I need silence": "Quiet",
  "Moderate — music at a normal volume": "Moderate Noise",
  "Loud — I play music / have people over": "Social",
  "Rarely / Never": "Quiet Space",
  "Sometimes (weekends)": "Social",
  "Often — I'm social": "Very Social",
  "Study at home": "Studious",
  "Library / campus mostly": "Campus Studier",
  "Mix of both": "Flexible",
  "No smoking at all": "Non-Smoker",
  "Outside only": "Outside Smoker",
  "I smoke / vape": "Smoker",
  "No pets please": "No Pets",
  "I'm fine with pets": "Pet Friendly",
  "I have a pet": "Has Pet",
  "I cook daily": "Cooks Often",
  "A few times a week": "Cooks Sometimes",
  "Mostly takeout / meal plan": "Takeout",
};

const LIFESTYLE_CATEGORIES = [
  { key: "sleep", label: "Sleep Schedule", emoji: "🌙", options: ["Early Bird (before 10pm)", "Night Owl (after midnight)", "Flexible"] },
  { key: "cleanliness", label: "Cleanliness", emoji: "✨", options: ["Very Tidy", "Reasonably Clean", "Relaxed"] },
  { key: "noise", label: "Noise Level", emoji: "🔊", options: ["Quiet — I need silence", "Moderate — music at a normal volume", "Loud — I play music / have people over"] },
  { key: "guests", label: "Guests", emoji: "👥", options: ["Rarely / Never", "Sometimes (weekends)", "Often — I'm social"] },
  { key: "study", label: "Study Habits", emoji: "📚", options: ["Study at home", "Library / campus mostly", "Mix of both"] },
  { key: "smoking", label: "Smoking / Vaping", emoji: "🚭", options: ["No smoking at all", "Outside only", "I smoke / vape"] },
  { key: "pets", label: "Pets", emoji: "🐾", options: ["No pets please", "I'm fine with pets", "I have a pet"] },
  { key: "cooking", label: "Kitchen Use", emoji: "🍳", options: ["I cook daily", "A few times a week", "Mostly takeout / meal plan"] },
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
   Mock Profiles
   ════════════════════════════════════════════════════════ */

const mockProfiles: LifestyleProfile[] = [
  { id: "r1", firstName: "Alex", initial: "T.", year: "3rd year", program: "Computer Science", budget: [500, 650], moveIn: "Fall 2026", leaseLength: "8-month", bio: "Looking for a chill roommate for a 2BR near campus. I'm pretty quiet during the week but love going out on weekends.", tags: { sleep: "Night Owl (after midnight)", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Mix of both", smoking: "No smoking at all", pets: "I'm fine with pets", cooking: "I cook daily" } },
  { id: "r2", firstName: "Jordan", initial: "K.", year: "2nd year", program: "Business Administration", budget: [650, 800], moveIn: "Fall 2026", leaseLength: "12-month", bio: "Transfer student looking for a clean, organized living situation. I keep to myself mostly but enjoy the occasional movie night.", tags: { sleep: "Early Bird (before 10pm)", cleanliness: "Very Tidy", noise: "Quiet — I need silence", guests: "Rarely / Never", study: "Library / campus mostly", smoking: "No smoking at all", pets: "No pets please", cooking: "A few times a week" } },
  { id: "r3", firstName: "Sam", initial: "W.", year: "4th year", program: "Engineering", budget: [500, 650], moveIn: "Fall 2026", leaseLength: "8-month", bio: "Social butterfly who loves hosting. Looking for roommates who are cool with people coming over. I'll cook for the house!", tags: { sleep: "Night Owl (after midnight)", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Often — I'm social", study: "Study at home", smoking: "Outside only", pets: "I'm fine with pets", cooking: "Mostly takeout / meal plan" } },
  { id: "r4", firstName: "Riley", initial: "M.", year: "2nd year", program: "Kinesiology", budget: [650, 800], moveIn: "Winter 2027", leaseLength: "8-month", bio: "Early riser, gym every morning. I have a small cat named Mochi. Looking for someone who's tidy and respectful of shared spaces.", tags: { sleep: "Early Bird (before 10pm)", cleanliness: "Very Tidy", noise: "Quiet — I need silence", guests: "Sometimes (weekends)", study: "Library / campus mostly", smoking: "No smoking at all", pets: "I have a pet", cooking: "I cook daily" } },
  { id: "r5", firstName: "Taylor", initial: "R.", year: "3rd year", program: "Environmental Science", budget: [500, 650], moveIn: "Fall 2026", leaseLength: "12-month", bio: "Plant parent looking for a relaxed living situation. I'm flexible on most things and easy to get along with.", tags: { sleep: "Flexible", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Mix of both", smoking: "No smoking at all", pets: "I'm fine with pets", cooking: "A few times a week" } },
  { id: "r6", firstName: "Morgan", initial: "L.", year: "1st year", program: "Psychology", budget: [800, 2000], moveIn: "Fall 2026", leaseLength: "12-month", bio: "First time living off campus! I'm quiet, love journaling and late-night walks. Looking for a calm, safe space.", tags: { sleep: "Night Owl (after midnight)", cleanliness: "Relaxed", noise: "Loud — I play music / have people over", guests: "Often — I'm social", study: "Mix of both", smoking: "Outside only", pets: "I'm fine with pets", cooking: "Mostly takeout / meal plan" } },
  { id: "r7", firstName: "Quinn", initial: "B.", year: "4th year", program: "Arts", budget: [500, 650], moveIn: "Summer 2026", leaseLength: "4-month", bio: "Looking for a summer sublet roommate. I'm in the studio most days so I'm barely home. Clean and quiet.", tags: { sleep: "Flexible", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Study at home", smoking: "No smoking at all", pets: "No pets please", cooking: "I cook daily" } },
];

/* ════════════════════════════════════════════════════════
   Compatibility Engine
   ════════════════════════════════════════════════════════ */

function computeCompatibility(myTags: Record<string, string>, theirTags: Record<string, string>, myBudget: [number, number], theirBudget: [number, number]): number {
  let score = 0;
  let total = 0;
  const weights: Record<string, number> = { sleep: 3, cleanliness: 3, noise: 2, guests: 2, smoking: 3, study: 1, pets: 2, cooking: 1 };

  for (const key of Object.keys(weights)) {
    const w = weights[key];
    total += w;
    if (myTags[key] === theirTags[key]) {
      score += w;
    } else {
      const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
      if (cat) {
        const myIdx = cat.options.indexOf(myTags[key]);
        const theirIdx = cat.options.indexOf(theirTags[key]);
        if (myIdx >= 0 && theirIdx >= 0 && Math.abs(myIdx - theirIdx) === 1) score += w * 0.5;
      }
    }
  }

  total += 2;
  const overlap = Math.min(myBudget[1], theirBudget[1]) - Math.max(myBudget[0], theirBudget[0]);
  if (overlap > 0) score += 2;
  else if (Math.abs(myBudget[0] - theirBudget[0]) <= 100) score += 1;

  return Math.round((score / total) * 100);
}

/* ════════════════════════════════════════════════════════
   Animated Illustration Wrapper
   ════════════════════════════════════════════════════════ */

function FloatingIllustration({ src, alt, className, delay = 0, floatRange = 8 }: { src: string; alt: string; className?: string; delay?: number; floatRange?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? {
        opacity: 1,
        y: [0, -floatRange, 0],
      } : { opacity: 0, y: 30 }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.3 },
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-contain" draggable={false} />
    </motion.div>
  );
}

/* Scroll-triggered section reveal */
function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   Profile Creation Form (with cat illustration companion)
   ════════════════════════════════════════════════════════ */

function ProfileForm({ onComplete }: { onComplete: (tags: Record<string, string>, budget: [number, number], moveIn: string, genderHousing: string) => void }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState<[number, number] | null>(null);
  const [moveIn, setMoveIn] = useState("");
  const [genderHousing, setGenderHousing] = useState("");

  const totalSteps = LIFESTYLE_CATEGORIES.length + 2;
  const progress = ((step + 1) / totalSteps) * 100;
  const currentCat = step < LIFESTYLE_CATEGORIES.length ? LIFESTYLE_CATEGORIES[step] : null;
  const canNext = currentCat ? !!tags[currentCat.key] : step === LIFESTYLE_CATEGORIES.length ? !!budget && !!moveIn : !!genderHousing;

  function next() {
    if (step < totalSteps - 1) setStep(step + 1);
    else onComplete(tags, budget!, moveIn, genderHousing);
  }

  return (
    <div className={`flex ${isMobile ? "flex-col" : "items-start gap-10"}`}>
      {/* Cat illustration companion — desktop only */}
      {!isMobile && (
        <FloatingIllustration
          src="/illustrations/cat-playful.svg"
          alt="Playful cat"
          className="w-[200px] h-[200px] shrink-0 mt-8"
          delay={0.2}
          floatRange={6}
        />
      )}

      <div className="flex-1 max-w-[560px]">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#FF6B35] rounded-full" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>Step {step + 1} of {totalSteps}</span>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="text-[#FF6B35] hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>← Back</button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
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
                      <button key={opt} onClick={() => setTags((prev) => ({ ...prev, [currentCat.key]: opt }))} className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`} style={{ fontSize: "14px", fontWeight: selected ? 600 : 400, color: selected ? "#FF6B35" : "#1B2D45" }}>
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
                      <button key={b.label} onClick={() => setBudget(b.range)} className={`px-3 py-3 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/60 hover:border-[#FF6B35]/20 bg-white"}`} style={{ fontSize: "13px", fontWeight: selected ? 600 : 400 }}>
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
                      <button key={m} onClick={() => setMoveIn(m)} className={`px-3 py-3 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/60 hover:border-[#FF6B35]/20 bg-white"}`} style={{ fontSize: "13px", fontWeight: selected ? 600 : 400 }}>
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
                      <button key={opt} onClick={() => setGenderHousing(opt)} className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${selected ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`} style={{ fontSize: "14px", fontWeight: selected ? 600 : 400, color: selected ? "#FF6B35" : "#1B2D45" }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
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

        <motion.button onClick={next} disabled={!canNext} className={`mt-6 w-full py-3.5 rounded-xl text-white transition-all ${canNext ? "bg-[#FF6B35] hover:bg-[#e55e2e] active:scale-[0.98]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`} style={{ fontSize: "14px", fontWeight: 700, boxShadow: canNext ? "0 4px 20px rgba(255,107,53,0.3)" : "none" }} whileTap={canNext ? { scale: 0.97 } : undefined}>
          {step < totalSteps - 1 ? "Next →" : "Find Roommates 🎯"}
        </motion.button>
      </div>
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
   Profile Card (swipeable)
   ════════════════════════════════════════════════════════ */

function ProfileCard({ profile, onInterested, onPass, onReport, onSave, isTop }: { profile: LifestyleProfile; onInterested: () => void; onPass: () => void; onReport: () => void; onSave: () => void; isTop: boolean }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const passOpacity = useTransform(x, [-100, -30], [1, 0]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 100) onInterested();
    else if (info.offset.x < -100) onPass();
  }

  const budgetLabel = profile.budget[1] >= 2000 ? `$${profile.budget[0]}+/mo` : `$${profile.budget[0]}–$${profile.budget[1]}/mo`;
  const tagEntries = Object.entries(profile.tags);

  return (
    <motion.div className="absolute inset-0 cursor-grab active:cursor-grabbing" style={{ x, rotate, zIndex: isTop ? 10 : 0 }} drag={isTop ? "x" : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.6 }} animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.6 }} exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}>
      {isTop && (
        <>
          <motion.div className="absolute top-6 left-6 z-20 px-3 py-1.5 rounded-lg bg-[#E71D36] text-white" style={{ opacity: passOpacity, fontSize: "14px", fontWeight: 800 }}>PASS</motion.div>
          <motion.div className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-lg bg-[#4ADE80] text-white" style={{ opacity: likeOpacity, fontSize: "14px", fontWeight: 800 }}>INTERESTED</motion.div>
        </>
      )}
      <div className="h-full bg-white rounded-2xl border border-black/[0.06] overflow-hidden flex flex-col" style={{ boxShadow: isTop ? "0 8px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#FF6B35" }}>{profile.firstName[0]}</span>
              </div>
              <div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>{profile.firstName} {profile.initial}</h3>
                <p className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>{profile.year} · {profile.program}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <CompatBadge score={profile.compatibility ?? 0} />
              <button onClick={onReport} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/15 hover:text-[#E71D36] transition-all" title="Report"><Flag className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="mt-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF6B35] text-white" style={{ fontSize: "10px", fontWeight: 700 }}>🔍 Looking for a room</span></div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 600 }}>💰 {budgetLabel}</span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>📅 {profile.moveIn}</span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>{profile.leaseLength}</span>
          </div>
        </div>
        <div className="px-5 pb-3">
          <p className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.6 }}>{bioExpanded ? profile.bio : profile.bio.length > 100 ? profile.bio.slice(0, 100) + "..." : profile.bio}</p>
          {profile.bio.length > 100 && <button onClick={() => setBioExpanded(!bioExpanded)} className="text-[#FF6B35] mt-0.5" style={{ fontSize: "11px", fontWeight: 600 }}>{bioExpanded ? "Show less" : "Read more"}</button>}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <span className="text-[#1B2D45]/30 block mb-2" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>LIFESTYLE</span>
          <div className="flex flex-wrap gap-2">
            {tagEntries.map(([key, value]) => {
              const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
              if (!cat) return null;
              return (
                <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-black/[0.02]">
                  <span style={{ fontSize: "14px" }}>{cat.emoji}</span>
                  <div>
                    <div className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>{TAG_SHORT_LABELS[value] || value}</div>
                    {TAG_SUBTITLES[value] && <div className="text-[#1B2D45]/30" style={{ fontSize: "9px", fontWeight: 500 }}>{TAG_SUBTITLES[value]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {isTop && (
          <div className="p-4 border-t border-black/[0.04] flex items-center gap-3">
            <button onClick={onInterested} className="flex-[2] py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all active:scale-[0.97] flex items-center justify-center gap-2" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}><MessageCircleMore className="w-4 h-4" /> Message</button>
            <button onClick={onSave} className="flex-1 py-3 rounded-xl border-2 border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20 hover:text-[#FF6B35] transition-all active:scale-[0.97] flex items-center justify-center gap-2" style={{ fontSize: "13px", fontWeight: 700 }}><Bookmark className="w-4 h-4" /> Save</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   Grid Card
   ════════════════════════════════════════════════════════ */

function GridProfileCard({ profile, onInterested, onSave, onReport }: { profile: LifestyleProfile; onInterested: () => void; onSave: () => void; onReport: () => void }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const budgetLabel = profile.budget[1] >= 2000 ? `$${profile.budget[0]}+/mo` : `$${profile.budget[0]}–$${profile.budget[1]}/mo`;
  const topTags = Object.entries(profile.tags).slice(0, 5);

  return (
    <motion.div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden hover:shadow-lg hover:border-[#FF6B35]/15 transition-all group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0"><span style={{ fontSize: "15px", fontWeight: 800, color: "#FF6B35" }}>{profile.firstName[0]}</span></div>
            <div>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>{profile.firstName} {profile.initial}</h3>
              <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>{profile.year} · {profile.program}</p>
            </div>
          </div>
          <button onClick={onReport} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/10 hover:text-[#E71D36] hover:bg-[#E71D36]/5 opacity-0 group-hover:opacity-100 transition-all" title="Report"><Flag className="w-3 h-3" /></button>
        </div>
        <div className="mt-2"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF6B35] text-white" style={{ fontSize: "9px", fontWeight: 700 }}>🔍 Looking for a room</span></div>
      </div>
      <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
        <CompatBadge score={profile.compatibility ?? 0} />
        <span className="ml-auto px-2 py-0.5 rounded-md bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "9px", fontWeight: 600 }}>💰 {budgetLabel}</span>
        <span className="px-2 py-0.5 rounded-md bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 600 }}>📅 {profile.moveIn}</span>
      </div>
      <div className="px-4 pb-2">
        <p className="text-[#1B2D45]/50" style={{ fontSize: "11px", lineHeight: 1.6 }}>{bioExpanded ? profile.bio : profile.bio.length > 80 ? profile.bio.slice(0, 80) + "..." : profile.bio}</p>
        {profile.bio.length > 80 && <button onClick={() => setBioExpanded(!bioExpanded)} className="text-[#FF6B35]" style={{ fontSize: "10px", fontWeight: 600 }}>{bioExpanded ? "Show less" : "Read more"}</button>}
      </div>
      <div className="px-4 pb-3">
        <span className="text-[#1B2D45]/25 block mb-1.5" style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>LIFESTYLE</span>
        <div className="flex flex-wrap gap-1.5">
          {topTags.map(([key, value]) => {
            const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
            if (!cat) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F4] border border-black/[0.02]">
                <span style={{ fontSize: "12px" }}>{cat.emoji}</span>
                <div>
                  <div className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>{TAG_SHORT_LABELS[value] || value}</div>
                  {TAG_SUBTITLES[value] && <div className="text-[#1B2D45]/25" style={{ fontSize: "8px", fontWeight: 500 }}>{TAG_SUBTITLES[value]}</div>}
                </div>
              </div>
            );
          })}
          {Object.keys(profile.tags).length > 5 && <span className="text-[#1B2D45]/20 self-center" style={{ fontSize: "9px", fontWeight: 500 }}>+{Object.keys(profile.tags).length - 5} more</span>}
        </div>
      </div>
      <div className="p-3 pt-0 flex items-center gap-2">
        <button onClick={onInterested} className="flex-[2] py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all active:scale-[0.97] flex items-center justify-center gap-1.5" style={{ fontSize: "12px", fontWeight: 700 }}><MessageCircleMore className="w-3.5 h-3.5" /> Message</button>
        <button onClick={onSave} className="flex-1 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20 hover:text-[#FF6B35] transition-all active:scale-[0.97] flex items-center justify-center gap-1.5" style={{ fontSize: "12px", fontWeight: 700 }}><Bookmark className="w-3.5 h-3.5" /> Save</button>
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
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center"><span style={{ fontSize: "10px", fontWeight: 800, color: "#FF6B35" }}>{p.firstName[0]}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 600 }}>{p.firstName} {p.initial}</div>
                  <div className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>{p.program}</div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: (p.compatibility ?? 0) >= 80 ? "#4ADE80" : (p.compatibility ?? 0) >= 60 ? "#FFB627" : "#FF6B35" }}>{p.compatibility}%</span>
              </div>
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[#FFB627]/[0.08] text-center" style={{ fontSize: "10px", fontWeight: 600, color: "#D4990F" }}>⏳ Pending — waiting for them</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {showSheet && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseSheet} />
          <motion.div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[70vh] flex flex-col" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
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
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0"><span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>{p.firstName[0]}</span></div>
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
   MAIN PAGE — REDESIGNED WITH ILLUSTRATIONS
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
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showMatchesSheet, setShowMatchesSheet] = useState(false);

  const profiles = useMemo(() => {
    if (!hasProfile) return [];
    return mockProfiles.map((p) => ({ ...p, compatibility: computeCompatibility(myTags, p.tags, myBudget, p.budget) })).sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0));
  }, [hasProfile, myTags, myBudget]);

  const remainingProfiles = useMemo(() => profiles.filter((p) => !interestedIds.includes(p.id) && !passedIds.includes(p.id)), [profiles, interestedIds, passedIds]);
  const interestedProfiles = useMemo(() => profiles.filter((p) => interestedIds.includes(p.id)), [profiles, interestedIds]);

  const handleInterested = useCallback((id: string) => { setInterestedIds((prev) => [...prev, id]); }, []);
  const handlePass = useCallback((id: string) => { setPassedIds((prev) => [...prev, id]); }, []);
  const handleSave = useCallback((id: string) => { setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }, []);

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
                    <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md transition-all duration-200 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`} style={{ fontSize: "12px", fontWeight: 600 }}>
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

      {/* ═══════════════════════════════════════════════
         WELCOME / LANDING — Illustration-driven redesign
         ═══════════════════════════════════════════════ */}
      {!hasProfile && !showForm ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 overflow-hidden">

          {/* ─── HERO SECTION ─── */}
          <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden relative" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
            {/* Subtle grain overlay */}
            <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.02]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat", backgroundSize: "128px 128px",
            }} />

            <div className={`relative z-10 ${isMobile ? "px-6 pt-10 pb-8" : "flex items-center px-10 pt-8 pb-8"}`}>
              {/* Text side */}
              <div className={`${isMobile ? "text-center" : "flex-1 min-w-0 pr-6"}`}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="inline-block mb-4">
                  <div className="px-4 py-2 rounded-2xl border border-white/40" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#4ADE80" }}>✨ 94% Match</span>
                  </div>
                </motion.div>

                <motion.h2
                  className="text-[#1B2D45]"
                  style={{ fontSize: isMobile ? "28px" : "38px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.15 }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Stop rolling the dice<br />on roommates.
                </motion.h2>

                <motion.p
                  className="text-[#1B2D45]/50 mt-4 max-w-[440px]"
                  style={{ fontSize: "14px", lineHeight: 1.7 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  Answer 10 quick lifestyle questions and we&apos;ll match you with UofG students who actually live like you. No awkward surprises in September.
                </motion.p>

                {/* Vibe tags */}
                <motion.div
                  className={`flex gap-2 flex-wrap mt-5 ${isMobile ? "justify-center" : ""}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {["☕️ 8AM Classes", "🎧 Quiet Study", "🧹 Clean Kitchen", "🌙 Night Owl", "🍳 Home Cook"].map((label, i) => (
                    <motion.div
                      key={label}
                      className="bg-[#FAF8F4] px-3 py-1.5 rounded-full border border-black/[0.04]"
                      style={{ fontSize: "11px", fontWeight: 600, color: "#1B2D45" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      {label}
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                  className={`mt-8 ${isMobile ? "flex flex-col items-center" : ""}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    onClick={() => setShowForm(true)}
                    className="px-8 py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 24px rgba(255,107,53,0.3)" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Create My Profile →
                  </motion.button>
                  <p className="text-[#1B2D45]/20 mt-3" style={{ fontSize: "11px" }}>Takes about 2 minutes · Requires verified UofG email</p>
                </motion.div>
              </div>

              {/* ─── HERO VISUAL: Single Match Card + Ambient Effects ─── */}
              {!isMobile && (
                <div className="w-[420px] h-[480px] shrink-0 relative flex items-center justify-center">
                  {/* ── Ambient sparkles / particles ── */}
                  {[
                    { size: 4, x: 20, y: 40, delay: 0, dur: 3 },
                    { size: 3, x: 350, y: 30, delay: 0.8, dur: 2.5 },
                    { size: 5, x: 380, y: 380, delay: 1.5, dur: 3.5 },
                    { size: 3, x: 10, y: 350, delay: 0.4, dur: 2.8 },
                    { size: 4, x: 200, y: -10, delay: 1.0, dur: 3.2 },
                    { size: 3, x: 400, y: 200, delay: 0.6, dur: 2.6 },
                    { size: 2, x: 60, y: 180, delay: 1.8, dur: 3.0 },
                    { size: 4, x: 330, y: 120, delay: 0.2, dur: 2.4 },
                    { size: 2, x: 150, y: 420, delay: 1.2, dur: 3.3 },
                    { size: 3, x: 280, y: 450, delay: 0.9, dur: 2.7 },
                  ].map((p, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full z-0 pointer-events-none"
                      style={{ width: p.size, height: p.size, left: p.x, top: p.y, background: i % 3 === 0 ? "#4ADE80" : i % 3 === 1 ? "#FF6B35" : "#FFB627" }}
                      animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5], y: [0, -20, 0] }}
                      transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
                    />
                  ))}

                  {/* ── Soft glow rings ── */}
                  <motion.div
                    className="absolute z-0 rounded-full pointer-events-none"
                    style={{ width: 360, height: 360, left: 30, top: 60, background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)" }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute z-0 rounded-full pointer-events-none"
                    style={{ width: 280, height: 280, left: 70, top: 100, background: "radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)" }}
                    animate={{ scale: [1.05, 1, 1.05], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />

                  {/* ── Shimmer sweep across card area ── */}
                  <motion.div
                    className="absolute z-50 pointer-events-none"
                    style={{ width: 60, height: 500, top: -10, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-15deg)" }}
                    animate={{ left: [-60, 460] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                  />

                  {/* ── The Card ── */}
                  <motion.div
                    className="relative z-30 w-[320px]"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  >
                    <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.04)" }}>
                      <div className="p-5 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35]/25 to-[#FFB627]/25 flex items-center justify-center">
                              <span style={{ fontSize: "18px", fontWeight: 800, color: "#FF6B35" }}>A</span>
                            </div>
                            <div>
                              <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Alex T.</div>
                              <div className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 500 }}>3rd year · Computer Science</div>
                            </div>
                          </div>
                          <div className="relative w-11 h-11">
                            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#1B2D45" strokeOpacity="0.04" strokeWidth="3" />
                              <motion.circle cx="18" cy="18" r="14" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: "0 100" }} animate={{ strokeDasharray: "88 100" }} transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }} />
                            </svg>
                            <motion.span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "10px", fontWeight: 800, color: "#4ADE80" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>94</motion.span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-2.5 py-1 rounded-full bg-[#FF6B35] text-white" style={{ fontSize: "9px", fontWeight: 700 }}>🔍 Looking for a room</span>
                          <span className="px-2 py-1 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "9px", fontWeight: 600 }}>💰 $500–$650/mo</span>
                        </div>
                      </div>
                      <div className="px-5 pb-3"><p className="text-[#1B2D45]/50" style={{ fontSize: "11px", lineHeight: 1.6 }}>Looking for a chill roommate for a 2BR near campus. Pretty quiet during the week but love weekends.</p></div>
                      <div className="px-5 pb-4">
                        <span className="text-[#1B2D45]/25 block mb-2" style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>LIFESTYLE</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { emoji: "🌙", label: "Night Owl", match: true },
                            { emoji: "✨", label: "Relaxed Clean", match: false },
                            { emoji: "🔊", label: "Moderate", match: true },
                            { emoji: "👥", label: "Social", match: true },
                            { emoji: "🚭", label: "Non-Smoker", match: true },
                            { emoji: "🐾", label: "Pet Friendly", match: false },
                          ].map((tag, i) => (
                            <motion.div key={tag.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${tag.match ? "bg-[#4ADE80]/[0.04] border-[#4ADE80]/20" : "bg-[#FAF8F4] border-black/[0.02]"}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0 + i * 0.08 }}>
                              <span style={{ fontSize: "11px" }}>{tag.emoji}</span>
                              <span className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 600 }}>{tag.label}</span>
                              {tag.match && <span style={{ fontSize: "8px", color: "#4ADE80" }}>✓</span>}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 pt-0 flex items-center gap-2">
                        <div className="flex-[2] py-2.5 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center gap-1.5" style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}><MessageCircleMore className="w-3.5 h-3.5" /> Message</div>
                        <div className="flex-1 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/30 flex items-center justify-center gap-1.5" style={{ fontSize: "12px", fontWeight: 700 }}><Bookmark className="w-3.5 h-3.5" /> Save</div>
                      </div>
                    </div>
                    {/* "Great Match" floating badge */}
                    <motion.div className="absolute -top-3 -right-3 z-40" initial={{ opacity: 0, scale: 0, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 1.4, type: "spring", stiffness: 400, damping: 15 }}>
                      <div className="px-3 py-1.5 rounded-full bg-[#4ADE80] text-white" style={{ fontSize: "11px", fontWeight: 700, boxShadow: "0 4px 16px rgba(74,222,128,0.35)" }}>Great Match ✨</div>
                    </motion.div>
                  </motion.div>
                </div>
              )}
              {isMobile && (
                <motion.div className="mt-8 mx-auto" style={{ width: 280 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-4 relative" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/25 to-[#FFB627]/25 flex items-center justify-center"><span style={{ fontSize: "15px", fontWeight: 800, color: "#FF6B35" }}>A</span></div>
                      <div className="flex-1"><div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>Alex T.</div><div className="text-[#1B2D45]/35" style={{ fontSize: "10px" }}>3rd year · CS</div></div>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#4ADE80" }}>94%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["🌙 Night Owl", "🔊 Moderate", "🚭 No Smoke"].map((t) => (
                        <span key={t} className="px-2 py-1 rounded-md bg-[#4ADE80]/[0.06] border border-[#4ADE80]/15" style={{ fontSize: "9px", fontWeight: 600, color: "#1B2D45" }}>{t}</span>
                      ))}
                    </div>
                    <motion.div className="absolute -top-2 -right-2" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }}>
                      <div className="px-2 py-1 rounded-full bg-[#4ADE80] text-white" style={{ fontSize: "9px", fontWeight: 700 }}>Great Match ✨</div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ─── FEATURE CARDS — with illustrations ─── */}
          <RevealSection className="mt-8">
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {/* Compatibility Matching */}
              <motion.div
                className="bg-white rounded-2xl p-6 border border-black/[0.04] relative overflow-hidden"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.06)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,107,53,0.1)", color: "#FF6B35" }}>
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-[#1B2D45] mt-3" style={{ fontSize: "15px", fontWeight: 700 }}>Compatibility Matching</h3>
                <p className="text-[#1B2D45]/40 mt-1.5" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  We compare 8 lifestyle habits — sleep, cleanliness, noise, guests, and more — to find people you&apos;ll actually get along with.
                </p>
              </motion.div>

              {/* Anonymous Until Match — with shhh illustration */}
              <motion.div
                className="bg-white rounded-2xl p-6 border border-black/[0.04] relative overflow-hidden"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.06)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(46,196,182,0.1)", color: "#2EC4B6" }}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <FloatingIllustration
                    src="/illustrations/anonymous-shhh.svg"
                    alt="Shhh — anonymous"
                    className="w-[90px] h-[90px] -mt-3 -mr-3"
                    delay={0.4}
                    floatRange={4}
                  />
                </div>
                <h3 className="text-[#1B2D45] mt-3" style={{ fontSize: "15px", fontWeight: 700 }}>Anonymous Until Match</h3>
                <p className="text-[#1B2D45]/40 mt-1.5" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  Only your first name and lifestyle tags are visible. No photos, no last name — until you both say yes.
                </p>
              </motion.div>

              {/* Chat After Match — with chat bubbles illustration */}
              <motion.div
                className="bg-white rounded-2xl p-6 border border-black/[0.04] relative overflow-hidden"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.06)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,182,39,0.1)", color: "#FFB627" }}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <FloatingIllustration
                    src="/illustrations/chat-bubbles.svg"
                    alt="Chat bubbles"
                    className="w-[90px] h-[90px] -mt-3 -mr-3"
                    delay={0.5}
                    floatRange={4}
                  />
                </div>
                <h3 className="text-[#1B2D45] mt-3" style={{ fontSize: "15px", fontWeight: 700 }}>Chat After Match</h3>
                <p className="text-[#1B2D45]/40 mt-1.5" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  When both students express interest, messaging unlocks. All conversations stay on cribb.
                </p>
              </motion.div>
            </div>
          </RevealSection>

          {/* ─── HOW IT WORKS ─── */}
          <RevealSection className="mt-8" delay={0.1}>
            <div className="bg-white rounded-2xl border border-black/[0.04] px-6 md:px-10 py-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px flex-1 bg-black/[0.04]" />
                <span className="text-[#1B2D45]/30 shrink-0" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>HOW IT WORKS</span>
                <div className="h-px flex-1 bg-black/[0.04]" />
              </div>
              <div className={`grid gap-5 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
                {[
                  { icon: <Check className="w-4 h-4" />, color: "#FF6B35", bg: "rgba(255,107,53,0.08)", label: "Take the quiz", sub: "2 min, 10 questions", num: "1" },
                  { icon: <Target className="w-4 h-4" />, color: "#2EC4B6", bg: "rgba(46,196,182,0.08)", label: "Browse matches", sub: "Sorted by compatibility", num: "2" },
                  { icon: <Footprints className="w-4 h-4" />, color: "#FFB627", bg: "rgba(255,182,39,0.08)", label: "Express interest", sub: "Swipe or tap", num: "3" },
                  { icon: <MessageCircle className="w-4 h-4" />, color: "#4ADE80", bg: "rgba(74,222,128,0.08)", label: "Match & chat", sub: "When it's mutual", num: "4" },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-black/[0.06] flex items-center justify-center" style={{ fontSize: "8px", fontWeight: 800, color: "#1B2D45" }}>{s.num}</span>
                    </div>
                    <div>
                      <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{s.label}</div>
                      <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>{s.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* Social proof */}
          <RevealSection className="mt-6" delay={0.15}>
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {["A", "J", "S", "R", "T"].map((letter, i) => (
                  <div key={letter} className="w-7 h-7 rounded-full border-2 border-[#FAF8F4] bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center" style={{ zIndex: 5 - i }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#FF6B35" }}>{letter}</span>
                  </div>
                ))}
              </div>
              <span className="text-[#1B2D45]/30" style={{ fontSize: "12px", fontWeight: 500 }}>Start matching now!</span>
            </div>
          </RevealSection>
        </div>

      ) : !hasProfile && showForm ? (
        /* ─── Profile Form (with cat companion) ─── */
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 md:p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
            <ProfileForm onComplete={handleProfileComplete} />
          </div>
        </div>

      ) : remainingProfiles.length === 0 ? (
        /* ─── All Reviewed — with reading book illustration ─── */
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border-2 border-dashed border-black/[0.06]">
            <FloatingIllustration
              src="/illustrations/reading-book.svg"
              alt="Student reading"
              className="w-[220px] h-[260px]"
              floatRange={8}
            />
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
          <div className="relative" style={{ height: "620px" }}>
            <AnimatePresence>
              {remainingProfiles.slice(0, 2).map((profile, i) => (
                <ProfileCard key={profile.id} profile={profile} isTop={i === 0} onInterested={() => handleInterested(profile.id)} onPass={() => handlePass(profile.id)} onSave={() => handleSave(profile.id)} onReport={() => {}} />
              ))}
            </AnimatePresence>
          </div>
          <p className="text-center text-[#1B2D45]/20 mt-3" style={{ fontSize: "11px" }}>{isMobile ? "Swipe right if interested, left to pass" : "Drag card or use buttons below"}</p>
        </div>
      ) : (
        <div className={`max-w-[1200px] mx-auto px-4 md:px-6 py-4 ${interestedIds.length > 0 ? "mr-[260px]" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {remainingProfiles.map((profile) => (
              <GridProfileCard key={profile.id} profile={profile} onInterested={() => handleInterested(profile.id)} onSave={() => handleSave(profile.id)} onReport={() => {}} />
            ))}
          </div>
        </div>
      )}

      <MatchesTray matches={interestedProfiles} showSheet={showMatchesSheet} onCloseSheet={() => setShowMatchesSheet(false)} />

      <AnimatePresence>
        {isMobile && hasProfile && interestedIds.length > 0 && !showMatchesSheet && (
          <motion.div className="fixed bottom-4 right-4 z-30" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <button onClick={() => setShowMatchesSheet(true)} className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(255,107,53,0.4)] active:scale-95 transition-transform" style={{ fontSize: "13px", fontWeight: 700 }}>
              🤝 {interestedIds.length} interested
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}