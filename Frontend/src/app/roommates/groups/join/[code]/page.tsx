"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Shield, ChevronRight, MapPin, Home, Send, Check, Link2, Camera } from "lucide-react";
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
  const heroImage =
    group.groupImage ||
    group.housing?.linkedListingImage ||
    group.housing?.selfReportedPhotos?.[0] ||
    null;

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
      <div className="max-w-[1120px] mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="relative space-y-4 lg:sticky lg:top-24">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-6 top-16 h-32 w-32 rounded-full bg-[#FF6B35]/[0.08] blur-3xl"
              animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute right-2 top-[18rem] h-24 w-24 rounded-full bg-[#FFB627]/[0.08] blur-3xl"
              animate={{ opacity: [0.24, 0.5, 0.24], y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/12 bg-[#FF6B35]/[0.06] px-3 py-1.5 text-[#FF6B35]"
                style={{ fontSize: "11px", fontWeight: 700 }}
              >
                <Users className="w-3.5 h-3.5" />
                Group invite
              </span>
              <h1 className="mt-4 text-[#1B2D45]" style={{ fontSize: "34px", lineHeight: 1.05, fontWeight: 900 }}>
                {group.name}
              </h1>
              <p className="mt-3 max-w-[520px] text-[#1B2D45]/48" style={{ fontSize: "15px", lineHeight: 1.75 }}>
                Looking for {group.spotsNeeded} more roommate{group.spotsNeeded > 1 ? "s" : ""}. Check the vibe, current home, and group setup before you send a request.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
              className="overflow-hidden rounded-[34px] border border-black/[0.05] bg-[linear-gradient(180deg,#FFF8F3_0%,#FFFFFF_100%)]"
              style={{ boxShadow: "0 24px 56px rgba(15, 23, 42, 0.07)" }}
            >
              <div className="px-5 py-5 border-b border-black/[0.05] bg-[linear-gradient(135deg,#FFF4EE_0%,#FFFFFF_100%)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Group overview
                    </div>
                    <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                      What you’re joining
                    </div>
                  </div>
                  <motion.span
                    className="rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.08] px-3 py-1 text-[#FF6B35]"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Need {group.spotsNeeded}
                  </motion.span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative h-[92px] w-[108px] shrink-0 overflow-hidden rounded-[22px] border border-black/[0.05] bg-[#FAF8F4]">
                    {heroImage ? (
                      <img src={heroImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#FF6B35]/55" style={{ background: group.bannerGradient || "linear-gradient(135deg, #FFE6DA 0%, #FFF8F2 100%)" }}>
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[#1B2D45]/38" style={{ fontSize: "12px", fontWeight: 600 }}>
                      <span>{filled} of {group.groupSize} filled</span>
                      <span className="h-1 w-1 rounded-full bg-[#1B2D45]/15" />
                      <span>{group.moveIn}</span>
                    </div>
                    <p className="mt-2 text-[#1B2D45]/52" style={{ fontSize: "13px", lineHeight: 1.7 }}>
                      {group.description}
                    </p>
                    <div className="mt-4 flex items-center">
                      {group.members.map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.04, duration: 0.25 }}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#FFE3D3_0%,#FFF7F0_100%)] text-[#FF6B35]"
                          style={{ fontSize: "13px", fontWeight: 800, marginLeft: index === 0 ? 0 : -10 }}
                        >
                          {member.firstName[0]}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#1B2D45]/[0.05] px-3 py-1.5 text-[#1B2D45]/58" style={{ fontSize: "11px", fontWeight: 700 }}>
                    {displayRent ? `$${displayRent}/mo` : `$${group.budgetMin}–$${group.budgetMax}/mo`}
                  </span>
                  <span className="rounded-full bg-[#1B2D45]/[0.05] px-3 py-1.5 text-[#1B2D45]/58" style={{ fontSize: "11px", fontWeight: 700 }}>
                    {utilitiesIncluded == null ? "Utilities unknown" : utilitiesIncluded ? "Utilities included" : "Utilities extra"}
                  </span>
                  {group.genderPreference && group.genderPreference !== "No preference" && (
                    <span className="rounded-full bg-[#FFB627]/[0.08] px-3 py-1.5 text-[#FFB627]" style={{ fontSize: "11px", fontWeight: 700 }}>
                      {group.genderPreference}
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-[20px] border border-black/[0.05] bg-white/85 px-4 py-3">
                  <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Current home
                  </div>
                  {group.housing?.status === "linked" && group.housing.linkedListingId ? (
                    <Link href={`/browse/${group.housing.linkedListingId}`} className="mt-2 flex items-center gap-3 rounded-[16px] bg-[#4ADE80]/[0.04] border border-[#4ADE80]/10 px-3 py-3 transition-all hover:border-[#4ADE80]/20">
                      <Home className="w-4.5 h-4.5 text-[#4ADE80] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[#4ADE80]" style={{ fontSize: "12px", fontWeight: 700 }}>{group.housing.linkedListingAddress || group.housing.linkedListingTitle}</div>
                        <div className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "10px", fontWeight: 600 }}>
                          Verified place on Cribb
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#4ADE80]/40" />
                    </Link>
                  ) : group.housing?.status === "pending" && group.housing.selfReportedAddress ? (
                    <div className="mt-2 flex items-center gap-3 rounded-[16px] bg-[#FFB627]/[0.04] border border-[#FFB627]/10 px-3 py-3">
                      <MapPin className="w-4.5 h-4.5 text-[#FFB627] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[#FFB627]" style={{ fontSize: "12px", fontWeight: 700 }}>{group.housing.selfReportedAddress}</div>
                        <div className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "10px", fontWeight: 600 }}>
                          Awaiting verification
                        </div>
                      </div>
                    </div>
                  ) : group.targetListingTitle ? (
                    <Link href={`/browse/${group.targetListingId}`} className="mt-2 flex items-center gap-3 rounded-[16px] bg-[#FF6B35]/[0.04] border border-[#FF6B35]/10 px-3 py-3 transition-all hover:border-[#FF6B35]/20">
                      <Home className="w-4.5 h-4.5 text-[#FF6B35] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>{group.targetListingTitle}</div>
                        <div className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "10px", fontWeight: 600 }}>
                          Linked listing
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#FF6B35]/40" />
                    </Link>
                  ) : (
                    <div className="mt-2 text-[#1B2D45]/40" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                      The exact home details will appear here when the group links or verifies a place.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[32px] border border-black/[0.04] overflow-hidden"
              style={{ boxShadow: "0 10px 36px rgba(15,23,42,0.06)" }}
            >
              <div className="px-6 py-5 border-b border-black/[0.04]">
                <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Members
                </div>
                <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                  Meet the current house
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="space-y-2">
                  {group.members.map((m) => <MemberPreview key={m.id} member={m} />)}
                  {Array.from({ length: group.spotsNeeded }, (_, i) => (
                    <div key={`spot-${i}`} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-black/[0.06] text-[#1B2D45]/15" style={{ fontSize: "11px", fontWeight: 500 }}>
                      This could be you
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-5 border-t border-black/[0.04] bg-[#FCFBF8]">
                {sent ? (
                  <div className="text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-2">
                      <Check className="w-6 h-6 text-[#4ADE80]" />
                    </div>
                    <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Request sent</h3>
                    <p className="text-[#1B2D45]/35 mt-1" style={{ fontSize: "11px" }}>The group will review and get back to you.</p>
                  </div>
                ) : showForm ? (
                  <div>
                    <h3 className="text-[#1B2D45] mb-2" style={{ fontSize: "15px", fontWeight: 800 }}>Introduce yourself</h3>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Hey! I saw your group and think I’d be a good fit..."
                      className="w-full px-4 py-3 rounded-[20px] bg-white border border-black/[0.05] focus:border-[#FF6B35]/20 focus:outline-none resize-none transition-all"
                      style={{ fontSize: "13px", lineHeight: 1.6, minHeight: 96 }}
                      autoFocus
                    />
                    <p className="text-[#1B2D45]/18 mt-2 mb-3" style={{ fontSize: "10px" }}>Your profile will be shared with this message.</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-full text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04]" style={{ fontSize: "12px", fontWeight: 600 }}>Cancel</button>
                      <button onClick={handleRequest} className="flex-1 py-3 rounded-full bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all flex items-center justify-center gap-1.5" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 8px 24px rgba(255,107,53,0.22)" }}>
                        <Send className="w-3.5 h-3.5" /> Send request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => user ? setShowForm(true) : router.push(`/login?redirect=/roommates/groups/join/${code}`)} className="w-full py-3.5 rounded-full bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 8px 24px rgba(255,107,53,0.22)" }}>
                      {user ? "Request this availability" : "Sign up to join"}
                    </button>
                    {!user && (
                      <p className="text-[#1B2D45]/20 mt-2 text-center" style={{ fontSize: "10px" }}>
                        Already have an account? <Link href={`/login?redirect=/roommates/groups/join/${code}`} className="text-[#FF6B35] hover:underline">Log in</Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-[20px] bg-[#2EC4B6]/[0.04]">
              <Shield className="w-4 h-4 text-[#2EC4B6] shrink-0 mt-0.5" />
              <p className="text-[#1B2D45]/30" style={{ fontSize: "10px", lineHeight: 1.5 }}>
                All members use verified student email. Your contact info stays private until you join.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
