"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Users, Copy, Check, Link2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { BUDGET_OPTIONS, MOVE_IN_OPTIONS, GENDER_HOUSING_OPTIONS } from "@/components/roommates/roommate-data";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [groupSize, setGroupSize] = useState(4);
  const [haveCount, setHaveCount] = useState(2);
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(700);
  const [moveIn, setMoveIn] = useState("Fall 2026");
  const [area, setArea] = useState("");
  const [gender, setGender] = useState("No preference");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  // Result
  const [created, setCreated] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const spotsNeeded = groupSize - haveCount;
  const areas = ["Near Campus", "South End", "Downtown", "West End", "East Side", "No preference"];

  const canContinue = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return haveCount > 0 && groupSize > haveCount;
    if (step === 2) return !!moveIn && !!area;
    if (step === 3) return description.trim().length >= 10;
    return true;
  };

  const handleCreate = () => {
    // TODO: POST /api/groups { name, group_size, spots_needed, budget_min, budget_max, preferred_area, move_in, gender_preference, description, is_visible }
    const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    setInviteCode(code);
    setCreated(true);
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/roommates/groups/join/${inviteCode}` : `cribb.ca/join/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Your group is live! Share the link with your friends to join.
            </p>

            {/* Invite link */}
            <div className="bg-white rounded-xl border border-black/[0.04] p-4 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <label className="text-[#1B2D45]/40 block mb-2 text-left" style={{ fontSize: "11px", fontWeight: 600 }}>Share this link</label>
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
                Anyone with this link can view your group and request to join.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-black/[0.04] p-4 text-left mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>{haveCount} of {groupSize} filled</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>Need {spotsNeeded} more</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>${budgetMin}–${budgetMax}/mo</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#2EC4B6]/[0.06] text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 600 }}>{area}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/roommates" className="flex-1 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all" style={{ fontSize: "13px", fontWeight: 600 }}>
                Browse Roommates
              </Link>
              <Link href={`/roommates/groups/${inviteCode}`} className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
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

          {/* Step 3: Preferences */}
          {step === 2 && (
            <div>
              <h2 className="text-[#1B2D45] mb-5" style={{ fontSize: "22px", fontWeight: 800 }}>Group preferences</h2>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Budget range (per person/month)</label>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex-1">
                  <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-black/[0.04] focus:border-[#FF6B35]/30 focus:outline-none" style={{ fontSize: "14px" }} placeholder="Min" />
                </div>
                <span className="text-[#1B2D45]/20" style={{ fontSize: "12px" }}>to</span>
                <div className="flex-1">
                  <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-black/[0.04] focus:border-[#FF6B35]/30 focus:outline-none" style={{ fontSize: "14px" }} placeholder="Max" />
                </div>
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Move-in timing</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {MOVE_IN_OPTIONS.map((m) => {
                  const sel = moveIn === m;
                  return <button key={m} onClick={() => setMoveIn(m)} className={`px-3 py-2.5 rounded-xl border-2 transition-all ${sel ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400 }}>{m}</button>;
                })}
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Preferred area</label>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {areas.map((a) => {
                  const sel = area === a;
                  return <button key={a} onClick={() => setArea(a)} className={`px-3 py-2.5 rounded-xl border-2 transition-all ${sel ? "border-[#FF6B35] bg-[#FF6B35]/[0.04] text-[#FF6B35]" : "border-black/[0.04] text-[#1B2D45]/50 hover:border-[#FF6B35]/20"}`} style={{ fontSize: "12px", fontWeight: sel ? 600 : 400 }}>{a}</button>;
                })}
              </div>

              <label className="text-[#1B2D45] block mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>Gender preference</label>
              <div className="space-y-2">
                {GENDER_HOUSING_OPTIONS.map((opt) => {
                  const sel = gender === opt;
                  return <button key={opt} onClick={() => setGender(opt)} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${sel ? "border-[#FF6B35] bg-[#FF6B35]/[0.04]" : "border-black/[0.04] hover:border-[#FF6B35]/20 bg-white"}`} style={{ fontSize: "13px", fontWeight: sel ? 600 : 400, color: sel ? "#FF6B35" : "#1B2D45" }}>{opt}</button>;
                })}
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