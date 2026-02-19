"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
      router.push("/browse");
    } catch {
      // Error is handled by the store
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
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

        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@uoguelph.ca"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            {error && (
              <div className="bg-[#E71D36]/10 text-[#E71D36] px-4 py-2 rounded-lg" style={{ fontSize: "13px" }}>
                {error}
              </div>
            )}

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
