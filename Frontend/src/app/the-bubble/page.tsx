"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronUp, Bookmark, Share2, MoreHorizontal, X, ImagePlus,
  Shield, TrendingUp, MapPin, Calendar, Pencil, BadgeCheck, Sparkles, Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";
import type { PostListResponse, PostCategory as PostCategoryType } from "@/types";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type Category = "event" | "deal" | "news" | "lifestyle" | "food" | "other";
type SortMode = "trending" | "new" | "top";

interface Post {
  id: string;
  author: string;
  initial: string;
  avatarGradient: string;
  verified: boolean;
  timestamp: string;
  category: Category;
  title: string;
  body: string;
  image?: string;
  eventDate?: string;
  eventLocation?: string;
  isHappeningToday?: boolean;
  upvotes: number;
  postedAt: number; // unix ms for sorting
  slug?: string;
  viewCount?: number;
}

function formatRelativeTimestamp(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function buildLivePost(post: PostListResponse): Post {
  const category = (post.category || "other") as Category;
  const meta = getCategoryMeta(category);
  const authorName = post.author_name || "Writer";

  return {
    id: `live-${post.id}`,
    author: authorName,
    initial: authorName[0]?.toUpperCase() || "W",
    avatarGradient: `linear-gradient(135deg, ${meta.color}, #1B2D45)`,
    verified: true,
    timestamp: formatRelativeTimestamp(post.created_at),
    category,
    title: post.title,
    body: post.preview || "Tap through to read the full post.",
    image: post.cover_image_url || undefined,
    eventDate: post.event_date,
    upvotes: post.view_count || 0,
    postedAt: new Date(post.created_at).getTime(),
    slug: post.slug,
    viewCount: post.view_count,
  };
}

/* ═══════════════════════════════════════════════════════
   CATEGORY DEFINITIONS — matches backend PostCategory
   ═══════════════════════════════════════════════════════ */

const CATEGORIES: { key: Category | "all"; label: string; emoji: string; color: string }[] = [
  { key: "all", label: "All Posts", emoji: "🔥", color: "#FF6B35" },
  { key: "event", label: "Events", emoji: "🎉", color: "#6C5CE7" },
  { key: "deal", label: "Deals", emoji: "🏪", color: "#2EC4B6" },
  { key: "news", label: "News", emoji: "📰", color: "#1B2D45" },
  { key: "lifestyle", label: "Lifestyle", emoji: "☀️", color: "#FFB627" },
  { key: "food", label: "Food", emoji: "🍕", color: "#E84393" },
  { key: "other", label: "Other", emoji: "💡", color: "#98A3B0" },
];

function getCategoryMeta(cat: Category) {
  return CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0];
}

/* ═══════════════════════════════════════════════════════
   MOCK POSTS
   ═══════════════════════════════════════════════════════ */

const now = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

const POSTS: Post[] = [
  {
    id: "p1", author: "Jordan", initial: "J",
    avatarGradient: "linear-gradient(135deg, #FF6B35, #FFB627)",
    verified: true, timestamp: "2h ago", category: "event",
    title: "Homecoming 2026 lineup just dropped!",
    body: "They got Tory Lanez and bbno$ headlining at Alumni Stadium. Tickets go live March 1st for students. Last year sold out in 20 minutes so set your alarms. Also there's a free BBQ at Johnston Green beforehand.",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=450&fit=crop",
    eventDate: "Sep 27, 2026", eventLocation: "Alumni Stadium",
    upvotes: 248, postedAt: now - 2 * HOUR,
  },
  {
    id: "p2", author: "Ava", initial: "A",
    avatarGradient: "linear-gradient(135deg, #6C5CE7, #a29bfe)",
    verified: true, timestamp: "3h ago", category: "food",
    title: "New ramen spot on Gordon St is actually amazing",
    body: "Yuki Ramen just opened where the old Subway used to be. Tried the tonkotsu — absolutely insane for the price ($14). They also do a student discount with your OneCard. Highly recommend going before it gets too busy.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=450&fit=crop",
    upvotes: 192, postedAt: now - 3 * HOUR,
  },
  {
    id: "p3", author: "Marcus", initial: "M",
    avatarGradient: "linear-gradient(135deg, #2EC4B6, #0984e3)",
    verified: true, timestamp: "5h ago", category: "other",
    title: "PSA: You can get free printing at the library",
    body: "Most people don't know this but McLaughlin Library gives every student $20 of free printing credits per semester. Just go to the help desk with your student card and they'll load it. Saved me so much money during exam season.",
    upvotes: 156, postedAt: now - 5 * HOUR,
  },
  {
    id: "p4", author: "Fatima", initial: "F",
    avatarGradient: "linear-gradient(135deg, #FFB627, #FF6B35)",
    verified: true, timestamp: "8h ago", category: "event",
    title: "Farmers Market is back starting this Saturday!",
    body: "The Guelph Farmers Market downtown is back for the season. Every Saturday 7am-12pm. They have the best apple cider donuts and local honey. It gets packed by 9am so go early if you want the good stuff.",
    eventDate: "Today", eventLocation: "Downtown Guelph", isHappeningToday: true,
    upvotes: 134, postedAt: now - 8 * HOUR,
  },
  {
    id: "p5", author: "Lena", initial: "L",
    avatarGradient: "linear-gradient(135deg, #1B2D45, #5C6B7A)",
    verified: true, timestamp: "1d ago", category: "news",
    title: "UC renovations will close the south entrance all March",
    body: "Just got an email from campus facilities. The University Centre south entrance is closed for renovations starting March 3rd through April. Use the north entrance near the courtyard. The Bullring cafe will still be open thankfully.",
    upvotes: 72, postedAt: now - DAY,
  },
  {
    id: "p6", author: "Sam", initial: "S",
    avatarGradient: "linear-gradient(135deg, #FFB627, #e17055)",
    verified: true, timestamp: "1d ago", category: "lifestyle",
    title: "Best patios to hit up this spring in Guelph",
    body: "Now that it's warming up here's my ranked list: 1) Baker St. Station (huge patio, great vibes) 2) The Wooly (rooftop!!) 3) Royal City Brewing (dogs allowed) 4) Miijidaa (fancy but worth it). You're welcome.",
    upvotes: 201, postedAt: now - DAY - 2 * HOUR,
  },
];

const WEEKLY_HIGHLIGHTS = [
  "🎤 Homecoming 2026 lineup announced — tickets March 1st",
  "🍜 Yuki Ramen opens on Gordon St with student discounts",
  "🏗️ UC south entrance closed for March renovations",
  "☀️ Patios are open — see the community's top picks",
];

/* ═══════════════════════════════════════════════════════
   AVATAR
   ═══════════════════════════════════════════════════════ */

function Avatar({ initial, gradient, size = 32 }: { initial: string; gradient: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white"
      style={{ width: size, height: size, background: gradient, fontSize: `${size * 0.4}px`, fontWeight: 700 }}>
      {initial}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VERIFIED BADGE SVG
   ═══════════════════════════════════════════════════════ */

function VerifiedBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <path d="M8.6 3.1c.6-1.5 2.8-1.5 3.4 0l.5 1.2c.2.6.8 1 1.4.9l1.3-.1c1.6-.2 2.5 1.7 1.4 2.9l-.9 1c-.4.4-.5 1.1-.2 1.6l.6 1.2c.7 1.4-.6 3-2.2 2.4l-1.2-.5c-.6-.2-1.2 0-1.6.4l-.9 1c-1 1.2-3.1.3-3-1.3l.1-1.3c0-.6-.3-1.2-.9-1.4l-1.2-.5C3.6 9.9 3.7 7.8 5.2 7.5l1.3-.2c.6-.1 1.1-.5 1.3-1.1l.8-3.1z" fill="#FF6B35" />
      <path d="M8.5 11.5l1.5 1.5 3.5-3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   CATEGORY PILL
   ═══════════════════════════════════════════════════════ */

function CategoryPill({ cat, small }: { cat: Category; small?: boolean }) {
  const meta = getCategoryMeta(cat);
  return (
    <span className="inline-flex items-center gap-1 rounded-full"
      style={{ fontSize: small ? "9px" : "10px", fontWeight: 600, padding: small ? "2px 8px" : "3px 10px", backgroundColor: meta.color + "12", color: meta.color }}>
      {meta.emoji} {meta.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   POST CARD
   ═══════════════════════════════════════════════════════ */

function PostCard({ post, index }: { post: Post; index: number }) {
  const [upvoted, setUpvoted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const voteCount = upvoted ? post.upvotes + 1 : post.upvotes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.06)", transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}
    >
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar initial={post.initial} gradient={post.avatarGradient} />
            <div className="flex items-center gap-1.5">
              <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{post.author}</span>
              {post.verified && <VerifiedBadge />}
              <span className="text-[#98A3B0]" style={{ fontSize: "11px" }}>· {post.timestamp}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <CategoryPill cat={post.category} small />
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-xl border border-black/[0.06] shadow-lg py-1 z-20 w-[140px]">
                  <button onClick={() => setShowMenu(false)} className="w-full text-left px-3 py-2 text-[#E71D36] hover:bg-[#E71D36]/5 flex items-center gap-2 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
                    <Flag className="w-3 h-3" /> Report Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[#1B2D45] mb-1.5" style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.35 }}>{post.title}</h3>

        {/* Body */}
        <p className="text-[#5C6B7A] mb-3" style={{
          fontSize: "13px", lineHeight: 1.6,
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? undefined : 3,
          WebkitBoxOrient: expanded ? undefined : ("vertical" as const),
          overflow: expanded ? "visible" : "hidden",
        }}>
          {post.body}
        </p>
        {!expanded && post.body.length > 160 && (
          <button onClick={() => setExpanded(true)} className="text-[#FF6B35] mb-3 hover:underline" style={{ fontSize: "12px", fontWeight: 600 }}>
            Read more
          </button>
        )}

        {/* Event metadata */}
        {(post.eventDate || post.eventLocation) && (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {post.isHappeningToday ? (
              <motion.span animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF6B35] text-white" style={{ fontSize: "10px", fontWeight: 700 }}>
                🚨 Happening Today
              </motion.span>
            ) : post.eventDate && (
              <span className="inline-flex items-center gap-1 text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 500 }}>
                <Calendar className="w-3 h-3" />{post.eventDate}
              </span>
            )}
            {post.eventLocation && (
              <span className="inline-flex items-center gap-1 text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 500 }}>
                <MapPin className="w-3 h-3" />{post.eventLocation}
              </span>
            )}
          </div>
        )}

        {/* Image */}
        {post.image && (
          <div className="rounded-2xl overflow-hidden mb-3 -mx-1">
            <img src={post.image} alt={post.title} className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.04]">
          <div className="relative">
            <motion.button onClick={() => setUpvoted(!upvoted)} whileTap={{ scale: 1.2 }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-colors ${upvoted ? "bg-[#FF6B35]/10 text-[#FF6B35]" : "text-[#98A3B0] hover:bg-[#1B2D45]/5"}`}
              style={{ fontSize: "12px", fontWeight: 600 }}>
              <ChevronUp className="w-4 h-4" />{voteCount}
            </motion.button>
            {/* Bubble pop particles on upvote */}
            <AnimatePresence>
              {upvoted && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      initial={{ scale: 0, opacity: 0.8, x: 0, y: 0 }}
                      animate={{ scale: [0, 1, 0], opacity: [0.8, 0.4, 0], x: (i - 1) * 12, y: -20 - i * 5 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-[#FF6B35]/40 pointer-events-none" />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-0.5">
            <motion.button onClick={() => setSaved(!saved)} whileTap={{ scale: 1.3 }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${saved ? "text-[#FF6B35] bg-[#FF6B35]/10" : "text-[#98A3B0] hover:bg-[#1B2D45]/5"}`}>
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-[#FF6B35]" : ""}`} />
            </motion.button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   WEEKLY HIGHLIGHTS
   ═══════════════════════════════════════════════════════ */

function WeeklyHighlightsCard() {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden border border-[#FFB627]/20"
      style={{ background: "linear-gradient(135deg, #FAF8F4 0%, #FFF8E8 100%)", borderLeft: "4px solid #FFB627", boxShadow: "0 2px 8px rgba(255,182,39,0.08)" }}>
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 800 }}>📌 This Week in Guelph</h3>
          <span className="px-2.5 py-1 rounded-full bg-[#FFB627]/12 text-[#B8860B]" style={{ fontSize: "9px", fontWeight: 700 }}>Curated by cribb</span>
        </div>
        <ul className="space-y-2.5">
          {WEEKLY_HIGHLIGHTS.map((item, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="text-[#5C6B7A] flex items-start gap-2" style={{ fontSize: "13px", lineHeight: 1.5 }}>
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#FFB627]/15 text-[#B8860B] flex items-center justify-center mt-0.5" style={{ fontSize: "9px", fontWeight: 800 }}>{i + 1}</span>
              {item}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   BECOME A WRITER CARD
   ═══════════════════════════════════════════════════════ */

function BecomeWriterCard({ onApply, compact }: { onApply: () => void; compact?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl border border-[#FF6B35]/15 overflow-hidden cursor-pointer"
      style={{ boxShadow: "0 2px 12px rgba(255,107,53,0.08)", background: "linear-gradient(135deg, #FFFAF7 0%, #FFFFFF 100%)" }}
      onClick={onApply}>
      <div className={compact ? "p-3.5" : "p-5"}>
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate: [0, -8, 8, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5 text-[#FF6B35]" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[#1B2D45]" style={{ fontSize: compact ? "12px" : "14px", fontWeight: 700 }}>Become a Writer</h4>
            <p className="text-[#5C6B7A]" style={{ fontSize: compact ? "10px" : "11px", lineHeight: 1.4 }}>
              Get the verified badge and share with the Guelph community
            </p>
          </div>
          <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="shrink-0">
            <Sparkles className="w-4 h-4 text-[#FF6B35]" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   WRITER APPLICATION MODAL
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   POST CREATION MODAL
   ═══════════════════════════════════════════════════════ */

function PostModal({ onClose }: { onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  const handleSubmit = async () => {
    if (!title || !selectedCategory || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const post = await api.posts.create({
        title,
        content: body,
        preview: body.slice(0, 160),
        category: selectedCategory as PostCategoryType,
        event_date: eventDate || undefined,
        event_location: eventLocation || undefined,
      });
      // Post is created as draft — publish it immediately
      try {
        await api.posts.publish(post.id);
      } catch {
        // Publish failed — post stays as draft, still close the modal
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="bg-white rounded-2xl w-full overflow-hidden" style={{ maxWidth: isMobile ? "100%" : "540px", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Create a Post</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {/* Category */}
          <div>
            <label className="text-[#5C6B7A] block mb-2" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
                <motion.button key={cat.key} whileTap={{ scale: 0.93 }} onClick={() => setSelectedCategory(cat.key as Category)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat.key ? "border-transparent text-white" : "border-black/[0.06] text-[#5C6B7A] hover:border-black/15 bg-white"}`}
                  style={{ fontSize: "11px", fontWeight: 600, backgroundColor: selectedCategory === cat.key ? cat.color : undefined }}>
                  {cat.emoji} {cat.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's happening?" className={inputClass} style={{ fontSize: "14px", fontWeight: 600 }} />
          </div>

          {/* Body */}
          <div>
            <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Give the community more details..." rows={4} className={`${inputClass} resize-none`} style={{ fontSize: "13px", lineHeight: 1.6 }} />
          </div>

          {/* Conditional event fields */}
          <AnimatePresence>
            {selectedCategory === "event" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image upload */}
          <motion.div whileHover={{ borderColor: "rgba(255,107,53,0.3)" }} className="border-2 border-dashed border-[#E8E4DC] rounded-xl p-6 text-center cursor-pointer transition-colors">
            <ImagePlus className="w-6 h-6 text-[#98A3B0] mx-auto mb-2" />
            <p className="text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 500 }}>Drag & drop an image, or <span className="text-[#FF6B35]">browse</span></p>
          </motion.div>
        </div>

        <div className="px-5 py-4 border-t border-black/5 flex flex-col gap-2">
          {error && <p className="text-[#E71D36] bg-[#E71D36]/5 rounded-xl px-3 py-2" style={{ fontSize: "12px", fontWeight: 500 }}>{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[#98A3B0]" style={{ fontSize: "10px", lineHeight: 1.5 }}>Posts are public and auto-expire in 30 days.</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting || !title || !selectedCategory}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors disabled:opacity-50"
              style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
              {submitting ? "Posting..." : "Post to The Bubble"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   TIP MODAL
   ═══════════════════════════════════════════════════════ */

function TipModal({ onClose }: { onClose: () => void }) {
  const [tip, setTip] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const tipCategories = [
    { key: "event", label: "Event", emoji: "🎉" },
    { key: "deal", label: "Deal / Discount", emoji: "💰" },
    { key: "news", label: "Campus News", emoji: "📰" },
    { key: "food", label: "Food Spot", emoji: "🍕" },
    { key: "warning", label: "Heads Up", emoji: "⚠️" },
    { key: "other", label: "Other", emoji: "💡" },
  ];

  const handleSubmit = async () => {
    if (!tip.trim() || submitting) return;
    setSubmitting(true);
    // Send tip to Formspree or backend
    try {
      await fetch("https://formspree.io/f/xbdazpzg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Bubble Tip",
          category: category || "general",
          tip: tip.trim(),
        }),
      });
    } catch { /* still show success */ }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="bg-white rounded-2xl w-full overflow-hidden" style={{ maxWidth: "440px", boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <div>
            <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Submit a Tip</h3>
            <p className="text-[#98A3B0]" style={{ fontSize: "10px" }}>A writer may feature your tip in a post</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {sent ? (
          <div className="px-5 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-[#4ADE80]" />
            </div>
            <h4 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Tip submitted!</h4>
            <p className="text-[#98A3B0] mt-1 mb-4" style={{ fontSize: "12px" }}>Thanks for sharing. A writer will review this and may feature it.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-[#1B2D45] text-white" style={{ fontSize: "13px", fontWeight: 700 }}>Done</button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Category */}
            <div>
              <label className="text-[#5C6B7A] block mb-2" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>What kind of tip?</label>
              <div className="flex flex-wrap gap-1.5">
                {tipCategories.map((cat) => (
                  <button key={cat.key} onClick={() => setCategory(cat.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${category === cat.key ? "border-[#FF6B35] bg-[#FF6B35]/[0.06] text-[#FF6B35]" : "border-black/[0.06] text-[#5C6B7A] hover:border-black/15 bg-white"}`}
                    style={{ fontSize: "11px", fontWeight: 600 }}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tip content */}
            <div>
              <label className="text-[#5C6B7A] block mb-1.5" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your tip</label>
              <textarea
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                placeholder="What should the community know about? An upcoming event, a deal, campus news..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all resize-none"
                style={{ fontSize: "13px", lineHeight: 1.6 }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!tip.trim() || submitting}
              className="w-full py-2.5 rounded-xl bg-[#FFB627] text-white hover:bg-[#e5a420] disabled:opacity-40 transition-all"
              style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,182,39,0.3)" }}
            >
              {submitting ? "Sending..." : "💡 Submit Tip"}
            </button>

            <p className="text-[#98A3B0] text-center" style={{ fontSize: "10px" }}>Tips are anonymous. Writers will credit you if they use your tip.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════ */

function HeroSection({ isWriter, canContribute, onCreatePost, onApply, isMobile }: { isWriter: boolean; canContribute: boolean; onCreatePost: () => void; onApply: () => void; isMobile: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(255,107,53,0.06) 0%, transparent 60%), #FAF8F4" }}>

      {/* Ambient floating bubbles */}
      {[
        { size: 48, top: "12%", left: "8%", delay: 0 },
        { size: 24, top: "60%", left: "22%", delay: 1.2 },
        { size: 56, top: "8%", left: "55%", delay: 0.4 },
        { size: 32, top: "55%", left: "68%", delay: 0.9 },
        { size: 20, top: "30%", left: "42%", delay: 1.6 },
        { size: 40, top: "15%", left: "80%", delay: 0.6 },
        { size: 16, top: "50%", left: "35%", delay: 2.0 },
        ...(!isMobile ? [
          { size: 28, top: "65%", left: "50%", delay: 1.4 },
          { size: 44, top: "10%", left: "90%", delay: 0.2 },
        ] : []),
      ].map((b, i) => (
        <motion.div key={`bubble-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -(10 + (i % 3) * 6), 0] }}
          transition={{ opacity: { duration: 0.6, delay: b.delay * 0.5 }, y: { duration: 5 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: b.delay } }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size, height: b.size, top: b.top, left: b.left,
            background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.5), rgba(255,107,53,0.07) 40%, rgba(255,107,53,0.03) 100%)",
            border: "1px solid rgba(255,107,53,0.06)",
            boxShadow: "inset 0 -3px 6px rgba(255,107,53,0.04), 0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div className="absolute rounded-full" style={{
            width: b.size * 0.35, height: b.size * 0.2, top: b.size * 0.15, left: b.size * 0.2,
            background: "rgba(255,255,255,0.4)", borderRadius: "50%", transform: "rotate(-20deg)",
          }} />
        </motion.div>
      ))}

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-10 relative z-10">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[#1B2D45]"
            style={{ fontSize: isMobile ? "26px" : "32px", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            The Bubble 🫧
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[#1B2D45]/50 mt-2" style={{ fontSize: "14px", lineHeight: 1.6, maxWidth: "420px" }}>
            What&apos;s happening in Guelph — events, deals, tips &amp; more
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mt-3">
            {[
              { label: "🎉 Homecoming", color: "#6C5CE7" },
              { label: "🍕 New Eats", color: "#2EC4B6" },
              { label: "☀️ Patio Season", color: "#FF6B35" },
              { label: "🎓 Campus News", color: "#1B2D45" },
            ].map((tag, i) => (
              <motion.span key={tag.label}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 400, damping: 20 }}
                className="px-2.5 py-1 rounded-full bg-white border border-black/[0.04]"
                style={{ fontSize: "11px", fontWeight: 600, color: tag.color, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                {tag.label}
              </motion.span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5">
            {canContribute ? isWriter ? (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCreatePost}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FF6B35] text-white"
                style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
                ✍️ Post Something
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onApply}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6B35] text-white"
                style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
                <BadgeCheck className="w-4 h-4" /> Become a Writer
              </motion.button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1B2D45]/10 bg-white/80 px-4 py-2.5 text-[#1B2D45]/55" style={{ fontSize: "12px", fontWeight: 600 }}>
                Bubble posting is student-only
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FILTER BAR + SORT TOGGLE
   ═══════════════════════════════════════════════════════ */

function FilterBar({ activeCategory, onSelectCategory, sortMode, onSelectSort, isMobile }: {
  activeCategory: Category | "all"; onSelectCategory: (c: Category | "all") => void;
  sortMode: SortMode; onSelectSort: (s: SortMode) => void; isMobile: boolean;
}) {
  return (
    <div className="sticky top-[56px] md:top-[64px] z-40 bg-[#FAF8F4]/90 backdrop-blur-sm border-b border-black/[0.04]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 relative">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <motion.button key={cat.key} whileTap={{ scale: 0.92 }} onClick={() => onSelectCategory(cat.key as Category | "all")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0 transition-all ${isActive ? "border-transparent text-white" : "border-black/[0.06] bg-white text-[#1B2D45]/60 hover:border-black/15"}`}
                  style={{ fontSize: "12px", fontWeight: isActive ? 700 : 600, backgroundColor: isActive ? cat.color : undefined, boxShadow: isActive ? `0 2px 10px ${cat.color}30` : undefined }}>
                  <span style={{ fontSize: "13px" }}>{cat.emoji}</span>{cat.label}
                </motion.button>
              );
            })}
            {isMobile && <div className="absolute top-0 right-0 bottom-0 w-6 pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(250,248,244,0.95))" }} />}
          </div>
          {/* Sort toggle */}
          {!isMobile && (
            <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0">
              {(["trending", "new", "top"] as const).map((s) => (
                <button key={s} onClick={() => onSelectSort(s)}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${sortMode === s ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
                  style={{ fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════ */

function Sidebar({ isWriter, canContribute, onCreatePost, onApply, onTip, posts }: { isWriter: boolean; canContribute: boolean; onCreatePost: () => void; onApply: () => void; onTip: () => void; posts: Post[] }) {
  const trendingPosts = useMemo(() => [...posts].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5), [posts]);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
      className="w-[280px] shrink-0 space-y-4 pb-4">
      {/* Trending */}
      <div className="bg-white rounded-2xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-[#FF6B35]" />
          <h4 className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800 }}>Trending This Week</h4>
        </div>
        <div className="space-y-2.5">
          {trendingPosts.map((post, i) => (
            <div key={post.id} className="flex items-start gap-2.5 cursor-pointer hover:translate-x-0.5 transition-transform">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center" style={{ fontSize: "10px", fontWeight: 800 }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[#1B2D45] truncate" style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.4 }}>{post.title}</p>
                <span className="text-[#98A3B0]" style={{ fontSize: "10px", fontWeight: 500 }}>▲ {post.upvotes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit a Tip */}
      {canContribute && (
        <div className="bg-white rounded-2xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB627]" />
            <h4 className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800 }}>Submit a Tip</h4>
          </div>
          <p className="text-[#98A3B0] mb-3" style={{ fontSize: "11px", lineHeight: 1.5 }}>Know something the community should hear? Send us a tip and a writer may feature it.</p>
          <button onClick={onTip} className="w-full py-2 rounded-xl border border-[#FFB627]/20 text-[#B8860B] hover:bg-[#FFB627]/5 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
            💡 Send a Tip
          </button>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-[#FAF8F4] rounded-2xl border border-[#E8E4DC] p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield className="w-3.5 h-3.5 text-[#98A3B0]" />
          <h4 className="text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700 }}>Community Guidelines</h4>
        </div>
        <p className="text-[#98A3B0]" style={{ fontSize: "11px", lineHeight: 1.6 }}>
          Be respectful. No personal info. No landlord ads. Posts auto-expire in 30 days.
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════ */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4">
      <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: "48px", display: "inline-block" }}>📭</motion.span>
      <h3 className="text-[#1B2D45] mt-4" style={{ fontSize: "18px", fontWeight: 700 }}>Nothing here yet</h3>
      <p className="text-[#5C6B7A] mt-2 text-center max-w-[300px]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
        Be the first to share something with the Guelph community!
      </p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onReset}
        className="mt-5 px-5 py-2 rounded-xl bg-[#FF6B35] text-white" style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}>
        Show all posts
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

export default function TheBubblePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [showPostModal, setShowPostModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isWriter, setIsWriter] = useState(false);
  const [livePosts, setLivePosts] = useState<Post[]>([]);
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const isLandlord = user?.role === "landlord";
  const canUseBubbleActions = !isLandlord;

  // Check if user has write access (student with is_writable, or a writer token)
  useEffect(() => {
    if (user?.role === "landlord") {
      setIsWriter(false);
      return;
    }

    // Logged-in students should only get writer controls if their actual user account has write access.
    if (user) {
      setIsWriter(Boolean((user as unknown as Record<string, unknown>).is_writable));
      return;
    }

    // Logged-out writer sessions can still use the Bubble with their dedicated writer token.
    try {
      const writerToken = localStorage.getItem("cribb_writer_token");
      setIsWriter(Boolean(writerToken));
    } catch {
      setIsWriter(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadPublishedPosts() {
      try {
        const data = await api.posts.getAll();
        if (!cancelled) {
          setLivePosts(data.filter((post) => post.status === "published").map(buildLivePost));
        }
      } catch {
        if (!cancelled) setLivePosts([]);
      }
    }

    loadPublishedPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  const feedPosts = useMemo(() => {
    if (livePosts.length === 0) return POSTS;
    const liveSlugs = new Set(livePosts.map((post) => post.slug).filter(Boolean));
    const mockPosts = POSTS.filter((post) => !post.slug || !liveSlugs.has(post.slug));
    return [...livePosts, ...mockPosts];
  }, [livePosts]);

  const filteredAndSorted = useMemo(() => {
    let posts = activeCategory === "all" ? [...feedPosts] : feedPosts.filter((p) => p.category === activeCategory);
    if (sortMode === "trending") {
      // hot score: upvotes weighted by recency
      posts.sort((a, b) => {
        const ageA = (now - a.postedAt) / HOUR;
        const ageB = (now - b.postedAt) / HOUR;
        const scoreA = a.upvotes / Math.pow(ageA + 2, 1.5);
        const scoreB = b.upvotes / Math.pow(ageB + 2, 1.5);
        return scoreB - scoreA;
      });
    } else if (sortMode === "new") {
      posts.sort((a, b) => b.postedAt - a.postedAt);
    } else {
      posts.sort((a, b) => b.upvotes - a.upvotes);
    }
    return posts;
  }, [activeCategory, sortMode, feedPosts]);

  const handlePostClick = () => {
    if (isLandlord) return;
    if (!user) {
      router.push("/writers/signup");
      return;
    }
    if (isWriter) setShowPostModal(true);
    else router.push("/writers/signup");
  };

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F4" }}>

      {/* ─── Page-wide background bubbles ─── 
           Using fixed position so they're always visible as you scroll */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {[
          { size: 40, top: "15%", left: "2%", delay: 0.2 },
          { size: 24, top: "45%", left: "6%", delay: 1.0 },
          { size: 52, top: "70%", left: "4%", delay: 0.5 },
          { size: 18, top: "30%", left: "94%", delay: 1.8 },
          { size: 44, top: "60%", left: "90%", delay: 0.3 },
          { size: 30, top: "85%", left: "92%", delay: 1.4 },
          { size: 34, top: "10%", left: "88%", delay: 0.7 },
          { size: 20, top: "50%", left: "96%", delay: 2.0 },
          { size: 26, top: "20%", left: "3%", delay: 0.9 },
          { size: 16, top: "90%", left: "8%", delay: 1.6 },
          { size: 38, top: "40%", left: "93%", delay: 0.4 },
          { size: 22, top: "75%", left: "1%", delay: 1.2 },
        ].map((b, i) => (
          <motion.div key={`page-bubble-${i}`}
            animate={{ y: [0, -(8 + (i % 4) * 4), 0], scale: [1, 1.03, 1] }}
            transition={{
              duration: 6 + (i % 3) * 2, repeat: Infinity, ease: "easeInOut", delay: b.delay,
            }}
            className="absolute rounded-full"
            style={{
              width: b.size, height: b.size, top: b.top, left: b.left,
              background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.45), rgba(255,107,53,0.06) 45%, rgba(255,107,53,0.02) 100%)",
              border: "1px solid rgba(255,107,53,0.05)",
              boxShadow: "inset 0 -2px 5px rgba(255,107,53,0.03), 0 1px 2px rgba(0,0,0,0.01)",
            }}
          >
            <div className="absolute rounded-full" style={{
              width: b.size * 0.3, height: b.size * 0.18, top: b.size * 0.15, left: b.size * 0.2,
              background: "rgba(255,255,255,0.35)", transform: "rotate(-20deg)",
            }} />
          </motion.div>
        ))}
      </div>

      {/* Page content */}
      <div className="relative z-10">
      <HeroSection isWriter={isWriter} canContribute={canUseBubbleActions} onCreatePost={() => setShowPostModal(true)} onApply={() => router.push("/writers/signup")} isMobile={isMobile} />

      <FilterBar activeCategory={activeCategory} onSelectCategory={setActiveCategory} sortMode={sortMode} onSelectSort={setSortMode} isMobile={isMobile} />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {!isMobile && activeCategory === "all" && (
          <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-8 items-start mb-5">
            <WeeklyHighlightsCard />
            {canUseBubbleActions ? (
              isWriter ? (
                <div
                  className="bg-white rounded-2xl border border-black/[0.04] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}
                  onClick={() => setShowPostModal(true)}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar initial="Y" gradient="linear-gradient(135deg, #FF6B35, #FFB627)" size={28} />
                    <div className="flex-1 bg-[#FAF8F4] rounded-xl px-3 py-2 text-[#98A3B0]" style={{ fontSize: "12px" }}>
                      Share something with Guelph...
                    </div>
                  </div>
                </div>
              ) : (
                <BecomeWriterCard onApply={() => router.push("/writers/signup")} />
              )
            ) : (
              <div className="bg-white rounded-2xl border border-black/[0.04] p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
                <h4 className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800 }}>Read-only for landlords</h4>
                <p className="mt-2 text-[#98A3B0]" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                  Landlord accounts can browse Bubble posts, but student and writer accounts handle tips and publishing.
                </p>
              </div>
            )}
          </div>
        )}

        <div className={`flex gap-8 ${isMobile ? "" : "items-start"}`}>
          {/* Feed */}
          <div className="flex-1 min-w-0 space-y-4">
            {isMobile && activeCategory === "all" && <WeeklyHighlightsCard />}
            {isMobile && canUseBubbleActions && !isWriter && activeCategory === "all" && <BecomeWriterCard onApply={() => router.push("/writers/signup")} />}

            {/* Mobile sort toggle */}
            {isMobile && (
              <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 w-fit">
                {(["trending", "new", "top"] as const).map((s) => (
                  <button key={s} onClick={() => setSortMode(s)}
                    className={`px-3 py-1.5 rounded-md transition-all ${sortMode === s ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40"}`}
                    style={{ fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
            ) : (
              <EmptyState onReset={() => setActiveCategory("all")} />
            )}
          </div>

          {!isMobile && (
            <div className="shrink-0 pl-1 pr-1">
              <Sidebar isWriter={isWriter} canContribute={canUseBubbleActions} onCreatePost={() => setShowPostModal(true)} onApply={() => router.push("/writers/signup")} onTip={() => setShowTipModal(true)} posts={feedPosts} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {isMobile && canUseBubbleActions && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.5 }}
          whileTap={{ scale: 0.9 }} onClick={handlePostClick}
          className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-[#FF6B35] text-white flex items-center justify-center"
          style={{ boxShadow: "0 6px 24px rgba(255,107,53,0.4), 0 2px 8px rgba(0,0,0,0.1)" }}>
          {isWriter ? <Pencil className="w-5 h-5" /> : <BadgeCheck className="w-5 h-5" />}
        </motion.button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showPostModal && canUseBubbleActions && isWriter && <PostModal onClose={() => setShowPostModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showTipModal && canUseBubbleActions && (
          <TipModal onClose={() => setShowTipModal(false)} />
        )}
      </AnimatePresence>
      </div>{/* end z-10 content wrapper */}
    </div>
  );
}
