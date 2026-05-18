"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Shield, Check, MapPin, DollarSign, Users, Link2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";

interface LandlordInvitePreview {
  id: number;
  group_name: string;
  group_description?: string | null;
  group_size: number;
  address: string;
  postal_code?: string | null;
  property_type?: string | null;
  total_rooms?: number | null;
  bathrooms?: number | null;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  estimated_utility_cost?: number | null;
  distance_to_campus_km?: number | null;
  nearest_bus_route?: string | null;
  rent_per_room?: number | null;
  rent_total?: number | null;
  lease_type?: string | null;
  move_in_date?: string | null;
  gender_preference?: string | null;
  status: string;
  created_at: string;
}

export default function LandlordClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [invite, setInvite] = useState<LandlordInvitePreview | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.landlordInvites.preview(token);
        if (!cancelled) setInvite(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) setError(err.detail || "This invite is no longer valid.");
        else setError("Could not load this invite.");
        setInvite(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const handleClaim = async () => {
    if (!user) {
      router.push(`/landlord/login?next=${encodeURIComponent(`/landlord-claim/${token}`)}`);
      return;
    }
    setClaiming(true);
    setError(null);
    try {
      const result = await api.landlordInvites.claim(token);
      router.push(`/landlord/properties/${result.property_id}`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || "Could not claim this listing.");
      else setError("Could not claim this listing.");
      setClaiming(false);
    }
  };

  if (invite === undefined) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="w-8 h-8 border-3 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center max-w-[380px]">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-7 h-7 text-[#1B2D45]/20" />
          </div>
          <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>Invite unavailable</h1>
          <p className="text-[#1B2D45]/40 mt-2 mb-5" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            {error || "This claim link may have expired or already been used."}
          </p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
            Back to Cribb
          </Link>
        </div>
      </div>
    );
  }

  const isLandlord = user?.role === "landlord";
  const isVerified = isLandlord && (user as { identity_verified?: boolean }).identity_verified === true;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[840px] mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2EC4B6]/15 bg-[#2EC4B6]/[0.06] px-3 py-1.5 text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 700 }}>
            <Home className="w-3.5 h-3.5" /> Landlord verification request
          </span>
          <h1 className="mt-4 text-[#1B2D45]" style={{ fontSize: "32px", lineHeight: 1.1, fontWeight: 900 }}>
            {invite.group_name} wants to verify their place with you
          </h1>
          <p className="mt-3 max-w-[560px] text-[#1B2D45]/55" style={{ fontSize: "14px", lineHeight: 1.7 }}>
            A student group on Cribb has invited you to confirm you&apos;re their landlord. Claiming creates a draft Property and Listing under your account.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          {/* Property details */}
          <div className="bg-white rounded-[28px] border border-black/[0.05] p-6" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
            <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Property prefilled by group
            </div>
            <div className="mt-3 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#FF6B35] shrink-0 mt-0.5" />
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>{invite.address}</div>
                {invite.postal_code && (
                  <div className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px" }}>{invite.postal_code}</div>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {invite.rent_per_room && (
                <Stat icon={<DollarSign className="w-3.5 h-3.5" />} label="Rent per room" value={`$${invite.rent_per_room}`} />
              )}
              {invite.total_rooms && (
                <Stat icon={<Home className="w-3.5 h-3.5" />} label="Rooms" value={String(invite.total_rooms)} />
              )}
              <Stat icon={<Check className="w-3.5 h-3.5" />} label="Utilities" value={invite.utilities_included ? "Included" : "Not included"} />
              <Stat icon={<Users className="w-3.5 h-3.5" />} label="Group size" value={String(invite.group_size)} />
            </div>

            <p className="mt-5 text-[#1B2D45]/40" style={{ fontSize: "12px", lineHeight: 1.6 }}>
              You&apos;ll finish filling in the rest of the property details (bathrooms, amenities, photos, etc.) after claiming.
            </p>
          </div>

          {/* Claim panel */}
          <div className="bg-white rounded-[28px] border border-black/[0.05] p-6" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#E71D36]/5 px-3 py-2.5 text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 600 }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!user ? (
              <>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Log in to claim</h2>
                <p className="mt-2 text-[#1B2D45]/45" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  You need a verified landlord account to claim this listing.
                </p>
                <Link
                  href={`/landlord/login?next=${encodeURIComponent(`/landlord-claim/${token}`)}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#FF6B35] px-5 py-3 text-white hover:bg-[#e55e2e] transition-all"
                  style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 8px 24px rgba(255,107,53,0.22)" }}
                >
                  Log in as landlord
                </Link>
                <Link
                  href={`/landlord/signup?claim=${encodeURIComponent(token)}`}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-black/[0.08] bg-white px-5 py-3 text-[#1B2D45]/65 hover:text-[#1B2D45] transition-all"
                  style={{ fontSize: "13px", fontWeight: 700 }}
                >
                  New here? Sign up
                </Link>
              </>
            ) : !isLandlord ? (
              <>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Landlord account required</h2>
                <p className="mt-2 text-[#1B2D45]/45" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  This invite is for landlords. You&apos;re currently signed in as a {user.role}.
                </p>
                <Link
                  href="/landlord/login"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#FF6B35] px-5 py-3 text-white hover:bg-[#e55e2e] transition-all"
                  style={{ fontSize: "14px", fontWeight: 700 }}
                >
                  Switch to landlord login
                </Link>
              </>
            ) : !isVerified ? (
              <>
                <div className="flex items-center gap-2 text-[#FFB627]">
                  <Shield className="w-4 h-4" />
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Verification required
                  </span>
                </div>
                <h2 className="mt-2 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Verify your identity first</h2>
                <p className="mt-2 text-[#1B2D45]/45" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  We need to confirm you&apos;re a landlord before you can claim listings. Head to your dashboard to upload your documents.
                </p>
                <Link
                  href="/landlord"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#FFB627] px-5 py-3 text-white hover:bg-[#e5a420] transition-all"
                  style={{ fontSize: "14px", fontWeight: 700 }}
                >
                  Go to my dashboard
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Claim this listing</h2>
                <p className="mt-2 text-[#1B2D45]/45" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  Creates a new Property and a draft Listing under your account, linked to <strong>{invite.group_name}</strong>.
                </p>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#FF6B35] px-5 py-3 text-white hover:bg-[#e55e2e] transition-all disabled:opacity-50"
                  style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 8px 24px rgba(255,107,53,0.22)" }}
                >
                  {claiming ? "Claiming..." : "Claim listing"}
                </button>
                <p className="mt-3 text-center text-[#1B2D45]/30" style={{ fontSize: "10px" }}>
                  You&apos;ll be able to edit all fields and add photos after claiming.
                </p>
              </>
            )}

            <div className="mt-5 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[#2EC4B6]/[0.04]">
              <Shield className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0 mt-0.5" />
              <p className="text-[#1B2D45]/35" style={{ fontSize: "10px", lineHeight: 1.5 }}>
                Claiming doesn&apos;t obligate you to anything. You can edit, unpublish, or delete the listing afterward.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[#FCFBF8] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {icon} {label}
      </div>
      <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
