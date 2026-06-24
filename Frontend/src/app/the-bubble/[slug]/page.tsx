"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Calendar, MapPin, ExternalLink, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { PostResponse } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function BubblePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.posts.getBySlug(slug);
        if (!cancelled) setPost(data);
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (missing || !post) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-[760px] mx-auto px-4 md:px-6 py-16 text-center">
          <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>Post not found</h1>
          <p className="text-[#98A3B0] mt-1" style={{ fontSize: "13px" }}>This post may have been unpublished or removed.</p>
          <Link href="/the-bubble" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
            <ArrowLeft className="w-4 h-4" /> Back to The Bubble
          </Link>
        </div>
      </div>
    );
  }

  const category = post.category.charAt(0).toUpperCase() + post.category.slice(1);

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <article className="max-w-[760px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link href="/the-bubble" className="inline-flex items-center gap-1.5 text-[#1B2D45]/55 hover:text-[#1B2D45] transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> The Bubble
        </Link>

        <div className="mt-5">
          <span className="inline-block rounded-full bg-[#FF6B35]/10 px-3 py-1 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.02em" }}>
            {category}
          </span>
        </div>

        <h1 className="mt-3 text-[#1B2D45]" style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {post.title}
        </h1>

        {/* Author + meta */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5">
            {post.author_photo_url ? (
              <img src={post.author_photo_url} alt={post.author_name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#FF6B35]/12 flex items-center justify-center text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 800 }}>
                {initials(post.author_name)}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{post.author_name}</span>
              {post.author_is_official && <BadgeCheck className="w-4 h-4 text-[#FF6B35]" />}
            </div>
          </div>
          <span className="text-[#1B2D45]/20">·</span>
          <span className="text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 500 }}>{formatDate(post.created_at)}</span>
          <span className="text-[#1B2D45]/20">·</span>
          <span className="inline-flex items-center gap-1 text-[#98A3B0]" style={{ fontSize: "12px", fontWeight: 500 }}>
            <Eye className="w-3.5 h-3.5" /> {post.view_count} view{post.view_count === 1 ? "" : "s"}
          </span>
        </div>

        {post.cover_image_url && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.05] bg-white">
            <img src={post.cover_image_url} alt={post.title} className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
          </div>
        )}

        {/* Event / deal meta */}
        {(post.event_date || post.event_location || post.event_link || post.deal_expires) && (
          <div className="mt-6 rounded-2xl border border-[#FF6B35]/15 bg-[#FF6B35]/[0.04] p-4 space-y-2">
            {post.event_date && (
              <div className="flex items-center gap-2 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Calendar className="w-4 h-4 text-[#FF6B35]" /> {formatDate(post.event_date)}
              </div>
            )}
            {post.event_location && (
              <div className="flex items-center gap-2 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                <MapPin className="w-4 h-4 text-[#FF6B35]" /> {post.event_location}
              </div>
            )}
            {post.event_link && (
              <a href={post.event_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#FF6B35] hover:underline" style={{ fontSize: "13px", fontWeight: 700 }}>
                <ExternalLink className="w-4 h-4" /> Event link
              </a>
            )}
            {post.deal_expires && (
              <div className="flex items-center gap-2 text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 600 }}>
                <Calendar className="w-4 h-4 text-[#FF6B35]" /> Deal expires {formatDate(post.deal_expires)}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="mt-6 text-[#1B2D45]/85" style={{ fontSize: "16px", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {post.content}
        </div>
      </article>
    </div>
  );
}
