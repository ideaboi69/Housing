"use client";

import { useState } from "react";
import { Flag, X, AlertTriangle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

const REPORT_REASONS = [
  { value: "inaccurate_info", label: "Inaccurate listing info", icon: "📝" },
  { value: "scam_fraud", label: "Suspected scam or fraud", icon: "🚨" },
  { value: "duplicate", label: "Duplicate listing", icon: "📋" },
  { value: "offensive_content", label: "Offensive or inappropriate content", icon: "⚠️" },
  { value: "already_rented", label: "Already rented / unavailable", icon: "🔒" },
  { value: "other", label: "Other", icon: "💬" },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle?: string;
}

export function ReportModal({ isOpen, onClose, listingId, listingTitle }: ReportModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "duplicate">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (!selectedReason) return;

    if (!user) {
      onClose();
      router.push("/login");
      return;
    }

    const reason = selectedReason === "other" && customReason.trim()
      ? customReason.trim()
      : REPORT_REASONS.find((r) => r.value === selectedReason)?.label ?? selectedReason;

    setStatus("sending");
    try {
      await api.flags.create({ listing_id: listingId, reason });
      setStatus("sent");
      setTimeout(() => {
        onClose();
        // Reset after close animation
        setTimeout(() => {
          setSelectedReason(null);
          setCustomReason("");
          setStatus("idle");
        }, 200);
      }, 1800);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStatus("duplicate");
        setTimeout(() => { onClose(); setStatus("idle"); setSelectedReason(null); }, 2000);
      } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        onClose();
        router.push("/login");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
        setStatus("error");
      }
    }
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
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-2xl w-full overflow-hidden"
            style={{ maxWidth: "420px", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
          >
            {/* Success / Duplicate state */}
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
                  {status === "sent" ? "Report Submitted" : "Already Reported"}
                </p>
                <p className="text-[#1B2D45]/50 mt-1" style={{ fontSize: "13px" }}>
                  {status === "sent"
                    ? "Thanks for helping keep cribb safe. We'll review this shortly."
                    : "You've already reported this listing. We're on it."}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E71D36]/10 flex items-center justify-center">
                      <Flag className="w-4 h-4 text-[#E71D36]" />
                    </div>
                    <div>
                      <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Report Listing</h3>
                      {listingTitle && (
                        <p className="text-[#1B2D45]/40 truncate" style={{ fontSize: "11px", maxWidth: "220px" }}>
                          {listingTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-[#1B2D45]/40" />
                  </button>
                </div>

                {/* Reasons */}
                <div className="p-5 space-y-1.5">
                  <p className="text-[#1B2D45]/50 mb-3" style={{ fontSize: "12px", fontWeight: 500 }}>
                    Why are you reporting this listing?
                  </p>
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                        selectedReason === reason.value
                          ? "border-[#E71D36]/30 bg-[#E71D36]/[0.04]"
                          : "border-transparent hover:bg-[#1B2D45]/[0.02]"
                      }`}
                    >
                      <span style={{ fontSize: "16px" }}>{reason.icon}</span>
                      <span
                        className={`${selectedReason === reason.value ? "text-[#E71D36]" : "text-[#1B2D45]/70"}`}
                        style={{ fontSize: "13px", fontWeight: selectedReason === reason.value ? 600 : 500 }}
                      >
                        {reason.label}
                      </span>
                    </button>
                  ))}

                  {/* Custom reason text area */}
                  <AnimatePresence>
                    {selectedReason === "other" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Describe the issue..."
                          className="w-full mt-2 p-3 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#1B2D45]/30 focus:outline-none focus:border-[#E71D36]/30 resize-none"
                          style={{ fontSize: "13px", minHeight: "80px" }}
                          maxLength={500}
                        />
                        <p className="text-right text-[#1B2D45]/25 mt-1" style={{ fontSize: "10px" }}>
                          {customReason.length}/500
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  {status === "error" && (
                    <p className="text-[#E71D36] mt-2" style={{ fontSize: "12px" }}>{errorMessage}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-5 pt-0">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.02] transition-colors"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || status === "sending" || (selectedReason === "other" && !customReason.trim())}
                    className="flex-1 py-2.5 rounded-xl bg-[#E71D36] text-white disabled:opacity-40 hover:bg-[#d01830] transition-all"
                    style={{ fontSize: "13px", fontWeight: 700 }}
                  >
                    {status === "sending" ? "Submitting..." : "Submit Report"}
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