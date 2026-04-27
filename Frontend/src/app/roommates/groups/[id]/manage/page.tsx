"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Users, Copy, Check, Link2, Pencil, Trash2,
  X, UserPlus, UserMinus, Shield, MessageCircle, Clock,
  AlertCircle, Settings, Eye, Camera,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import {
  type LifestyleProfile, type RoommateGroup, type GroupRequest,
  TAG_SHORT_LABELS, MOCK_PROFILES, getRoommateGroupById, removeStoredRoommateGroup, upsertStoredRoommateGroup,
  MOVE_IN_OPTIONS, GENDER_HOUSING_OPTIONS,
} from "@/components/roommates/roommate-data";
import type { RoommateRequestResponse } from "@/types";
import { PhotoCropper } from "@/components/PhotoCropper";
/* ── Components ── */

function ApiRequestCard({
  request, onAccept, onReject,
}: { request: RoommateRequestResponse; onAccept: () => void; onReject: () => void }) {
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const handleAccept = async () => { setBusy("accept"); try { await onAccept(); } finally { setBusy(null); } };
  const handleReject = async () => { setBusy("reject"); try { await onReject(); } finally { setBusy(null); } };
  const scoreColor = request.compatibility_score >= 80 ? "#4ADE80" : request.compatibility_score >= 60 ? "#FFB627" : "#FF6B35";

  return (
    <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0">
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#FF6B35" }}>{request.user_name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{request.user_name}</h4>
            <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>{new Date(request.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
          <span className="rounded-md px-2 py-0.5 shrink-0" style={{ fontSize: "10px", fontWeight: 700, color: scoreColor, background: `${scoreColor}14` }}>
            {request.compatibility_score}% match
          </span>
        </div>

        {request.message && (
          <div className="bg-[#FAF8F4] rounded-lg px-3 py-2.5 mb-3">
            <p className="text-[#1B2D45]/60" style={{ fontSize: "12px", lineHeight: 1.5 }}>{request.message}</p>
          </div>
        )}

        {request.lifestyle_tags && request.lifestyle_tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {Array.from(new Set(request.lifestyle_tags)).slice(0, 5).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-[#FF6B35]/[0.06] text-[#FF6B35]/60" style={{ fontSize: "9px", fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={handleAccept} disabled={!!busy} className="flex-1 py-2 rounded-lg bg-[#4ADE80] text-white hover:bg-[#3cc46f] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50" style={{ fontSize: "12px", fontWeight: 700 }}>
            <Check className="w-3.5 h-3.5" /> {busy === "accept" ? "Accepting..." : "Accept"}
          </button>
          <button onClick={handleReject} disabled={!!busy} className="flex-1 py-2 rounded-lg border border-black/[0.06] text-[#1B2D45]/40 hover:text-[#E71D36] hover:border-[#E71D36]/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50" style={{ fontSize: "12px", fontWeight: 600 }}>
            <X className="w-3.5 h-3.5" /> {busy === "reject" ? "..." : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, isOwner, onRemove }: { member: LifestyleProfile; isOwner: boolean; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-black/[0.04]">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center shrink-0 overflow-hidden">
        {member.avatar ? (
          <img src={member.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF6B35" }}>{member.firstName[0]}</span>
        )}
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
  const [ownerUserId, setOwnerUserId] = useState<number | null>(null);
  const [tab, setTab] = useState<"requests" | "members" | "settings">("requests");
  const [requests, setRequests] = useState<RoommateRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [landlordCopied, setLandlordCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVisible, setEditVisible] = useState(true);
  const [editGroupImage, setEditGroupImage] = useState<string | null>(null);
  const [editGroupFile, setEditGroupFile] = useState<File | null>(null);
  const [pendingGroupPhotoFile, setPendingGroupPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchGroup() {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        try {
          const apiGroup = await api.roommates.getGroup(numId);
          setOwnerUserId(apiGroup.owner_id);
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
              avatar: m.profile_photo_url || undefined,
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
            isVisible: apiGroup.is_visible,
            genderPreference: apiGroup.gender_preference || null,
            moveIn: apiGroup.move_in_timing || "",
            createdAt: apiGroup.created_at,
            housing: apiGroup.has_place ? {
              status: apiGroup.is_verified ? "linked" : "pending",
              selfReportedAddress: apiGroup.address || undefined,
              selfReportedRent: Number(apiGroup.rent_per_person) || undefined,
              selfReportedUtilitiesIncluded: apiGroup.utilities_included,
            } : undefined,
            groupImage: apiGroup.group_photo_url || undefined,
          } as RoommateGroup);
          return;
        } catch { /* fall through to mock */ }
      }
      setGroup(getRoommateGroupById(id) ?? null);
    }
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description);
    setEditVisible(group.isVisible);
    setEditGroupImage(group.groupImage || null);
  }, [group]);

  // Compute ownership against the actual API owner id
  const userId = typeof user?.id === "number" ? user.id : Number(user?.id);
  const isOwner = !!user && ownerUserId !== null && userId === ownerUserId;

  // Load real pending requests once we know the user owns this group
  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    async function loadRequests() {
      setRequestsLoading(true);
      try {
        const reqs = await api.roommates.getReceivedRequests();
        if (!cancelled) setRequests(reqs);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }
    loadRequests();
    return () => { cancelled = true; };
  }, [isOwner]);

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
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const resolvedRequests = requests.filter((r) => r.status !== "pending");
  const pendingCount = pendingRequests.length;

  const handleCopy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleLandlordCopy = () => {
    if (!group.housing?.landlordInviteUrl) return;
    navigator.clipboard.writeText(group.housing.landlordInviteUrl);
    setLandlordCopied(true);
    setTimeout(() => setLandlordCopied(false), 2000);
  };

  const refreshGroup = async () => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    try {
      const apiGroup = await api.roommates.getGroup(numId);
      setGroup((g) => g ? {
        ...g,
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
        spotsNeeded: apiGroup.spots_remaining,
      } : g);
    } catch { /* ignore */ }
  };

  const handleAccept = async (reqId: number) => {
    try {
      await api.roommates.acceptRequest(reqId);
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "accepted" as const } : r));
      await refreshGroup();
    } catch (err) {
      console.error("Failed to accept request", err);
    }
  };

  const handleReject = async (reqId: number) => {
    try {
      await api.roommates.declineRequest(reqId);
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "declined" as const } : r));
    } catch (err) {
      console.error("Failed to decline request", err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const groupNumId = parseInt(group.id, 10);
      const memberNumId = parseInt(memberId, 10);
      if (!isNaN(groupNumId) && !isNaN(memberNumId)) {
        await api.roommates.removeMember(groupNumId, memberNumId);
        await refreshGroup();
      }
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  const handleSaveSettings = async () => {
    if (!group) return;
    setSaveStatus("saving");
    const numId = parseInt(group.id, 10);
    const trimmedName = editName.trim() || group.name;
    const trimmedDesc = editDesc.trim() || group.description;

    let persistedPhotoUrl: string | undefined = group.groupImage;

    try {
      // Save name + description via PATCH
      if (!isNaN(numId) && (trimmedName !== group.name || trimmedDesc !== group.description)) {
        await api.roommates.updateGroup(numId, {
          name: trimmedName,
          description: trimmedDesc,
        });
      }

      // Visibility lives on its own endpoint — toggle if changed
      if (!isNaN(numId) && editVisible !== group.isVisible) {
        await api.roommates.setGroupVisibility(numId, editVisible);
      }

      // Photo — three cases: new file selected, photo cleared, or unchanged
      if (!isNaN(numId)) {
        if (editGroupFile) {
          // New upload: pushes to Cloudinary via backend, returns persistent URL
          const { group_photo_url } = await api.roommates.uploadGroupPhoto(numId, editGroupFile);
          persistedPhotoUrl = group_photo_url;
          setEditGroupFile(null);
          setEditGroupImage(group_photo_url);
        } else if (!editGroupImage && group.groupImage) {
          // User removed the existing photo — delete on backend
          await api.roommates.deleteGroupPhoto(numId);
          persistedPhotoUrl = undefined;
        }
      }
    } catch (err) {
      console.error("Failed to save group", err);
      setSaveStatus("error");
      return;
    }

    const nextGroup: RoommateGroup = {
      ...group,
      name: trimmedName,
      description: trimmedDesc,
      isVisible: editVisible,
      groupImage: persistedPhotoUrl,
    };
    upsertStoredRoommateGroup(nextGroup);
    setGroup(nextGroup);
    setEditing(false);
    setSaveStatus("idle");
  };

  const handleDelete = async () => {
    try {
      const numId = parseInt(group.id, 10);
      if (!isNaN(numId)) await api.roommates.deleteGroup(numId);
    } catch { /* API failed */ }
    removeStoredRoommateGroup(group.id);
    router.push("/roommates");
  };

  const heroImage = editGroupImage || group.groupImage || group.housing?.linkedListingImage || group.housing?.selfReportedPhotos?.[0] || null;
  const saveDisabled =
    editName.trim().length < 2 ||
    editDesc.trim().length < 10 ||
    saveStatus === "saving" ||
    (
      editName.trim() === group.name &&
      editDesc.trim() === group.description &&
      editVisible === group.isVisible &&
      (editGroupImage || "") === (group.groupImage || "")
    );

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-4 py-6 md:py-8">
        {/* Back */}
        <Link href={`/roommates/groups/${id}`} className="inline-flex items-center gap-1 text-[#1B2D45]/35 hover:text-[#1B2D45] transition-colors mb-5" style={{ fontSize: "12px", fontWeight: 600 }}>
          <ChevronLeft className="w-4 h-4" /> Back to group
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="relative space-y-4 lg:sticky lg:top-24">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-6 top-14 h-32 w-32 rounded-full bg-[#FF6B35]/[0.08] blur-3xl"
              animate={{ opacity: [0.35, 0.62, 0.35], scale: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute right-4 top-[17rem] h-24 w-24 rounded-full bg-[#FFB627]/[0.08] blur-3xl"
              animate={{ opacity: [0.24, 0.5, 0.24], y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="overflow-hidden rounded-[30px] border border-black/[0.05] bg-white"
              style={{ boxShadow: "0 22px 60px rgba(15, 23, 42, 0.07)" }}
            >
              <div className="px-5 py-5 border-b border-black/[0.05] bg-[linear-gradient(135deg,#FFF4EE_0%,#FFFFFF_100%)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Group management
                    </div>
                    <h1 className="mt-2 text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900 }}>{group.name}</h1>
                    <p className="text-[#1B2D45]/42 mt-1" style={{ fontSize: "13px" }}>
                      {filled}/{group.groupSize} members filled · {group.spotsNeeded} spots open
                    </p>
                  </div>
                  <Link href={`/roommates/groups/${id}`} className="shrink-0 px-3.5 py-2 rounded-full border border-black/[0.06] text-[#1B2D45]/50 hover:text-[#1B2D45] transition-all flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 700 }}>
                    <Eye className="w-3 h-3" /> View public page
                  </Link>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative h-[88px] w-[104px] shrink-0 overflow-hidden rounded-[22px] border border-black/[0.05] bg-[#FAF8F4]">
                    {heroImage ? (
                      <img src={heroImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#FF6B35]/55" style={{ background: group.bannerGradient || "linear-gradient(135deg, #FFE6DA 0%, #FFF8F2 100%)" }}>
                        <Users className="h-5 w-5" />
                      </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#1B2D45]/[0.05] px-3 py-1.5 text-[#1B2D45]/58" style={{ fontSize: "11px", fontWeight: 700 }}>
                        {group.moveIn}
                      </span>
                      <span className="rounded-full bg-[#FF6B35]/[0.08] px-3 py-1.5 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>
                        Need {group.spotsNeeded}
                      </span>
                        <span className="rounded-full bg-[#1B2D45]/[0.05] px-3 py-1.5 text-[#1B2D45]/58" style={{ fontSize: "11px", fontWeight: 700 }}>
                          {group.isVisible ? "Public" : "Invite only"}
                        </span>
                      </div>
                      <p className="mt-3 text-[#1B2D45]/52" style={{ fontSize: "13px", lineHeight: 1.7 }}>
                        {group.description}
                      </p>
                      <div className="mt-4 flex items-center">
                      {group.members.slice(0, 4).map((member, index) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + index * 0.04, duration: 0.25 }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#FFE3D3_0%,#FFF7F0_100%)] text-[#FF6B35] overflow-hidden"
                            style={{ fontSize: "13px", fontWeight: 800, marginLeft: index === 0 ? 0 : -10 }}
                          >
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              member.firstName[0]
                            )}
                          </motion.div>
                        ))}
                        {group.spotsNeeded > 0 && (
                          <motion.div
                            className="ml-2 rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.08] px-3 py-1.5 text-[#FF6B35]"
                            style={{ fontSize: "11px", fontWeight: 700 }}
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
                          >
                            Need {group.spotsNeeded}
                          </motion.div>
                        )}
                      </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-black/[0.05] bg-[#FCFBF8] px-4 py-3">
                    <div className="text-[#1B2D45]/32" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Student invite
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="min-w-0 flex-1 truncate text-[#1B2D45]/50" style={{ fontSize: "12px", fontWeight: 600 }}>
                        {shareUrl || `cribb.ca/join/${group.inviteCode}`}
                      </div>
                      <button onClick={handleCopy} className="shrink-0 rounded-full bg-[#1B2D45] px-3 py-1.5 text-white transition-all hover:bg-[#152438]" style={{ fontSize: "10px", fontWeight: 700 }}>
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#2EC4B6]/12 bg-[#F5FCFB] px-4 py-3">
                    <div className="text-[#2EC4B6]" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Landlord verification
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="min-w-0 flex-1 truncate text-[#2EC4B6]/72" style={{ fontSize: "12px", fontWeight: 600 }}>
                        {group.housing?.landlordInviteUrl || "Generated when landlord verification is needed."}
                      </div>
                      {group.housing?.landlordInviteUrl && (
                        <button onClick={handleLandlordCopy} className="shrink-0 rounded-full bg-[#2EC4B6] px-3 py-1.5 text-white transition-all hover:bg-[#28b0a3]" style={{ fontSize: "10px", fontWeight: 700 }}>
                          {landlordCopied ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-black/[0.05] bg-[linear-gradient(180deg,#FFF8F3_0%,#FFFFFF_100%)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Group pulse
                      </div>
                      <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 800 }}>
                        Quick snapshot of what needs attention.
                      </div>
                    </div>
                    <motion.div
                      className="h-3 w-3 rounded-full bg-[#FF6B35]"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] bg-white px-3 py-3">
                      <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Requests</div>
                      <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>{pendingCount}</div>
                      <div className="text-[#1B2D45]/42 mt-1" style={{ fontSize: "11px", lineHeight: 1.55 }}>Waiting to be reviewed.</div>
                    </div>
                    <div className="rounded-[18px] bg-white px-3 py-3">
                      <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Members</div>
                      <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>{filled}</div>
                      <div className="text-[#1B2D45]/42 mt-1" style={{ fontSize: "11px", lineHeight: 1.55 }}>Already in the house.</div>
                    </div>
                    <div className="rounded-[18px] bg-white px-3 py-3">
                      <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Status</div>
                      <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>{group.housing?.status === "linked" ? "Verified" : "Pending"}</div>
                      <div className="text-[#1B2D45]/42 mt-1" style={{ fontSize: "11px", lineHeight: 1.55 }}>Home verification state.</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-black/[0.05] bg-white p-2 mb-5" style={{ boxShadow: "0 12px 30px rgba(15, 23, 42, 0.04)" }}>
              <button onClick={() => setTab("requests")} className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${tab === "requests" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/48 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04]"}`} style={{ fontSize: "12px", fontWeight: 700 }}>
                <UserPlus className="w-3.5 h-3.5" /> Requests
                {pendingCount > 0 && <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${tab === "requests" ? "bg-white/18 text-white" : "bg-[#E71D36] text-white"}`} style={{ fontSize: "9px", fontWeight: 800 }}>{pendingCount}</span>}
              </button>
              <button onClick={() => setTab("members")} className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${tab === "members" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/48 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04]"}`} style={{ fontSize: "12px", fontWeight: 700 }}>
                <Users className="w-3.5 h-3.5" /> Members
              </button>
              <button onClick={() => setTab("settings")} className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${tab === "settings" ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/48 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04]"}`} style={{ fontSize: "12px", fontWeight: 700 }}>
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
          {/* ── Requests Tab ── */}
          {tab === "requests" && (
            <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {requestsLoading ? (
                <div className="bg-white rounded-[28px] border border-dashed border-black/[0.08] p-10 text-center" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
                  <div className="w-6 h-6 border-2 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="bg-white rounded-[28px] border border-dashed border-black/[0.08] p-10 text-center" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
                  <UserPlus className="w-8 h-8 text-[#1B2D45]/10 mx-auto mb-2" />
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>No pending requests</h3>
                  <p className="text-[#1B2D45]/30 mt-1" style={{ fontSize: "12px" }}>Share your group link to get people requesting to join.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-[#1B2D45]/40" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>PENDING ({pendingRequests.length})</h3>
                  {pendingRequests.map((req) => (
                    <ApiRequestCard key={req.id} request={req} onAccept={() => handleAccept(req.id)} onReject={() => handleReject(req.id)} />
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
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#FF6B35" }}>{req.user_name[0]}</span>
                        </div>
                        <span className="text-[#1B2D45]/40 flex-1" style={{ fontSize: "12px" }}>{req.user_name}</span>
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
              <div className="space-y-2 rounded-[28px] border border-black/[0.05] bg-white p-4 sm:p-5" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
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
              <div className="bg-white rounded-[28px] border border-black/[0.05] p-5 sm:p-6" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Group settings</h3>
                  <button onClick={() => setEditing((prev) => !prev)} className="flex items-center gap-1.5 rounded-full border border-black/[0.06] px-3 py-1.5 text-[#1B2D45]/50 transition-all hover:text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>
                    <Pencil className="w-3 h-3" /> {editing ? "Lock fields" : "Edit fields"}
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                  <div className="rounded-[22px] border border-black/[0.05] bg-[#FCFBF8] p-4">
                    <div className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Group photo
                    </div>
                    <div className="mt-3 relative h-[164px] overflow-hidden rounded-[22px] border border-black/[0.05] bg-white">
                      {editGroupImage ? (
                        <>
                          <img src={editGroupImage} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setEditGroupImage(null); setEditGroupFile(null); }}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 transition-colors hover:bg-black/65"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#FF6B35]/55" style={{ background: group.bannerGradient || "linear-gradient(135deg, #FFE6DA 0%, #FFF8F2 100%)" }}>
                          <Camera className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <label className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all ${editing ? "cursor-pointer border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] text-[#FF6B35] hover:bg-[#FF6B35]/[0.09]" : "border-black/[0.05] text-[#1B2D45]/28"}`} style={{ fontSize: "12px", fontWeight: 700 }}>
                      <Camera className="h-3.5 w-3.5" />
                      {editGroupImage ? "Replace photo" : "Upload photo"}
                      {editing && (
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setPendingGroupPhotoFile(file);
                            e.currentTarget.value = "";
                          }}
                        />
                      )}
                    </label>
                    <p className="mt-2 text-[#1B2D45]/38" style={{ fontSize: "11px", lineHeight: 1.55 }}>
                      Only the group creator manages the group image. Keep it simple so it supports the card instead of overwhelming it.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[#1B2D45]/38 block mb-1.5" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Group name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={!editing}
                        className="w-full rounded-[18px] border border-black/[0.07] bg-[#FCFBF8] px-4 py-3 text-[#1B2D45] outline-none transition-all focus:border-[#FF6B35]/24 focus:bg-white disabled:cursor-not-allowed disabled:text-[#1B2D45]/55"
                        style={{ fontSize: "14px", fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label className="text-[#1B2D45]/38 block mb-1.5" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        disabled={!editing}
                        className="w-full min-h-[128px] resize-none rounded-[18px] border border-black/[0.07] bg-[#FCFBF8] px-4 py-3 text-[#1B2D45] outline-none transition-all focus:border-[#FF6B35]/24 focus:bg-white disabled:cursor-not-allowed disabled:text-[#1B2D45]/55"
                        style={{ fontSize: "13px", lineHeight: 1.65 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="bg-white rounded-[28px] border border-black/[0.05] p-5 sm:p-6" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
                <h3 className="text-[#1B2D45] mb-3" style={{ fontSize: "16px", fontWeight: 800 }}>Visibility</h3>
                <div className="space-y-2">
                  <button onClick={() => editing && setEditVisible(true)} className={`w-full text-left px-4 py-3 rounded-[18px] border transition-all ${editVisible ? "border-[#FF6B35]/20 bg-[#FF6B35]/[0.06]" : "border-black/[0.05] bg-[#FCFBF8]"} ${editing ? "hover:border-[#FF6B35]/20 hover:bg-white" : "cursor-not-allowed opacity-80"}`}>
                    <div style={{ fontSize: "12px", fontWeight: editVisible ? 600 : 400, color: editVisible ? "#FF6B35" : "#1B2D45" }}>Public</div>
                    <div className="text-[#1B2D45]/25" style={{ fontSize: "10px" }}>Anyone can discover your group</div>
                  </button>
                  <button onClick={() => editing && setEditVisible(false)} className={`w-full text-left px-4 py-3 rounded-[18px] border transition-all ${!editVisible ? "border-[#FF6B35]/20 bg-[#FF6B35]/[0.06]" : "border-black/[0.05] bg-[#FCFBF8]"} ${editing ? "hover:border-[#FF6B35]/20 hover:bg-white" : "cursor-not-allowed opacity-80"}`}>
                    <div style={{ fontSize: "12px", fontWeight: !editVisible ? 600 : 400, color: !editVisible ? "#FF6B35" : "#1B2D45" }}>Invite only</div>
                    <div className="text-[#1B2D45]/25" style={{ fontSize: "10px" }}>Only people with the link can find you</div>
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-[#FCFBF8] px-4 py-3">
                  <div className="text-[#1B2D45]/38" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                    {saveStatus === "error" ? <span className="text-[#E71D36]">Save failed — try again.</span> : editing ? "Review your edits, then save to update the live group." : "Use Edit fields first if you want to change the group photo, text, or visibility."}
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={!editing || saveDisabled}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-white transition-all ${!editing || saveDisabled ? "bg-[#1B2D45]/12 cursor-not-allowed" : "bg-[#FF6B35] hover:bg-[#e55e2e]"}`}
                    style={{ fontSize: "12px", fontWeight: 700, boxShadow: !editing || saveDisabled ? "none" : "0 10px 26px rgba(255,107,53,0.22)" }}
                  >
                    {saveStatus === "saving" ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-[28px] border border-[#E71D36]/10 p-5 sm:p-6" style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.04)" }}>
                <h3 className="text-[#E71D36]/70 mb-2" style={{ fontSize: "15px", fontWeight: 800 }}>Danger Zone</h3>
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
      </div>

      {pendingGroupPhotoFile && (
        <PhotoCropper
          file={pendingGroupPhotoFile}
          onCancel={() => setPendingGroupPhotoFile(null)}
          onConfirm={(croppedFile) => {
            setPendingGroupPhotoFile(null);
            setEditGroupFile(croppedFile);
            const reader = new FileReader();
            reader.onload = (ev) => setEditGroupImage(ev.target?.result as string);
            reader.readAsDataURL(croppedFile);
          }}
        />
      )}
    </div>
  );
}
