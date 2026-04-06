"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Home, Flag, PenLine, FileText,
  Shield, ShieldCheck, ShieldX, Trash2, Check, X, Search,
  LogOut, ChevronDown, Eye, Ban, UserCheck, UserX, Loader2,
  Mail, Calendar, TrendingUp, AlertCircle, CheckCircle2, Star,
  UsersRound, ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import type {
  AdminStatsResponse, AdminUserResponse, AdminLandlordResponse,
  AdminListingResponse, AdminFlagResponse, WriterResponse, PostListResponse,
  MarketplaceItemListResponse, GroupCardResponse,
} from "@/types";

/* ════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════ */

type Tab = "overview" | "users" | "landlords" | "listings" | "flags" | "writers" | "posts" | "groups" | "marketplace";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cribb_admin_token");
}

function getAdminProfile(): { id: number; email: string; first_name: string; last_name: string } | null {
  try {
    const raw = localStorage.getItem("cribb_admin_profile");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ════════════════════════════════════════════════════════
   Sidebar
   ════════════════════════════════════════════════════════ */

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "landlords", label: "Landlords", icon: Building2 },
  { key: "listings", label: "Listings", icon: Home },
  { key: "flags", label: "Flags", icon: Flag },
  { key: "writers", label: "Writers", icon: PenLine },
  { key: "posts", label: "Posts", icon: FileText },
  { key: "groups", label: "Groups", icon: UsersRound },
  { key: "marketplace", label: "Market", icon: ShoppingBag },
];

function Sidebar({ active, onChange, flagCount, onLogout, adminName }: {
  active: Tab; onChange: (t: Tab) => void; flagCount: number; onLogout: () => void; adminName: string;
}) {
  return (
    <nav className="w-[220px] shrink-0 hidden md:flex flex-col h-screen sticky top-0 bg-[#0F1923] border-r border-white/[0.06]">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#FF6B35]" />
          <span className="text-white" style={{ fontSize: "16px", fontWeight: 800 }}>cribb <span className="text-[#FF6B35]">admin</span></span>
        </div>
      </div>

      <div className="flex-1 py-3 px-3 space-y-0.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                isActive ? "bg-[#FF6B35]/10 text-[#FF6B35]" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
              style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500 }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.key === "flags" && flagCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-[#E71D36] text-white" style={{ fontSize: "9px", fontWeight: 700, minWidth: 18, textAlign: "center" }}>
                  {flagCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#FF6B35]/15 flex items-center justify-center">
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#FF6B35" }}>{adminName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/70 truncate" style={{ fontSize: "12px", fontWeight: 600 }}>{adminName}</div>
            <div className="text-white/25" style={{ fontSize: "10px" }}>Admin</div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/25 hover:text-[#E71D36] hover:bg-[#E71D36]/[0.06] transition-all" style={{ fontSize: "12px", fontWeight: 500 }}>
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════
   Stat Card
   ════════════════════════════════════════════════════════ */

function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: number | string; icon: typeof Users; color: string; trend?: string;
}) {
  return (
    <div className="bg-[#1B2D45] rounded-2xl border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[#4ADE80]" style={{ fontSize: "11px", fontWeight: 600 }}>
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="text-white" style={{ fontSize: "28px", fontWeight: 800 }}>{value}</div>
      <div className="text-white/30 mt-0.5" style={{ fontSize: "11px", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Table Components
   ════════════════════════════════════════════════════════ */

function TableHeader({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 text-white/25 px-4 py-2" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</div>;
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:border-[#FF6B35]/30 focus:outline-none transition-all"
        style={{ fontSize: "13px" }}
      />
    </div>
  );
}

function ActionButton({ onClick, icon: Icon, label, color = "#FF6B35", danger = false, loading = false }: {
  onClick: () => void; icon: typeof Check; label: string; color?: string; danger?: boolean; loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
        danger
          ? "text-[#E71D36]/60 hover:bg-[#E71D36]/10 hover:text-[#E71D36]"
          : "hover:bg-white/[0.06]"
      }`}
      style={{ fontSize: "11px", fontWeight: 600, color: danger ? undefined : color }}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}25` }}>
      {label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════
   Overview Tab
   ════════════════════════════════════════════════════════ */

function OverviewTab({ stats }: { stats: AdminStatsResponse | null }) {
  if (!stats) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-white mb-5" style={{ fontSize: "20px", fontWeight: 800 }}>Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Students" value={stats.total_users} icon={Users} color="#4ADE80" />
        <StatCard label="Total Landlords" value={stats.total_landlords} icon={Building2} color="#2EC4B6" />
        <StatCard label="Properties" value={stats.total_properties} icon={Home} color="#FFB627" />
        <StatCard label="Active Listings" value={stats.total_listings} icon={FileText} color="#FF6B35" />
        <StatCard label="Reviews" value={stats.total_reviews} icon={CheckCircle2} color="#A78BFA" />
        <StatCard label="Pending Flags" value={stats.total_flags_pending} icon={Flag} color={stats.total_flags_pending > 0 ? "#E71D36" : "#4ADE80"} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Users Tab
   ════════════════════════════════════════════════════════ */

function UsersTab({ users, onRefresh }: { users: AdminUserResponse[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleVerify = async (id: number) => {
    try { await api.admin.verifyUser(id); toast.success("User verified"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try { await api.admin.deleteUser(id); toast.success("User deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleGrantWrite = async (id: number) => {
    try { await api.admin.grantWrite(id); toast.success("Write access granted"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleRejectWrite = async (id: number) => {
    try { await api.admin.rejectWrite(id); toast.success("Write request rejected"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleRevokeWrite = async (id: number) => {
    try { await api.admin.revokeWrite(id); toast.success("Write access revoked"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleGrantOG = async (id: number) => {
    try { await api.admin.grantOG(id); toast.success("OG badge granted"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleRevokeOG = async (id: number) => {
    try { await api.admin.revokeOG(id); toast.success("OG badge revoked"); onRefresh(); } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white" style={{ fontSize: "20px", fontWeight: 800 }}>Students ({users.length})</h2>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." />
      <div className="space-y-1">
        {filtered.map((u) => (
          <div key={u.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>{u.first_name[0]}{u.last_name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                {u.first_name} {u.last_name}
                {u.email_verified && <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />}
                {u.is_early_adopter && <span className="px-1.5 py-0.5 rounded text-white flex items-center gap-0.5" style={{ fontSize: "8px", fontWeight: 800, background: "linear-gradient(135deg, #3B82F6, #2563EB)", boxShadow: "0 1px 4px rgba(37,99,235,0.3)" }}>
                  <Star className="w-2 h-2" fill="white" /> OG
                </span>}
                {u.is_writable && <Badge label="Writer" color="#A78BFA" />}
                {u.write_access_requested && !u.is_writable && <Badge label="Write Requested" color="#FFB627" />}
              </div>
              <div className="text-white/30" style={{ fontSize: "11px" }}>{u.email} · {timeAgo(u.created_at)}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!u.email_verified && <ActionButton onClick={() => handleVerify(u.id)} icon={ShieldCheck} label="Verify" color="#4ADE80" />}
              {!u.is_early_adopter ? (
                <ActionButton onClick={() => handleGrantOG(u.id)} icon={Star} label="Grant OG" color="#3B82F6" />
              ) : (
                <ActionButton onClick={() => handleRevokeOG(u.id)} icon={Star} label="Revoke OG" color="#98A3B0" />
              )}
              {u.write_access_requested && !u.is_writable && (
                <>
                  <ActionButton onClick={() => handleGrantWrite(u.id)} icon={Check} label="Grant" color="#4ADE80" />
                  <ActionButton onClick={() => handleRejectWrite(u.id)} icon={X} label="Reject" color="#E71D36" />
                </>
              )}
              {u.is_writable && <ActionButton onClick={() => handleRevokeWrite(u.id)} icon={Ban} label="Revoke Write" color="#FFB627" />}
              <ActionButton onClick={() => handleDelete(u.id)} icon={Trash2} label="Delete" danger />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No users found</div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Landlords Tab
   ════════════════════════════════════════════════════════ */

function LandlordsTab({ landlords, onRefresh }: { landlords: AdminLandlordResponse[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = landlords.filter((l) => {
    const q = search.toLowerCase();
    return l.first_name.toLowerCase().includes(q) || l.last_name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.company_name || "").toLowerCase().includes(q);
  });

  const handleVerify = async (id: number) => {
    try { await api.admin.verifyLandlord(id); toast.success("Landlord verified"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleUnverify = async (id: number) => {
    try { await api.admin.unverifyLandlord(id); toast.success("Verification revoked"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this landlord and all their properties/listings? This cannot be undone.")) return;
    try { await api.admin.deleteLandlord(id); toast.success("Landlord deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <h2 className="text-white mb-4" style={{ fontSize: "20px", fontWeight: 800 }}>Landlords ({landlords.length})</h2>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or company..." />
      <div className="space-y-1">
        {filtered.map((l) => (
          <div key={l.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#2EC4B6]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                {l.first_name} {l.last_name}
                {l.identity_verified ? <Badge label="Verified" color="#4ADE80" /> : <Badge label="Unverified" color="#FFB627" />}
              </div>
              <div className="text-white/30" style={{ fontSize: "11px" }}>
                {l.email}{l.company_name ? ` · ${l.company_name}` : ""}{l.phone ? ` · ${l.phone}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!l.identity_verified ? (
                <ActionButton onClick={() => handleVerify(l.id)} icon={ShieldCheck} label="Verify" color="#4ADE80" />
              ) : (
                <ActionButton onClick={() => handleUnverify(l.id)} icon={ShieldX} label="Unverify" color="#FFB627" />
              )}
              <ActionButton onClick={() => handleDelete(l.id)} icon={Trash2} label="Delete" danger />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No landlords found</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Listings Tab
   ════════════════════════════════════════════════════════ */

function ListingsTab({ listings, onRefresh }: { listings: AdminListingResponse[]; onRefresh: () => void }) {
  const router = useRouter();
  
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this listing?")) return;
    try { await api.admin.deleteListing(id); toast.success("Listing deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <h2 className="text-white mb-4" style={{ fontSize: "20px", fontWeight: 800 }}>Listings ({listings.length})</h2>
      <div className="space-y-1">
        {listings.map((l) => (
          <div key={l.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                <button onClick={() => router.push(`/browse/${l.id}`)} className="hover:text-[#FF6B35] transition-colors text-left">
                  {l.property_title || `Listing #${l.id}`}
                </button>
                <Badge label={l.status} color={l.status === "active" ? "#4ADE80" : l.status === "draft" ? "#FFB627" : "#98A3B0"} />
                {l.is_sublet && <Badge label="Sublet" color="#2EC4B6" />}
              </div>
              <div className="text-white/30" style={{ fontSize: "11px" }}>
                {l.address ? `${l.address} · ` : ""}${l.rent_per_room}/room · ${l.rent_total} total · {l.lease_type} · {timeAgo(l.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ActionButton onClick={() => router.push(`/browse/${l.id}`)} icon={Eye} label="View" color="#60A5FA" />
              <ActionButton onClick={() => handleDelete(l.id)} icon={Trash2} label="Delete" danger />
            </div>
          </div>
        ))}
        {listings.length === 0 && <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No listings</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Flags Tab
   ════════════════════════════════════════════════════════ */

function FlagsTab({ flags, onRefresh }: { flags: AdminFlagResponse[]; onRefresh: () => void }) {
  const router = useRouter();
  
  const handleResolve = async (id: number) => {
    try { await api.admin.resolveFlag(id); toast.success("Flag resolved"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleDismiss = async (id: number) => {
    try { await api.admin.dismissFlag(id); toast.success("Flag dismissed"); onRefresh(); } catch { toast.error("Failed"); }
  };

 const handleViewFlagged = (f: AdminFlagResponse) => {
    if (f.listing_id) router.push(`/browse/${f.listing_id}`);
    else if (f.sublet_id) router.push(`/sublets/${f.sublet_id}`);
    else if (f.marketplace_item_id) router.push(`/marketplace/${f.marketplace_item_id}`);
  };

  const typeLabel = (f: AdminFlagResponse) => {
    if (f.listing_id) return `Listing: ${f.flagged_title || `#${f.listing_id}`}`;
    if (f.review_id) return `Review: ${f.flagged_title || `#${f.review_id}`}`;
    if (f.marketplace_item_id) return `Marketplace: ${f.flagged_title || `#${f.marketplace_item_id}`}`;
    if (f.sublet_id) return `Sublet: ${f.flagged_title || `#${f.sublet_id}`}`;
    return "Unknown";
  };

  const typeColor = (t: string) => {
    const map: Record<string, string> = { listing: "#FF6B35", review: "#A78BFA", marketplace_item: "#2EC4B6", sublet: "#FFB627" };
    return map[t] || "#98A3B0";
  };

  return (
    <div>
      <h2 className="text-white mb-4" style={{ fontSize: "20px", fontWeight: 800 }}>Pending Flags ({flags.length})</h2>
      <div className="space-y-1">
        {flags.map((f) => (
          <div key={f.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#E71D36]/10 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-[#E71D36]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                <button
                  onClick={() => handleViewFlagged(f)}
                  className="hover:text-[#FF6B35] transition-colors text-left"
                  disabled={!!f.review_id}
                >
                  {typeLabel(f)}
                </button>
                <Badge label={f.flag_type} color={typeColor(f.flag_type)} />
              </div>
              <div className="text-white/40 mt-0.5" style={{ fontSize: "11px", lineHeight: 1.5 }}>{f.reason}</div>
              <div className="text-white/20 mt-1" style={{ fontSize: "10px" }}>Reported by {f.reporter_name} · {timeAgo(f.created_at)}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ActionButton onClick={() => handleViewFlagged(f)} icon={Eye} label="View" color="#60A5FA" />
              <ActionButton onClick={() => handleResolve(f.id)} icon={Check} label="Resolve" color="#4ADE80" />
              <ActionButton onClick={() => handleDismiss(f.id)} icon={X} label="Dismiss" color="#98A3B0" />
            </div>
          </div>
        ))}
        {flags.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-[#4ADE80]/20 mx-auto mb-2" />
            <div className="text-white/30" style={{ fontSize: "13px", fontWeight: 600 }}>All clear — no pending flags</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Writers Tab
   ════════════════════════════════════════════════════════ */

function WritersTab({
  writers,
  pendingUsers,
  onRefresh,
}: {
  writers: WriterResponse[];
  pendingUsers: AdminUserResponse[];
  onRefresh: () => void;
}) {
  const handleApprove = async (id: number) => {
    try { await api.admin.approveWriter(id); toast.success("Writer approved"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleReject = async (id: number) => {
    try { await api.admin.rejectWriter(id); toast.success("Writer rejected"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleRevoke = async (id: number) => {
    try { await api.admin.revokeWriter(id); toast.success("Writer access revoked"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this writer and all their posts?")) return;
    try { await api.admin.deleteWriter(id); toast.success("Writer deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleGrantWrite = async (id: number) => {
    try { await api.admin.grantWrite(id); toast.success("Writer access granted"); onRefresh(); } catch { toast.error("Failed"); }
  };
  const handleRejectWrite = async (id: number) => {
    try { await api.admin.rejectWrite(id); toast.success("Write request rejected"); onRefresh(); } catch { toast.error("Failed"); }
  };

  const statusColor = (s: string) => s === "approved" ? "#4ADE80" : s === "pending" ? "#FFB627" : s === "rejected" ? "#E71D36" : "#98A3B0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#1B2D45] p-4">
          <div className="text-white/25" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Student Requests</div>
          <div className="mt-2 text-white" style={{ fontSize: "26px", fontWeight: 800 }}>{pendingUsers.length}</div>
          <div className="mt-1 text-white/30" style={{ fontSize: "11px" }}>Students asking for Bubble publishing access</div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#1B2D45] p-4">
          <div className="text-white/25" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Writer Accounts</div>
          <div className="mt-2 text-white" style={{ fontSize: "26px", fontWeight: 800 }}>{writers.length}</div>
          <div className="mt-1 text-white/30" style={{ fontSize: "11px" }}>Standalone writer accounts and publications</div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#1B2D45] p-4">
          <div className="text-white/25" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Pending Writer Accounts</div>
          <div className="mt-2 text-white" style={{ fontSize: "26px", fontWeight: 800 }}>{writers.filter((writer) => writer.status === "pending").length}</div>
          <div className="mt-1 text-white/30" style={{ fontSize: "11px" }}>External applications still awaiting review</div>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-white" style={{ fontSize: "20px", fontWeight: 800 }}>Student writer requests</h2>
          <p className="text-white/30 mt-1" style={{ fontSize: "12px", lineHeight: 1.55 }}>
            Existing student accounts that requested Bubble publishing privileges from inside Cribb.
          </p>
        </div>
        <div className="space-y-1">
          {pendingUsers.map((student) => (
            <div key={student.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#FF6B35]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                  {student.first_name} {student.last_name}
                  <Badge label="student request" color="#FF6B35" />
                </div>
                <div className="text-white/30" style={{ fontSize: "11px" }}>
                  {student.email} · joined {timeAgo(student.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ActionButton onClick={() => handleGrantWrite(student.id)} icon={Check} label="Grant access" color="#4ADE80" />
                <ActionButton onClick={() => handleRejectWrite(student.id)} icon={X} label="Reject" color="#E71D36" />
              </div>
            </div>
          ))}
          {pendingUsers.length === 0 && (
            <div className="text-center py-10 rounded-2xl border border-dashed border-white/[0.08] text-white/20" style={{ fontSize: "13px" }}>
              No pending student write-access requests
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-white" style={{ fontSize: "20px", fontWeight: 800 }}>Writer accounts</h2>
          <p className="text-white/30 mt-1" style={{ fontSize: "12px", lineHeight: 1.55 }}>
            Dedicated writer signups, publications, and account moderation.
          </p>
        </div>
        <div className="space-y-1">
          {writers.map((w) => (
            <div key={w.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[#A78BFA]/10 flex items-center justify-center shrink-0">
                <PenLine className="w-4 h-4 text-[#A78BFA]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                  {w.business_name}
                  <Badge label={w.status} color={statusColor(w.status)} />
                </div>
                <div className="text-white/30" style={{ fontSize: "11px" }}>
                  {w.first_name} {w.last_name} · {w.email}{w.website ? ` · ${w.website}` : ""}
                </div>
                {w.reason && <div className="text-white/20 mt-1" style={{ fontSize: "10px" }}>Reason: {w.reason}</div>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {w.status === "pending" && (
                  <>
                    <ActionButton onClick={() => handleApprove(w.id)} icon={Check} label="Approve" color="#4ADE80" />
                    <ActionButton onClick={() => handleReject(w.id)} icon={X} label="Reject" color="#E71D36" />
                  </>
                )}
                {w.status === "approved" && <ActionButton onClick={() => handleRevoke(w.id)} icon={Ban} label="Revoke" color="#FFB627" />}
                <ActionButton onClick={() => handleDelete(w.id)} icon={Trash2} label="Delete" danger />
              </div>
            </div>
          ))}
          {writers.length === 0 && <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No writer accounts</div>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Posts Tab
   ════════════════════════════════════════════════════════ */

function PostsTab({ posts, onRefresh }: { posts: PostListResponse[]; onRefresh: () => void }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    try { await api.admin.deletePost(id); toast.success("Post deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };

  const catColor = (c: string) => {
    const map: Record<string, string> = { event: "#6C5CE7", deal: "#2EC4B6", news: "#1B2D45", lifestyle: "#FFB627", food: "#E84393", other: "#98A3B0" };
    return map[c] || "#98A3B0";
  };

  return (
    <div>
      <h2 className="text-white mb-4" style={{ fontSize: "20px", fontWeight: 800 }}>Posts ({posts.length})</h2>
      <div className="space-y-1">
        {posts.map((p) => (
          <div key={p.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                  <button onClick={() => router.push("/the-bubble")} className="hover:text-[#FF6B35] transition-colors text-left">
                    {p.title}
                  </button>
                  <Badge label={p.category} color={catColor(p.category)} />
                  <Badge label={p.status} color={p.status === "published" ? "#4ADE80" : "#FFB627"} />
                </div>
                <div className="text-white/30" style={{ fontSize: "11px" }}>
                  By {p.author_name} · {p.view_count} views · {timeAgo(p.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ActionButton onClick={() => router.push("/the-bubble")} icon={Eye} label="Bubble" color="#60A5FA" />
                <ActionButton
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  icon={expandedId === p.id ? ChevronDown : Eye}
                  label={expandedId === p.id ? "Hide" : "Content"}
                  color="#A78BFA"
                />
                <ActionButton onClick={() => handleDelete(p.id)} icon={Trash2} label="Delete" danger />
              </div>
            </div>
            {expandedId === p.id && p.content && (
              <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                <div
                  className="text-white/60 max-w-none"
                  style={{ fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{ __html: p.content }}
                />
              </div>
            )}
          </div>
        ))}
        {posts.length === 0 && <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No posts</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Groups Tab
   ════════════════════════════════════════════════════════ */

function GroupsTab({ groups, onRefresh }: { groups: GroupCardResponse[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q);
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    try { await api.roommates.deleteGroup(id); toast.success("Group deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <h2 className="text-white mb-4" style={{ fontSize: "20px", fontWeight: 800 }}>Roommate Groups ({groups.length})</h2>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by group name..." />
      <div className="space-y-1">
        {filtered.map((g) => (
          <div key={g.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
              <UsersRound className="w-4 h-4 text-[#2EC4B6]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                {g.name}
                <Badge label={`${g.current_size}/${g.total_capacity}`} color="#2EC4B6" />
                {g.spots_remaining > 0 && <Badge label={`${g.spots_remaining} open`} color="#FFB627" />}
                {g.has_place && <Badge label="Has place" color="#4ADE80" />}
              </div>
              <div className="text-white/30" style={{ fontSize: "11px" }}>
                {g.description ? g.description.slice(0, 80) + (g.description.length > 80 ? "..." : "") : "No description"}
                {g.rent_per_person ? ` · $${g.rent_per_person}/person` : ""}
                {g.move_in_timing ? ` · ${g.move_in_timing}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ActionButton onClick={() => handleDelete(g.id)} icon={Trash2} label="Delete" danger />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No groups found</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Marketplace Tab
   ════════════════════════════════════════════════════════ */

function MarketplaceTab({ items, onRefresh }: { items: MarketplaceItemListResponse[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || i.seller_name.toLowerCase().includes(q);
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this marketplace item?")) return;
    try { await api.marketplace.deleteItem(id); toast.success("Item deleted"); onRefresh(); } catch { toast.error("Failed"); }
  };

  const statusColor = (s: string) => s === "available" ? "#4ADE80" : s === "sold" ? "#98A3B0" : s === "draft" ? "#FFB627" : "#98A3B0";
  const pricingLabel = (i: MarketplaceItemListResponse) => {
    if (i.pricing_type === "free") return "FREE";
    return `$${i.price ?? 0}${i.pricing_type === "negotiable" ? " Neg" : ""}`;
  };

  return (
    <div>
      <h2 className="text-white mb-4" style={{ fontSize: "20px", fontWeight: 800 }}>Marketplace Items ({items.length})</h2>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by title or seller..." />
      <div className="space-y-1">
        {filtered.map((i) => (
          <div key={i.id} className="bg-[#1B2D45] rounded-xl border border-white/[0.04] px-4 py-3 flex items-center gap-4">
            {i.primary_image ? (
              <img src={i.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-[#FF6B35]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                {i.title}
                <Badge label={i.status} color={statusColor(i.status)} />
                <span className="text-[#4ADE80]" style={{ fontSize: "12px", fontWeight: 800 }}>{pricingLabel(i)}</span>
              </div>
              <div className="text-white/30" style={{ fontSize: "11px" }}>
                By {i.seller_name} · {i.category} · {i.condition} · {i.view_count} views · {timeAgo(i.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ActionButton onClick={() => handleDelete(i.id)} icon={Trash2} label="Delete" danger />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-white/20" style={{ fontSize: "13px" }}>No items found</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Dashboard Page
   ════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<{ first_name: string; last_name: string } | null>(null);

  // Data
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [landlords, setLandlords] = useState<AdminLandlordResponse[]>([]);
  const [listings, setListings] = useState<AdminListingResponse[]>([]);
  const [flags, setFlags] = useState<AdminFlagResponse[]>([]);
  const [writers, setWriters] = useState<WriterResponse[]>([]);
  const [pendingWriters, setPendingWriters] = useState<AdminUserResponse[]>([]);
  const [posts, setPosts] = useState<PostListResponse[]>([]);
  const [groups, setGroups] = useState<GroupCardResponse[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItemListResponse[]>([]);

  // Auth check
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    // Override the regular token for admin API calls
    localStorage.setItem("cribb_token", token);
    const profile = getAdminProfile();
    setAdminProfile(profile);
    setLoading(false);
  }, [router]);

  // Fetch data for active tab
  const fetchData = useCallback(async () => {
    try {
      if (tab === "overview") {
        const s = await api.admin.getStats();
        setStats(s);
      } else if (tab === "users") {
        const u = await api.admin.getUsers();
        setUsers(u);
      } else if (tab === "landlords") {
        const l = await api.admin.getLandlords();
        setLandlords(l);
      } else if (tab === "listings") {
        const l = await api.admin.getListings();
        setListings(l);
      } else if (tab === "flags") {
        const f = await api.admin.getFlags();
        setFlags(f);
      } else if (tab === "writers") {
        const [w, pending] = await Promise.all([
          api.admin.getWriters(),
          api.admin.getPendingWriters(),
        ]);
        setWriters(w);
        setPendingWriters(pending);
      } else if (tab === "posts") {
        const p = await api.admin.getPosts();
        setPosts(p);
      } else if (tab === "groups") {
        try { const g = await api.roommates.browseGroups(); setGroups(g); } catch { setGroups([]); }
      } else if (tab === "marketplace") {
        try { const m = await api.marketplace.getItems(); setMarketplaceItems(m); } catch { setMarketplaceItems([]); }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("cribb_admin_token");
        localStorage.removeItem("cribb_admin_profile");
        router.push("/admin/login");
      }
    }
  }, [tab, router]);

  useEffect(() => {
    if (!loading) fetchData();
  }, [loading, fetchData]);

  // Also fetch flag count for sidebar badge
  useEffect(() => {
    if (loading) return;
    api.admin.getFlags().then((f) => setFlags(f)).catch(() => {});
  }, [loading]);

  const handleLogout = () => {
    localStorage.removeItem("cribb_admin_token");
    localStorage.removeItem("cribb_admin_profile");
    localStorage.removeItem("cribb_token");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1923] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  const adminName = adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}` : "Admin";

  return (
    <div className="flex min-h-screen bg-[#0F1923]">
      <Sidebar
        active={tab}
        onChange={setTab}
        flagCount={flags.filter((f) => f.status === "pending").length}
        onLogout={handleLogout}
        adminName={adminName}
      />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0F1923] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-white" style={{ fontSize: "14px", fontWeight: 800 }}>cribb admin</span>
        </div>
        <button onClick={handleLogout} className="text-white/30 hover:text-white/60 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F1923] border-t border-white/[0.06] px-2 py-2 flex items-center justify-around">
        {TABS.slice(0, 5).map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${tab === t.key ? "text-[#FF6B35]" : "text-white/25"}`}>
              <Icon className="w-4 h-4" />
              <span style={{ fontSize: "9px", fontWeight: 600 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 md:pt-8 pt-16 pb-24 md:pb-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {tab === "overview" && <OverviewTab stats={stats} />}
            {tab === "users" && <UsersTab users={users} onRefresh={fetchData} />}
            {tab === "landlords" && <LandlordsTab landlords={landlords} onRefresh={fetchData} />}
            {tab === "listings" && <ListingsTab listings={listings} onRefresh={fetchData} />}
            {tab === "flags" && <FlagsTab flags={flags} onRefresh={fetchData} />}
            {tab === "writers" && <WritersTab writers={writers} pendingUsers={pendingWriters} onRefresh={fetchData} />}
            {tab === "posts" && <PostsTab posts={posts} onRefresh={fetchData} />}
            {tab === "groups" && <GroupsTab groups={groups} onRefresh={fetchData} />}
            {tab === "marketplace" && <MarketplaceTab items={marketplaceItems} onRefresh={fetchData} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
