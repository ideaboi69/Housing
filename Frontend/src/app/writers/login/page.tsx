"use client";

import { WriterAuthBackground } from "@/components/ui/WriterAuthBackground";
import { AuthBackLink } from "@/components/ui/AuthBackLink";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWriterStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { AlertCircle, ArrowRight, PenLine, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const rotatingLines = ["campus stories", "local deals", "student tips"];

function WriterLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/writer";
  const user = useAuthStore((state) => state.user);
  const { login, isLoading, error, clearError } = useWriterStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((current) => (current + 1) % rotatingLines.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      useAuthStore.getState().logout();
      router.push(nextPath);
    } catch {
      // store sets the error
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
                Writer login isn&apos;t available for landlord accounts.
              </h1>
              <p className="mt-3 text-[#1B2D45]/52" style={{ fontSize: "14px", lineHeight: 1.7 }}>
                Landlords can read Bubble posts, but publishing and writer access are reserved for student and approved writer accounts.
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
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
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
                className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/10 bg-[#FF6B35]/[0.06] px-4 py-2 text-[#C86B34]/70 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                Approved writers only
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.9rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                Write for
                <br />
                The Bubble.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
                className="mt-4 h-[3px] w-24 origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(15,118,110,0.95) 0%, rgba(20,184,166,0.22) 100%)" }}
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
                Log in with your writer account to publish posts, share campus news, and keep The Bubble moving.
              </motion.p>

              <div className="mt-10 grid max-w-[560px] gap-3 sm:grid-cols-3">
                {[
                  { icon: <PenLine className="h-4 w-4" />, label: "Publish posts" },
                  { icon: <ShieldCheck className="h-4 w-4" />, label: "Approved access" },
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
            className="relative lg:ml-auto lg:w-full lg:max-w-[460px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/24 blur-2xl" />

            <div className="rounded-[34px] border border-[#FF6B35]/[0.08] bg-white/92 p-6 backdrop-blur-xl md:p-8" style={{ boxShadow: "0 24px 80px rgba(255,107,53,0.10)" }}>
              <div className="border-b border-[#FF6B35]/10 pb-5">
                <div className="mt-4">
                  <div className="text-[#FF6B35]/45" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Welcome back
                  </div>
                  <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
                    Sign in to post.
                  </h2>
                  <p className="mt-2 text-[#1B2D45]/42" style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.5 }}>
                    Approved writer access for The Bubble.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className="mt-2 w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="w-full rounded-2xl border border-[#FF6B35]/10 bg-[#FAFBFA] px-4 py-3.5 pr-12 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/25 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1B2D45]/28 hover:text-[#1B2D45]/55 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[#1B2D45]/38" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                    Use the password from your application. Strong passwords usually include an uppercase letter, a number, and a symbol.
                  </p>
                </div>

                {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#E71D36]/10 bg-[#E71D36]/8 px-4 py-3 text-[#E71D36]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span style={{ fontSize: "13px" }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-[#FF6B35] px-4 py-3.5 text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
                  style={{ fontSize: "15px", fontWeight: 800, boxShadow: "0 10px 24px rgba(255,107,53,0.24)" }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <PenLine className="h-4 w-4 animate-pulse" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Open writer dashboard
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
                  New writer?{" "}
                  <Link href="/writers/signup" className="text-[#FF6B35]" style={{ fontWeight: 700 }}>
                    Apply to write
                  </Link>
                </p>
                <p className="mt-2 text-[#1B2D45]/25" style={{ fontSize: "11px" }}>
                  Looking for housing?{" "}
                  <Link href="/login" className="text-[#1B2D45]/40 underline">
                    Student login
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function WriterLoginPage() {
  return (
    <Suspense fallback={null}>
      <WriterLoginPageContent />
    </Suspense>
  );
}
