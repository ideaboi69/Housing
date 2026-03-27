"use client";

import { AuthBackground } from "@/components/ui/AuthBackground";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const rotatingResetLines = ["reset access", "get back to your picks", "stay in the flow"];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((current) => (current + 1) % rotatingResetLines.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

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
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
      <AuthBackground />
      <div className="relative z-10 min-h-screen px-4 py-8 md:px-6 md:py-10 lg:flex lg:items-center">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="min-w-0 lg:-mt-10 lg:pr-6"
          >
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
              <Link href="/" className="inline-block text-[#FF6B35] lg:-ml-6 xl:-ml-8" style={{ fontSize: "38px", fontWeight: 900, letterSpacing: "-0.05em" }}>
                cribb
              </Link>
            </motion.div>

            <div className="mt-10 max-w-[620px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-white/72 px-4 py-2 text-[#1B2D45]/55 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                Student-only password reset
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.7rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                Get back
                <br />
                into Cribb
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
                className="mt-4 h-[3px] w-24 origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,107,53,0.9) 0%, rgba(255,107,53,0.2) 100%)" }}
              />

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="mt-4 text-[#FF6B35]"
                style={{ fontSize: "clamp(1.35rem,2.2vw,2rem)", fontWeight: 800, letterSpacing: "-0.04em", minHeight: "1.2em" }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={rotatingResetLines[rotatingIndex]}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {rotatingResetLines[rotatingIndex]}
                  </motion.span>
                </AnimatePresence>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.5, ease: "easeOut" }}
                className="mt-6 max-w-[520px] text-[#1B2D45]/58"
                style={{ fontSize: "16px", lineHeight: 1.8 }}
              >
                Enter your school email and we&apos;ll send you a reset link so you can get back to your saved listings and comparisons.
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="relative lg:ml-auto lg:w-full lg:max-w-[440px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/22 blur-2xl" />

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div
                  key="forgot-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[34px] border border-black/[0.05] bg-white/88 p-6 backdrop-blur-xl md:p-8"
                  style={{ boxShadow: "0 24px 80px rgba(27,45,69,0.10)" }}
                >
                  <div className="border-b border-[#1B2D45]/8 pb-5">
                    <div className="w-fit rounded-full bg-[#F3E4DA] px-3 py-1.5 text-[#C86B34]" style={{ fontSize: "11px", fontWeight: 800 }}>
                      Reset password
                    </div>
                    <div className="mt-4">
                      <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Account recovery
                      </div>
                      <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
                        Reset your password.
                      </h2>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div>
                      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                        School email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@uoguelph.ca"
                        required
                        className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                        style={{ fontSize: "14px", fontWeight: 500 }}
                      />
                    </div>

                    {error && (
                      <div className="rounded-2xl bg-[#E71D36]/[0.06] px-4 py-3 text-[#E71D36]" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-2xl bg-[#FF6B35] py-3.5 text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
                      style={{ fontSize: "15px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
                    >
                      {isLoading ? "Sending..." : "Send reset link"}
                    </button>
                  </form>

                  <Link
                    href="/login"
                    className="mt-5 inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45]/70 transition-colors"
                    style={{ fontSize: "13px", fontWeight: 700 }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to log in
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="forgot-sent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[34px] border border-black/[0.05] bg-white/88 p-6 text-center backdrop-blur-xl md:p-8"
                  style={{ boxShadow: "0 24px 80px rgba(27,45,69,0.10)" }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4ADE80]/10">
                    <Mail className="h-7 w-7 text-[#4ADE80]" />
                  </div>

                  <h2 className="mt-5 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>
                    Check your email
                  </h2>
                  <p className="mx-auto mt-2 max-w-[320px] text-[#1B2D45]/55" style={{ fontSize: "14px", lineHeight: 1.65 }}>
                    If an account exists for <span className="font-semibold text-[#1B2D45]">{email}</span>, we&apos;ve sent a password reset link.
                  </p>

                  <div className="mt-6 rounded-2xl bg-[#FCFAF6] p-4 text-left">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                      <div>
                        <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                          What to do next
                        </div>
                        <p className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "11px", lineHeight: 1.55 }}>
                          Open the email, use the reset link, and then log back in. Check spam if you don&apos;t see it right away.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#FF6B35] py-3.5 text-white hover:bg-[#e55e2e] transition-all"
                      style={{ fontSize: "14px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
                    >
                      Back to log in
                    </Link>
                    <button
                      onClick={() => { setSent(false); setEmail(""); }}
                      className="w-full rounded-2xl py-2.5 text-[#1B2D45]/42 hover:text-[#1B2D45]/65 transition-colors"
                      style={{ fontSize: "12px", fontWeight: 700 }}
                    >
                      Try a different email
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
