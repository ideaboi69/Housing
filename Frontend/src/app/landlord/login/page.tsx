"use client";

import { AuthBackground } from "@/components/ui/AuthBackground";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import type { UserResponse } from "@/types";
import { AuthBackLink } from "@/components/ui/AuthBackLink";
import { Building2, Loader2, AlertCircle, ShieldCheck, MessageCircle, Home, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const rotatingLines = ["direct student messages", "verified listings", "faster replies"];

function persistLandlordSession(token: string, landlord: UserResponse) {
  localStorage.setItem("cribb_token", token);
  localStorage.setItem("cribb_landlord_profile", JSON.stringify(landlord));
  useAuthStore.setState({
    user: landlord,
    token,
    isLoading: false,
  });
}

function LandlordLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/landlord";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((current) => (current + 1) % rotatingLines.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

      persistLandlordSession(data.access_token, landlordUser);
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
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
                className="inline-flex items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-[#1B2D45]/[0.05] px-4 py-2 text-[#1B2D45]/65 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <ShieldCheck className="h-4 w-4 text-[#2D5B88]" />
                Landlord dashboard
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.9rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                Manage your
                <br />
                Guelph properties.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
                className="mt-4 h-[3px] w-24 origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(27,45,69,0.95) 0%, rgba(45,91,136,0.22) 100%)" }}
              />

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="mt-4 text-[#1B2D45]"
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
                Log in to manage verified student inquiries, keep your listings current, and see the homes you own from the same workspace your students use.
              </motion.p>

              <div className="mt-10 grid max-w-[560px] gap-3 sm:grid-cols-3">
                {[
                  { icon: <MessageCircle className="h-4 w-4" />, label: "Student messages" },
                  { icon: <Home className="h-4 w-4" />, label: "Property tools" },
                  { icon: <CheckCircle2 className="h-4 w-4" />, label: "Trusted flow" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34 + index * 0.07, duration: 0.42, ease: "easeOut" }}
                    className="rounded-2xl border border-[#1B2D45]/10 bg-[#1B2D45]/[0.03] px-4 py-4 text-[#1B2D45]/65 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2 text-[#2D5B88]" style={{ fontSize: "12px", fontWeight: 700 }}>
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
            className="relative lg:ml-auto lg:w-full lg:max-w-[440px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/22 blur-2xl" />

            <div className="rounded-[34px] border border-[#1B2D45]/[0.06] bg-white/90 p-6 backdrop-blur-xl md:p-8" style={{ boxShadow: "0 24px 80px rgba(27,45,69,0.10)" }}>
              <div className="border-b border-[#1B2D45]/8 pb-5">
                <div className="mt-4">
                  <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Welcome back
                  </div>
                  <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
                    Sign in to Cribb.
                  </h2>
                  <p className="mt-2 text-[#1B2D45]/42" style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.5 }}>
                    Landlord access for managing properties and student inquiries.
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
                    className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#1B2D45]/25 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="mt-2 w-full rounded-2xl border border-[#1B2D45]/8 bg-[#FCFAF6] px-4 py-3.5 text-[#1B2D45] placeholder:text-[#1B2D45]/25 focus:border-[#1B2D45]/25 focus:bg-white focus:outline-none transition-all"
                  />
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
                  className="w-full rounded-2xl bg-[#1B2D45] px-4 py-3.5 text-white hover:bg-[#152438] disabled:opacity-60 transition-all"
                  style={{ fontSize: "15px", fontWeight: 800, boxShadow: "0 10px 24px rgba(27,45,69,0.24)" }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Open dashboard
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
                  New landlord?{" "}
                  <Link href="/landlord/signup" className="text-[#1B2D45]" style={{ fontWeight: 700 }}>
                    Create an account
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

export default function LandlordLoginPage() {
  return (
    <Suspense fallback={null}>
      <LandlordLoginPageContent />
    </Suspense>
  );
}
