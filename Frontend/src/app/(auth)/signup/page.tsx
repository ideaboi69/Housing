"use client";

import { AuthBackground } from "@/components/ui/AuthBackground";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Mail, CheckCircle, ArrowRight, Check, X, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { key: "number", label: "One number", test: (pw: string) => /\d/.test(pw) },
  { key: "special", label: "One special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

const rotatingSignupLines = ["verified access", "faster comparisons", "student-only housing"];

function PasswordChecklist({ password }: { password: string }) {
  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 grid gap-2"
    >
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <motion.div
            key={rule.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{
                background: passed ? "rgba(74,222,128,0.14)" : "rgba(27,45,69,0.05)",
                border: passed ? "1.5px solid rgba(74,222,128,0.38)" : "1.5px solid rgba(27,45,69,0.08)",
              }}
            >
              {passed ? <Check className="h-2.5 w-2.5 text-[#4ADE80]" /> : <X className="h-2.5 w-2.5 text-[#1B2D45]/20" />}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: passed ? "#2A9F63" : "#1B2D45",
                opacity: passed ? 1 : 0.42,
              }}
            >
              {rule.label}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [showVerification, setShowVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((current) => (current + 1) % rotatingSignupLines.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const allPasswordRulesPassed = useMemo(
    () => PASSWORD_RULES.every((rule) => rule.test(form.password)),
    [form.password]
  );

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!allPasswordRulesPassed) return;

    try {
      const res = await register(form);
      if (res && typeof res === "object" && "access_token" in res) {
        router.push("/browse");
      } else {
        setShowVerification(true);
      }
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
      <AuthBackground />
      <div className="relative z-10 min-h-screen px-4 py-8 md:px-6 md:py-10 lg:flex lg:items-center">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
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

            <div className="mt-10 max-w-[640px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-white/72 px-4 py-2 text-[#1B2D45]/55 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                For verified UofG students
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.9rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                Make your
                <br />
                Cribb account
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
                    key={rotatingSignupLines[rotatingIndex]}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {rotatingSignupLines[rotatingIndex]}
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
                Sign up with your school email to save listings, compare them properly, and keep your housing search in one place.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.5, ease: "easeOut" }}
                className="relative mt-10 max-w-[620px]"
              >
                <div className="pointer-events-none absolute -left-3 -top-3 h-16 w-16 rounded-full border border-[#1B2D45]/7" />
                <div className="pointer-events-none absolute right-6 top-8 h-2 w-2 rounded-full bg-[#FF6B35]/45" />
                <p className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.45 }}>
                  The good part is that once you sign up, Cribb starts behaving like your housing workspace instead of a pile of screenshots.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {["Save listings", "Compare in one place", "Built around UofG"].map((item, index) => (
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
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="relative lg:ml-auto lg:w-full lg:max-w-[460px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/22 blur-2xl" />

            <AnimatePresence mode="wait">
              {!showVerification ? (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[34px] border border-black/[0.05] bg-white/88 p-6 backdrop-blur-xl md:p-8"
                  style={{ boxShadow: "0 24px 80px rgba(27,45,69,0.10)" }}
                >
                  <div className="border-b border-[#1B2D45]/8 pb-5">
                    <div className="w-fit rounded-full bg-[#F3E4DA] px-3 py-1.5 text-[#C86B34]" style={{ fontSize: "11px", fontWeight: 800 }}>
                      Student-only sign up
                    </div>
                    <div className="mt-4">
                      <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Get started
                      </div>
                      <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
                        Create your cribb.
                      </h2>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                          First name
                        </label>
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => update("first_name", e.target.value)}
                          required
                          className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
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
                          className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                          style={{ fontSize: "14px", fontWeight: 500 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                        School email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@uoguelph.ca"
                        required
                        className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                        style={{ fontSize: "14px", fontWeight: 500 }}
                      />
                    </div>

                    <div>
                      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                          placeholder="Create a strong password"
                          required
                          className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 pr-11 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                          style={{ fontSize: "14px", fontWeight: 500 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 translate-y-[2px] text-[#1B2D45]/25 hover:text-[#1B2D45]/55 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        <PasswordChecklist password={form.password} />
                      </AnimatePresence>
                    </div>

                    {error && (
                      <div className="rounded-2xl bg-[#E71D36]/[0.06] px-4 py-3 text-[#E71D36]" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !allPasswordRulesPassed}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] py-3.5 text-white hover:bg-[#e55e2e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      style={{ fontSize: "15px", fontWeight: 800, boxShadow: allPasswordRulesPassed ? "0 10px 28px rgba(255,107,53,0.28)" : "none" }}
                    >
                      {isLoading ? "Creating account..." : "Sign up"}
                      {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </form>

                  <div className="mt-5 text-[#1B2D45]/45" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                    We use your UofG email to keep the network student-only and more trustworthy.
                  </div>

                  <p className="mt-5 text-center text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#FF6B35]" style={{ fontWeight: 700 }}>
                      Log in
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-verify"
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
                    We sent a verification link to <span className="font-semibold text-[#1B2D45]">{form.email}</span>. Click it to activate your account.
                  </p>

                  <div className="mt-6 rounded-2xl bg-[#FCFAF6] p-4 text-left">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                      <div>
                        <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                          What happens next
                        </div>
                        <p className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "11px", lineHeight: 1.55 }}>
                          After verifying, you can log in and start saving listings, comparing picks, and browsing the rest of the platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] py-3.5 text-white hover:bg-[#e55e2e] transition-all"
                      style={{ fontSize: "14px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
                    >
                      I&apos;ve verified
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setShowVerification(false)}
                      className="w-full rounded-2xl py-2.5 text-[#1B2D45]/42 hover:text-[#1B2D45]/65 transition-colors"
                      style={{ fontSize: "12px", fontWeight: 700 }}
                    >
                      Back to sign up
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
