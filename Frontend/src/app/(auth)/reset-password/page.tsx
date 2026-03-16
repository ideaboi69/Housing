"use client";
import { AuthBackground } from "@/components/ui/AuthBackground";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

/* ── Same password rules as signup ── */

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
          <div key={rule.key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                background: passed ? "rgba(74,222,128,0.15)" : "rgba(27,45,69,0.06)",
                border: passed ? "1.5px solid rgba(74,222,128,0.4)" : "1.5px solid rgba(27,45,69,0.08)",
              }}
            >
              {passed ? <Check className="w-2.5 h-2.5 text-[#4ADE80]" /> : <X className="w-2.5 h-2.5 text-[#1B2D45]/20" />}
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: passed ? "#4ADE80" : "#1B2D45", opacity: passed ? 1 : 0.4 }}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const allRulesPassed = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPassed && passwordsMatch && !isLoading;

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset link. Please request a new one.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setError("");
    setIsLoading(true);

    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
    } catch {
      setError("This reset link has expired or is invalid. Please request a new one.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 relative">
        <AuthBackground />
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            cribb
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="text-center mb-6">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>Set new password</h1>
                <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "14px" }}>Choose a strong password for your account</p>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 p-6" style={{ boxShadow: "0 8px 40px rgba(27,45,69,0.08)" }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>New password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
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
                    <PasswordChecklist password={password} />
                  </div>

                  <div>
                    <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Confirm password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Re-enter your password"
                      required
                      className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                      style={{ fontSize: "14px" }}
                    />
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1.5 text-[#E71D36]"
                        style={{ fontSize: "11px", fontWeight: 500 }}
                      >
                        Passwords don&apos;t match
                      </motion.p>
                    )}
                    {passwordsMatch && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1.5 flex items-center gap-1 text-[#4ADE80]"
                        style={{ fontSize: "11px", fontWeight: 500 }}
                      >
                        <Check className="w-3 h-3" /> Passwords match
                      </motion.p>
                    )}
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2.5 bg-[#E71D36]/[0.06] text-[#E71D36] px-4 py-3 rounded-xl"
                        style={{ fontSize: "13px", lineHeight: 1.5 }}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: canSubmit ? "0 4px 20px rgba(255,107,53,0.3)" : "none" }}
                  >
                    {isLoading ? "Resetting..." : "Reset password"}
                  </button>
                </form>
              </div>

              <Link href="/login" className="flex items-center justify-center gap-1.5 mt-4 text-[#1B2D45]/50 hover:text-[#1B2D45]/70 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                ← Back to log in
              </Link>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center mx-auto"
              >
                <ShieldCheck className="w-7 h-7 text-[#4ADE80]" />
              </motion.div>

              <h2 className="text-[#1B2D45] mt-5" style={{ fontSize: "22px", fontWeight: 800 }}>Password updated</h2>
              <p className="text-[#1B2D45]/50 mt-2 max-w-[320px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                Your password has been successfully reset. You can now log in with your new password.
              </p>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-3 mt-6 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
              >
                Log in with new password
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}