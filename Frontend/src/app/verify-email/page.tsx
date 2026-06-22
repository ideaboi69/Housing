"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2, MailWarning, ShieldCheck } from "lucide-react";

import { AuthBackground } from "@/components/ui/AuthBackground";
import { AuthBackLink } from "@/components/ui/AuthBackLink";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { TokenResponse, UserResponse } from "@/types";

type Status = "verifying" | "success" | "already" | "error";

function isTokenResponse(value: unknown): value is TokenResponse {
  return Boolean(value) && typeof value === "object" && value !== null && "access_token" in value;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedUser, setVerifiedUser] = useState<UserResponse | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("This link is missing a verification code. Try clicking the link in your email again.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await api.auth.verifyEmail(token);
        if (cancelled) return;

        if (isTokenResponse(result)) {
          localStorage.setItem("cribb_token", result.access_token);
          if (result.refresh_token) localStorage.setItem("cribb_refresh_token", result.refresh_token);
          useAuthStore.setState({ user: result.user, token: result.access_token });
          setVerifiedUser(result.user);
          setStatus("success");
        } else {
          setStatus("already");
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setErrorMessage(
            err.status === 400
              ? "This verification link is invalid or has expired. Send yourself a fresh one below."
              : err.detail || "We couldn't verify your email. Try again or request a new link."
          );
        } else {
          setErrorMessage("We couldn't reach the server. Check your connection and try again.");
        }
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => {
      router.replace("/onboarding/complete-profile");
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [status, router]);

  const handleResend = async () => {
    if (!resendEmail.trim() || resending) return;
    setResending(true);
    try {
      await api.auth.resendVerification(resendEmail.trim());
      setResendSent(true);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.detail : "Couldn't send a new link. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
      <AuthBackground />
      <div className="relative z-10 flex min-h-screen items-center px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto w-full max-w-[520px]">
          <AuthBackLink />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-8 rounded-[32px] border border-black/[0.06] bg-white/92 p-7 backdrop-blur-xl md:p-9"
            style={{ boxShadow: "0 24px 60px rgba(27,45,69,0.10)" }}
          >
            {status === "verifying" && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
                </div>
                <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.04em" }}>
                  Verifying your email...
                </h1>
                <p className="mt-2 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                  Hang tight - this only takes a second.
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="py-2 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4ADE80]/12"
                >
                  <ShieldCheck className="h-6 w-6 text-[#4ADE80]" />
                </motion.div>
                <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.04em" }}>
                  You&apos;re in{verifiedUser ? `, ${verifiedUser.first_name}` : ""}.
                </h1>
                <p className="mt-2 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                  Email verified. Taking you to finish your profile...
                </p>

                <Link
                  href="/onboarding/complete-profile"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 text-white transition-all hover:bg-[#e55e2e]"
                  style={{ fontSize: "13px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {status === "already" && (
              <div className="py-2 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4ADE80]/12">
                  <CheckCircle className="h-6 w-6 text-[#4ADE80]" />
                </div>
                <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.04em" }}>
                  Already verified.
                </h1>
                <p className="mt-2 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                  This email has been verified before. Log in and you&apos;re good to go.
                </p>

                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 text-white transition-all hover:bg-[#e55e2e]"
                  style={{ fontSize: "13px", fontWeight: 800, boxShadow: "0 10px 28px rgba(255,107,53,0.28)" }}
                >
                  Go to login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {status === "error" && (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E71D36]/10">
                    <MailWarning className="h-6 w-6 text-[#E71D36]" />
                  </div>
                  <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.04em" }}>
                    We couldn&apos;t verify this link.
                  </h1>
                  <p className="mt-2 text-[#1B2D45]/55" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                    {errorMessage}
                  </p>
                </div>

                {!resendSent ? (
                  <div className="mt-7 rounded-2xl bg-[#FCFAF6] p-4">
                    <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Send a new link
                    </div>
                    <p className="mt-1 text-[#1B2D45]/50" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                      Enter the school email you signed up with.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="you@uoguelph.ca"
                        className="flex-1 rounded-xl border border-[#E8E4DC] bg-white px-3.5 py-2.5 text-[#1B2D45] placeholder:text-[#98A3B0] transition-all focus:border-[#FF6B35]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
                        style={{ fontSize: "13px", fontWeight: 500 }}
                      />
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={!resendEmail.trim() || resending}
                        className="rounded-xl bg-[#1B2D45] px-4 py-2.5 text-white transition-all hover:bg-[#152438] disabled:opacity-50"
                        style={{ fontSize: "12px", fontWeight: 800 }}
                      >
                        {resending ? "Sending..." : "Resend"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 rounded-2xl bg-[#4ADE80]/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                      <div>
                        <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800 }}>
                          New link sent
                        </div>
                        <p className="mt-1 text-[#1B2D45]/55" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                          Check <span className="font-semibold text-[#1B2D45]">{resendEmail}</span> for a fresh verification link.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 text-center">
                  <Link
                    href="/login"
                    className="text-[#1B2D45]/45 transition-colors hover:text-[#1B2D45]/70"
                    style={{ fontSize: "12px", fontWeight: 700 }}
                  >
                    Back to log in
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
          <AuthBackground />
          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
