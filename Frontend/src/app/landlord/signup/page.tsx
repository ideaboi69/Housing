"use client";
import { AuthBackground } from "@/components/ui/AuthBackground";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Building2, Phone, Shield, Upload, FileText, X, Check,
  ArrowLeft, ArrowRight, User, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff,
} from "lucide-react";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";

/* ════════════════════════════════════════════════════════
   Step indicator — navy theme
   ════════════════════════════════════════════════════════ */

function StepIndicator({ current }: { current: number }) {
  const steps = ["Account", "Business", "Verification"];
  return (
    <div className="mb-7 flex items-center justify-center gap-1.5">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white transition-all ${
            i < current ? "bg-[#4ADE80]" : i === current ? "bg-[#1B2D45]" : "bg-[#1B2D45]/10"
          }`} style={{ fontSize: "11px", fontWeight: 700 }}>
            {i < current ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          <span className={`hidden sm:inline ${i === current ? "text-[#1B2D45]" : "text-[#1B2D45]/30"}`} style={{ fontSize: "11px", fontWeight: i === current ? 600 : 400 }}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="mx-1 h-px w-6 bg-[#1B2D45]/8" />}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   File upload component — navy theme
   ════════════════════════════════════════════════════════ */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function FileUploadBox({
  label, description, accepted, file, onSelect, onRemove, onError,
}: {
  label: string; description: string; accepted: string;
  file: File | null; onSelect: (file: File) => void; onRemove: () => void;
  onError?: (msg: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{label}</label>
      <p className="text-[#1B2D45]/55" style={{ fontSize: "11px", lineHeight: 1.4 }}>{description}</p>

      {file ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#4ADE80]/[0.06] border border-[#4ADE80]/20">
          <FileText className="w-5 h-5 text-[#4ADE80] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: 500 }}>{file.name}</div>
            <div className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
          <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:text-[#E71D36] hover:bg-[#E71D36]/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-[#1B2D45]/10 hover:border-[#1B2D45]/25 hover:bg-[#1B2D45]/[0.02] transition-all cursor-pointer">
          <Upload className="w-6 h-6 text-[#1B2D45]/20" />
          <span className="text-[#1B2D45]/55" style={{ fontSize: "12px", fontWeight: 500 }}>Click to upload or drag and drop</span>
          <span className="text-[#1B2D45]/40" style={{ fontSize: "10px" }}>PDF, JPG, PNG up to 10MB</span>
          <input type="file" accept={accepted} className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > MAX_FILE_SIZE) { onError?.("File must be smaller than 10 MB"); e.target.value = ""; return; }
            if (!ALLOWED_MIME_TYPES.includes(f.type)) { onError?.("Only PDF, JPG, and PNG files are accepted"); e.target.value = ""; return; }
            onSelect(f);
          }} />
        </label>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { key: "number", label: "One number", test: (pw: string) => /\d/.test(pw) },
  { key: "special", label: "One special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordChecklist({ password }: { password: string }) {
  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 grid gap-2"
    >
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <motion.div
            key={rule.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{
                background: passed ? "rgba(74,222,128,0.14)" : "rgba(27,45,69,0.05)",
                border: passed ? "1.5px solid rgba(74,222,128,0.38)" : "1.5px solid rgba(27,45,69,0.08)",
              }}
            >
              {passed ? <Check className="h-2.5 w-2.5 text-[#4ADE80]" /> : <X className="h-2.5 w-2.5 text-[#1B2D45]/20" />}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: passed ? "#2A9F63" : "#1B2D45",
                opacity: passed ? 1 : 0.42,
              }}
            >
              {rule.label}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function LandlordSignupPageContent() {
  const router = useRouter();
  const setAuthState = useAuthStore.setState;
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [account, setAccount] = useState({ first_name: "", last_name: "", email: "", password: "", confirm_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [business, setBusiness] = useState({ company_name: "", phone: "", num_properties: "1", is_company_team: false });
  const [idType, setIdType] = useState<string>("drivers_license");
  const [documentType, setDocumentType] = useState<string>("property_tax_bill");
  const [govId, setGovId] = useState<File | null>(null);
  const [proofOfOwnership, setProofOfOwnership] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  function validateStep0() {
    if (!account.first_name || !account.last_name || !account.email || !account.password) { setError("All fields are required"); return false; }
    if (account.email.endsWith("@uoguelph.ca") || account.email.endsWith("@mail.uoguelph.ca")) { setError("Student emails are for student accounts. Use a personal or business email."); return false; }
    if (!PASSWORD_RULES.every((rule) => rule.test(account.password))) { setError("Password doesn't meet all the requirements listed below."); return false; }
    if (account.password !== account.confirm_password) { setError("Passwords don't match"); return false; }
    return true;
  }

  function validateStep1() {
    if (!business.phone) { setError("Phone number is required so students can reach you"); return false; }
    if (business.is_company_team && !business.company_name.trim()) { setError("Enter your company or agency name to set up a team"); return false; }
    return true;
  }

  async function handleNext() {
    setError("");
    if (step === 0 && validateStep0()) setStep(1);
    else if (step === 1 && validateStep1()) setStep(2);
  }

  async function handleSubmit() {
    if (!govId) { setError("Government ID is required for verification"); return; }
    if (!proofOfOwnership) { setError("Proof of property ownership is required"); return; }
    if (govId.size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.includes(govId.type)) {
      setError("Government ID must be a PDF, JPG, or PNG under 10 MB"); return;
    }
    if (proofOfOwnership.size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.includes(proofOfOwnership.type)) {
      setError("Proof of ownership must be a PDF, JPG, or PNG under 10 MB"); return;
    }
    setIsLoading(true);
    setError("");

    try {
      const propertyRangeMap: Record<string, string> = { "1": "1", "2-5": "2-5", "6-10": "6-10", "10+": "10+" };
      const formData = new FormData();
      formData.append("email", account.email);
      formData.append("password", account.password);
      formData.append("first_name", account.first_name);
      formData.append("last_name", account.last_name);
      formData.append("phone", business.phone);
      formData.append("no_of_property", propertyRangeMap[business.num_properties] || "1");
      formData.append("id_type", idType);
      formData.append("document_type", documentType);
      formData.append("id_file", govId);
      formData.append("document_file", proofOfOwnership);
      if (business.company_name) formData.append("company_name", business.company_name);
      if (turnstileToken) formData.append("turnstile_token", turnstileToken);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/landlords/register`, { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(body.detail || "Registration failed");
      }

      const data = await res.json();
      if (data.access_token && data.landlord) {
        const landlordUser = {
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
        localStorage.setItem("cribb_token", data.access_token);
        if (data.refresh_token) localStorage.setItem("cribb_refresh_token", data.refresh_token);
        sessionStorage.setItem("cribb_landlord_profile", JSON.stringify(landlordUser));
        setAuthState({
          user: landlordUser,
          token: data.access_token,
          isLoading: false,
        });
        // Property manager opted into a team — auto-create the org from their
        // company name so they're an owner from first login. Token is already
        // stored, so this authed call works. Non-fatal if it fails (Settings → Team).
        if (business.is_company_team && business.company_name.trim()) {
          try {
            await api.landlords.createOrg(business.company_name.trim());
          } catch {
            /* they can still create the team later in Settings */
          }
        }
        // Invited agents arrive with ?next=/landlord/join-team/<token>. Since
        // registration logs them in, send them straight back to accept the
        // invite. Normal signups (no `next`) keep the existing flow untouched.
        const next = new URLSearchParams(window.location.search).get("next");
        if (next && next.startsWith("/")) {
          router.push(next);
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Shared input class
  const inputCls = "w-full mt-1.5 px-4 py-2.5 rounded-lg bg-white border border-[#1B2D45]/15 focus:border-[#1B2D45]/45 focus:ring-2 focus:ring-[#1B2D45]/10 focus:outline-none transition-all";

  // Selected pill style (navy instead of orange)
  function pillCls(selected: boolean) {
    return `flex-1 py-2.5 rounded-lg border transition-all ${
      selected
        ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
        : "border-black/[0.08] text-[#1B2D45]/60 hover:border-[#1B2D45]/20 hover:bg-[#1B2D45]/[0.02]"
    }`;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F1E8]">
      <AuthBackground />
      <div className="relative z-10 min-h-screen px-4 py-8 md:px-6 md:py-10 lg:flex lg:items-center">
        <div className="mx-auto grid w-full max-w-[1180px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="min-w-0 lg:pr-6 lg:self-center"
          >
            <div className="mt-6 max-w-[620px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-white/72 px-4 py-2 text-[#1B2D45]/55 backdrop-blur-sm"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                <Shield className="h-4 w-4 text-[#1B2D45]" />
                Landlord dashboard
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                className="mt-6 text-[#1B2D45]"
                style={{ fontSize: "clamp(3rem,5vw,4.9rem)", fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.94 }}
              >
                List your
                <br />
                Guelph properties.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
                className="mt-4 h-[3px] w-24 origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(27,45,69,0.9) 0%, rgba(46,196,182,0.25) 100%)" }}
              />

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5, ease: "easeOut" }}
                className="mt-6 max-w-[560px] text-[#1B2D45]/58"
                style={{ fontSize: "16px", lineHeight: 1.8 }}
              >
                Create a landlord account to manage properties, respond to student inquiries, and keep everything in one calm workspace.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="relative mt-6 max-w-[560px]"
              >
                <div className="pointer-events-none absolute -left-3 -top-3 h-16 w-16 rounded-full border border-[#1B2D45]/7" />
                <p className="text-[#1B2D45]" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.5 }}>
                  One account is enough to verify once, manage your listings, and keep student messages in one place.
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="relative lg:ml-auto lg:w-full lg:max-w-[500px]"
          >
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-24 rounded-[36px] bg-white/22 blur-2xl" />

            <div className="relative z-10">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Link href="/" className="inline-flex items-center gap-1.5 text-[#1B2D45]/60 hover:text-[#1B2D45] transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
                  <ArrowLeft className="w-4 h-4" /> Back to Cribb Landing Page
                </Link>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => { setStep(step - 1); setError(""); }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#1B2D45]/10 bg-white/75 px-3 py-1.5 text-[#1B2D45]/65 hover:border-[#1B2D45]/20 hover:text-[#1B2D45] transition-all"
                    style={{ fontSize: "12px", fontWeight: 700 }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Stage {step}
                  </button>
                )}
              </div>
              <StepIndicator current={step} />

              {/* ─── Step 0: Account ─── */}
              {step === 0 && (
              <div className="rounded-[28px] border border-black/[0.05] bg-white/88 p-6 space-y-4 backdrop-blur-sm" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <User className="w-4 h-4 text-[#1B2D45]/50" /> Create your account
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="landlord-first-name" className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>First name</label>
                <input id="landlord-first-name" type="text" value={account.first_name} onChange={(e) => setAccount({ ...account, first_name: e.target.value })} required className={inputCls} style={{ fontSize: "14px" }} />
              </div>
              <div>
                <label htmlFor="landlord-last-name" className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Last name</label>
                <input id="landlord-last-name" type="text" value={account.last_name} onChange={(e) => setAccount({ ...account, last_name: e.target.value })} required className={inputCls} style={{ fontSize: "14px" }} />
              </div>
            </div>

            <div>
              <label htmlFor="landlord-email" className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Mail className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Email
              </label>
              <input id="landlord-email" type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="you@email.com" required className={inputCls} style={{ fontSize: "14px" }} />
              <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "11px" }}>Use a business or personal email.</p>
            </div>

            <div>
              <label htmlFor="landlord-password" className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Lock className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Password
              </label>
              <div className="relative">
                <input id="landlord-password" type={showPassword ? "text" : "password"} value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} placeholder="Create a strong password" required className={`${inputCls} pr-11`} style={{ fontSize: "14px" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/30 hover:text-[#1B2D45]/60 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordChecklist password={account.password} />
            </div>

            <div>
              <label htmlFor="landlord-confirm-password" className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Confirm password</label>
              <div className="relative">
                <input id="landlord-confirm-password" type={showConfirm ? "text" : "password"} value={account.confirm_password} onChange={(e) => setAccount({ ...account, confirm_password: e.target.value })} placeholder="Re-enter password" required className={`${inputCls} pr-11`} style={{ fontSize: "14px" }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2D45]/30 hover:text-[#1B2D45]/60 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {account.confirm_password && (
                <p className={account.password === account.confirm_password ? "text-[#2EC4B6] mt-1" : "text-[#E71D36] mt-1"} style={{ fontSize: "11px", fontWeight: 600 }}>
                  {account.password === account.confirm_password ? "Passwords match." : "Passwords do not match yet."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 1: Business Info ─── */}
        {step === 1 && (
          <div className="rounded-[28px] border border-black/[0.05] bg-white/88 p-6 space-y-4 backdrop-blur-sm" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Building2 className="w-4 h-4 text-[#1B2D45]/50" /> Business Details
            </h2>

            <div>
              <label htmlFor="landlord-company-name" className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Company or management name</label>
              <input id="landlord-company-name" type="text" value={business.company_name} onChange={(e) => setBusiness({ ...business, company_name: e.target.value })} placeholder="Optional — leave blank if individual landlord" className={inputCls} style={{ fontSize: "14px" }} />
            </div>

            {/* Property-management team opt-in — auto-creates the org after signup */}
            <button
              type="button"
              onClick={() => setBusiness({ ...business, is_company_team: !business.is_company_team })}
              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                business.is_company_team
                  ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.04]"
                  : "border-black/[0.08] hover:border-[#1B2D45]/20 hover:bg-[#1B2D45]/[0.02]"
              }`}
            >
              <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                business.is_company_team ? "bg-[#1B2D45] border-[#1B2D45]" : "border-[#1B2D45]/25"
              }`}>
                {business.is_company_team && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                  I manage properties for a company or agency
                </span>
                <span className="block text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  Sets up a team under your company name so you can invite agents and share one inbox. You can also do this later in Settings.
                </span>
              </span>
            </button>

            <div>
              <label htmlFor="landlord-phone" className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Phone className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Phone number *
              </label>
              <input id="landlord-phone" type="tel" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="519-555-0123" required className={inputCls} style={{ fontSize: "14px" }} />
              <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "11px" }}>Students may use this to contact you about listings.</p>
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>How many properties do you manage?</label>
              <div className="flex gap-2 mt-2">
                {["1", "2-5", "6-10", "10+"].map((opt) => (
                  <button key={opt} type="button" onClick={() => setBusiness({ ...business, num_properties: opt })}
                    className={pillCls(business.num_properties === opt)}
                    style={{ fontSize: "13px", fontWeight: business.num_properties === opt ? 600 : 500 }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 2: Verification Documents ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-black/[0.05] bg-white/88 p-6 space-y-5 backdrop-blur-sm" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
              <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                <Shield className="w-4 h-4 text-[#1B2D45]/50" /> Verification Documents
              </h2>

              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>ID Type *</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { key: "drivers_license", label: "Driver's License" },
                    { key: "passport", label: "Passport" },
                    { key: "provincial_id", label: "Provincial ID" },
                  ].map((opt) => (
                    <button key={opt.key} type="button" onClick={() => setIdType(opt.key)}
                      className={pillCls(idType === opt.key)}
                      style={{ fontSize: "12px", fontWeight: idType === opt.key ? 600 : 500 }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <FileUploadBox label="Government-issued ID *" description="Driver's license, passport, or provincial ID card. Must show your name clearly." accepted=".pdf,.jpg,.jpeg,.png" file={govId} onSelect={setGovId} onRemove={() => setGovId(null)} onError={setError} />

              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Document Type *</label>
                <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
                  {[
                    { key: "property_tax_bill", label: "Property Tax Bill" },
                    { key: "utility_bill", label: "Utility Bill" },
                    { key: "mortgage_statement", label: "Mortgage Statement" },
                    { key: "property_management_license", label: "Management License" },
                  ].map((opt) => (
                    <button key={opt.key} type="button" onClick={() => setDocumentType(opt.key)}
                      className={`px-2.5 py-2 rounded-lg border transition-all ${
                        documentType === opt.key
                          ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                          : "border-black/[0.08] text-[#1B2D45]/60 hover:border-[#1B2D45]/20 hover:bg-[#1B2D45]/[0.02]"
                      }`}
                      style={{ fontSize: "12px", fontWeight: documentType === opt.key ? 600 : 500 }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <FileUploadBox label="Proof of property ownership *" description="Property tax bill, utility bill in your name at the property address, mortgage statement, or property management license." accepted=".pdf,.jpg,.jpeg,.png" file={proofOfOwnership} onSelect={setProofOfOwnership} onRemove={() => setProofOfOwnership(null)} onError={setError} />
            </div>

            {/* What happens next */}
            <div className="rounded-2xl bg-white/72 px-4 py-3 text-[#1B2D45]/50 backdrop-blur-sm" style={{ fontSize: "12px", lineHeight: 1.6 }}>
              Review typically takes 1-2 business days, and approved accounts receive a verified landlord badge.
            </div>
          </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-[#E71D36]/10 text-[#E71D36] px-4 py-3 rounded-xl mt-4 flex items-center gap-2" style={{ fontSize: "13px" }}>
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Captcha on final step */}
              {step === 2 && (
                <div className="mt-5">
                  <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />
                </div>
              )}

              {step === 2 && (
                <p className="text-center text-[#1B2D45]/55 mt-4" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-[#FF6B35] underline-offset-4 hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[#FF6B35] underline-offset-4 hover:underline">Privacy Policy</Link>.
                </p>
              )}

              {/* Navigation — navy buttons */}
              <div className="flex items-center gap-3 mt-6">
                {step < 2 ? (
                  <button onClick={handleNext}
                    className="flex-1 py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-all flex items-center justify-center gap-2"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(27,45,69,0.2)" }}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={isLoading || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)}
                    className="flex-1 py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(27,45,69,0.2)" }}>
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create Landlord Account <ArrowRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>

              {/* Footer */}
              <p className="text-center mt-6 text-[#1B2D45]/30" style={{ fontSize: "12px" }}>
                Already have an account?{" "}
                <Link href="/landlord/login" className="text-[#1B2D45]" style={{ fontWeight: 600 }}>Log in</Link>
              </p>
              <p className="text-center mt-2 text-[#1B2D45]/20" style={{ fontSize: "11px" }}>
                Looking for housing?{" "}
                <Link href="/signup" className="text-[#1B2D45]/40 underline">Sign up as a student</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LandlordSignupPage() {
  return (
    <Suspense fallback={null}>
      <LandlordSignupPageContent />
    </Suspense>
  );
}
