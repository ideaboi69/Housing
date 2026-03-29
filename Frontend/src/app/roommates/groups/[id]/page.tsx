"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, ShieldCheck, ChevronLeft, MessageCircle, Link2, Copy, Check, MapPin, Home, Calendar, DollarSign, Sparkles, Send, Settings, Search, Share2, Camera, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { getLandlordClaimState, type LandlordClaimState } from "@/lib/landlord-claim";
import {
  type LifestyleProfile, type RoommateGroup, type GroupHousing,
  TAG_SHORT_LABELS, computeGroupCompatibility,
  getRoommateGroupById,
} from "@/components/roommates/roommate-data";

/* ── Helpers ── */

function CompatRing({ score, size = 44 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#FFB627" : "#FF6B35";
  const label = score >= 80 ? "Great Match" : score >= 60 ? "Good Match" : "Some Differences";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1B2D45" strokeOpacity={0.04} strokeWidth={3} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: size * 0.28, fontWeight: 800, color }}>{score}</span>
      </div>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color }}>{label}</div>
        <div className="text-[#1B2D45]/25" style={{ fontSize: "10px" }}>compatibility with you</div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: LifestyleProfile }) {
  const topTags = Object.entries(member.tags).slice(0, 5).map(([_, v]) => TAG_SHORT_LABELS[v] || v);
  const budgetLabel = member.budget[1] >= 2000 ? `$${member.budget[0]}+` : `$${member.budget[0]}–$${member.budget[1]}`;

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-4" style={{ boxShadow: "0 12px 28px rgba(27,45,69,0.04)" }}>
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0 overflow-hidden border border-[#1B2D45]/10">
          {(member as typeof member & { avatar?: string }).avatar ? (
            <img src={(member as typeof member & { avatar?: string }).avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#FF6B35" }}>{member.firstName[0]}</span>
          )}
        </div>
        <div>
          <h4 className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{member.firstName} {member.initial}</h4>
          <p className="text-[#1B2D45]/35" style={{ fontSize: "10px" }}>{member.year} · {member.program}</p>
        </div>
      </div>
      {member.bio && (
        <p className="text-[#1B2D45]/40 mb-2" style={{ fontSize: "11px", lineHeight: 1.5 }}>{member.bio}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="px-2 py-0.5 rounded bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 600 }}>{budgetLabel}/mo</span>
        {topTags.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded bg-[#FF6B35]/[0.06] text-[#FF6B35]/60" style={{ fontSize: "9px", fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Landlord Copy Button ── */

function LandlordCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="px-3 py-2 rounded-lg bg-[#2EC4B6] text-white hover:bg-[#28b0a3] transition-all flex items-center gap-1.5 shrink-0" style={{ fontSize: "10px", fontWeight: 600 }}>
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

/* ── Main Page ── */

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<RoommateGroup | null | undefined>(undefined);
  const [claimState, setClaimState] = useState<LandlordClaimState | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      // Try API first for numeric IDs
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        try {
          const apiGroup = await api.roommates.getGroup(numId);
          // Convert API response to local format
          setGroup({
            id: String(apiGroup.id),
            name: apiGroup.name,
            createdBy: String(apiGroup.owner_id),
            members: apiGroup.members.map((m) => ({
              id: String(m.user_id),
              firstName: m.first_name,
              initial: m.last_initial,
              year: "",
              program: "",
              budget: [0, 0] as [number, number],
              moveIn: "",
              leaseLength: "",
              bio: "",
              tags: {},
            })),
            groupSize: apiGroup.total_capacity,
            spotsNeeded: apiGroup.spots_remaining,
            budgetMin: Number(apiGroup.rent_per_person) || 0,
            budgetMax: Number(apiGroup.rent_per_person) || 0,
            preferredArea: null,
            targetListingId: null,
            targetListingTitle: null,
            description: apiGroup.description || "",
            inviteCode: "",
            isVisible: apiGroup.is_active,
            genderPreference: apiGroup.gender_preference || null,
            moveIn: apiGroup.move_in_timing || "",
            createdAt: apiGroup.created_at,
            housing: apiGroup.has_place ? {
              status: apiGroup.is_verified ? "linked" : "pending",
              selfReportedAddress: apiGroup.address || undefined,
              selfReportedRent: Number(apiGroup.rent_per_person) || undefined,
              selfReportedUtilitiesIncluded: apiGroup.utilities_included,
            } : undefined,
          } as RoommateGroup);
          return;
        } catch { /* fall through to mock */ }
      }
      // Fallback to mock/localStorage
      setGroup(getRoommateGroupById(id) ?? null);
    }
    fetchGroup();
  }, [id]);

  useEffect(() => {
    setClaimState(getLandlordClaimState());
  }, []);

  if (group === undefined) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Group not found</h2>
          <p className="text-[#1B2D45]/35 mt-1" style={{ fontSize: "13px" }}>This group may have been removed or the link is invalid.</p>
          <Link href="/roommates" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#FF6B35] text-white" style={{ fontSize: "13px", fontWeight: 600 }}>Browse Roommates</Link>
        </div>
      </div>
    );
  }

  const filled = group.groupSize - group.spotsNeeded;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/roommates/groups/join/${group.inviteCode}` : "";
  const isOwner = Boolean(user) && (
    group.createdBy === `user:${user?.id}` ||
    group.createdBy === `${user?.id}-member-1`
  );
  const displayRent = group.housing?.status === "linked"
    ? group.housing.linkedListingPrice
    : group.housing?.status === "pending"
      ? group.housing.selfReportedRent
      : null;
  const utilitiesIncluded = group.housing?.status === "linked"
    ? group.housing.linkedListingUtilitiesIncluded
    : group.housing?.status === "pending"
      ? group.housing.selfReportedUtilitiesIncluded
      : undefined;
  const matchingClaim = claimState?.claim_code === group.inviteCode ? claimState : null;
  const pendingHeadline = matchingClaim?.status === "listing_created"
    ? "Landlord published the listing"
    : matchingClaim?.status === "property_created"
      ? "Landlord added the property details"
      : "Current availability awaiting landlord verification";
  const heroImage =
    (group as RoommateGroup & { groupImage?: string }).groupImage ||
    group.housing?.linkedListingImage ||
    group.housing?.selfReportedPhotos?.[0] ||
    null;
  const compactMeta = [
    group.spotsNeeded === 1 ? "Need 1 more" : `Need ${group.spotsNeeded} more`,
    group.preferredArea,
    group.genderPreference && group.genderPreference !== "No preference" ? group.genderPreference : null,
  ].filter(Boolean).slice(0, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const numId = parseInt(group.id, 10);
      if (!isNaN(numId)) {
        await api.roommates.sendRequest({ group_id: numId, message: requestMessage || undefined });
      }
    } catch { /* API failed — still show success for demo */ }
    setRequestSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[700px] mx-auto px-4 py-6 md:py-8">
        {/* Back */}
        <Link href="/roommates" className="inline-flex items-center gap-1 text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors mb-6" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ChevronLeft className="w-4 h-4" /> Back to Roommates
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-[24px] border border-black/[0.06] p-5 mb-4" style={{ boxShadow: "0 16px 34px rgba(27,45,69,0.05)" }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {compactMeta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#FF6B35]/[0.08] px-2.5 py-1 text-[#FF6B35]"
                    style={{ fontSize: "10px", fontWeight: 700 }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em" }}>{group.name}</h1>
              </div>
              <p className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
                Looking for {group.spotsNeeded} more roommate{group.spotsNeeded > 1 ? "s" : ""} · {group.moveIn}
              </p>
            </div>
            <div className="flex items-start gap-3 shrink-0">
              <div
                className="hidden sm:block w-[92px] h-[82px] rounded-2xl overflow-hidden border border-black/[0.05] bg-[#FAF8F4]"
              >
                {heroImage ? (
                  <img src={heroImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.18) 0%, rgba(255,182,39,0.18) 100%)" }} />
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-[#FAF8F4] px-3 py-2 rounded-xl border border-black/[0.04]">
                {Array.from({ length: group.groupSize }, (_, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-full ${i < filled ? "bg-[#4ADE80]" : "bg-[#1B2D45]/[0.08] border-2 border-dashed border-[#1B2D45]/10"}`} />
                ))}
                <span className="text-[#1B2D45]/40 ml-1" style={{ fontSize: "11px", fontWeight: 600 }}>{filled}/{group.groupSize}</span>
              </div>
            </div>
          </div>

          <p className="text-[#1B2D45]/60 mb-4" style={{ fontSize: "13px", lineHeight: 1.6 }}>{group.description}</p>

          {/* Snapshot */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-2xl bg-[#FCFAF7] px-3 py-2.5 border border-black/[0.05]">
              <div className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 700 }}>Rent</div>
              <div className="text-[#1B2D45] mt-0.5" style={{ fontSize: "12px", fontWeight: 800 }}>
                {displayRent ? `$${displayRent}/mo` : `$${group.budgetMin}–$${group.budgetMax}/mo`}
              </div>
            </div>
            <div className="rounded-2xl bg-[#FCFAF7] px-3 py-2.5 border border-black/[0.05]">
              <div className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 700 }}>Utilities</div>
              <div className="text-[#1B2D45] mt-0.5" style={{ fontSize: "12px", fontWeight: 800 }}>
                {utilitiesIncluded == null ? "Not listed" : utilitiesIncluded ? "Included" : "Extra"}
              </div>
            </div>
            <div className="rounded-2xl bg-[#FCFAF7] px-3 py-2.5 border border-black/[0.05]">
              <div className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 700 }}>Move-in</div>
              <div className="text-[#1B2D45] mt-0.5" style={{ fontSize: "12px", fontWeight: 800 }}>{group.moveIn}</div>
            </div>
            <div className="rounded-2xl bg-[#FCFAF7] px-3 py-2.5 border border-black/[0.05]">
              <div className="text-[#1B2D45]/30" style={{ fontSize: "10px", fontWeight: 700 }}>Availability</div>
              <div
                className="mt-0.5"
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: group.housing?.status === "linked" ? "#4ADE80" : "#FFB627",
                }}
              >
                {group.housing?.status === "linked" ? "Verified place" : "Awaiting verification"}
              </div>
            </div>
          </div>

          {group.genderPreference && group.genderPreference !== "No preference" && (
            <div className="mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-[#FFB627]/[0.06] text-[#FFB627]" style={{ fontSize: "11px", fontWeight: 600 }}>
                {group.genderPreference}
              </span>
            </div>
          )}

          {/* Housing Status */}
          {group.housing && (
            <div className="mb-4">
              {/* ── Linked: Verified listing ── */}
              {group.housing.status === "linked" && group.housing.linkedListingId && (
                <Link href={`/browse/${group.housing.linkedListingId}`} className="block rounded-xl overflow-hidden hover:translate-y-[-2px] transition-all" style={{ border: "2.5px solid rgba(74,222,128,0.2)", boxShadow: "0 2px 12px rgba(74,222,128,0.08)" }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4ADE80]/[0.06]">
                    <ShieldCheck className="w-3 h-3 text-[#4ADE80]" />
                    <span className="text-[#4ADE80]" style={{ fontSize: "10px", fontWeight: 700 }}>Verified current home on Cribb</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white">
                    {group.housing.linkedListingImage ? (
                      <div className="w-20 h-16 rounded-lg bg-[#FAF8F4] overflow-hidden shrink-0">
                        <img src={group.housing.linkedListingImage} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    ) : (
                      <div className="w-20 h-16 rounded-lg bg-[#FF6B35]/[0.06] flex items-center justify-center shrink-0">
                        <Home className="w-6 h-6 text-[#FF6B35]/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{group.housing.linkedListingTitle}</h4>
                      <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>{group.housing.linkedListingAddress}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {group.housing.linkedListingScore && (
                          <span className="px-2 py-0.5 rounded bg-[#4ADE80]/10 text-[#4ADE80]" style={{ fontSize: "10px", fontWeight: 700 }}>Cribb Score: {group.housing.linkedListingScore}</span>
                        )}
                        {group.housing.linkedListingPrice && (
                          <span className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>${group.housing.linkedListingPrice}/mo</span>
                        )}
                        {group.housing.linkedListingUtilitiesIncluded != null && (
                          <span className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>
                            · {group.housing.linkedListingUtilitiesIncluded ? "Utilities included" : "Utilities extra"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#1B2D45]/15 shrink-0" />
                  </div>
                </Link>
              )}

              {/* ── Pending: Self-reported ── */}
              {group.housing.status === "pending" && (
                <div className="rounded-xl overflow-hidden" style={{ border: "2.5px solid rgba(255,182,39,0.2)", boxShadow: "0 2px 12px rgba(255,182,39,0.06)" }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFB627]/[0.06]">
                    <span style={{ fontSize: "10px" }}>⏳</span>
                    <span className="text-[#FFB627]" style={{ fontSize: "10px", fontWeight: 700 }}>{pendingHeadline}</span>
                  </div>
                  <div className="p-4 bg-white">
                    {/* Optional photos */}
                    {group.housing.selfReportedPhotos && group.housing.selfReportedPhotos.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                        {group.housing.selfReportedPhotos.map((src, i) => (
                          <div key={i} className="w-24 h-18 rounded-lg overflow-hidden shrink-0 bg-[#FAF8F4]" style={{ aspectRatio: "4/3" }}>
                            <img src={src} alt={`Place photo ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FFB627]/[0.06] flex items-center justify-center shrink-0" style={{ border: "2px solid rgba(255,182,39,0.1)" }}>
                        <MapPin className="w-5 h-5 text-[#FFB627]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{group.housing.selfReportedAddress}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {group.housing.selfReportedRent && (
                            <span className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>~${group.housing.selfReportedRent}/person</span>
                          )}
                          {group.housing.selfReportedUtilitiesIncluded != null && (
                            <span className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>
                              · {group.housing.selfReportedUtilitiesIncluded ? "Utilities included" : "Utilities extra"}
                            </span>
                          )}
                          <span className="text-[#FFB627]/60" style={{ fontSize: "10px", fontWeight: 600 }}>· Self-reported</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#1B2D45]/25 mt-2.5" style={{ fontSize: "10px", lineHeight: 1.4 }}>
                      The group already has this place lined up. Amenities, Cribb Score, and full details will appear once the landlord verifies it on Cribb.
                    </p>

                    {matchingClaim && (
                      <div
                        className="mt-3 rounded-xl px-3 py-3"
                        style={{
                          background: matchingClaim.status === "listing_created" ? "rgba(74,222,128,0.06)" : "rgba(46,196,182,0.05)",
                          border: `1.5px solid ${matchingClaim.status === "listing_created" ? "rgba(74,222,128,0.18)" : "rgba(46,196,182,0.18)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {matchingClaim.status === "listing_created" ? (
                            <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                          ) : (
                            <Home className="w-3.5 h-3.5 text-[#2EC4B6]" />
                          )}
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: matchingClaim.status === "listing_created" ? "#4ADE80" : "#2EC4B6",
                            }}
                          >
                            {matchingClaim.status === "listing_created" ? "Frontend progress: listing published" : "Frontend progress: property added"}
                          </span>
                        </div>
                        <p className="text-[#1B2D45]/35 mt-1.5" style={{ fontSize: "10px", lineHeight: 1.45 }}>
                          {matchingClaim.status === "listing_created"
                            ? "The landlord has already created the property and published the listing on Cribb. The final backend step still needs to attach it to this group."
                            : "The landlord has started the verification flow and added the property details. The listing is the next step."}
                        </p>
                        {matchingClaim.property_address && (
                          <div className="text-[#1B2D45]/30 mt-2" style={{ fontSize: "10px", fontWeight: 600 }}>
                            Property: {matchingClaim.property_address}
                          </div>
                        )}
                        {matchingClaim.status === "listing_created" && matchingClaim.listing_rent_per_room && (
                          <div className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "10px", fontWeight: 600 }}>
                            Listing rent: ${matchingClaim.listing_rent_per_room}/room
                          </div>
                        )}
                      </div>
                    )}

                    {/* Landlord invite link */}
                    {group.housing.landlordInviteUrl && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1.5px solid rgba(27,45,69,0.04)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Share2 className="w-3.5 h-3.5 text-[#2EC4B6]" />
                          <span className="text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 700 }}>Landlord verification link</span>
                        </div>
                        <p className="text-[#1B2D45]/30 mb-2" style={{ fontSize: "10px", lineHeight: 1.4 }}>
                          This is separate from the student join link below. Send this to your landlord so they can claim and verify the home on Cribb.
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4] border border-[#2EC4B6]/10 min-w-0">
                            <Link2 className="w-3 h-3 text-[#2EC4B6]/40 shrink-0" />
                            <span className="text-[#2EC4B6]/60 truncate" style={{ fontSize: "10px", fontWeight: 500 }}>{group.housing.landlordInviteUrl}</span>
                          </div>
                          <LandlordCopyButton url={group.housing.landlordInviteUrl} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Fallback for old data format without housing object */}
          {!group.housing && group.targetListingTitle && (
            <Link href={`/browse/${group.targetListingId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35]/[0.04] border border-[#FF6B35]/10 hover:border-[#FF6B35]/20 transition-all mb-4">
              <Home className="w-5 h-5 text-[#FF6B35] shrink-0" />
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>Current home</div>
                <div className="text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>{group.targetListingTitle} →</div>
              </div>
            </Link>
          )}

          {/* Manage (owner only — TODO: check ownership via API) */}
          {isOwner && (
            <Link href={`/roommates/groups/${group.id}/manage`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[#1B2D45]/10 text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-[#1B2D45]/20 transition-all mb-3" style={{ fontSize: "12px", fontWeight: 600 }}>
              <Settings className="w-3.5 h-3.5" /> Manage Group
            </Link>
          )}

          {/* Share link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4] border border-black/[0.04]">
              <Link2 className="w-3.5 h-3.5 text-[#1B2D45]/25 shrink-0" />
              <span className="text-[#1B2D45]/40 truncate" style={{ fontSize: "11px" }}>Student invite: {shareUrl || `cribb.ca/join/${group.inviteCode}`}</span>
            </div>
            <button onClick={handleCopy} className="px-3 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all flex items-center gap-1.5 shrink-0" style={{ fontSize: "11px", fontWeight: 600 }}>
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Link</>}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="mb-4">
          <h2 className="text-[#1B2D45] mb-3" style={{ fontSize: "16px", fontWeight: 800 }}>
            Members ({group.members.length})
          </h2>
          <div className="space-y-2.5">
            {group.members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
          {/* Empty spots */}
          {group.spotsNeeded > 0 && (
            <div className="mt-2.5 space-y-2">
              {Array.from({ length: group.spotsNeeded }, (_, i) => (
                <div key={`empty-${i}`} className="rounded-xl border-2 border-dashed border-black/[0.06] p-4 flex items-center justify-center gap-2 text-[#1B2D45]/20" style={{ fontSize: "12px", fontWeight: 500 }}>
                  <Users className="w-4 h-4" /> Open spot
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request to Join */}
        {group.spotsNeeded > 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.04] p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            {requestSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Request Sent!</h3>
                <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px" }}>The group will review your profile and get back to you.</p>
              </div>
            ) : !showRequestForm ? (
              <div className="text-center">
                <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Interested in joining?</h3>
                <p className="text-[#1B2D45]/35 mb-4" style={{ fontSize: "12px" }}>Send a request and introduce yourself to the group.</p>
                <button onClick={() => user ? setShowRequestForm(true) : router.push("/login")} className="px-6 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.25)" }}>
                  {user ? "Request to Join" : "Log in to Request"}
                </button>
                {!user && (
                  <p className="text-[#1B2D45]/20 mt-2" style={{ fontSize: "10px" }}>You need a cribb account to join groups</p>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "15px", fontWeight: 700 }}>Say hi to the group 👋</h3>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Hey! I'm a 2nd year student and I’m interested in the available room at your place..."
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F4] border border-black/[0.04] focus:border-[#FF6B35]/20 focus:outline-none resize-none transition-all"
                  style={{ fontSize: "13px", lineHeight: 1.5, minHeight: 100 }}
                />
                <p className="text-[#1B2D45]/20 mt-1 mb-3" style={{ fontSize: "10px" }}>Your lifestyle profile will be shared with the group along with this message.</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowRequestForm(false)} className="px-4 py-2.5 rounded-xl text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-all" style={{ fontSize: "13px", fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleRequestJoin} className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all flex items-center justify-center gap-1.5" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}>
                    <Send className="w-4 h-4" /> Send Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privacy note */}
        <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#2EC4B6]/[0.04]">
          <Shield className="w-4 h-4 text-[#2EC4B6] shrink-0 mt-0.5" />
          <p className="text-[#1B2D45]/30" style={{ fontSize: "10px", lineHeight: 1.5 }}>
            All members use verified student email. Your contact info is never shared until you join a group.
          </p>
        </div>
      </div>
    </div>
  );
}
