"use client";

import { useState, useEffect } from "react";
import { X, Cigarette, PawPrint, Sparkles, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import type { TenantCardResponse } from "@/types";

/* ════════════════════════════════════════════════════════
   Tenant Card Modal
   Landlord taps a student's profile picture to see this
   ════════════════════════════════════════════════════════ */

const LABEL_MAP: Record<string, Record<string, string>> = {
  smoking: { no_smoking: "Non-smoker", outside_only: "Outside only", i_smoke: "Smoker" },
  pets: { no_pets: "No pets", fine_with_pets: "Pet friendly", i_have_a_pet: "Has a pet" },
  cleanliness: { very_tidy: "Very tidy", reasonably_clean: "Reasonably clean", relaxed: "Relaxed" },
  gender_housing_pref: { mixed_gender: "Mixed gender", same_gender: "Same gender preferred", no_preference: "No preference" },
};

const FIELD_CONFIG = [
  { key: "smoking", label: "Smoking", icon: Cigarette, color: "#E71D36" },
  { key: "pets", label: "Pets", icon: PawPrint, color: "#FFB627" },
  { key: "cleanliness", label: "Cleanliness", icon: Sparkles, color: "#2EC4B6" },
  { key: "gender_housing_pref", label: "Housing Pref", icon: Users, color: "#6C63FF" },
] as const;

interface TenantCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export function TenantCardModal({ isOpen, onClose, userId }: TenantCardModalProps) {
  const [card, setCard] = useState<TenantCardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    api.auth.getTenantCard(userId)
      .then((data) => setCard(data))
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white rounded-2xl w-full overflow-hidden"
            style={{ maxWidth: "380px", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
          >
            {loading ? (
              <div className="p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#1B2D45]/20" />
              </div>
            ) : card ? (
              <>
                {/* Header + Close */}
                <div className="relative">
                  <div className="h-20 bg-gradient-to-br from-[#FF6B35]/15 to-[#2EC4B6]/10" />
                  <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm">
                    <X className="w-4 h-4 text-[#1B2D45]/40" />
                  </button>
                  {/* Avatar */}
                  <div className="absolute -bottom-8 left-5">
                    {card.profile_photo_url ? (
                      <img src={card.profile_photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-[3px] border-white shadow-[0_4px_12px_rgba(27,45,69,0.1)]" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#1B2D45]/[0.06] border-[3px] border-white shadow-[0_4px_12px_rgba(27,45,69,0.1)] flex items-center justify-center">
                        <span className="text-[#1B2D45]/40" style={{ fontSize: "20px", fontWeight: 700 }}>{card.first_name[0]}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 pt-11 pb-2">
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>{card.first_name} {card.last_name}</h3>
                  {(card.program || card.year) && (
                    <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px", fontWeight: 500 }}>
                      {[card.program, card.year].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {card.bio && (
                    <p className="text-[#1B2D45]/55 mt-2" style={{ fontSize: "12px", lineHeight: 1.5 }}>{card.bio}</p>
                  )}
                </div>

                {/* Tenant Fields */}
                <div className="px-5 pb-5 pt-2">
                  {card.has_tenant_profile ? (
                    <div className="space-y-2">
                      {FIELD_CONFIG.map(({ key, label, icon: Icon, color }) => {
                        const val = card[key as keyof TenantCardResponse] as string | null;
                        const display = val ? (LABEL_MAP[key]?.[val] || val) : null;
                        if (!display) return null;
                        return (
                          <div key={key} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: `${color}08`, border: `1.5px solid ${color}15` }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}12` }}>
                              <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            <div>
                              <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>{label}</div>
                              <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{display}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#FAF8F4] border border-black/[0.04] p-4 text-center">
                      <p className="text-[#1B2D45]/35" style={{ fontSize: "12px" }}>This student hasn&apos;t filled out their tenant profile yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-[#1B2D45]/40" style={{ fontSize: "13px" }}>Couldn&apos;t load student profile.</p>
                <button onClick={onClose} className="mt-3 text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 600 }}>Close</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}