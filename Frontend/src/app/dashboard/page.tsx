"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Home,
  LayoutDashboard,
  MessageCircle,
  PenSquare,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { RequestWriterAccessModal } from "@/components/ui/RequestWriterAccessModal";
import { DashboardSkeleton } from "@/components/ui/Skeletons";
import type { PostListResponse, UserDashboardResponse } from "@/types";

const emptyDashboard: UserDashboardResponse = {
  sublets_active: 0,
  sublets_drafts: 0,
  sublets_total: 0,
  posts: 0,
  saved_listings: 0,
  marketplace_active: 0,
  marketplace_sold: 0,
  marketplace_drafts: 0,
  marketplace_unread_messages: 0,
  marketplace_total_views: 0,
  upcoming_viewings: 0,
  unread_messages: 0,
  reviews_written: 0,
  has_roommate_profile: false,
  roommate_quiz_completed: false,
  is_in_group: false,
  is_group_owner: false,
  group_id: null,
  group_name: null,
  pending_invites_received: 0,
  pending_requests_sent: 0,
  profile_completeness: 0,
  is_writable: false,
  write_access_requested: false,
};

function StatCard({
  label,
  value,
  sub,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <div className="mb-3 flex items-center gap-2 text-[#5C6B7A]">
        {icon}
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em" }}>
        {value}
      </div>
      {sub && (
        <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </>
  );
  const shadow = { boxShadow: "0 1px 4px rgba(27,45,69,0.04)" } as const;
  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-black/[0.04] bg-white p-4 transition-all hover:border-[#FF6B35]/20 hover:shadow-md md:p-5"
        style={shadow}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white p-4 md:p-5" style={shadow}>
      {inner}
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-black/[0.04] bg-white p-4 transition-all hover:border-[#FF6B35]/20 hover:shadow-md"
      style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                {title}
              </h3>
              {badge && (
                <span className="rounded-full bg-[#1B2D45]/[0.05] px-2 py-0.5 text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 700 }}>
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", lineHeight: 1.55 }}>
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#1B2D45]/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#FF6B35]" />
      </div>
    </Link>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuthStore();
  const [dashboard, setDashboard] = useState<UserDashboardResponse>(emptyDashboard);
  const [recentBubblePosts, setRecentBubblePosts] = useState<PostListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriterRequestModal, setShowWriterRequestModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "student") {
      router.replace("/");
      return;
    }

    let cancelled = false;
    async function loadDashboard() {
      try {
        const data = await api.auth.getDashboard();
        if (!cancelled) setDashboard(data);
      } catch {
        if (!cancelled) setDashboard(emptyDashboard);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [authLoading, token, user, router]);

  const roommateHref = useMemo(() => {
    if (!dashboard.is_in_group && dashboard.pending_invites_received > 0) {
      return "/roommates/invites";
    }
    if (dashboard.is_in_group && dashboard.group_id) {
      return `/roommates/groups/${dashboard.group_id}`;
    }
    return dashboard.roommate_quiz_completed ? "/roommates" : "/settings";
  }, [dashboard]);

  const roommateDescription = useMemo(() => {
    if (dashboard.is_in_group && dashboard.group_name) {
      return dashboard.is_group_owner
        ? `${dashboard.group_name} is live. Manage requests and members.`
        : `You’re part of ${dashboard.group_name}. View your group details.`;
    }
    if (dashboard.pending_invites_received > 0) {
      return `${dashboard.pending_invites_received} invite${dashboard.pending_invites_received > 1 ? "s" : ""} waiting for you.`;
    }
    if (dashboard.roommate_quiz_completed) {
      return "Your roommate profile is live. Browse groups and matches.";
    }
    return "Complete your roommate profile to unlock matching and group creation.";
  }, [dashboard]);

  const hasWriterAccess = Boolean(dashboard.is_writable || user?.is_writable);
  const writerRequestPending = Boolean(dashboard.write_access_requested || user?.write_access_requested) && !hasWriterAccess;

  useEffect(() => {
    if (!token || !user || !hasWriterAccess) {
      setRecentBubblePosts([]);
      return;
    }

    let cancelled = false;
    async function loadRecentBubblePosts() {
      try {
        const posts = await api.posts.getMyPosts();
        if (!cancelled) setRecentBubblePosts(posts.slice(0, 3));
      } catch {
        if (!cancelled) setRecentBubblePosts([]);
      }
    }

    loadRecentBubblePosts();
    return () => {
      cancelled = true;
    };
  }, [token, user, hasWriterAccess]);

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1120px] px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#FF6B35]/10 px-3 py-1 text-[#FF6B35]">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Student Dashboard</span>
            </div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Welcome back, {user?.first_name}
            </h1>
            <p className="mt-2 max-w-[620px] text-[#98A3B0]" style={{ fontSize: "14px", lineHeight: 1.65 }}>
              Your housing search, listings, and roommate progress — all in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <div className="text-[#5C6B7A]" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Profile Completeness
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em" }}>
                {dashboard.profile_completeness}%
              </div>
              <Link href="/settings" className="pb-1 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 700 }}>
                Finish profile
              </Link>
            </div>
          </div>
        </div>

        {/* At-a-glance numbers — Saved & Messages click through to their pages */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Saved" value={dashboard.saved_listings} sub="Listings saved to compare" href="/saved" icon={<Bookmark className="h-4 w-4 text-[#FF6B35]" />} />
          <StatCard label="Messages" value={dashboard.unread_messages} sub="Unread landlord replies" href="/messages" icon={<MessageCircle className="h-4 w-4 text-[#1B2D45]" />} />
          <StatCard label="Viewings" value={dashboard.upcoming_viewings} sub="Upcoming confirmed showings" icon={<CalendarDays className="h-4 w-4 text-[#2EC4B6]" />} />
          <StatCard label="Reviews" value={dashboard.reviews_written} sub="Reviews you’ve written" icon={<Star className="h-4 w-4 text-[#FFB627]" />} />
        </div>

        {/* One tile per destination — counts folded in, no repeats */}
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Jump back in</h2>
            <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px" }}>Everything you’re searching, posting, or managing on cribb.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Browse Listings"
              description="Search homes, compare, and pin new favourites."
              href="/browse"
              icon={<Home className="h-5 w-5" />}
            />
            <ActionCard
              title="Roommates"
              description={roommateDescription}
              href={roommateHref}
              icon={<Users className="h-5 w-5" />}
              badge={dashboard.pending_invites_received > 0 ? `${dashboard.pending_invites_received} invite${dashboard.pending_invites_received > 1 ? "s" : ""}` : undefined}
            />
            <ActionCard
              title="Sublets"
              description={`${dashboard.sublets_active} active · ${dashboard.sublets_drafts} draft${dashboard.sublets_drafts === 1 ? "" : "s"} · ${dashboard.sublets_total} total`}
              href="/sublets/my"
              icon={<Home className="h-5 w-5" />}
              badge={dashboard.sublets_drafts > 0 ? `${dashboard.sublets_drafts} draft${dashboard.sublets_drafts > 1 ? "s" : ""}` : undefined}
            />
            <ActionCard
              title="Marketplace"
              description={`${dashboard.marketplace_active} active · ${dashboard.marketplace_total_views} views${dashboard.marketplace_unread_messages > 0 ? ` · ${dashboard.marketplace_unread_messages} unread` : ""}`}
              href="/marketplace/my"
              icon={<ShoppingBag className="h-5 w-5" />}
              badge={dashboard.marketplace_drafts > 0 ? `${dashboard.marketplace_drafts} draft${dashboard.marketplace_drafts > 1 ? "s" : ""}` : dashboard.marketplace_unread_messages > 0 ? `${dashboard.marketplace_unread_messages} unread` : undefined}
            />
            <ActionCard
              title={hasWriterAccess ? "Bubble Posts" : "The Bubble"}
              description={
                hasWriterAccess
                  ? dashboard.posts > 0
                    ? `${dashboard.posts} post${dashboard.posts > 1 ? "s" : ""} on your account. Open your publishing tools.`
                    : "You have writer access. Start sharing updates and useful finds."
                  : writerRequestPending
                    ? "Your writer access request is under review."
                    : "Read what’s happening around Guelph — and request writer access to post."
              }
              href={hasWriterAccess ? "/writer" : "/the-bubble"}
              icon={<PenSquare className="h-5 w-5" />}
              badge={hasWriterAccess ? "Writer" : writerRequestPending ? "Pending" : undefined}
            />
            <ActionCard
              title="Settings"
              description={dashboard.profile_completeness < 100 ? "Finish your profile and keep your preferences up to date." : "Update your profile, preferences, and account."}
              href="/settings"
              icon={<Settings className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* Writer access request — only when they don't have it yet */}
        {!hasWriterAccess && !writerRequestPending && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/[0.04] bg-white p-5 sm:flex-row sm:items-center sm:justify-between" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <div>
              <h2 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 800 }}>Want to post on the Bubble?</h2>
              <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                Share campus updates, tips, and local finds. We review student requests manually, usually within 24 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWriterRequestModal(true)}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white transition-all hover:bg-[#e55e2e]"
              style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}
            >
              Request writer access
            </button>
          </div>
        )}

        {/* Writer recent posts — quick glance without living in the writer dashboard */}
        {hasWriterAccess && (
          <div className="mt-6 rounded-2xl border border-black/[0.04] bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                  Your Bubble Posts
                </h2>
                <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  Keep an eye on what you&apos;ve published without needing to live in the writer dashboard.
                </p>
              </div>
              <Link href="/writer" className="shrink-0 inline-flex items-center gap-1.5 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 700 }}>
                Manage all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentBubblePosts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recentBubblePosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/the-bubble/${post.slug}`}
                    className="block rounded-xl bg-[#FAF8F4] px-4 py-3 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                          {post.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[#98A3B0]" style={{ fontSize: "11px", fontWeight: 600 }}>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[#1B2D45]/55">{post.status}</span>
                          <span>{post.view_count} views</span>
                          <span>{post.category.toLowerCase()}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#1B2D45]/20" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-[#FAF8F4] px-4 py-3">
                <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>
                  No Bubble posts yet
                </div>
                <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                  Your writer access is active. When you publish your first post, it&apos;ll show up here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <RequestWriterAccessModal
        open={showWriterRequestModal}
        onClose={() => setShowWriterRequestModal(false)}
        onSubmitted={() => {
          setDashboard((current) => ({
            ...current,
            write_access_requested: true,
          }));
        }}
      />
    </div>
  );
}
