"use client";

import { useState, useMemo } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, ShieldCheck, ChevronLeft, MessageCircle, Link2, Copy, Check, MapPin, Home, Calendar, DollarSign, Sparkles, Send, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  type LifestyleProfile, type RoommateGroup,
  TAG_SHORT_LABELS, computeGroupCompatibility,
  MOCK_GROUPS,
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
    <div className="bg-white rounded-xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#FF6B35" }}>{member.firstName[0]}</span>
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

/* ── Main Page ── */

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // TODO: fetch from API — GET /api/groups/{id}
  const group = MOCK_GROUPS.find((g) => g.id === id);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestJoin = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    // TODO: POST /api/groups/{id}/request { message }
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
        <div className="bg-white rounded-2xl border border-black/[0.04] p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 900 }}>{group.name}</h1>
              </div>
              <p className="text-[#1B2D45]/35" style={{ fontSize: "12px" }}>
                Looking for {group.spotsNeeded} more roommate{group.spotsNeeded > 1 ? "s" : ""} · {group.moveIn}
              </p>
            </div>
            {/* Spots visual */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F4] px-3 py-2 rounded-xl">
              {Array.from({ length: group.groupSize }, (_, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full ${i < filled ? "bg-[#4ADE80]" : "bg-[#1B2D45]/[0.08] border-2 border-dashed border-[#1B2D45]/10"}`} />
              ))}
              <span className="text-[#1B2D45]/40 ml-1" style={{ fontSize: "11px", fontWeight: 600 }}>{filled}/{group.groupSize}</span>
            </div>
          </div>

          <p className="text-[#1B2D45]/60 mb-4" style={{ fontSize: "13px", lineHeight: 1.6 }}>{group.description}</p>

          {/* Info tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>
              <DollarSign className="w-3 h-3" /> ${group.budgetMin}–${group.budgetMax}/mo
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B2D45]/[0.04] text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Calendar className="w-3 h-3" /> {group.moveIn}
            </span>
            {group.preferredArea && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2EC4B6]/[0.06] text-[#2EC4B6]" style={{ fontSize: "11px", fontWeight: 600 }}>
                <MapPin className="w-3 h-3" /> {group.preferredArea}
              </span>
            )}
            {group.genderPreference && group.genderPreference !== "No preference" && (
              <span className="px-2.5 py-1 rounded-lg bg-[#FFB627]/[0.06] text-[#FFB627]" style={{ fontSize: "11px", fontWeight: 600 }}>
                {group.genderPreference}
              </span>
            )}
          </div>

          {/* Target listing */}
          {group.targetListingTitle && (
            <Link href={`/browse/${group.targetListingId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35]/[0.04] border border-[#FF6B35]/10 hover:border-[#FF6B35]/20 transition-all mb-4">
              <Home className="w-5 h-5 text-[#FF6B35] shrink-0" />
              <div>
                <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>Eyeing a listing</div>
                <div className="text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>{group.targetListingTitle} →</div>
              </div>
            </Link>
          )}

          {/* Manage (owner only — TODO: check ownership via API) */}
          {user && (
            <Link href={`/roommates/groups/${group.id}/manage`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[#1B2D45]/10 text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-[#1B2D45]/20 transition-all mb-3" style={{ fontSize: "12px", fontWeight: 600 }}>
              <Settings className="w-3.5 h-3.5" /> Manage Group
            </Link>
          )}

          {/* Share link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F4] border border-black/[0.04]">
              <Link2 className="w-3.5 h-3.5 text-[#1B2D45]/25 shrink-0" />
              <span className="text-[#1B2D45]/40 truncate" style={{ fontSize: "11px" }}>{shareUrl || `cribb.ca/join/${group.inviteCode}`}</span>
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
                  placeholder="Hey! I'm a 2nd year student looking for a place near campus..."
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
            All members are verified UofG students. Your contact info is never shared until you join a group.
          </p>
        </div>
      </div>
    </div>
  );
}