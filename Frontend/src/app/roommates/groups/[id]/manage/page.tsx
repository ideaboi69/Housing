"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Users, Copy, Check, Link2, Pencil, Trash2,
  X, UserPlus, UserMinus, Shield, MessageCircle, Clock,
  AlertCircle, Settings, Eye,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  type LifestyleProfile, type RoommateGroup, type GroupRequest,
  TAG_SHORT_LABELS, MOCK_PROFILES, getRoommateGroupById, removeStoredRoommateGroup, upsertStoredRoommateGroup,
  MOVE_IN_OPTIONS, GENDER_HOUSING_OPTIONS,
} from "@/components/roommates/roommate-data";

/* ── Mock requests ── */
const MOCK_REQUESTS: GroupRequest[] = [
  {
    id: "req1", groupId: "g1", userId: "r5",
    profile: MOCK_PROFILES[4],
    message: "Hey! I saw this on a friend's story. I'm a 3rd year EnvSci student, super clean and easygoing. Would love to chat!",
    status: "pending", createdAt: "2026-02-28",
  },
  {
    id: "req2", groupId: "g1", userId: "r7",
    profile: MOCK_PROFILES[7],
    message: "Hi! I'm looking for a quiet place to live. I'm in the lab most days so barely home. Mochi sounds adorable btw!",
    status: "pending", createdAt: "2026-03-01",
  },
];

/* ── Components ── */

function RequestCard({
  request, onAccept, onReject,
}: { request: GroupRequest; onAccept: () => void; onReject: () => void }) {
  const tags = Object.entries(request.profile.tags).slice(0, 4).map(([_, v]) => TAG_SHORT_LABELS[v] || v);
  const budget = request.profile.budget;
  const budgetLabel = budget[1] >= 2000 ? `$${budget[0]}+` : `$${budget[0]}–$${budget[1]}`;

  return (
    <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#FF6B35" }}>{request.profile.firstName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{request.profile.firstName} {request.profile.initial}</h4>
            <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>{request.profile.year} · {request.profile.program}</p>
          </div>
          <div className="flex items-center gap-1 text-[#1B2D45]/20" style={{ fontSize: "10px" }}>
            <Clock className="w-3 h-3" /> {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>

        {/* Message */}
        <div className="bg-[#FAF8F4] rounded-lg px-3 py-2.5 mb-3">
          <p className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.5 }}>{request.message}</p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="px-2 py-0.5 rounded bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 600 }}>{budgetLabel}/mo</span>
          <span className="px-2 py-0.5 rounded bg-[#1B2D45]/[0.04] text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 600 }}>{request.profile.moveIn}</span>
          {tags.map((t) => <span key={t} className="px-2 py-0.5 rounded bg-[#FF6B35]/[0.06] text-[#FF6B35]/60" style={{ fontSize: "9px", fontWeight: 500 }}>{t}</span>)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={onAccept} className="flex-1 py-2 rounded-lg bg-[#4ADE80] text-white hover:bg-[#3cc46f] transition-all flex items-center justify-center gap-1.5" style={{ fontSize: "12px", fontWeight: 700 }}>
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
          <button onClick={onReject} className="flex-1 py-2 rounded-lg border border-black/[0.06] text-[#1B2D45]/40 hover:text-[#E71D36] hover:border-[#E71D36]/20 transition-all flex items-center justify-center gap-1.5" style={{ fontSize: "12px", fontWeight: 600 }}>
            <X className="w-3.5 h-3.5" /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, isOwner, onRemove }: { member: LifestyleProfile; isOwner: boolean; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-black/[0.04]">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF6B35" }}>{member.firstName[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>{member.firstName} {member.initial}</span>
          {isOwner && <span className="px-1.5 py-0.5 rounded bg-[#FFB627]/10 text-[#FFB627]" style={{ fontSize: "8px", fontWeight: 700 }}>Owner</span>}
        </div>
        <span className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>{member.year} · {member.program}</span>
      </div>
      {onRemove && !isOwner && (
        <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/15 hover:text-[#E71D36] hover:bg-[#E71D36]/[0.04] transition-all" title="Remove member">
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Main Page ── */

export default function ManageGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<RoommateGroup | null | undefined>(undefined);
  const [tab, setTab] = useState<"requests" | "members" | "settings">("requests");
  const [requests, setRequests] = useState(MOCK_REQUESTS.filter((r) => r.groupId === id || id === "g1"));
  const [copied, setCopied] = useState(false);
  const [landlordCopied, setLandlordCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVisible, setEditVisible] = useState(true);

  useEffect(() => {
    // TODO: GET /api/groups/{id} — for now use mock + stored local groups
    setGroup(getRoommateGroupById(id) ?? null);
  }, [id]);

  useEffect(() => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description);
    setEditVisible(group.isVisible);
  }, [group]);

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
          <Link href="/roommates" className="inline-block mt-3 text-[#FF6B35]" style={{ fontSize: "13px", fontWeight: 600 }}>← Back to Roommates</Link>
        </div>
      </div>
    );
  }

  const isOwner = Boolean(user) && (
    group.createdBy === `user:${user?.id}` ||
    group.createdBy === `${user?.id}-member-1`
  );

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="max-w-[420px] text-center">
          <AlertCircle className="w-10 h-10 text-[#FFB627] mx-auto mb-3" />
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>Only the group owner can manage this post</h2>
          <p className="text-[#1B2D45]/35 mt-2" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            Log into the account that created the group, or go back to the public page.
          </p>
          <Link href={`/roommates/groups/${id}`} className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#FF6B35] text-white" style={{ fontSize: "13px", fontWeight: 600 }}>
            Back to Group
          </Link>
        </div>
      </div>
    );
  }

  const filled = group.groupSize - group.spotsNeeded;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/roommates/groups/join/${group.inviteCode}` : "";
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const handleCopy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleLandlordCopy = () => {
    if (!group.housing?.landlordInviteUrl) return;
    navigator.clipboard.writeText(group.housing.landlordInviteUrl);
    setLandlordCopied(true);
    setTimeout(() => setLandlordCopied(false), 2000);
  };

  const handleAccept = (reqId: string) => {
    // TODO: POST /api/groups/{id}/requests/{reqId}/accept
    setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "accepted" as const } : r));
  };

  const handleReject = (reqId: string) => {
    // TODO: POST /api/groups/{id}/requests/{reqId}/reject
    setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "rejected" as const } : r));
  };

  const handleRemoveMember = (memberId: string) => {
    // TODO: DELETE /api/groups/{id}/members/{userId}
  };

  const handleSaveEdit = () => {
    const nextGroup: RoommateGroup = {
      ...group,
      name: editName.trim() || group.name,
      description: editDesc.trim() || group.description,
      isVisible: editVisible,
    };

    upsertStoredRoommateGroup(nextGroup);
    setGroup(nextGroup);
    setEditing(false);
  };

  const handleDelete = () => {
    const deleted = removeStoredRoommateGroup(group.id);
    if (deleted) {
      router.push("/roommates");
      return;
    }

    setShowDelete(false);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const resolvedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[640px] mx-auto px-4 py-6 md:py-8">
        {/* Back */}
        <Link href={`/roommates/groups/${id}`} className="inline-flex items-center gap-1 text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors mb-5" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ChevronLeft className="w-4 h-4" /> Back to group
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 900 }}>{group.name}</h1>
            <p className="text-[#1B2D45]/35 mt-0.5" style={{ fontSize: "12px" }}>{filled}/{group.groupSize} members · {group.spotsNeeded} spots open</p>
          </div>
          <Link href={`/roommates/groups/${id}`} className="px-3 py-1.5 rounded-lg border border-black/[0.06] text-[#1B2D45]/40 hover:text-[#1B2D45] transition-all flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 600 }}>
            <Eye className="w-3 h-3" /> View public page
          </Link>
        </div>

        {/* Invite link bar */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-black/[0.04] px-3 py-2.5 mb-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
          <Link2 className="w-3.5 h-3.5 text-[#1B2D45]/20 shrink-0" />
          <span className="text-[#1B2D45]/40 truncate flex-1" style={{ fontSize: "11px" }}>Student invite: {shareUrl || `cribb.ca/join/${group.inviteCode}`}</span>
          <button onClick={handleCopy} className="px-3 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all flex items-center gap-1 shrink-0" style={{ fontSize: "10px", fontWeight: 600 }}>
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>

        {group.housing?.status === "pending" && group.housing.landlordInviteUrl && (
          <div className="flex items-center gap-2 bg-white rounded-xl border border-[#2EC4B6]/10 px-3 py-2.5 mb-5" style={{ boxShadow: "0 1px 4px rgba(46,196,182,0.03)" }}>
            <Link2 className="w-3.5 h-3.5 text-[#2EC4B6]/40 shrink-0" />
            <span className="text-[#2EC4B6]/70 truncate flex-1" style={{ fontSize: "11px" }}>Landlord verify: {group.housing.landlordInviteUrl}</span>
            <button onClick={handleLandlordCopy} className="px-3 py-1.5 rounded-lg bg-[#2EC4B6] text-white hover:bg-[#28b0a3] transition-all flex items-center gap-1 shrink-0" style={{ fontSize: "10px", fontWeight: 600 }}>
              {landlordCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-black/[0.04] p-1 mb-5 w-fit">
          <button onClick={() => setTab("requests")} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${tab === "requests" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <UserPlus className="w-3 h-3" /> Requests
            {pendingCount > 0 && <span className={`w-4 h-4 rounded-full flex items-center justify-center ${tab === "requests" ? "bg-white/20 text-white" : "bg-[#E71D36] text-white"}`} style={{ fontSize: "9px", fontWeight: 700 }}>{pendingCount}</span>}
          </button>
          <button onClick={() => setTab("members")} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${tab === "members" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <Users className="w-3 h-3" /> Members
          </button>
          <button onClick={() => setTab("settings")} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${tab === "settings" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]"}`} style={{ fontSize: "11px", fontWeight: 600 }}>
            <Settings className="w-3 h-3" /> Settings
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* ── Requests Tab ── */}
          {tab === "requests" && (
            <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-black/[0.06] p-8 text-center">
                  <UserPlus className="w-8 h-8 text-[#1B2D45]/10 mx-auto mb-2" />
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>No pending requests</h3>
                  <p className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "12px" }}>Share your group link to get people requesting to join.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>PENDING ({pendingRequests.length})</h3>
                  {pendingRequests.map((req) => (
                    <RequestCard key={req.id} request={req} onAccept={() => handleAccept(req.id)} onReject={() => handleReject(req.id)} />
                  ))}
                </div>
              )}

              {resolvedRequests.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[#1B2D45]/25 mb-2" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>RESOLVED ({resolvedRequests.length})</h3>
                  <div className="space-y-2">
                    {resolvedRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/50 border border-black/[0.02]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B35]/10 to-[#FFB627]/10 flex items-center justify-center shrink-0">
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#FF6B35" }}>{req.profile.firstName[0]}</span>
                        </div>
                        <span className="text-[#1B2D45]/40 flex-1" style={{ fontSize: "12px" }}>{req.profile.firstName} {req.profile.initial}</span>
                        <span className={`px-2 py-0.5 rounded ${req.status === "accepted" ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#1B2D45]/[0.04] text-[#1B2D45]/25"}`} style={{ fontSize: "9px", fontWeight: 700 }}>{req.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Members Tab ── */}
          {tab === "members" && (
            <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="space-y-2">
                {group.members.map((m, i) => (
                  <MemberRow key={m.id} member={m} isOwner={i === 0} onRemove={() => handleRemoveMember(m.id)} />
                ))}
                {Array.from({ length: group.spotsNeeded }, (_, i) => (
                  <div key={`spot-${i}`} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-black/[0.06] text-[#1B2D45]/15" style={{ fontSize: "11px", fontWeight: 500 }}>
                    <Users className="w-3.5 h-3.5" /> Open spot
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Settings Tab ── */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              {/* Edit group info */}
              <div className="bg-white rounded-xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "14px", fontWeight: 700 }}>Group Info</h3>
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "10px", fontWeight: 600 }}>Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#FAF8F4] border border-black/[0.04] focus:border-[#FF6B35]/20 focus:outline-none" style={{ fontSize: "13px" }} />
                    </div>
                    <div>
                      <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "10px", fontWeight: 600 }}>Description</label>
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#FAF8F4] border border-black/[0.04] focus:border-[#FF6B35]/20 focus:outline-none resize-none" style={{ fontSize: "13px", minHeight: 80 }} />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04]" style={{ fontSize: "11px", fontWeight: 600 }}>Cancel</button>
                      <button onClick={handleSaveEdit} className="px-4 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all" style={{ fontSize: "11px", fontWeight: 700 }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[#1B2D45]/50 mb-2" style={{ fontSize: "12px", lineHeight: 1.5 }}>{group.description}</p>
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[#FF6B35] hover:underline" style={{ fontSize: "11px", fontWeight: 600 }}>
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div className="bg-white rounded-xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "14px", fontWeight: 700 }}>Visibility</h3>
                <div className="space-y-2">
                  <button onClick={() => setEditVisible(true)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${editVisible ? "border-[#FF6B35]/20 bg-[#FF6B35]/[0.04]" : "border-black/[0.04]"}`}>
                    <div style={{ fontSize: "12px", fontWeight: editVisible ? 600 : 400, color: editVisible ? "#FF6B35" : "#1B2D45" }}>Public</div>
                    <div className="text-[#1B2D45]/25" style={{ fontSize: "10px" }}>Anyone can discover your group</div>
                  </button>
                  <button onClick={() => setEditVisible(false)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${!editVisible ? "border-[#FF6B35]/20 bg-[#FF6B35]/[0.04]" : "border-black/[0.04]"}`}>
                    <div style={{ fontSize: "12px", fontWeight: !editVisible ? 600 : 400, color: !editVisible ? "#FF6B35" : "#1B2D45" }}>Invite only</div>
                    <div className="text-[#1B2D45]/25" style={{ fontSize: "10px" }}>Only people with the link can find you</div>
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-xl border border-[#E71D36]/10 p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                <h3 className="text-[#E71D36]/70 mb-2" style={{ fontSize: "14px", fontWeight: 700 }}>Danger Zone</h3>
                {showDelete ? (
                  <div>
                    <p className="text-[#1B2D45]/40 mb-3" style={{ fontSize: "12px" }}>This will permanently delete the group and remove all members. This cannot be undone.</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowDelete(false)} className="px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04]" style={{ fontSize: "11px", fontWeight: 600 }}>Cancel</button>
                      <button onClick={handleDelete} className="px-4 py-1.5 rounded-lg bg-[#E71D36] text-white hover:bg-[#c91830] transition-all" style={{ fontSize: "11px", fontWeight: 700 }}>Yes, Delete Group</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDelete(true)} className="flex items-center gap-1.5 text-[#E71D36]/50 hover:text-[#E71D36] transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Group
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
