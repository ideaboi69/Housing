"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@uoguelph.ca")) {
      setError("Please use your @uoguelph.ca email address.");
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            cribb
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="text-center mb-6">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>Reset your password</h1>
                <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "14px" }}>
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@uoguelph.ca"
                      required
                      className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                      style={{ fontSize: "14px" }}
                    />
                  </div>

                  {error && (
                    <div className="bg-[#E71D36]/[0.06] text-[#E71D36] px-4 py-2 rounded-lg" style={{ fontSize: "13px" }}>{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
                  >
                    {isLoading ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              </div>

              <Link href="/login" className="flex items-center justify-center gap-1.5 mt-4 text-[#1B2D45]/50 hover:text-[#1B2D45]/70 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
              </Link>
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center mx-auto"
              >
                <Mail className="w-7 h-7 text-[#4ADE80]" />
              </motion.div>

              <h2 className="text-[#1B2D45] mt-5" style={{ fontSize: "22px", fontWeight: 800 }}>Check your email</h2>
              <p className="text-[#1B2D45]/50 mt-2 max-w-[320px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                If an account exists for <span className="text-[#1B2D45] font-semibold">{email}</span>, we&apos;ve sent a password reset link.
              </p>

              <div className="mt-6 p-4 rounded-xl bg-[#FAF8F4] border border-black/[0.04]">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>What to do next</p>
                    <p className="text-[#1B2D45]/45 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                      Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                  style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
                >
                  Back to log in
                </Link>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full py-2.5 rounded-xl text-[#1B2D45]/40 hover:text-[#1B2D45]/60 transition-all"
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  Try a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}