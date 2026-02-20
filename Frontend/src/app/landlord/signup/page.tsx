"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { UserRole } from "@/types";
import {
  Building2,
  Phone,
  Shield,
  Upload,
  FileText,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";

/* ════════════════════════════════════════════════════════
   Step indicator
   ════════════════════════════════════════════════════════ */

function StepIndicator({ current }: { current: number }) {
  const steps = ["Account", "Business", "Verification"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${
            i < current ? "bg-[#4ADE80]" : i === current ? "bg-[#FF6B35]" : "bg-[#1B2D45]/10"
          }`} style={{ fontSize: "12px", fontWeight: 700 }}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`hidden sm:inline ${i === current ? "text-[#1B2D45]" : "text-[#1B2D45]/30"}`} style={{ fontSize: "12px", fontWeight: i === current ? 600 : 400 }}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="w-8 h-px bg-[#1B2D45]/10 mx-1" />}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   File upload component
   ════════════════════════════════════════════════════════ */

function FileUploadBox({
  label,
  description,
  accepted,
  file,
  onSelect,
  onRemove,
}: {
  label: string;
  description: string;
  accepted: string;
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{label}</label>
      <p className="text-[#1B2D45]/30" style={{ fontSize: "11px", lineHeight: 1.4 }}>{description}</p>

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
        <label className="flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-[#1B2D45]/10 hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.02] transition-all cursor-pointer">
          <Upload className="w-6 h-6 text-[#1B2D45]/20" />
          <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>Click to upload or drag and drop</span>
          <span className="text-[#1B2D45]/20" style={{ fontSize: "10px" }}>PDF, JPG, PNG up to 10MB</span>
          <input
            type="file"
            accept={accepted}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onSelect(f);
            }}
          />
        </label>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════ */

export default function LandlordSignupPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Account
  const [account, setAccount] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  // Step 2: Business
  const [business, setBusiness] = useState({
    company_name: "",
    phone: "",
    num_properties: "1",
  });

  // Step 3: Verification docs
  const [govId, setGovId] = useState<File | null>(null);
  const [proofOfOwnership, setProofOfOwnership] = useState<File | null>(null);

  function validateStep0() {
    if (!account.first_name || !account.last_name || !account.email || !account.password) {
      setError("All fields are required");
      return false;
    }
    if (account.email.endsWith("@uoguelph.ca") || account.email.endsWith("@mail.uoguelph.ca")) {
      setError("UofG emails are for student accounts. Use a personal or business email for your landlord account.");
      return false;
    }
    if (account.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (account.password !== account.confirm_password) {
      setError("Passwords don't match");
      return false;
    }
    return true;
  }

  function validateStep1() {
    if (!business.phone) {
      setError("Phone number is required so students can reach you");
      return false;
    }
    return true;
  }

  async function handleNext() {
    setError("");
    if (step === 0 && validateStep0()) setStep(1);
    else if (step === 1 && validateStep1()) setStep(2);
  }

  async function handleSubmit() {
    if (!govId) {
      setError("Government ID is required for verification");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Register the account
      await register({
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
        password: account.password,
      });

      // 2. Switch role to landlord
      await api.auth.switchRole({
        role: UserRole.LANDLORD,
        company_name: business.company_name || undefined,
        phone: business.phone || undefined,
      });

      // 3. TODO: Upload documents when backend supports file upload
      // For now, documents are selected but not uploaded — verification stays pending
      // OJ will add: POST /api/landlords/me/documents with multipart form data

      // 4. Reload user and redirect
      await useAuthStore.getState().loadUser();
      router.push("/landlord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[500px]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to cribb
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            cribb
          </Link>
          <h1 className="mt-3 text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>
            Landlord Registration
          </h1>
          <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
            List your properties to verified UofG students
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ─── Step 0: Account ─── */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <User className="w-4 h-4 text-[#FF6B35]" /> Create your account
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>First name</label>
                <input
                  type="text"
                  value={account.first_name}
                  onChange={(e) => setAccount({ ...account, first_name: e.target.value })}
                  required
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Last name</label>
                <input
                  type="text"
                  value={account.last_name}
                  onChange={(e) => setAccount({ ...account, last_name: e.target.value })}
                  required
                  className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Mail className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Email
              </label>
              <input
                type="email"
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                placeholder="you@email.com"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
              <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "11px" }}>
                Use a personal or business email — @uoguelph.ca is for student accounts
              </p>
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Lock className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Password
              </label>
              <input
                type="password"
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
                placeholder="Min 8 characters"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Confirm password</label>
              <input
                type="password"
                value={account.confirm_password}
                onChange={(e) => setAccount({ ...account, confirm_password: e.target.value })}
                placeholder="Re-enter password"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>
          </div>
        )}

        {/* ─── Step 1: Business Info ─── */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Building2 className="w-4 h-4 text-[#FF6B35]" /> Business Details
            </h2>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Company or management name</label>
              <input
                type="text"
                value={business.company_name}
                onChange={(e) => setBusiness({ ...business, company_name: e.target.value })}
                placeholder="Optional — leave blank if individual landlord"
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Phone className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Phone number *
              </label>
              <input
                type="tel"
                value={business.phone}
                onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                placeholder="519-555-0123"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#FF6B35]/30 focus:bg-white focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
              <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "11px" }}>
                Students may use this to contact you about listings
              </p>
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>How many properties do you manage?</label>
              <div className="flex gap-2 mt-2">
                {["1", "2-5", "6-10", "10+"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBusiness({ ...business, num_properties: opt })}
                    className={`flex-1 py-2.5 rounded-lg border transition-all ${
                      business.num_properties === opt
                        ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                        : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/15"
                    }`}
                    style={{ fontSize: "13px", fontWeight: business.num_properties === opt ? 600 : 500 }}
                  >
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
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-5">
              <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                <Shield className="w-4 h-4 text-[#FF6B35]" /> Verification Documents
              </h2>

              <div className="bg-[#2EC4B6]/[0.06] rounded-xl p-4">
                <p className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  To protect students and build trust, we verify all landlords before their listings go live. Upload the documents below — our team typically reviews within <strong>1-2 business days</strong>.
                </p>
              </div>

              <FileUploadBox
                label="Government-issued ID *"
                description="Driver's license, passport, or provincial ID card. Must show your name clearly."
                accepted=".pdf,.jpg,.jpeg,.png"
                file={govId}
                onSelect={setGovId}
                onRemove={() => setGovId(null)}
              />

              <FileUploadBox
                label="Proof of property ownership"
                description="Property tax bill, utility bill in your name at the property address, mortgage statement, or property management license."
                accepted=".pdf,.jpg,.jpeg,.png"
                file={proofOfOwnership}
                onSelect={setProofOfOwnership}
                onRemove={() => setProofOfOwnership(null)}
              />
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-xl border border-black/[0.06] p-5">
              <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>What happens next?</h3>
              <div className="space-y-3 mt-3">
                {[
                  { num: "1", text: "We review your documents (1-2 business days)" },
                  { num: "2", text: "Once approved, you get a \"Verified Landlord\" badge" },
                  { num: "3", text: "Your listings appear as trusted to students" },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>{item.num}</span>
                    </div>
                    <span className="text-[#1B2D45]/50" style={{ fontSize: "13px", lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-[#1B2D45]/25 mt-3" style={{ fontSize: "11px" }}>
                You can start adding properties immediately — they&apos;ll go live once you&apos;re verified.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#E71D36]/10 text-[#E71D36] px-4 py-3 rounded-xl mt-4 flex items-center gap-2" style={{ fontSize: "13px" }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => { setStep(step - 1); setError(""); }}
              className="px-5 py-3 rounded-xl border border-black/[0.08] text-[#1B2D45]/60 hover:bg-black/[0.02] transition-all"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              ← Back
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all flex items-center justify-center gap-2"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <>Create Landlord Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[#1B2D45]/30" style={{ fontSize: "12px" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-[#FF6B35]" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
        <p className="text-center mt-2 text-[#1B2D45]/20" style={{ fontSize: "11px" }}>
          Looking for housing?{" "}
          <Link href="/signup" className="text-[#1B2D45]/40 underline">Sign up as a student</Link>
        </p>
      </div>
    </div>
  );
}
