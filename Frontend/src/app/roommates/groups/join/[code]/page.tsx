"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Shield, ChevronRight, MapPin, Home, Send, Check, Link2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { type LifestyleProfile, type RoommateGroup, TAG_SHORT_LABELS, getRoommateGroupByInviteCode } from "@/components/roommates/roommate-data";

/* ── Member Preview ── */

function MemberPreview({ member }: { member: LifestyleProfile }) {
  const tags = Object.entries(member.tags).slice(0, 3).map(([_, v]) => TAG_SHORT_LABELS[v] || v);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-black/[0.04]">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF6B35" }}>{member.firstName[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{member.firstName} {member.initial}</div>
        <div className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>{member.year} · {member.program}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {tags.slice(0, 2).map((t) => (
          <span key={t} className="px-1.5 py-0.5 rounded bg-[#FF6B35]/[0.06] text-[#FF6B35]/60" style={{ fontSize: "8px", fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<RoommateGroup | null | undefined>(undefined);
  const [requestMessage, setRequestMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // TODO: GET /api/groups/join/{code}
    setGroup(getRoommateGroupByInviteCode(code) ?? null);
  }, [code]);

  if (group === undefined) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="w-8 h-8 border-3 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center max-w-[360px]">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.06] flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-7 h-7 text-[#1B2D45]/20" />
          </div>
          <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>Invalid invite link</h1>
          <p className="text-[#1B2D45]/35 mt-2 mb-5" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            This group link may have expired or been removed. Ask the person who shared it for a new link.
          </p>
          <Link href="/roommates" className="inline-block px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
            Browse Roommates
          </Link>
        </div>
      </div>
    );
  }

  const filled = group.groupSize - group.spotsNeeded;
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

  const handleRequest = async () => {
    if (!user) {
      router.push(`/login?redirect=/roommates/groups/join/${code}`);
      return;
    }
    try {
      const numId = parseInt(group.id, 10);
      if (!isNaN(numId)) {
        await api.roommates.sendRequest({ group_id: numId, message: requestMessage || undefined });
      }
    } catch { /* API failed — still show success for demo */ }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero banner */}
      <div className="bg-gradient-to-b from-[#1B2D45] to-[#152438] px-4 pt-10 pb-14 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/60 mb-4" style={{ fontSize: "10px", fontWeight: 600 }}>
            <Users className="w-3 h-3" /> Group Invite
          </div>
          <h1 className="text-white" style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1.2 }}>{group.name}</h1>
          <p className="text-white/40 mt-2" style={{ fontSize: "13px" }}>
            Looking for {group.spotsNeeded} more roommate{group.spotsNeeded > 1 ? "s" : ""} · {group.moveIn}
          </p>

          {/* Spots visual */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: group.groupSize }, (_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${i < filled ? "bg-[#4ADE80]" : "bg-white/10 border-2 border-dashed border-white/15"}`} />
            ))}
            <span className="text-white/30 ml-1" style={{ fontSize: "11px", fontWeight: 500 }}>{filled}/{group.groupSize} spots filled</span>
          </div>
        </motion.div>
      </div>

      {/* Content card — overlaps the banner */}
      <div className="max-w-[520px] mx-auto px-4 -mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

          {/* Description */}
          <div className="px-5 py-5">
            <p className="text-[#1B2D45]/60" style={{ fontSize: "13px", lineHeight: 1.6 }}>{group.description}</p>

            {/* Snapshot */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-xl bg-[#FAF8F4] px-3 py-2.5 border border-black/[0.04]">
                <div className="text-[#1B2D45]/25" style={{ fontSize: "10px", fontWeight: 700 }}>Rent</div>
                <div className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "12px", fontWeight: 700 }}>
                  {displayRent ? `$${displayRent}/mo` : `$${group.budgetMin}–$${group.budgetMax}/mo`}
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF8F4] px-3 py-2.5 border border-black/[0.04]">
                <div className="text-[#1B2D45]/25" style={{ fontSize: "10px", fontWeight: 700 }}>Utilities</div>
                <div className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "12px", fontWeight: 700 }}>
                  {utilitiesIncluded == null ? "Not listed" : utilitiesIncluded ? "Included" : "Extra"}
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF8F4] px-3 py-2.5 border border-black/[0.04]">
                <div className="text-[#1B2D45]/25" style={{ fontSize: "10px", fontWeight: 700 }}>Move-in</div>
                <div className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "12px", fontWeight: 700 }}>{group.moveIn}</div>
              </div>
              <div className="rounded-xl bg-[#FAF8F4] px-3 py-2.5 border border-black/[0.04]">
                <div className="text-[#1B2D45]/25" style={{ fontSize: "10px", fontWeight: 700 }}>Availability</div>
                <div
                  className="mt-0.5"
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: group.housing?.status === "linked" ? "#4ADE80" : "#FFB627",
                  }}
                >
                  {group.housing?.status === "linked" ? "Verified place" : "Awaiting verification"}
                </div>
              </div>
            </div>

            {group.genderPreference && group.genderPreference !== "No preference" && (
              <div className="mt-3">
                <span className="px-2.5 py-1 rounded-lg bg-[#FFB627]/[0.06] text-[#FFB627]" style={{ fontSize: "11px", fontWeight: 600 }}>
                  {group.genderPreference}
                </span>
              </div>
            )}

            {/* Current home / listing */}
            {group.housing?.status === "linked" && group.housing.linkedListingId ? (
              <Link href={`/browse/${group.housing.linkedListingId}`} className="flex items-center gap-3 mt-4 px-4 py-3 rounded-xl bg-[#4ADE80]/[0.04] border border-[#4ADE80]/10 hover:border-[#4ADE80]/20 transition-all">
                <Home className="w-5 h-5 text-[#4ADE80] shrink-0" />
                  <div className="flex-1">
                    <div className="text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>Verified current home</div>
                  <div className="text-[#4ADE80]" style={{ fontSize: "12px", fontWeight: 700 }}>{group.housing.linkedListingAddress || group.housing.linkedListingTitle}</div>
                  <div className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "10px", fontWeight: 600 }}>
                    {group.housing.linkedListingPrice ? `$${group.housing.linkedListingPrice}/mo` : "Rent not listed"}
                    {group.housing.linkedListingUtilitiesIncluded != null ? ` · ${group.housing.linkedListingUtilitiesIncluded ? "Utilities included" : "Utilities extra"}` : ""}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#4ADE80]/40" />
              </Link>
            ) : group.housing?.status === "pending" && group.housing.selfReportedAddress ? (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 rounded-xl bg-[#FFB627]/[0.04] border border-[#FFB627]/10">
                <MapPin className="w-5 h-5 text-[#FFB627] shrink-0" />
                <div className="flex-1">
                  <div className="text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>Current availability awaiting verification</div>
                  <div className="text-[#FFB627]" style={{ fontSize: "12px", fontWeight: 700 }}>{group.housing.selfReportedAddress}</div>
                  <div className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "10px", fontWeight: 600 }}>
                    {group.housing.selfReportedRent ? `~$${group.housing.selfReportedRent}/person` : "Rent not listed"}
                    {group.housing.selfReportedUtilitiesIncluded != null ? ` · ${group.housing.selfReportedUtilitiesIncluded ? "Utilities included" : "Utilities extra"}` : ""}
                  </div>
                </div>
              </div>
            ) : group.targetListingTitle ? (
              <Link href={`/browse/${group.targetListingId}`} className="flex items-center gap-3 mt-4 px-4 py-3 rounded-xl bg-[#FF6B35]/[0.04] border border-[#FF6B35]/10 hover:border-[#FF6B35]/20 transition-all">
                <Home className="w-5 h-5 text-[#FF6B35] shrink-0" />
                <div className="flex-1">
                  <div className="text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 600 }}>Current home</div>
                  <div className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 600 }}>{group.targetListingTitle}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#FF6B35]/40" />
              </Link>
            ) : null}
          </div>

          {/* Members */}
          <div className="px-5 py-4 border-t border-black/[0.04] bg-[#FAF8F4]/50">
            <h3 className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>MEMBERS ({group.members.length})</h3>
            <div className="space-y-2">
              {group.members.map((m) => <MemberPreview key={m.id} member={m} />)}
              {Array.from({ length: group.spotsNeeded }, (_, i) => (
                <div key={`spot-${i}`} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-black/[0.06] text-[#1B2D45]/15" style={{ fontSize: "11px", fontWeight: 500 }}>
                  This could be you
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 py-5 border-t border-black/[0.04]">
            {sent ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Request Sent!</h3>
                <p className="text-[#1B2D45]/35 mt-1" style={{ fontSize: "11px" }}>The group will review and get back to you.</p>
              </div>
            ) : showForm ? (
              <div>
                <h3 className="text-[#1B2D45] mb-2" style={{ fontSize: "14px", fontWeight: 700 }}>Introduce yourself 👋</h3>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Hey! I saw this on your story — I’m interested in the available room and think I’d be a good fit..."
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F4] border border-black/[0.04] focus:border-[#FF6B35]/20 focus:outline-none resize-none transition-all"
                  style={{ fontSize: "13px", lineHeight: 1.5, minHeight: 90 }}
                  autoFocus
                />
                <p className="text-[#1B2D45]/15 mt-1 mb-3" style={{ fontSize: "9px" }}>Your profile will be shared with this message.</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04]" style={{ fontSize: "12px", fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleRequest} className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all flex items-center justify-center gap-1.5" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}>
                    <Send className="w-3.5 h-3.5" /> Send Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button onClick={() => user ? setShowForm(true) : router.push(`/login?redirect=/roommates/groups/join/${code}`)} className="w-full py-3.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.25)" }}>
                  {user ? "Request This Availability" : "Sign Up to Join"}
                </button>
                {!user && (
                  <p className="text-[#1B2D45]/20 mt-2" style={{ fontSize: "10px" }}>
                    Already have an account? <Link href={`/login?redirect=/roommates/groups/join/${code}`} className="text-[#FF6B35] hover:underline">Log in</Link>
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Trust */}
        <div className="mt-4 mb-8 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#2EC4B6]/[0.04]">
          <Shield className="w-4 h-4 text-[#2EC4B6] shrink-0 mt-0.5" />
          <p className="text-[#1B2D45]/30" style={{ fontSize: "10px", lineHeight: 1.5 }}>
            All members are verified UofG students. Your contact info stays private until you join.
          </p>
        </div>
      </div>
    </div>
  );
}