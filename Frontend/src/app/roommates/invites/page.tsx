"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Mail, Check, X, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { InviteResponse } from "@/types";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function InvitesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<InviteResponse[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.roommates.getReceivedInvites();
      setInvites(data);
    } catch {
      setInvites([]);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    load();
  }, [user, router, load]);

  const handleAccept = async (invite: InviteResponse) => {
    setBusyId(invite.id);
    try {
      await api.roommates.acceptInvite(invite.id);
      toast.success(`Joined ${invite.group_name}`);
      router.push(`/roommates/groups/${invite.group_id}`);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Couldn't accept invite";
      toast.error(msg);
      setBusyId(null);
    }
  };

  const handleDecline = async (invite: InviteResponse) => {
    setBusyId(invite.id);
    try {
      await api.roommates.declineInvite(invite.id);
      setInvites((prev) => (prev || []).filter((i) => i.id !== invite.id));
      toast.success("Invite declined");
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Couldn't decline invite";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const pending = (invites || []).filter((i) => i.status === "pending");
  const past = (invites || []).filter((i) => i.status !== "pending");

  if (invites === null) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[720px] mx-auto px-4 py-6 md:py-10">
        <Link
          href="/roommates"
          className="inline-flex items-center gap-1 text-[#1B2D45]/45 hover:text-[#1B2D45] transition-colors mb-4"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to roommates
        </Link>

        <div className="mb-6">
          <h1 className="text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900 }}>
            Group invites
          </h1>
          <p className="text-[#1B2D45]/45 mt-1" style={{ fontSize: "13px" }}>
            People who want you to join their group. Accepting puts you in the group; declining hides the invite.
          </p>
        </div>

        {pending.length === 0 && past.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-10 text-center"
            style={{ border: "2.5px dashed rgba(27,45,69,0.12)" }}
          >
            <Mail className="w-10 h-10 text-[#1B2D45]/15 mx-auto mb-3" />
            <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
              No invites yet
            </h3>
            <p className="text-[#1B2D45]/50 mt-1" style={{ fontSize: "12px" }}>
              When someone invites you to their group, it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((invite, idx) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-5"
                style={{ boxShadow: "0 12px 28px rgba(15,23,42,0.04)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      href={`/roommates/groups/${invite.group_id}`}
                      className="inline-flex items-center gap-1.5 text-[#1B2D45] hover:text-[#FF6B35] transition-colors"
                      style={{ fontSize: "16px", fontWeight: 800 }}
                    >
                      <Users className="w-4 h-4 text-[#FF6B35]" />
                      {invite.group_name}
                    </Link>
                    <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "12px" }}>
                      Invite from someone in this group
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[#1B2D45]/30 shrink-0" style={{ fontSize: "11px" }}>
                    <Clock className="w-3 h-3" />
                    {formatRelative(invite.created_at)}
                  </div>
                </div>

                {invite.message && (
                  <div className="rounded-xl bg-[#FAF8F4] px-3 py-2.5 mb-3">
                    <p className="text-[#1B2D45]/70" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                      &ldquo;{invite.message}&rdquo;
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={busyId === invite.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all disabled:opacity-60"
                    style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.24)" }}
                  >
                    {busyId === invite.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Accept &amp; join
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDecline(invite)}
                    disabled={busyId === invite.id}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:border-[#1B2D45]/18 hover:text-[#1B2D45] transition-all disabled:opacity-50"
                    style={{ fontSize: "12px", fontWeight: 700 }}
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                  <Link
                    href={`/roommates/groups/${invite.group_id}`}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-[#1B2D45]/55 hover:text-[#1B2D45] transition-colors border border-black/[0.06] bg-[#FCFAF7]"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    View group
                  </Link>
                </div>
              </motion.div>
            ))}

            {past.length > 0 && (
              <div className="pt-6">
                <h2 className="text-[#1B2D45]/40 mb-2" style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Past invites
                </h2>
                <div className="space-y-2">
                  {past.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white border border-black/[0.05] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[#1B2D45]/65 truncate" style={{ fontSize: "13px", fontWeight: 600 }}>
                          {invite.group_name}
                        </p>
                        <p className="text-[#1B2D45]/35" style={{ fontSize: "11px" }}>
                          {invite.status === "accepted"
                            ? "You joined"
                            : invite.status === "declined"
                            ? "You declined"
                            : "Expired"}{" "}
                          · {formatRelative(invite.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          invite.status === "accepted"
                            ? "bg-[#4ADE80]/10 text-[#4ADE80]"
                            : "bg-[#1B2D45]/[0.06] text-[#1B2D45]/45"
                        }`}
                        style={{ fontSize: "10px", fontWeight: 700, textTransform: "capitalize" }}
                      >
                        {invite.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
