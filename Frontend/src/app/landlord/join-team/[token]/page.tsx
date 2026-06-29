"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { OrgInvitePreview } from "@/types";

export default function JoinTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<OrgInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    api.landlords.getOrgInvitePreview(token)
      .then((p) => { if (!cancelled) setPreview(p); })
      .catch(() => { if (!cancelled) setError("This invite link is invalid or has expired."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const isLandlord = user?.role === "landlord";
  const nextPath = `/landlord/join-team/${token}`;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await api.landlords.acceptOrgInvite(token);
      toast.success(`You've joined ${preview?.org_name ?? "the team"}`);
      router.push("/landlord?tab=settings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't accept invite");
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#1B2D45]/[0.06] p-7" style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.05)" }}>
        {loading || !mounted ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[#1B2D45]/40" style={{ fontSize: "14px" }}>
            <Loader2 className="w-5 h-5 animate-spin" /> Loading invite…
          </div>
        ) : error || !preview ? (
          <div className="text-center py-6">
            <AlertCircle className="w-9 h-9 text-[#E71D36]/60 mx-auto" />
            <p className="text-[#1B2D45] mt-3" style={{ fontSize: "15px", fontWeight: 700 }}>Invite not available</p>
            <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "13px" }}>{error ?? "This invite link is invalid."}</p>
            <Link href="/landlord" className="inline-block mt-4 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>← Back to dashboard</Link>
          </div>
        ) : preview.status !== "pending" ? (
          <div className="text-center py-6">
            <AlertCircle className="w-9 h-9 text-[#FFB627] mx-auto" />
            <p className="text-[#1B2D45] mt-3" style={{ fontSize: "15px", fontWeight: 700 }}>This invite is no longer active</p>
            <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "13px" }}>
              It was already {preview.status}. Ask {preview.inviter_name} to send a new one.
            </p>
            <Link href="/landlord" className="inline-block mt-4 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>← Back to dashboard</Link>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 text-[#1B2D45]" />
            </div>
            <h1 className="text-[#1B2D45] text-center mt-4" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Join {preview.org_name}
            </h1>
            <p className="text-[#1B2D45]/55 text-center mt-2" style={{ fontSize: "14px", lineHeight: 1.6 }}>
              <strong className="text-[#1B2D45]">{preview.inviter_name}</strong> invited you to join their team as an agent. You&apos;ll share one inbox and can reply to any tenant inquiry for your properties.
            </p>

            {isLandlord ? (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full mt-6 py-3 rounded-xl bg-[#1B2D45] text-white hover:bg-[#16243a] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                style={{ fontSize: "15px", fontWeight: 700 }}
              >
                {accepting ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : <><Check className="w-4 h-4" /> Accept invitation</>}
              </button>
            ) : (
              <div className="mt-6">
                <p className="text-[#1B2D45]/50 text-center mb-3" style={{ fontSize: "12px" }}>
                  Sign in or create a landlord account to accept — use <strong className="text-[#1B2D45]/70">{preview.email}</strong>.
                </p>
                <Link
                  href={`/landlord/login?next=${encodeURIComponent(nextPath)}`}
                  className="block w-full py-3 rounded-xl bg-[#1B2D45] text-white text-center hover:bg-[#16243a] transition-colors"
                  style={{ fontSize: "15px", fontWeight: 700 }}
                >
                  Sign in to accept
                </Link>
                <Link
                  href={`/landlord/signup?next=${encodeURIComponent(nextPath)}`}
                  className="block w-full mt-2 py-3 rounded-xl border border-[#1B2D45]/15 text-[#1B2D45] text-center hover:bg-[#1B2D45]/[0.03] transition-colors"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Create a landlord account
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
