"use client";
import { AuthBackground } from "@/components/ui/AuthBackground";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import type { UserResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LandlordLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_URL}/api/landlords/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(body.detail || "Invalid email or password");
      }

      const data = await res.json();

      // Store token
      localStorage.setItem("cribb_token", data.access_token);

      // Build user object from login response and cache it
      const landlordUser: UserResponse = {
        id: data.landlord.id,
        email: data.landlord.email,
        first_name: data.landlord.first_name,
        last_name: data.landlord.last_name,
        role: "landlord",
        email_verified: true,
        created_at: "",
        updated_at: "",
        identity_verified: data.landlord.identity_verified,
        company_name: data.landlord.company_name,
        phone: data.landlord.phone,
      };

      // Cache so AuthHydrator's loadUser() won't lose the data
      localStorage.setItem("cribb_landlord_profile", JSON.stringify(landlordUser));

      // Set user directly in store
      useAuthStore.setState({
        user: landlordUser,
        token: data.access_token,
        isLoading: false,
      });

      router.push("/landlord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 relative">
        <AuthBackground />
      <div className="w-full max-w-[400px] relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            cribb
          </Link>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-9 h-9 rounded-xl bg-[#1B2D45]/[0.06] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#1B2D45]/60" />
            </div>
            <div className="text-left">
              <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>Landlord Login</h1>
              <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>Manage your properties and listings</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 p-6" style={{ boxShadow: "0 8px 40px rgba(27,45,69,0.08)" }} style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com" required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#1B2D45]/20 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password" required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#1B2D45]/20 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[#E71D36]/10 text-[#E71D36] px-4 py-2.5 rounded-lg" style={{ fontSize: "13px" }}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-60 transition-all"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(27,45,69,0.2)" }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</span>
              ) : "Log in"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <p className="text-center mt-5 text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
          Don&apos;t have a landlord account?{" "}
          <Link href="/landlord/signup" className="text-[#FF6B35]" style={{ fontWeight: 600 }}>Sign up</Link>
        </p>
        <p className="text-center mt-2 text-[#1B2D45]/25" style={{ fontSize: "11px" }}>
          Looking for housing?{" "}
          <Link href="/login" className="text-[#1B2D45]/40 underline">Student login</Link>
        </p>
      </div>
    </div>
  );
}