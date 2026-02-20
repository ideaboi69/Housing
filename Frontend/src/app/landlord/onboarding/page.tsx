"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { UserRole } from "@/types";
import { ArrowLeft, Building2, Phone, Shield } from "lucide-react";

export default function LandlordOnboardingPage() {
  const router = useRouter();
  const { user, loadUser } = useAuthStore();
  const [form, setForm] = useState({ company_name: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Already a landlord — redirect
  if (user?.role === "landlord") {
    router.replace("/landlord");
    return null;
  }

  // Not logged in — send to signup
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center max-w-[360px]">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#FF6B35]" />
          </div>
          <h2 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>Sign in to get started</h2>
          <p className="text-[#1B2D45]/50 mt-2" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            Create an account or log in first, then you can switch to a landlord account.
          </p>
          <div className="flex items-center gap-3 mt-6 justify-center">
            <Link href="/login" className="px-6 py-2.5 rounded-xl border border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 transition-all" style={{ fontSize: "14px", fontWeight: 500 }}>
              Log in
            </Link>
            <Link href="/landlord/signup" className="px-6 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}>
              Sign up as Landlord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.auth.switchRole({
        role: UserRole.LANDLORD,
        company_name: form.company_name || undefined,
        phone: form.phone || undefined,
      });
      await loadUser(); // Refresh user data with new role
      router.push("/landlord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch role");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to cribb
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#FF6B35]" />
          </div>
          <h1 className="text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 800 }}>
            Become a Landlord on cribb
          </h1>
          <p className="mt-2 text-[#1B2D45]/50 max-w-[360px] mx-auto" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            List your properties, manage listings, and connect with verified UofG students looking for housing.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "📋", label: "Easy listing management" },
            { icon: "📊", label: "Health Score visibility" },
            { icon: "🎓", label: "Verified student tenants" },
          ].map((b) => (
            <div key={b.label} className="text-center bg-white rounded-xl border border-black/[0.04] p-3">
              <span style={{ fontSize: "20px" }}>{b.icon}</span>
              <div className="text-[#1B2D45]/50 mt-1" style={{ fontSize: "10px", fontWeight: 500, lineHeight: 1.3 }}>{b.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Building2 className="w-3.5 h-3.5 text-[#1B2D45]/40" />
                Company or property management name
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="Optional — leave blank if individual landlord"
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Phone className="w-3.5 h-3.5 text-[#1B2D45]/40" />
                Phone number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 519-555-0123"
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            {/* Verification info */}
            <div className="bg-[#2EC4B6]/[0.06] rounded-xl p-4 flex gap-3">
              <Shield className="w-5 h-5 text-[#2EC4B6] shrink-0 mt-0.5" />
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Verification required</div>
                <p className="text-[#1B2D45]/50 mt-0.5" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  After signing up, you&apos;ll need to verify your identity to publish listings. This protects students and builds trust.
                </p>
              </div>
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
              {isLoading ? "Setting up..." : "Continue as Landlord →"}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-[#1B2D45]/30" style={{ fontSize: "12px" }}>
          You can switch back to student at any time from your profile settings.
        </p>
      </div>
    </div>
  );
}
