"use client";
import { AuthBackground } from "@/components/ui/AuthBackground";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

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
      router.push("/browse");
    } catch {
      // Error is handled by the store
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 relative">
        <AuthBackground />
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-[#FF6B35]"
            style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.04em" }}
          >
            cribb
          </Link>
          <h1 className="mt-3 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>
            Welcome back
          </h1>
          <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "14px" }}>
            Log in with your @uoguelph.ca email
          </p>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError(); }}
                placeholder="you@uoguelph.ca"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#FF6B35] hover:text-[#e55e2e] transition-colors"
                  style={{ fontSize: "12px", fontWeight: 600 }}
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
            </div>

            <AnimatePresence>
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2.5 bg-[#E71D36]/[0.06] text-[#E71D36] px-4 py-3 rounded-xl"
                  style={{ fontSize: "13px", lineHeight: 1.5 }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#FF6B35]" style={{ fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}