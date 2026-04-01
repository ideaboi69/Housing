"use client";
import { AuthBackground } from "@/components/ui/AuthBackground";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { AuthBackLink } from "@/components/ui/AuthBackLink";
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const rotatingAuthLines = ["saved picks", "compare flow", "campus-first search"];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/browse";
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((current) => (current + 1) % rotatingAuthLines.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Friendly error mapping
  function getFriendlyError(err: string): string {
    const lower = err.toLowerCase();
    if (lower.includes("401") || lower.includes("invalid") || lower.includes("incorrect") || lower.includes("credentials") || lower.includes("not found")) {
      return "Incorrect email or password. Please try again.";
    }
    if (lower.includes("uoguelph")) {
      return "Please use your @uoguelph.ca email address.";
    }
    if (lower.includes("verified") || lower.includes("verify")) {
      return "Your email hasn't been verified yet. Check your inbox for the verification link.";
    }
    if (lower.includes("network") || lower.includes("fetch")) {
      return "Can't reach the server right now. Check your connection and try again.";
    }
    return err;
  }

  const displayError = localError || (error ? getFriendlyError(error) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError("");

    // Basic client-side checks
    if (!email.endsWith("@uoguelph.ca")) {
      setLocalError("Please use your @uoguelph.ca email address.");
      return;
    }

    try {
      await login({ email, password });
      router.push(nextPath);
    } catch {
      // Error is handled by the store
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
            className="min-w-0 lg:pr-6 lg:self-center"
          >
            <AuthBackLink />

            <div className="mt-6 max-w-[620px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-white/72 px-4 py-2 text-[#1B2D45]/55 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                For verified Guelph students
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.9rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                Pick up where
                <br />
                you left off.
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
                    key={rotatingAuthLines[rotatingIndex]}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {rotatingAuthLines[rotatingIndex]}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.5, ease: "easeOut" }}
                className="mt-6 max-w-[540px] text-[#1B2D45]/58"
                style={{ fontSize: "16px", lineHeight: 1.8 }}
              >
                Log back in to see your saved listings, revisit comparisons, and get back to finding a place without reopening ten tabs.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.5, ease: "easeOut" }}
                className="relative mt-6 max-w-[620px]"
              >
                <div className="pointer-events-none absolute -left-3 -top-3 h-16 w-16 rounded-full border border-[#1B2D45]/7" />
                <div className="pointer-events-none absolute right-6 top-8 h-2 w-2 rounded-full bg-[#FF6B35]/45" />
                <p className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.45 }}>
                  Cribb works best when it feels like your housing workspace, not another listing tab.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {["Saved picks stay put", "Compare flow is still there", "Campus distance stays visible"].map((item, index) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.42 + index * 0.08, duration: 0.42, ease: "easeOut" }}
                      whileHover={{ y: -2 }}
                      className="rounded-full border border-[#1B2D45]/10 bg-white/70 px-4 py-2 text-[#1B2D45]/60 backdrop-blur-sm"
                      style={{ fontSize: "13px", fontWeight: 650 }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62, duration: 0.4, ease: "easeOut" }}
                  className="mt-8 flex items-center gap-4 text-[#1B2D45]/42"
                  style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}
                >
                  <span>Student-only</span>
                  <span className="h-1 w-1 rounded-full bg-[#1B2D45]/20" />
                  <span>Verified network</span>
                  <span className="h-1 w-1 rounded-full bg-[#1B2D45]/20" />
                  <span>Guelph focused</span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="relative lg:ml-auto lg:w-full lg:max-w-[440px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/22 blur-2xl" />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-[34px] border border-black/[0.05] bg-white/88 p-6 backdrop-blur-xl md:p-8"
              style={{ boxShadow: "0 24px 80px rgba(27,45,69,0.10)" }}
            >
              <div className="border-b border-[#1B2D45]/8 pb-5">
                <div className="mt-4">
                  <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Welcome back
                  </div>
                  <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
                    Log in to your cribb.
                  </h2>
                  <p className="mt-2 text-[#1B2D45]/42" style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.5 }}>
                    Student-only access using your @uoguelph.ca email.
                  </p>
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
                    onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError(); }}
                    placeholder="you@uoguelph.ca"
                    required
                    className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[#FF6B35] hover:text-[#e55e2e] transition-colors"
                      style={{ fontSize: "12px", fontWeight: 700 }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLocalError(""); clearError(); }}
                      placeholder="••••••••"
                      required
                      className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 pr-11 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 translate-y-[2px] text-[#1B2D45]/25 hover:text-[#1B2D45]/55 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2.5 rounded-2xl bg-[#E71D36]/[0.06] px-4 py-3 text-[#E71D36]"
                      style={{ fontSize: "13px", lineHeight: 1.5 }}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{displayError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] py-3.5 text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
                  style={{ fontSize: "15px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
                >
                  {isLoading ? "Logging in..." : "Log in"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-5 text-[#1B2D45]/45" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                Your student email keeps Cribb student-only and helps cut down on fake accounts.
              </div>

              <p className="mt-5 text-center text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#FF6B35]" style={{ fontWeight: 700 }}>
                  Sign up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
