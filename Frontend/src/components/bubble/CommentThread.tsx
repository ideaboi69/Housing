"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronUp, CornerUpLeft, Trash2, Loader2, Send, Flag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ReportModal } from "@/components/ui/ReportModal";
import AvatarLightbox from "@/components/ui/AvatarLightbox";
import type { PostComment } from "@/types";

type SortKey = "top" | "newest";

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function authorInitials(a: PostComment["author"]): string {
  if (!a) return "?";
  return ((a.first_name[0] ?? "") + (a.last_name[0] ?? "")).toUpperCase();
}

/* Toggle like on a comment by id anywhere in the (2-level) tree. */
function applyLike(c: PostComment, id: number): PostComment {
  if (c.id === id) {
    const liked = !c.liked_by_me;
    return { ...c, liked_by_me: liked, like_count: c.like_count + (liked ? 1 : -1) };
  }
  if (c.replies.length) return { ...c, replies: c.replies.map((r) => applyLike(r, id)) };
  return c;
}

export function CommentThread({ postId }: { postId: number }) {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === "student";
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("top");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [reportId, setReportId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setComments(await api.posts.listComments(postId));
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const total = comments.reduce((n, c) => n + 1 + c.reply_count, 0);

  const sorted = [...comments].sort((a, b) =>
    sort === "top"
      ? b.like_count - a.like_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const submit = async (content: string, parentId?: number) => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      await api.posts.createComment(postId, content.trim(), parentId);
      await load();
      setDraft("");
      setReplyDraft("");
      setReplyTo(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post your comment");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (id: number) => {
    if (!isStudent) { toast.error("Log in as a student to react"); return; }
    setComments((prev) => prev.map((c) => applyLike(c, id)));
    try {
      await api.posts.toggleCommentLike(id);
    } catch {
      setComments((prev) => prev.map((c) => applyLike(c, id))); // revert
    }
  };

  const del = async (id: number) => {
    try {
      await api.posts.deleteComment(id);
      await load();
    } catch {
      toast.error("Couldn't delete that comment");
    }
  };

  const renderComment = (c: PostComment, isReply = false) => {
    const mine = isStudent && c.author?.id === user?.id;
    const deleted = c.author === null;
    return (
      <div key={c.id} className={isReply ? "" : "border-b border-[#1B2D45]/[0.05] pb-4"}>
        <div className="flex gap-3">
          <AvatarLightbox photoUrl={c.author?.profile_photo_url} alt={c.author?.first_name} className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#1B2D45]/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
              {c.author?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.author.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#1B2D45]/60" style={{ fontSize: "11px", fontWeight: 700 }}>{authorInitials(c.author)}</span>
              )}
            </div>
          </AvatarLightbox>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                {deleted ? "Someone" : `${c.author!.first_name} ${c.author!.last_name}`}
              </span>
              {c.author?.is_early_adopter && (
                <span className="text-[#FF6B35] bg-[#FF6B35]/10 px-1.5 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 800 }}>OG</span>
              )}
              <span className="text-[#98A3B0]" style={{ fontSize: "11px" }}>{timeAgo(c.created_at)}</span>
            </div>
            <p className={`mt-1 whitespace-pre-wrap break-words ${deleted ? "text-[#98A3B0] italic" : "text-[#1B2D45]/80"}`} style={{ fontSize: "13px", lineHeight: 1.5 }}>
              {deleted ? "This comment was deleted" : c.content}
            </p>

            {!deleted && (
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => toggleLike(c.id)}
                  className={`flex items-center gap-1 transition-colors ${c.liked_by_me ? "text-[#FF6B35]" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/70"}`}
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  {c.like_count > 0 && c.like_count}
                </button>
                {!isReply && (
                  <button
                    onClick={() => { if (!isStudent) { toast.error("Log in as a student to reply"); return; } setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }}
                    className="flex items-center gap-1 text-[#1B2D45]/40 hover:text-[#1B2D45]/70 transition-colors"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" /> Reply
                  </button>
                )}
                {mine ? (
                  <button
                    onClick={() => del(c.id)}
                    className="flex items-center gap-1 text-[#1B2D45]/30 hover:text-[#E71D36] transition-colors"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                ) : isStudent ? (
                  <button
                    onClick={() => setReportId(c.id)}
                    className="flex items-center gap-1 text-[#1B2D45]/30 hover:text-[#E71D36] transition-colors"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                ) : null}
              </div>
            )}

            {/* Inline reply composer */}
            {replyTo === c.id && isStudent && (
              <div className="mt-3 flex gap-2">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Write a reply…"
                  rows={2}
                  className="flex-1 rounded-xl border border-[#1B2D45]/[0.12] bg-white px-3 py-2 text-[#1B2D45] placeholder:text-[#98A3B0] focus:border-[#FF6B35]/40 focus:outline-none resize-none"
                  style={{ fontSize: "13px" }}
                />
                <button
                  onClick={() => submit(replyDraft, c.id)}
                  disabled={posting || !replyDraft.trim()}
                  className="self-end px-3 py-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-colors"
                  aria-label="Send reply"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Replies (one level) */}
            {c.replies.length > 0 && (
              <div className="mt-3 space-y-3 pl-3 border-l-2 border-[#1B2D45]/[0.06]">
                {c.replies.map((r) => renderComment(r, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="comments" className="mt-8 scroll-mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
          {total > 0 ? `${total} ${total === 1 ? "comment" : "comments"}` : "Comments"}
        </h3>
        {comments.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg bg-[#1B2D45]/[0.04] p-0.5">
            {(["top", "newest"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${sort === k ? "bg-white text-[#1B2D45] shadow-sm" : "text-[#1B2D45]/45 hover:text-[#1B2D45]/70"}`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      {isStudent ? (
        <div className="mb-6">
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add to the conversation…"
              rows={3}
              className="w-full rounded-xl border border-[#1B2D45]/[0.12] bg-white px-3.5 py-2.5 text-[#1B2D45] placeholder:text-[#98A3B0] focus:border-[#FF6B35]/40 focus:outline-none resize-none"
              style={{ fontSize: "14px" }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => submit(draft)}
                disabled={posting || !draft.trim()}
                className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                style={{ fontSize: "13px", fontWeight: 700 }}
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post comment
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-[#1B2D45]/[0.08] bg-[#FAF8F4] px-4 py-3 text-center">
          <p className="text-[#1B2D45]/60" style={{ fontSize: "13px" }}>
            <Link href="/login" className="text-[#FF6B35]" style={{ fontWeight: 700 }}>Log in</Link> as a student to join the conversation.
          </p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-[#1B2D45]/40 py-6" style={{ fontSize: "13px" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[#98A3B0] py-6 text-center" style={{ fontSize: "13px" }}>Be the first to comment.</p>
      ) : (
        <div className="space-y-4">{sorted.map((c) => renderComment(c))}</div>
      )}

      <ReportModal
        isOpen={reportId !== null}
        onClose={() => setReportId(null)}
        postCommentId={reportId ?? undefined}
        targetType="post_comment"
        targetTitle="this comment"
      />
    </section>
  );
}
