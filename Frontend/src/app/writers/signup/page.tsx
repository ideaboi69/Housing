"use client";

import { WriterAuthBackground } from "@/components/ui/WriterAuthBackground";
import { AuthBackLink } from "@/components/ui/AuthBackLink";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { AlertCircle, ArrowRight, CheckCircle2, PenLine, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WriterRegister } from "@/types";

type WriterSignupStep = 1 | 2;

const rotatingLines = ["campus news", "local deals", "student tips"];

const BUSINESS_TYPES = [
  { key: "individual", label: "Individual" },
  { key: "organization", label: "Organization" },
  { key: "business", label: "Business" },
] as const;

export default function WriterSignupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<WriterRegister>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    business_name: "",
    business_type: "individual",
    website: "",
    phone: "",
    reason: "",
  });
  const [step, setStep] = useState<WriterSignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((current) => (current + 1) % rotatingLines.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const canContinue =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.email.trim() &&
    form.password.trim();

  const canSubmit = canContinue && form.business_name.trim() && form.reason.trim();

  function update<K extends keyof WriterRegister>(field: K, value: WriterRegister[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function goToStepTwo() {
    if (!canContinue) {
      setError("Please add your name, email, and password first.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (step === 1) {
      goToStepTwo();
      return;
    }

    if (!canSubmit) {
      setError("Please finish the remaining application details.");
      return;
    }

    setIsLoading(true);
    try {
      await api.writers.register({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        business_name: form.business_name.trim(),
        business_type: form.business_type || undefined,
        website: form.website?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        reason: form.reason.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setIsLoading(false);
    }
  }

  if (user?.role === "landlord") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
        <WriterAuthBackground />
        <div className="relative z-10 min-h-screen px-4 py-8 md:px-6 md:py-10 flex items-center">
          <div className="mx-auto w-full max-w-[520px]">
            <AuthBackLink />
            <div className="mt-8 rounded-[28px] border border-black/[0.06] bg-white/92 p-8 text-center shadow-[0_24px_60px_rgba(27,45,69,0.10)] backdrop-blur-xl">
              <h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em" }}>
                Writer applications are student-only.
              </h1>
              <p className="mt-3 text-[#1B2D45]/52" style={{ fontSize: "14px", lineHeight: 1.7 }}>
                Landlord accounts can browse The Bubble, but only student and approved writer accounts can apply to contribute.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <Link href="/the-bubble" className="px-5 py-3 rounded-xl border border-black/[0.06] text-[#1B2D45]/65 hover:text-[#1B2D45] hover:border-[#1B2D45]/15 transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
                  Browse The Bubble
                </Link>
                <Link href="/landlord" className="px-5 py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#142235] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
                  Landlord Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
      <WriterAuthBackground />
      <div className="relative z-10 min-h-screen px-4 py-8 md:px-6 md:py-10 lg:flex lg:items-center">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="min-w-0 lg:pr-6 lg:self-center"
          >
            <AuthBackLink />

            <div className="mt-6 max-w-[640px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/10 bg-[#FF6B35]/[0.06] px-4 py-2 text-[#C86B34]/70 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                Writer application
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.9rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                Share what&apos;s
                <br />
                happening in Guelph.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
                className="mt-4 h-[3px] w-24 origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,107,53,0.95) 0%, rgba(255,107,53,0.2) 100%)" }}
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
                    key={rotatingLines[rotatingIndex]}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {rotatingLines[rotatingIndex]}
                  </motion.span>
                </AnimatePresence>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.5, ease: "easeOut" }}
                className="mt-6 max-w-[560px] text-[#1B2D45]/58"
                style={{ fontSize: "16px", lineHeight: 1.8 }}
              >
                Apply to write for The Bubble, share local stories, and help students find the useful stuff faster.
              </motion.p>

              <div className="mt-10 grid max-w-[560px] gap-3 sm:grid-cols-3">
                {[
                  { icon: <PenLine className="h-4 w-4" />, label: "Submit stories" },
                  { icon: <ShieldCheck className="h-4 w-4" />, label: "Reviewed access" },
                  { icon: <ArrowRight className="h-4 w-4" />, label: "Bubble workflow" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34 + index * 0.07, duration: 0.42, ease: "easeOut" }}
                    className="rounded-2xl border border-[#FF6B35]/10 bg-[#FF6B35]/[0.03] px-4 py-4 text-[#1B2D45]/65 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2 text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>
                      {item.icon}
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="relative lg:ml-auto lg:w-full lg:max-w-[480px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/24 blur-2xl" />

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="writer-apply"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[34px] border border-[#FF6B35]/[0.08] bg-white/92 p-6 backdrop-blur-xl md:p-8"
                  style={{ boxShadow: "0 24px 80px rgba(255,107,53,0.10)" }}
                >
                  <div className="border-b border-[#FF6B35]/10 pb-5">
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[#FF6B35]/45" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Apply now
                        </div>
                        <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
                          {step === 1 ? "Create your account." : "Tell us about your publication."}
                        </h2>
                        <p className="mt-2 text-[#1B2D45]/42" style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.5 }}>
                          Step 1 keeps the setup short. Step 2 covers your publication details.
                        </p>
                      </div>
                      <div className="rounded-full bg-[#FF6B35]/[0.08] px-3 py-1.5 text-[#C86B34]" style={{ fontSize: "11px", fontWeight: 800 }}>
                        Step {step} of 2
                      </div>
                    </div>
                    <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#FF6B35]/10">
                      <div
                        className="h-full rounded-full bg-[#FF6B35]"
                        style={{ width: step === 1 ? "50%" : "100%" }}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7">
                    <AnimatePresence mode="wait">
                      {step === 1 ? (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -14 }}
                          transition={{ duration: 0.28 }}
                          className="space-y-5"
                        >
                          <div className="rounded-[28px] border border-[#FF6B35]/10 bg-[#FF6B35]/[0.03] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[#FF6B35]/45" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Step 1
                              </div>
                              <div className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 700 }}>
                                Account details
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                  First name
                                </label>
                                <input
                                  type="text"
                                  value={form.first_name}
                                  onChange={(e) => update("first_name", e.target.value)}
                                  required
                                  className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                  style={{ fontSize: "14px", fontWeight: 500 }}
                                />
                              </div>

                              <div>
                                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                  Last name
                                </label>
                                <input
                                  type="text"
                                  value={form.last_name}
                                  onChange={(e) => update("last_name", e.target.value)}
                                  required
                                  className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                  style={{ fontSize: "14px", fontWeight: 500 }}
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                Email
                              </label>
                              <input
                                type="email"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
                                placeholder="you@email.com"
                                required
                                className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                style={{ fontSize: "14px", fontWeight: 500 }}
                              />
                            </div>

                            <div className="mt-4">
                              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                Password
                              </label>
                              <input
                                type="password"
                                value={form.password}
                                onChange={(e) => update("password", e.target.value)}
                                placeholder="Create a strong password"
                                required
                                className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                style={{ fontSize: "14px", fontWeight: 500 }}
                              />
                            </div>
                          </div>

                          {error && (
                            <div className="flex items-center gap-2 rounded-2xl border border-[#E71D36]/10 bg-[#E71D36]/8 px-4 py-3 text-[#E71D36]">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span style={{ fontSize: "13px" }}>{error}</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isLoading || !canContinue}
                            className="w-full rounded-2xl bg-[#FF6B35] px-4 py-3.5 text-white transition-all hover:bg-[#e55e2e] disabled:opacity-60"
                            style={{ fontSize: "15px", fontWeight: 800, boxShadow: "0 10px 24px rgba(255,107,53,0.24)" }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              Continue
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step-2"
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -14 }}
                          transition={{ duration: 0.28 }}
                          className="space-y-5"
                        >
                          <div className="rounded-[28px] border border-[#FF6B35]/10 bg-[#FF6B35]/[0.03] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[#FF6B35]/45" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Step 2
                              </div>
                              <div className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 700 }}>
                                Publication details
                              </div>
                            </div>

                            <div className="mt-4 space-y-4">
                              <div>
                                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                  Publication / org name
                                </label>
                                <input
                                  type="text"
                                  value={form.business_name}
                                  onChange={(e) => update("business_name", e.target.value)}
                                  placeholder="The Bubble, Guelph Eats, etc."
                                  required
                                  className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                  style={{ fontSize: "14px", fontWeight: 500 }}
                                />
                              </div>

                              <div>
                                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                  Writer type
                                </label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {BUSINESS_TYPES.map((opt) => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => update("business_type", opt.key)}
                                      className={`rounded-full border px-3 py-2 transition-all ${
                                        form.business_type === opt.key
                                          ? "border-[#FF6B35]/25 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                                          : "border-black/[0.06] text-[#1B2D45]/45 hover:border-[#FF6B35]/15"
                                      }`}
                                      style={{ fontSize: "12px", fontWeight: 600 }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                    Website
                                  </label>
                                  <input
                                    type="url"
                                    value={form.website || ""}
                                    onChange={(e) => update("website", e.target.value)}
                                    placeholder="https://..."
                                    className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                    style={{ fontSize: "14px", fontWeight: 500 }}
                                  />
                                </div>

                                <div>
                                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                    Phone
                                  </label>
                                  <input
                                    type="tel"
                                    value={form.phone || ""}
                                    onChange={(e) => update("phone", e.target.value)}
                                    placeholder="519-555-0123"
                                    className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                    style={{ fontSize: "14px", fontWeight: 500 }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                                  What will you post about?
                                </label>
                                <textarea
                                  value={form.reason}
                                  onChange={(e) => update("reason", e.target.value)}
                                  placeholder="Tell us what kind of stories, tips, or posts you want to share..."
                                  rows={4}
                                  required
                                  className="mt-2 w-full resize-none rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] transition-all placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none"
                                  style={{ fontSize: "14px", lineHeight: 1.65 }}
                                />
                              </div>
                            </div>
                          </div>

                          {error && (
                            <div className="flex items-center gap-2 rounded-2xl border border-[#E71D36]/10 bg-[#E71D36]/8 px-4 py-3 text-[#E71D36]">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span style={{ fontSize: "13px" }}>{error}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isLoading) {
                                  setError("");
                                  setStep(1);
                                }
                              }}
                              disabled={isLoading}
                              className="rounded-2xl border border-[#1B2D45]/10 bg-white/70 px-4 py-3.5 text-[#1B2D45]/65 transition-all hover:border-[#1B2D45]/18 hover:text-[#1B2D45]/85 disabled:opacity-50"
                              style={{ fontSize: "14px", fontWeight: 800 }}
                            >
                              Back
                            </button>

                            <button
                              type="submit"
                              disabled={isLoading || !canSubmit}
                              className="rounded-2xl bg-[#FF6B35] px-4 py-3.5 text-white transition-all hover:bg-[#e55e2e] disabled:opacity-60"
                              style={{ fontSize: "15px", fontWeight: 800, boxShadow: "0 10px 24px rgba(255,107,53,0.24)" }}
                            >
                              {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <PenLine className="h-4 w-4 animate-pulse" />
                                  Submitting...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2">
                                  Submit application
                                  <ArrowRight className="h-4 w-4" />
                                </span>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>

                  <div className="mt-6 rounded-2xl bg-[#FF6B35]/[0.05] px-4 py-3 text-[#1B2D45]/55" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                    We review writer applications manually and usually get back to you within 24 hours.
                  </div>

                  <p className="mt-5 text-center text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
                    Already approved?{" "}
                    <Link href="/writers/login" className="text-[#FF6B35]" style={{ fontWeight: 700 }}>
                      Log in
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="writer-submitted"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[34px] border border-[#FF6B35]/[0.08] bg-white/92 p-6 text-center backdrop-blur-xl md:p-8"
                  style={{ boxShadow: "0 24px 80px rgba(255,107,53,0.10)" }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
                    <CheckCircle2 className="h-7 w-7 text-[#FF6B35]" />
                  </div>

                  <h2 className="mt-5 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>
                    Application submitted
                  </h2>
                  <p className="mx-auto mt-2 max-w-[320px] text-[#1B2D45]/55" style={{ fontSize: "14px", lineHeight: 1.65 }}>
                    We&apos;ll review your writer application and get back to you within 24 hours. Once approved, you can log in and start posting to The Bubble.
                  </p>

                  <div className="mt-6 rounded-2xl bg-[#FAFBFA] p-4 text-left">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B35]" />
                      <div>
                        <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                          What happens next
                        </div>
                        <p className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "11px", lineHeight: 1.55 }}>
                          We&apos;ll email you when your account is approved. Then you can log in and start writing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Link
                      href="/writers/login"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] py-3.5 text-white transition-all hover:bg-[#e55e2e]"
                      style={{ fontSize: "14px", fontWeight: 800, boxShadow: "0 10px 24px rgba(255,107,53,0.24)" }}
                    >
                      Go to writer login
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full rounded-2xl py-2.5 text-[#1B2D45]/42 transition-colors hover:text-[#1B2D45]/65"
                      style={{ fontSize: "12px", fontWeight: 700 }}
                    >
                      Back to cribb
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
