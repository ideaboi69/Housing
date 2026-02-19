"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await register(form);
      router.push("/browse");
    } catch {
      // Error handled by store
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
            Join cribb
          </h1>
          <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "14px" }}>
            Create your account with your @uoguelph.ca email
          </p>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                  First name
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  required
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Last name
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  required
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
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
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
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
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-[#1B2D45]/50" style={{ fontSize: "13px" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-[#FF6B35]" style={{ fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
