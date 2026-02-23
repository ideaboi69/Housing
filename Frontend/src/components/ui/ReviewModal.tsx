"use client";

import { useState, useCallback } from "react";
import { Star, X, Check, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import type { ReviewResponse } from "@/types";

/* ── Star Rating Picker ───────────────────────── */

function StarPicker({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="min-w-0">
        <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
          {label}
        </p>
        <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>
          {description}
        </p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 ml-3">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || value);
          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              whileTap={{ scale: 0.8 }}
              className="p-0.5 transition-colors"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  filled
                    ? "fill-[#FFB627] text-[#FFB627]"
                    : "text-[#1B2D45]/15 hover:text-[#FFB627]/40"
                }`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Modal ───────────────────────────────── */

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle?: string;
  /** Called after successful submission with the new review */
  onReviewSubmitted?: (review: ReviewResponse) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  onReviewSubmitted,
}: ReviewModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [responsiveness, setResponsiveness] = useState(0);
  const [maintenanceSpeed, setMaintenanceSpeed] = useState(0);
  const [respectPrivacy, setRespectPrivacy] = useState(0);
  const [fairnessOfCharges, setFairnessOfCharges] = useState(0);
  const [wouldRentAgain, setWouldRentAgain] = useState<boolean | null>(null);
  const [attested, setAttested] = useState(false);

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "duplicate">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const allRated = responsiveness > 0 && maintenanceSpeed > 0 && respectPrivacy > 0 && fairnessOfCharges > 0 && wouldRentAgain !== null && attested;

  const avgRating = (responsiveness > 0 && maintenanceSpeed > 0 && respectPrivacy > 0 && fairnessOfCharges > 0)
    ? ((responsiveness + maintenanceSpeed + respectPrivacy + fairnessOfCharges) / 4).toFixed(1)
    : null;

  const resetForm = useCallback(() => {
    setResponsiveness(0);
    setMaintenanceSpeed(0);
    setRespectPrivacy(0);
    setFairnessOfCharges(0);
    setWouldRentAgain(null);
    setAttested(false);
    setStatus("idle");
    setErrorMessage("");
  }, []);

  const handleSubmit = async () => {
    if (!allRated) return;

    if (!user) {
      onClose();
      router.push("/login");
      return;
    }

    setStatus("sending");
    try {
      const review = await api.reviews.create({
        property_id: propertyId,
        responsiveness,
        maintenance_speed: maintenanceSpeed,
        respect_privacy: respectPrivacy,
        fairness_of_charges: fairnessOfCharges,
        would_rent_again: wouldRentAgain!,
      });
      setStatus("sent");
      onReviewSubmitted?.(review);
      setTimeout(() => {
        onClose();
        setTimeout(resetForm, 200);
      }, 1800);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStatus("duplicate");
        setTimeout(() => {
          onClose();
          setTimeout(resetForm, 200);
        }, 2000);
      } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        onClose();
        router.push("/login");
      } else {
        setErrorMessage(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
        setStatus("error");
      }
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 200);
  };

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
            {/* ── Success / Duplicate ── */}
            {(status === "sent" || status === "duplicate") ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                    status === "sent" ? "bg-[#4ADE80]/10" : "bg-[#FFB627]/10"
                  }`}
                >
                  {status === "sent" ? (
                    <Check className="w-6 h-6 text-[#4ADE80]" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-[#FFB627]" />
                  )}
                </motion.div>
                <p className="text-[#1B2D45] mt-4" style={{ fontSize: "16px", fontWeight: 700 }}>
                  {status === "sent" ? "Review Submitted!" : "Already Reviewed"}
                </p>
                <p className="text-[#1B2D45]/50 mt-1" style={{ fontSize: "13px" }}>
                  {status === "sent"
                    ? "Thanks for helping fellow students make better housing decisions."
                    : "You've already reviewed this property. You can edit it from your settings."}
                </p>
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="flex items-center justify-between p-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFB627]/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-[#FFB627]" />
                    </div>
                    <div>
                      <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                        Rate Your Experience
                      </h3>
                      {propertyTitle && (
                        <p className="text-[#1B2D45]/40 truncate" style={{ fontSize: "11px", maxWidth: "240px" }}>
                          {propertyTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-[#1B2D45]/40" />
                  </button>
                </div>

                <p className="px-5 text-[#1B2D45]/40" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  Rate your landlord across 4 categories. Your review is anonymous — only star ratings are shown publicly.
                </p>

                {/* ── Star Categories ── */}
                <div className="px-5 mt-2 divide-y divide-[#1B2D45]/[0.04]">
                  <StarPicker
                    label="Responsiveness"
                    description="How quickly they reply"
                    value={responsiveness}
                    onChange={setResponsiveness}
                  />
                  <StarPicker
                    label="Maintenance Speed"
                    description="How fast repairs get done"
                    value={maintenanceSpeed}
                    onChange={setMaintenanceSpeed}
                  />
                  <StarPicker
                    label="Respect for Privacy"
                    description="Notice before visits, boundaries"
                    value={respectPrivacy}
                    onChange={setRespectPrivacy}
                  />
                  <StarPicker
                    label="Fairness of Charges"
                    description="Deposit handling, hidden fees"
                    value={fairnessOfCharges}
                    onChange={setFairnessOfCharges}
                  />
                </div>

                {/* ── Would Rent Again ── */}
                <div className="px-5 mt-4">
                  <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                    Would you rent from this landlord again?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setWouldRentAgain(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                        wouldRentAgain === true
                          ? "border-[#4ADE80]/30 bg-[#4ADE80]/[0.06] text-[#4ADE80]"
                          : "border-[#E8E4DC] text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.02]"
                      }`}
                      style={{ fontSize: "13px", fontWeight: wouldRentAgain === true ? 700 : 500 }}
                    >
                      <ThumbsUp className={`w-4 h-4 ${wouldRentAgain === true ? "fill-[#4ADE80]" : ""}`} />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRentAgain(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                        wouldRentAgain === false
                          ? "border-[#E71D36]/30 bg-[#E71D36]/[0.06] text-[#E71D36]"
                          : "border-[#E8E4DC] text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.02]"
                      }`}
                      style={{ fontSize: "13px", fontWeight: wouldRentAgain === false ? 700 : 500 }}
                    >
                      <ThumbsDown className={`w-4 h-4 ${wouldRentAgain === false ? "fill-[#E71D36]" : ""}`} />
                      No
                    </button>
                  </div>
                </div>

                {/* ── Average preview ── */}
                <AnimatePresence>
                  {avgRating && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-5 mt-4 p-3 rounded-xl bg-[#FAF8F4] flex items-center justify-between">
                        <span className="text-[#1B2D45]/50" style={{ fontSize: "12px", fontWeight: 500 }}>
                          Your average rating
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-[#FFB627] text-[#FFB627]" />
                          <span className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
                            {avgRating}
                          </span>
                          <span className="text-[#1B2D45]/30" style={{ fontSize: "12px" }}>/5</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Attestation ── */}
                <div className="px-5 mt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={attested}
                        onChange={(e) => setAttested(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${
                        attested
                          ? "bg-[#FFB627] border-[#FFB627]"
                          : "border-[#1B2D45]/20 group-hover:border-[#FFB627]/50"
                      }`}>
                        {attested && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                      I confirm that I currently rent or have previously rented at this property.
                    </span>
                  </label>
                </div>

                {/* ── Error ── */}
                {status === "error" && (
                  <p className="text-[#E71D36] px-5 mt-3" style={{ fontSize: "12px" }}>{errorMessage}</p>
                )}

                {/* ── Actions ── */}
                <div className="flex gap-2 p-5 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.02] transition-colors"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!allRated || status === "sending"}
                    className="flex-1 py-2.5 rounded-xl bg-[#FFB627] text-white disabled:opacity-40 hover:bg-[#e5a422] transition-all"
                    style={{ fontSize: "13px", fontWeight: 700 }}
                  >
                    {status === "sending" ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}