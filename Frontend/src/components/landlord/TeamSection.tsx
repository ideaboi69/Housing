"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Trash2, ShieldCheck, Building2, Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { OrgResponse, OrgInvite } from "@/types";

export function TeamSection() {
  const myId = useAuthStore((s) => s.user?.id);
  const [org, setOrg] = useState<OrgResponse | null>(null);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.landlords.getOrg();
      setOrg(data);
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isOwner = !!org && org.members.find((m) => m.id === myId)?.org_role === "owner";

  // Owners can see pending invites.
  useEffect(() => {
    if (org && isOwner) {
      api.landlords.listOrgInvites().then(setInvites).catch(() => {});
    }
  }, [org, isOwner]);

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    setBusy(true);
    try {
      const created = await api.landlords.createOrg(orgName.trim());
      setOrg(created);
      setOrgName("");
      toast.success("Team created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create team");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setBusy(true);
    try {
      await api.landlords.inviteOrgMember(inviteEmail.trim());
      setInviteEmail("");
      const fresh = await api.landlords.listOrgInvites();
      setInvites(fresh);
      toast.success("Invitation sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send invite");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    setBusy(true);
    try {
      await api.landlords.cancelOrgInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invite cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't cancel invite");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (landlordId: number) => {
    setBusy(true);
    try {
      await api.landlords.removeOrgMember(landlordId);
      setOrg((prev) => (prev ? { ...prev, members: prev.members.filter((m) => m.id !== landlordId) } : prev));
      toast.success("Agent removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove agent");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#1B2D45]/[0.08] bg-white p-5">
        <div className="flex items-center gap-2 text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading team…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1B2D45]/[0.08] bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-[#1B2D45]" />
        <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Team</h3>
      </div>
      <p className="text-[#1B2D45]/50 mb-4" style={{ fontSize: "12px", lineHeight: 1.55 }}>
        For property-management companies — add agents so your whole team shares one inbox and can reply to any tenant inquiry.
      </p>

      {!org ? (
        /* No team yet — create one */
        <div className="rounded-lg bg-[#1B2D45]/[0.03] border border-[#1B2D45]/[0.06] p-4">
          <label className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>Company / team name</label>
          <div className="flex gap-2 mt-1.5">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Primax Realtor"
              className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#1B2D45]/[0.12] focus:border-[#1B2D45]/40 focus:outline-none transition-colors"
              style={{ fontSize: "13px" }}
            />
            <button
              onClick={handleCreate}
              disabled={busy || !orgName.trim()}
              className="px-4 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#16243a] disabled:opacity-50 transition-colors whitespace-nowrap"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              Create team
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Team header */}
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[#1B2D45]/[0.06]">
            <div className="w-9 h-9 rounded-lg bg-[#1B2D45]/[0.06] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#1B2D45]" />
            </div>
            <div>
              <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{org.name}</p>
              <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>
                {org.members.length} {org.members.length === 1 ? "member" : "members"} · shared inbox
              </p>
            </div>
          </div>

          {/* Members */}
          <div className="space-y-1.5">
            {org.members.map((m) => {
              const isOwnerRow = m.org_role === "owner";
              return (
                <div key={m.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#1B2D45]/[0.02]">
                  <div className="w-8 h-8 rounded-full bg-[#1B2D45]/[0.06] flex items-center justify-center shrink-0 text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                    {(m.first_name[0] ?? "") + (m.last_name[0] ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: 600 }}>
                        {m.first_name} {m.last_name}{m.id === myId ? " (you)" : ""}
                      </p>
                      {m.identity_verified && <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />}
                    </div>
                    <p className="text-[#1B2D45]/40 truncate" style={{ fontSize: "11px" }}>{m.email}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full shrink-0 ${isOwnerRow ? "bg-[#1B2D45] text-white" : "bg-[#1B2D45]/[0.06] text-[#1B2D45]/60"}`}
                    style={{ fontSize: "10px", fontWeight: 700 }}
                  >
                    {isOwnerRow ? "Owner" : "Agent"}
                  </span>
                  {isOwner && !isOwnerRow && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={busy}
                      aria-label={`Remove ${m.first_name}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:text-[#E71D36] hover:bg-[#E71D36]/[0.06] transition-colors shrink-0 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pending invites (owner only) */}
          {isOwner && invites.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1B2D45]/[0.06]">
              <p className="text-[#1B2D45]/40 mb-2" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>
                PENDING INVITES
              </p>
              <div className="space-y-1.5">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-[#1B2D45]/[0.02]">
                    <Mail className="w-3.5 h-3.5 text-[#1B2D45]/30 shrink-0" />
                    <p className="text-[#1B2D45]/70 truncate flex-1" style={{ fontSize: "12px" }}>{inv.email}</p>
                    <span className="text-[#FFB627] bg-[#FFB627]/10 px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: "10px", fontWeight: 700 }}>Invited</span>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      disabled={busy}
                      aria-label="Cancel invite"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#1B2D45]/30 hover:text-[#E71D36] hover:bg-[#E71D36]/[0.06] transition-colors shrink-0 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite agent (owner only) */}
          {isOwner && (
            <div className="mt-4 pt-4 border-t border-[#1B2D45]/[0.06]">
              <label className="flex items-center gap-1.5 text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
                <UserPlus className="w-3.5 h-3.5" /> Invite an agent
              </label>
              <div className="flex gap-2 mt-1.5">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  type="email"
                  placeholder="agent@company.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#1B2D45]/[0.12] focus:border-[#1B2D45]/40 focus:outline-none transition-colors"
                  style={{ fontSize: "13px" }}
                />
                <button
                  onClick={handleInvite}
                  disabled={busy || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#16243a] disabled:opacity-50 transition-colors whitespace-nowrap"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  Send invite
                </button>
              </div>
              <p className="text-[#1B2D45]/35 mt-1.5" style={{ fontSize: "11px" }}>
                We&apos;ll email them a link to join — they can create a cribb landlord account if they don&apos;t have one yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
