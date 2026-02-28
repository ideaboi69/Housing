"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Phone, Shield, Upload, FileText, X, Check,
  ArrowLeft, ArrowRight, User, Mail, Lock, AlertCircle, Loader2,
} from "lucide-react";

const NAVY = "#1B2D45";
const NAVY_LIGHT = "rgba(27,45,69,0.06)";

/* ════════════════════════════════════════════════════════
   Step indicator — navy theme
   ════════════════════════════════════════════════════════ */

function StepIndicator({ current }: { current: number }) {
  const steps = ["Account", "Business", "Verification"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${
            i < current ? "bg-[#4ADE80]" : i === current ? "bg-[#1B2D45]" : "bg-[#1B2D45]/10"
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
   File upload component — navy theme
   ════════════════════════════════════════════════════════ */

function FileUploadBox({
  label, description, accepted, file, onSelect, onRemove,
}: {
  label: string; description: string; accepted: string;
  file: File | null; onSelect: (file: File) => void; onRemove: () => void;
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
        <label className="flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-[#1B2D45]/10 hover:border-[#1B2D45]/25 hover:bg-[#1B2D45]/[0.02] transition-all cursor-pointer">
          <Upload className="w-6 h-6 text-[#1B2D45]/20" />
          <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>Click to upload or drag and drop</span>
          <span className="text-[#1B2D45]/20" style={{ fontSize: "10px" }}>PDF, JPG, PNG up to 10MB</span>
          <input type="file" accept={accepted} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
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
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [account, setAccount] = useState({ first_name: "", last_name: "", email: "", password: "", confirm_password: "" });
  const [business, setBusiness] = useState({ company_name: "", phone: "", num_properties: "1" });
  const [idType, setIdType] = useState<string>("drivers_license");
  const [documentType, setDocumentType] = useState<string>("property_tax_bill");
  const [govId, setGovId] = useState<File | null>(null);
  const [proofOfOwnership, setProofOfOwnership] = useState<File | null>(null);

  function validateStep0() {
    if (!account.first_name || !account.last_name || !account.email || !account.password) { setError("All fields are required"); return false; }
    if (account.email.endsWith("@uoguelph.ca") || account.email.endsWith("@mail.uoguelph.ca")) { setError("UofG emails are for student accounts. Use a personal or business email."); return false; }
    if (account.password.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (account.password !== account.confirm_password) { setError("Passwords don't match"); return false; }
    return true;
  }

  function validateStep1() {
    if (!business.phone) { setError("Phone number is required so students can reach you"); return false; }
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

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/landlords/register`, { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(body.detail || "Registration failed");
      }

      const data = await res.json();
      if (data.access_token) localStorage.setItem("cribb_token", data.access_token);
      router.push("/landlord/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Shared input class
  const inputCls = "w-full mt-1.5 px-4 py-2.5 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#1B2D45]/20 focus:bg-white focus:outline-none transition-all";

  // Selected pill style (navy instead of orange)
  function pillCls(selected: boolean) {
    return `flex-1 py-2.5 rounded-lg border transition-all ${
      selected
        ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
        : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#1B2D45]/15"
    }`;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[500px]">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "13px", fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> Back to cribb
        </Link>

        {/* Header — navy-themed */}
        <div className="text-center mb-6">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}>cribb</Link>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-9 h-9 rounded-xl bg-[#1B2D45]/[0.06] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#1B2D45]/60" />
            </div>
            <div className="text-left">
              <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>Landlord Registration</h1>
              <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>List your properties to verified UofG students</p>
            </div>
          </div>
        </div>

        <StepIndicator current={step} />

        {/* ─── Step 0: Account ─── */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <User className="w-4 h-4 text-[#1B2D45]/50" /> Create your account
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>First name</label>
                <input type="text" value={account.first_name} onChange={(e) => setAccount({ ...account, first_name: e.target.value })} required className={inputCls} style={{ fontSize: "14px" }} />
              </div>
              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Last name</label>
                <input type="text" value={account.last_name} onChange={(e) => setAccount({ ...account, last_name: e.target.value })} required className={inputCls} style={{ fontSize: "14px" }} />
              </div>
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Mail className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Email
              </label>
              <input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="you@email.com" required className={inputCls} style={{ fontSize: "14px" }} />
              <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "11px" }}>Use a personal or business email — @uoguelph.ca is for student accounts</p>
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Lock className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Password
              </label>
              <input type="password" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} placeholder="Min 8 characters" required className={inputCls} style={{ fontSize: "14px" }} />
            </div>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Confirm password</label>
              <input type="password" value={account.confirm_password} onChange={(e) => setAccount({ ...account, confirm_password: e.target.value })} placeholder="Re-enter password" required className={inputCls} style={{ fontSize: "14px" }} />
            </div>
          </div>
        )}

        {/* ─── Step 1: Business Info ─── */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
              <Building2 className="w-4 h-4 text-[#1B2D45]/50" /> Business Details
            </h2>

            <div>
              <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Company or management name</label>
              <input type="text" value={business.company_name} onChange={(e) => setBusiness({ ...business, company_name: e.target.value })} placeholder="Optional — leave blank if individual landlord" className={inputCls} style={{ fontSize: "14px" }} />
            </div>

            <div>
              <label className="text-[#1B2D45] flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Phone className="w-3.5 h-3.5 text-[#1B2D45]/40" /> Phone number *
              </label>
              <input type="tel" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="519-555-0123" required className={inputCls} style={{ fontSize: "14px" }} />
              <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "11px" }}>Students may use this to contact you about listings</p>
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
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
              <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 700 }}>
                <Shield className="w-4 h-4 text-[#1B2D45]/50" /> Verification Documents
              </h2>

              <div className="bg-[#1B2D45]/[0.04] rounded-xl p-4">
                <p className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  To protect students and build trust, we verify all landlords before their listings go live. Upload the documents below — our team typically reviews within <strong>1-2 business days</strong>.
                </p>
              </div>

              <FileUploadBox label="Government-issued ID *" description="Driver's license, passport, or provincial ID card. Must show your name clearly." accepted=".pdf,.jpg,.jpeg,.png" file={govId} onSelect={setGovId} onRemove={() => setGovId(null)} />

              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>ID Type *</label>
                <div className="flex gap-2 mt-2">
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

              <FileUploadBox label="Proof of property ownership *" description="Property tax bill, utility bill in your name at the property address, mortgage statement, or property management license." accepted=".pdf,.jpg,.jpeg,.png" file={proofOfOwnership} onSelect={setProofOfOwnership} onRemove={() => setProofOfOwnership(null)} />

              <div>
                <label className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>Document Type *</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { key: "property_tax_bill", label: "Property Tax Bill" },
                    { key: "utility_bill", label: "Utility Bill" },
                    { key: "mortgage_statement", label: "Mortgage Statement" },
                    { key: "property_management_license", label: "Mgmt License" },
                  ].map((opt) => (
                    <button key={opt.key} type="button" onClick={() => setDocumentType(opt.key)}
                      className={`px-3 py-2 rounded-lg border transition-all ${
                        documentType === opt.key
                          ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                          : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#1B2D45]/15"
                      }`}
                      style={{ fontSize: "12px", fontWeight: documentType === opt.key ? 600 : 500 }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-xl border border-black/[0.06] p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>What happens next?</h3>
              <div className="space-y-3 mt-3">
                {[
                  { num: "1", text: "We review your documents (1-2 business days)" },
                  { num: "2", text: "Once approved, you get a \"Verified Landlord\" badge" },
                  { num: "3", text: "Your listings appear as trusted to students" },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1B2D45]/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#1B2D45]/60" style={{ fontSize: "11px", fontWeight: 700 }}>{item.num}</span>
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
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Navigation — navy buttons */}
        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => { setStep(step - 1); setError(""); }}
              className="px-5 py-3 rounded-xl border border-black/[0.08] text-[#1B2D45]/60 hover:bg-black/[0.02] transition-all"
              style={{ fontSize: "14px", fontWeight: 500 }}>
              ← Back
            </button>
          )}

          {step < 2 ? (
            <button onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] transition-all flex items-center justify-center gap-2"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(27,45,69,0.2)" }}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
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
    </div>
  );
}