"use client";

import { useState } from "react";
import { X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

/* ════════════════════════════════════════════════════════
   Tenant Profile Prompt
   Shown before a student's first message or booking
   ════════════════════════════════════════════════════════ */

const TENANT_QUESTIONS = [
  {
    key: "cleanliness",
    label: "Cleanliness",
    emoji: "✨",
    subtitle: "How tidy do you keep your space?",
    options: [
      { label: "Very Tidy", value: "very_tidy" },
      { label: "Reasonably Clean", value: "reasonably_clean" },
      { label: "Relaxed", value: "relaxed" },
    ],
  },
  {
    key: "smoking",
    label: "Smoking / Vaping",
    emoji: "🚭",
    subtitle: "Do you smoke or vape?",
    options: [
      { label: "No smoking at all", value: "no_smoking" },
      { label: "Outside only", value: "outside_only" },
      { label: "I smoke / vape", value: "i_smoke" },
    ],
  },
  {
    key: "pets",
    label: "Pets",
    emoji: "🐾",
    subtitle: "Do you have or want pets?",
    options: [
      { label: "No pets please", value: "no_pets" },
      { label: "I'm fine with pets", value: "fine_with_pets" },
      { label: "I have a pet", value: "i_have_a_pet" },
    ],
  },
  {
    key: "gender_housing_pref",
    label: "Housing Preference",
    emoji: "🏠",
    subtitle: "Gender preference for your living space",
    options: [
      { label: "Mixed gender fine", value: "mixed_gender" },
      { label: "Same gender preferred", value: "same_gender" },
      { label: "No preference", value: "no_preference" },
    ],
  },
];

interface TenantProfilePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function TenantProfilePrompt({ isOpen, onClose, onComplete }: TenantProfilePromptProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const current = TENANT_QUESTIONS[step];
  const totalSteps = TENANT_QUESTIONS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const canNext = !!answers[current.key];

  async function handleNext() {
    if (!canNext) return;

    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    // Final step — submit
    setSubmitting(true);
    try {
      await api.auth.submitTenantProfile({
        smoking: answers.smoking,
        pets: answers.pets,
        gender_housing_pref: answers.gender_housing_pref,
        cleanliness: answers.cleanliness,
      });
    } catch { /* API failed — still proceed */ }
    setSubmitting(false);
    onComplete();
  }

  function handleClose() {
    setStep(0);
    setAnswers({});
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-2xl w-full overflow-hidden"
            style={{ maxWidth: "440px", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Quick profile</h3>
                <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "11px" }}>Helps landlords know if you&apos;re a good fit</p>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-[#1B2D45]/40" />
              </button>
            </div>

            {/* Progress */}
            <div className="px-5 mt-4">
              <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(27,45,69,0.04)" }}>
                <motion.div className="h-full bg-[#FF6B35] rounded-full" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 500 }}>Step {step + 1} of {totalSteps}</span>
                {step > 0 && <button onClick={() => setStep(step - 1)} className="text-[#FF6B35] hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>← Back</button>}
              </div>
            </div>

            {/* Question */}
            <div className="px-5 py-4">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span style={{ fontSize: "28px" }}>{current.emoji}</span>
                    <h2 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>{current.label}</h2>
                  </div>
                  <p className="text-[#1B2D45]/55 mb-5" style={{ fontSize: "13px" }}>{current.subtitle}</p>
                  <div className="space-y-2.5">
                    {current.options.map((opt) => {
                      const sel = answers[current.key] === opt.value;
                      return (
                        <motion.button
                          key={opt.value}
                          onClick={() => setAnswers((p) => ({ ...p, [current.key]: opt.value }))}
                          className={`w-full text-left px-4 py-3.5 rounded-xl transition-all ${sel ? "bg-[#FF6B35]/[0.04]" : "bg-white hover:translate-y-[-1px]"}`}
                          style={{
                            fontSize: "14px", fontWeight: sel ? 600 : 400,
                            color: sel ? "#FF6B35" : "#1B2D45",
                            border: sel ? "2.5px solid #FF6B35" : "2.5px solid rgba(27,45,69,0.06)",
                            boxShadow: sel ? "3px 3px 0px rgba(255,107,53,0.1)" : "2px 2px 0px rgba(27,45,69,0.04)",
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {opt.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Privacy note on last step */}
            {step === totalSteps - 1 && (
              <div className="px-5 pb-2">
                <div className="rounded-xl p-4 flex items-start gap-2.5" style={{ background: "rgba(46,196,182,0.04)", border: "2px solid rgba(46,196,182,0.15)" }}>
                  <Shield className="w-4 h-4 text-[#2EC4B6] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>Saves you a wasted trip</p>
                    <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>Landlords can see these details so they can let you know upfront if the place is a good fit.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next button */}
            <div className="px-5 pb-5">
              <motion.button
                onClick={handleNext}
                disabled={!canNext || submitting}
                className={`w-full py-3.5 rounded-xl text-white transition-all ${canNext && !submitting ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-[#1B2D45]/10 cursor-not-allowed"}`}
                style={{ fontSize: "14px", fontWeight: 700, border: canNext ? "2px solid #e55e2e" : "none", boxShadow: canNext ? "4px 4px 0px rgba(255,107,53,0.2)" : "none" }}
                whileTap={canNext ? { scale: 0.97 } : undefined}
              >
                {submitting ? "Saving..." : step < totalSteps - 1 ? "Next →" : "Continue"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
