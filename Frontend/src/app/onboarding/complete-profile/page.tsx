"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AuthBackground } from "@/components/ui/AuthBackground";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const YEAR_OPTIONS: { value: string; label: string }[] = [
  { value: "1st", label: "1st Year" },
  { value: "2nd", label: "2nd Year" },
  { value: "3rd", label: "3rd Year" },
  { value: "4th", label: "4th Year" },
  { value: "5th+", label: "5th Year+" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuthStore();

  const [program, setProgram] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      router.replace("/login?next=/onboarding/complete-profile");
      return;
    }
    if (user.role !== "student") {
      router.replace("/");
    }
  }, [isLoading, token, user, router]);

  useEffect(() => {
    if (!user) return;
    setProgram(user.program || "");
    setYear(user.year || "");
  }, [user]);

  const canSave = program.trim().length > 0 && year.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updatedUser = await api.auth.updateMe({
        program: program.trim(),
        year,
      });
      useAuthStore.setState({ user: updatedUser });
      toast.success("Profile saved");
      router.replace("/browse");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Couldn't save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace("/browse");
  };

  if (isLoading || !user) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
        <AuthBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
      <AuthBackground />
      <div className="relative z-10 flex min-h-screen items-center px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto w-full max-w-[520px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="rounded-[32px] border border-black/[0.06] bg-white/92 p-7 backdrop-blur-xl md:p-9"
            style={{ boxShadow: "0 24px 60px rgba(27,45,69,0.10)" }}
          >
            <div
              className="flex w-fit items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-white/72 px-3.5 py-1.5 text-[#1B2D45]/55"
              style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF6B35]" />
              One quick step
            </div>

            <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
              Tell us about your studies.
            </h1>
            <p className="mt-3 text-[#1B2D45]/55" style={{ fontSize: "14px", lineHeight: 1.65 }}>
              Your program and year help us match you with better roommates and the right listings. You can change these any time in settings.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Program
                </label>
                <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  e.g. Computer Science, Mechanical Engineering, Biology
                </p>
                <div className="relative mt-2">
                  <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B2D45]/30" />
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="Your program of study"
                    maxLength={120}
                    className="w-full rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] py-3 pl-9 pr-3.5 text-[#1B2D45] placeholder:text-[#98A3B0] transition-all focus:border-[#FF6B35]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Year
                </label>
                <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  Which year are you in?
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {YEAR_OPTIONS.map((option) => {
                    const active = year === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setYear(option.value)}
                        className={`rounded-xl border px-3 py-2.5 transition-all ${
                          active
                            ? "border-[#FF6B35]/40 bg-[#FF6B35]/8 text-[#FF6B35]"
                            : "border-[#E8E4DC] bg-white text-[#1B2D45]/60 hover:border-[#1B2D45]/15 hover:text-[#1B2D45]"
                        }`}
                        style={{ fontSize: "12px", fontWeight: 700 }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] py-3.5 text-white transition-all hover:bg-[#e55e2e] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ fontSize: "14px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save and continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="w-full rounded-2xl py-2.5 text-[#1B2D45]/42 transition-colors hover:text-[#1B2D45]/65 disabled:opacity-50"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                I&apos;ll do this later
              </button>
            </div>

            <p className="mt-6 text-center text-[#1B2D45]/35" style={{ fontSize: "11px", lineHeight: 1.55 }}>
              Need to update something else?{" "}
              <Link href="/settings" className="text-[#FF6B35] hover:underline" style={{ fontWeight: 700 }}>
                Go to settings
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
