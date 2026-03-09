"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Mail, CheckCircle, ArrowRight, Check, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Password rules ── */

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { key: "number", label: "One number", test: (pw: string) => /\d/.test(pw) },
  { key: "special", label: "One special character (!@#$...)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordChecklist({ password }: { password: string }) {
  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-2.5 space-y-1.5"
    >
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <motion.div
            key={rule.key}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                background: passed ? "rgba(74,222,128,0.15)" : "rgba(27,45,69,0.06)",
                border: passed ? "1.5px solid rgba(74,222,128,0.4)" : "1.5px solid rgba(27,45,69,0.08)",
              }}
            >
              {passed ? (
                <Check className="w-2.5 h-2.5 text-[#4ADE80]" />
              ) : (
                <X className="w-2.5 h-2.5 text-[#1B2D45]/20" />
              )}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: passed ? "#4ADE80" : "#1B2D45",
                opacity: passed ? 1 : 0.4,
                transition: "all 0.2s",
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
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            cribb
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!showVerification ? (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="text-center mb-6">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>Join cribb</h1>
                <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "14px" }}>Create your account with your @uoguelph.ca email</p>
              </div>

              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>First name</label>
                      <input type="text" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all" style={{ fontSize: "14px" }} />
                    </div>
                    <div>
                      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Last name</label>
                      <input type="text" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all" style={{ fontSize: "14px" }} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Email</label>
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@uoguelph.ca" required className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all" style={{ fontSize: "14px" }} />
                  </div>

                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        placeholder="Create a strong password"
                        required
                        className="w-full mt-1.5 px-4 py-2.5 pr-10 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                        style={{ fontSize: "14px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 translate-y-[-25%] text-[#1B2D45]/25 hover:text-[#1B2D45]/50 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      <PasswordChecklist password={form.password} />
                    </AnimatePresence>
                  </div>

                  {error && (
                    <div className="bg-[#E71D36]/10 text-[#E71D36] px-4 py-2 rounded-lg" style={{ fontSize: "13px" }}>{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !allPasswordRulesPassed}
                    className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: allPasswordRulesPassed ? "0 4px 20px rgba(255,107,53,0.3)" : "none" }}
                  >
                    {isLoading ? "Creating account..." : "Sign up"}
                  </button>
                </form>
              </div>

              <p className="text-center mt-4 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
                Already have an account?{" "}
                <Link href="/login" className="text-[#FF6B35]" style={{ fontWeight: 600 }}>Log in</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="verify" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }} className="w-16 h-16 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-[#4ADE80]" />
              </motion.div>

              <h2 className="text-[#1B2D45] mt-5" style={{ fontSize: "22px", fontWeight: 800 }}>Check your email</h2>
              <p className="text-[#1B2D45]/50 mt-2 max-w-[320px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                We sent a verification link to <span className="text-[#1B2D45] font-semibold">{form.email}</span>. Click the link to activate your account.
              </p>

              <div className="mt-6 p-4 rounded-xl bg-[#FAF8F4] border border-black/[0.04]">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>What happens next?</p>
                    <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                      After verifying your email, you&apos;ll be automatically logged in and can start browsing listings, saving favorites, and finding roommates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link href="/login" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}>
                  I&apos;ve verified — Log in <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={() => setShowVerification(false)} className="w-full py-2.5 rounded-xl text-[#1B2D45]/40 hover:text-[#1B2D45]/60 transition-all" style={{ fontSize: "12px", fontWeight: 600 }}>
                  ← Back to sign up
                </button>
              </div>

              <p className="text-[#1B2D45]/25 mt-5" style={{ fontSize: "11px" }}>
                Didn&apos;t get the email? Check spam or try signing up again.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}