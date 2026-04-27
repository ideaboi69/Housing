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
  Loader2,
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
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white p-4 md:p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
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
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="mx-auto max-w-[1120px] px-4 py-8 md:px-6 md:py-10">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-[#FF6B35]" />
          </div>
        </div>
      </div>
    );
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
              Keep track of your housing search, conversations, marketplace activity, and roommate progress in one place.
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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Saved" value={dashboard.saved_listings} sub="Listings saved to compare" icon={<Bookmark className="h-4 w-4 text-[#FF6B35]" />} />
          <StatCard label="Messages" value={dashboard.unread_messages} sub="Unread landlord replies" icon={<MessageCircle className="h-4 w-4 text-[#1B2D45]" />} />
          <StatCard label="Viewings" value={dashboard.upcoming_viewings} sub="Upcoming confirmed showings" icon={<CalendarDays className="h-4 w-4 text-[#2EC4B6]" />} />
          <StatCard label="Reviews" value={dashboard.reviews_written} sub="Reviews you’ve written" icon={<Star className="h-4 w-4 text-[#FFB627]" />} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section>
              <div className="mb-3">
                <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                  Core Flows
                </h2>
                <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px" }}>
                  The places you’ll probably come back to most.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ActionCard title="Saved Listings" description={`${dashboard.saved_listings} saved. Revisit your top picks and compare them again.`} href="/saved" icon={<Bookmark className="h-5 w-5" />} />
                <ActionCard title="Messages" description={dashboard.unread_messages > 0 ? `${dashboard.unread_messages} unread message${dashboard.unread_messages > 1 ? "s" : ""} from landlords.` : "Catch up on conversations with landlords."} href="/messages" icon={<MessageCircle className="h-5 w-5" />} badge={dashboard.unread_messages > 0 ? `${dashboard.unread_messages} unread` : undefined} />
                <ActionCard title="Roommates" description={roommateDescription} href={roommateHref} icon={<Users className="h-5 w-5" />} badge={dashboard.pending_invites_received > 0 ? `${dashboard.pending_invites_received} invite${dashboard.pending_invites_received > 1 ? "s" : ""}` : undefined} />
                <ActionCard title="Settings" description={dashboard.profile_completeness < 100 ? "Finish your profile and keep your preferences up to date." : "Update your profile, preferences, and account settings."} href="/settings" icon={<Settings className="h-5 w-5" />} />
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                  Your Activity
                </h2>
                <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px" }}>
                  Everything you’re posting or managing on cribb.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ActionCard
                  title="Sublets"
                  description={`${dashboard.sublets_active} active, ${dashboard.sublets_drafts} draft${dashboard.sublets_drafts === 1 ? "" : "s"}, ${dashboard.sublets_total} total.`}
                  href="/sublets"
                  icon={<Home className="h-5 w-5" />}
                  badge={dashboard.sublets_drafts > 0 ? `${dashboard.sublets_drafts} draft${dashboard.sublets_drafts > 1 ? "s" : ""}` : undefined}
                />
                <ActionCard
                  title="Marketplace"
                  description={`${dashboard.marketplace_active} active items, ${dashboard.marketplace_total_views} total views, ${dashboard.marketplace_unread_messages} unread marketplace messages.`}
                  href="/marketplace/my"
                  icon={<ShoppingBag className="h-5 w-5" />}
                  badge={dashboard.marketplace_drafts > 0 ? `${dashboard.marketplace_drafts} draft${dashboard.marketplace_drafts > 1 ? "s" : ""}` : undefined}
                />
                <ActionCard
                  title={hasWriterAccess ? "Bubble Posts" : "The Bubble"}
                  description={
                    hasWriterAccess
                      ? dashboard.posts > 0
                        ? `${dashboard.posts} post${dashboard.posts > 1 ? "s" : ""} published or drafted. Open your publishing tools and keep Bubble content moving.`
                        : "You have writer access. Start sharing updates, events, and useful finds for students."
                      : writerRequestPending
                        ? "Your writer access request is under review. We’ll let you know once publishing is approved."
                        : "Read what’s happening around Guelph and request writer access if you want to post."
                  }
                  href={hasWriterAccess ? "/writer" : "/the-bubble"}
                  icon={<PenSquare className="h-5 w-5" />}
                  badge={hasWriterAccess ? "Writer" : writerRequestPending ? "Pending" : undefined}
                />
                <ActionCard
                  title="Browse Listings"
                  description="Jump back into search, compare more homes, and pin new favourites."
                  href="/browse"
                  icon={<Home className="h-5 w-5" />}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-black/[0.04] bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
              <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                Roommate Status
              </h2>
              <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                Keep your roommate side of cribb moving forward.
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[#FAF8F4] px-4 py-3">
                  <div className="text-[#5C6B7A]" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Profile
                  </div>
                  <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                    {dashboard.roommate_quiz_completed ? "Quiz completed" : "Quiz not completed"}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF8F4] px-4 py-3">
                  <div className="text-[#5C6B7A]" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Group
                  </div>
                  <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                    {dashboard.is_in_group ? dashboard.group_name || "In a group" : "No active group"}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF8F4] px-4 py-3">
                  <div className="text-[#5C6B7A]" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Pending
                  </div>
                  <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                    {dashboard.pending_invites_received} invites · {dashboard.pending_requests_sent} requests sent
                  </div>
                </div>
              </div>
              <Link href={roommateHref} className="mt-4 inline-flex items-center gap-1.5 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 700 }}>
                Open roommates <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-black/[0.04] bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
              <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                Marketplace Snapshot
              </h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F4] px-4 py-3">
                  <span className="text-[#1B2D45]/55" style={{ fontSize: "12px", fontWeight: 600 }}>Active</span>
                  <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>{dashboard.marketplace_active}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F4] px-4 py-3">
                  <span className="text-[#1B2D45]/55" style={{ fontSize: "12px", fontWeight: 600 }}>Drafts</span>
                  <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>{dashboard.marketplace_drafts}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F4] px-4 py-3">
                  <span className="text-[#1B2D45]/55" style={{ fontSize: "12px", fontWeight: 600 }}>Sold</span>
                  <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>{dashboard.marketplace_sold}</span>
                </div>
              </div>
              <Link href="/marketplace/my" className="mt-4 inline-flex items-center gap-1.5 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 700 }}>
                Manage your items <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/marketplace/messages" className="mt-2 inline-flex items-center gap-1.5 text-[#1B2D45]/55 hover:text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
                Open marketplace messages <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-black/[0.04] bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
              <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
                Bubble Access
              </h2>
              <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px", lineHeight: 1.6 }}>
                Manage your writer status and Bubble publishing access from your student account.
              </p>

              <div className="mt-4 rounded-xl bg-[#FAF8F4] px-4 py-3">
                <div className="text-[#5C6B7A]" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Status
                </div>
                <div className="mt-1 text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>
                  {hasWriterAccess ? "Writer access approved" : writerRequestPending ? "Application pending" : "No writer access yet"}
                </div>
                <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "11px", lineHeight: 1.6 }}>
                  {hasWriterAccess
                    ? dashboard.posts > 0
                      ? `${dashboard.posts} Bubble post${dashboard.posts > 1 ? "s" : ""} on your account.`
                      : "You can now create and manage Bubble posts."
                    : writerRequestPending
                      ? "We review student requests manually and usually get back to you within 24 hours."
                      : "Want to post campus updates, tips, and local finds? Request access here."}
                </p>
              </div>

              <div className="mt-4">
                {hasWriterAccess ? (
                  <Link href="/writer" className="inline-flex items-center gap-1.5 text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Open writer dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : writerRequestPending ? (
                  <span className="inline-flex rounded-full bg-[#FFB627]/10 px-3 py-1.5 text-[#B8860B]" style={{ fontSize: "11px", fontWeight: 700 }}>
                    Application under review
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowWriterRequestModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-white hover:bg-[#e55e2e] transition-all"
                    style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}
                  >
                    Request writer access
                  </button>
                )}
              </div>
            </div>

            {hasWriterAccess && (
              <div className="rounded-2xl border border-black/[0.04] bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
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
        </div>
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
