"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Building2, ShieldCheck, Home, MessageCircle, ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function LandlordOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthStore();
  const [step, setStep] = useState(0);
  const [claimCode, setClaimCode] = useState("");
  const claimFromQuery = searchParams.get("claim")?.trim() ?? "";
  const isClaimFlow = claimCode.length > 0;

  useEffect(() => {
    if (claimFromQuery) {
      setClaimCode(claimFromQuery);
      try {
        localStorage.setItem("cribb_landlord_claim_code", claimFromQuery);
      } catch {
        /* ignore storage errors */
      }
      return;
    }

    try {
      const cachedClaim = localStorage.getItem("cribb_landlord_claim_code")?.trim() ?? "";
      setClaimCode(cachedClaim);
    } catch {
      setClaimCode("");
    }
  }, [claimFromQuery]);

  // Redirect if not a landlord
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/landlord/login");
      return;
    }
    if (user.role !== "landlord") {
      router.replace("/");
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== "landlord") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1B2D45]/20 border-t-[#1B2D45] rounded-full animate-spin" />
      </div>
    );
  }

  const steps = [
    {
      icon: <Sparkles className="w-7 h-7" />,
      iconBg: "bg-[#1B2D45]/[0.08]",
      iconColor: "text-[#1B2D45]",
      title: isClaimFlow ? `You're almost there, ${user.first_name}` : `Welcome, ${user.first_name}!`,
      description: isClaimFlow
        ? `Your landlord account has been created. Next, we'll guide you through what happens before claim code ${claimCode} can be attached to the roommate group's home on cribb.`
        : "Your landlord account has been created. Here's what happens next and how cribb works for property owners.",
      visual: (
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { emoji: "📋", label: isClaimFlow ? "Claim in progress" : "Easy listing management", desc: isClaimFlow ? "This home stays pending until verification is approved" : "Add properties and listings in minutes" },
            { emoji: "🎓", label: "Verified students", desc: "Guelph students only — no random inquiries" },
            { emoji: "📊", label: "Cribb Score", desc: "Build your reputation with every interaction" },
          ].map((b) => (
            <div key={b.label} className="text-center bg-[#FAF8F4] rounded-xl p-3">
              <span style={{ fontSize: "22px" }}>{b.emoji}</span>
              <div className="text-[#1B2D45] mt-1.5" style={{ fontSize: "11px", fontWeight: 700 }}>{b.label}</div>
              <div className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "9px", lineHeight: 1.3 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <ShieldCheck className="w-7 h-7" />,
      iconBg: user.identity_verified ? "bg-[#4ADE80]/[0.1]" : "bg-[#FFB627]/[0.1]",
      iconColor: user.identity_verified ? "text-[#4ADE80]" : "text-[#FFB627]",
      title: user.identity_verified
        ? (isClaimFlow ? "You're verified. Home claim can move forward" : "You're verified!")
        : "Verification in progress",
      description: user.identity_verified
        ? (isClaimFlow
          ? `Your identity has been confirmed. The home tied to claim code ${claimCode} can now be attached to the roommate group on cribb.`
          : "Your identity has been confirmed. Your listings will show the \"Verified Landlord\" badge, which students trust more.")
        : (isClaimFlow
          ? "Our team is reviewing your documents — this usually takes 1-2 business days. Once approved, the claimed home can be attached to the roommate group."
          : "Our team is reviewing your documents — this usually takes 1-2 business days. You can start adding properties right away. They'll go live once you're approved."),
      visual: (
        <div className="mt-6 space-y-3">
          {[
            { label: "Account created", done: true },
            { label: "Documents submitted", done: true },
            { label: "Identity verified", done: !!user.identity_verified },
            { label: "First listing published", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              {item.done ? (
                <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-[#1B2D45]/15 shrink-0" />
              )}
              <span className={item.done ? "text-[#1B2D45]" : "text-[#1B2D45]/30"} style={{ fontSize: "13px", fontWeight: item.done ? 600 : 400 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Home className="w-7 h-7" />,
      iconBg: "bg-[#1B2D45]/[0.08]",
      iconColor: "text-[#1B2D45]",
      title: isClaimFlow ? "Finish the home verification flow" : "Your dashboard",
      description: isClaimFlow
        ? "From your dashboard you can add the claimed property details, connect the home to the roommate group, and manage future listings once verification is approved."
        : "From your dashboard you can manage properties, create listings, respond to student inquiries, and track your Cribb Score. Ready to get started?",
      visual: (
        <div className="mt-6 space-y-2">
          {[
            { icon: <Building2 className="w-4 h-4" />, label: isClaimFlow ? "Add the claimed property" : "Add your first property", desc: isClaimFlow ? `Use claim code ${claimCode} to match the roommate group's home` : "Address, type, and details" },
            { icon: <Home className="w-4 h-4" />, label: isClaimFlow ? "Attach it to the group" : "Create a listing", desc: isClaimFlow ? "Connect the verified home so students see trusted property details" : "Rent, amenities, photos, move-in date" },
            { icon: <MessageCircle className="w-4 h-4" />, label: "Respond to inquiries", desc: "Students will message you directly" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 bg-[#FAF8F4] rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#1B2D45]/40 shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>{item.label}</div>
                <div className="text-[#1B2D45]/35" style={{ fontSize: "10px" }}>{item.desc}</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#1B2D45]/15 shrink-0" />
            </div>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}>cribb</Link>
        </div>

        {isClaimFlow && (
          <div className="mb-6 rounded-xl border border-[#2EC4B6]/15 bg-[#2EC4B6]/[0.04] px-4 py-4">
            <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
              Home claim in progress
            </div>
            <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
              This onboarding flow is tied to a roommate-group property verification request.
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-[#2EC4B6]/10">
              <span className="text-[#2EC4B6]" style={{ fontSize: "10px", fontWeight: 700 }}>Claim code</span>
              <span className="text-[#1B2D45]/60" style={{ fontSize: "10px", fontWeight: 600 }}>{claimCode}</span>
            </div>
          </div>
        )}

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl ${current.iconBg} ${current.iconColor} flex items-center justify-center`}>
              {current.icon}
            </div>

            {/* Title */}
            <h1 className="text-[#1B2D45] mt-4" style={{ fontSize: "22px", fontWeight: 800 }}>
              {current.title}
            </h1>
            <p className="text-[#1B2D45]/45 mt-2" style={{ fontSize: "13px", lineHeight: 1.65 }}>
              {current.description}
            </p>

            {/* Visual */}
            {current.visual}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? "#1B2D45" : "rgba(27,45,69,0.1)",
                }}
              />
            ))}
          </div>

          {/* Button */}
          {isLast ? (
            <Link
              href="/landlord"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-all"
              style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(27,45,69,0.2)" }}
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-all"
              style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(27,45,69,0.2)" }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <Link href="/landlord" className="text-[#1B2D45]/25 hover:text-[#1B2D45]/40 transition-all" style={{ fontSize: "11px", fontWeight: 500 }}>
            Skip — go straight to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
