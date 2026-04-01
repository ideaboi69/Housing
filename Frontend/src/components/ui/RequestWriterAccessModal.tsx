"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BadgeCheck, Loader2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface RequestWriterAccessModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function RequestWriterAccessModal({
  open,
  onClose,
  onSubmitted,
}: RequestWriterAccessModalProps) {
  const user = useAuthStore((state) => state.user);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const canSubmit = reason.trim().length >= 12;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      await api.auth.requestWriteAccess(reason.trim());

      useAuthStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              write_access_requested: true,
            }
          : null,
      }));

      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn’t submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="w-full max-w-[480px] rounded-[24px] border border-black/[0.06] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.15)] overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-4">
            <div>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
                Request writer access
              </h3>
              <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "11px" }}>
                Student accounts can request Bubble publishing privileges.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {submitted ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#4ADE80]/10">
                <BadgeCheck className="h-7 w-7 text-[#4ADE80]" />
              </div>
              <h4 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                Request submitted
              </h4>
              <p className="mt-2 text-[#98A3B0]" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                We’ll review your request and let you know once Bubble publishing is approved for{" "}
                <span className="font-semibold text-[#1B2D45]">{user?.email}</span>.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-xl bg-[#FF6B35] px-5 py-2.5 text-white hover:bg-[#e55e2e] transition-all"
                style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="px-5 py-5">
              <div className="rounded-2xl bg-[#FAF8F4] px-4 py-3 mb-4">
                <p className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                  Why do you want writer access?
                </p>
                <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                  Tell us what you’d like to post about: events, tips, local finds, campus updates, or anything helpful for students.
                </p>
              </div>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Example: I want to share local events, useful food spots, and quick student updates around Guelph."
                rows={5}
                className="w-full rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3 text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all resize-none"
                style={{ fontSize: "13px", lineHeight: 1.6 }}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[#98A3B0]" style={{ fontSize: "10px" }}>
                  Minimum 12 characters
                </span>
                <span className="text-[#98A3B0]" style={{ fontSize: "10px" }}>
                  {reason.length}/300
                </span>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E71D36]/5 px-3 py-2.5 text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 500 }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-black/[0.08] px-4 py-2.5 text-[#1B2D45]/60 hover:text-[#1B2D45] hover:border-black/[0.14] transition-all"
                  style={{ fontSize: "12px", fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white hover:bg-[#e55e2e] disabled:opacity-45 transition-all"
                  style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Submitting..." : "Request access"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
