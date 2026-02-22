"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye, FileText, PenLine, Trash2, MoreHorizontal, Plus,
  Clock, CheckCircle2, Archive, LogOut, AlertCircle, X,
  Send, Shield, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWriterStore } from "@/lib/writer-store";
import { api, ApiError } from "@/lib/api";
import type { PostListResponse, PostResponse, PostCategory } from "@/types";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  event: { label: "Event", emoji: "🎉", color: "#6C5CE7" },
  deal: { label: "Deal", emoji: "🏪", color: "#2EC4B6" },
  news: { label: "News", emoji: "📰", color: "#1B2D45" },
  lifestyle: { label: "Lifestyle", emoji: "☀️", color: "#FFB627" },
  food: { label: "Food", emoji: "🍕", color: "#E84393" },
  other: { label: "Other", emoji: "💡", color: "#98A3B0" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", color: "#FFB627", bg: "#FFB627", icon: FileText },
  published: { label: "Published", color: "#4ADE80", bg: "#4ADE80", icon: CheckCircle2 },
  archived: { label: "Archived", color: "#98A3B0", bg: "#98A3B0", icon: Archive },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ═══════════════════════════════════════════════════════
   LOGIN GATE
   ═══════════════════════════════════════════════════════ */

function WriterLogin() {
  const { login, isLoading, error, clearError } = useWriterStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch {
      // error is set in store
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>Writer Dashboard</h1>
          <p className="text-[#98A3B0] mt-1" style={{ fontSize: "13px" }}>Log in with your writer account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-black/[0.04] p-6 space-y-4" style={{ boxShadow: "0 2px 8px rgba(27,45,69,0.04)" }}>
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
          </div>
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={inputClass} style={{ fontSize: "13px", fontWeight: 500 }} />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E71D36]/5 text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 500 }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-4 text-[#98A3B0]" style={{ fontSize: "12px" }}>
          Not a writer yet? Apply from{" "}
          <a href="/the-bubble" className="text-[#FF6B35]" style={{ fontWeight: 600 }}>The Bubble</a>
        </p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   POST EDITOR MODAL
   ═══════════════════════════════════════════════════════ */

function PostEditor({ post, onClose, onSaved }: {
  post?: PostResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [category, setCategory] = useState<string>(post?.category || "");
  const [eventDate, setEventDate] = useState(post?.event_date || "");
  const [eventLocation, setEventLocation] = useState(post?.event_location || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!post;
  const canSave = title.trim() && content.trim() && category;

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";

  const handleSave = async (publish = false) => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.posts.update(post.id, {
          title,
          content,
          preview: content.slice(0, 160),
          category: category as PostCategory,
          event_date: eventDate || undefined,
          event_location: eventLocation || undefined,
          ...(publish ? { status: "published" as any } : {}),
        });
      } else {
        const created = await api.posts.create({
          title,
          content,
          preview: content.slice(0, 160),
          category: category as PostCategory,
          event_date: eventDate || undefined,
          event_location: eventLocation || undefined,
        });
        if (publish) {
          await api.posts.update(created.id, { status: "published" as any });
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: "600px", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 shrink-0">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>{isEdit ? "Edit Post" : "New Post"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Category */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category *</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-full border transition-all ${category === key ? "border-transparent text-white" : "border-black/[0.06] text-[#5C6B7A] bg-white hover:border-black/15"}`}
                  style={{ fontSize: "11px", fontWeight: 600, backgroundColor: category === key ? meta.color : undefined }}>
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's happening?" className={inputClass} style={{ fontSize: "14px", fontWeight: 600 }} />
          </div>

          {/* Content */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your post..." rows={6}
              className={`${inputClass} resize-none`} style={{ fontSize: "13px", lineHeight: 1.6 }} />
          </div>

          {/* Event fields */}
          {category === "event" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Date</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} style={{ fontSize: "12px" }} />
              </div>
              <div>
                <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Location</label>
                <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Where?" className={inputClass} style={{ fontSize: "12px" }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E71D36]/5 text-[#E71D36]" style={{ fontSize: "12px" }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/5 flex items-center justify-between gap-3 shrink-0">
          <button onClick={() => handleSave(false)} disabled={saving || !canSave}
            className="px-4 py-2.5 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.03] disabled:opacity-40 transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSave(true)} disabled={saving || !canSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-40 transition-all"
            style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
            <Send className="w-3.5 h-3.5" /> {saving ? "Publishing..." : "Publish"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   POST ROW
   ═══════════════════════════════════════════════════════ */

function PostRow({ post, onEdit, onStatusChange, onDelete }: {
  post: PostListResponse;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const catMeta = CATEGORY_META[post.category] || CATEGORY_META.other;
  const statusMeta = STATUS_META[post.status] || STATUS_META.draft;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="flex items-center gap-4 px-4 md:px-5 py-4 bg-white rounded-xl border border-black/[0.04] hover:border-black/[0.08] transition-all"
      style={{ boxShadow: "0 1px 3px rgba(27,45,69,0.03)" }}>

      {/* Category + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="px-2 py-0.5 rounded-full text-white shrink-0" style={{ fontSize: "9px", fontWeight: 700, backgroundColor: catMeta.color }}>
            {catMeta.emoji} {catMeta.label}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: "9px", fontWeight: 700, color: statusMeta.color, backgroundColor: `${statusMeta.bg}15` }}>
            <StatusIcon className="w-3 h-3" /> {statusMeta.label}
          </span>
        </div>
        <p className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{post.title}</p>
        <p className="text-[#98A3B0] truncate mt-0.5" style={{ fontSize: "11px" }}>{post.preview || "No preview"}</p>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-5 shrink-0">
        <div className="text-center">
          <p className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>{post.view_count}</p>
          <p className="text-[#98A3B0]" style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase" }}>Views</p>
        </div>
        <div className="text-center">
          <p className="text-[#98A3B0]" style={{ fontSize: "11px" }}>{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Actions menu */}
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-xl border border-black/[0.06] overflow-hidden z-50"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
              <button onClick={() => { onEdit(); setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-[#1B2D45]/70 hover:bg-[#1B2D45]/[0.03] transition-colors"
                style={{ fontSize: "12px", fontWeight: 500 }}>
                <PenLine className="w-3.5 h-3.5" /> Edit Post
              </button>

              {post.status === "draft" && (
                <button onClick={() => { onStatusChange("published"); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-[#4ADE80] hover:bg-[#4ADE80]/5 transition-colors"
                  style={{ fontSize: "12px", fontWeight: 500 }}>
                  <Send className="w-3.5 h-3.5" /> Publish
                </button>
              )}

              {post.status === "published" && (
                <button onClick={() => { onStatusChange("archived"); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-[#FFB627] hover:bg-[#FFB627]/5 transition-colors"
                  style={{ fontSize: "12px", fontWeight: 500 }}>
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}

              {post.status === "archived" && (
                <button onClick={() => { onStatusChange("published"); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-[#4ADE80] hover:bg-[#4ADE80]/5 transition-colors"
                  style={{ fontSize: "12px", fontWeight: 500 }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Republish
                </button>
              )}

              <div className="border-t border-black/[0.04]" />
              <button onClick={() => { onDelete(); setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-[#E71D36]/70 hover:bg-[#E71D36]/5 transition-colors"
                style={{ fontSize: "12px", fontWeight: 500 }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */

function Dashboard() {
  const { writer, logout } = useWriterStore();
  const [posts, setPosts] = useState<PostListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.posts.getMyPosts();
      setPosts(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);
  const totalViews = posts.reduce((sum, p) => sum + p.view_count, 0);
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  const handleEdit = async (post: PostListResponse) => {
    try {
      const full = await api.posts.getBySlug(post.slug);
      setEditingPost(full);
      setEditorOpen(true);
    } catch {
      // fallback
    }
  };

  const handleStatusChange = async (postId: number, status: string) => {
    try {
      await api.posts.update(postId, { status: status as any });
      fetchPosts();
    } catch {
      // error
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      await api.posts.delete(postId);
      fetchPosts();
    } catch {
      // error
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              Writer Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#FF6B35]" />
                <span className="text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>Verified Writer</span>
              </div>
              <span className="text-[#98A3B0]" style={{ fontSize: "11px" }}>·</span>
              <span className="text-[#98A3B0]" style={{ fontSize: "11px" }}>{writer?.first_name} {writer?.last_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingPost(null); setEditorOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
              <Plus className="w-4 h-4" /> New Post
            </motion.button>
            <button onClick={logout}
              className="w-9 h-9 rounded-xl border border-[#E8E4DC] flex items-center justify-center text-[#98A3B0] hover:text-[#E71D36] hover:border-[#E71D36]/20 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Views", value: totalViews, icon: Eye, color: "#6C5CE7" },
            { label: "Published", value: publishedCount, icon: CheckCircle2, color: "#4ADE80" },
            { label: "Drafts", value: draftCount, icon: FileText, color: "#FFB627" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.03)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-[#98A3B0]" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>{stat.label}</span>
                </div>
                <p className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(["all", "published", "draft", "archived"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition-all ${filter === f ? "bg-[#FF6B35] text-white" : "bg-white border border-black/[0.04] text-[#5C6B7A] hover:text-[#1B2D45]"}`}
              style={{ fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
              {f === "all" ? `All (${posts.length})` : `${f} (${posts.filter(p => p.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-8 h-8 text-[#98A3B0]/40 mx-auto mb-3" />
            <p className="text-[#98A3B0]" style={{ fontSize: "14px", fontWeight: 600 }}>
              {filter === "all" ? "No posts yet — create your first one!" : `No ${filter} posts`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((post) => (
              <PostRow key={post.id} post={post}
                onEdit={() => handleEdit(post)}
                onStatusChange={(status) => handleStatusChange(post.id, status)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {editorOpen && (
          <PostEditor
            post={editingPost}
            onClose={() => { setEditorOpen(false); setEditingPost(null); }}
            onSaved={fetchPosts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE EXPORT — login gate
   ═══════════════════════════════════════════════════════ */

export default function WriterPage() {
  const { writer, writerToken, loadWriter } = useWriterStore();

  useEffect(() => { loadWriter(); }, [loadWriter]);

  if (!writerToken || !writer) return <WriterLogin />;

  if (writer.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="text-center max-w-[360px]">
          <div className="w-14 h-14 rounded-2xl bg-[#FFB627]/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[#FFB627]" />
          </div>
          <h2 className="text-[#1B2D45] mb-2" style={{ fontSize: "20px", fontWeight: 800 }}>Application Pending</h2>
          <p className="text-[#98A3B0] mb-6" style={{ fontSize: "13px", lineHeight: 1.5 }}>
            Your writer application is still under review. We&apos;ll notify you once it&apos;s approved — usually within 24 hours.
          </p>
          <button onClick={() => useWriterStore.getState().logout()}
            className="px-4 py-2 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.03] transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}