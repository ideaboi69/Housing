"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, MessageCircle, Heart } from "lucide-react";
import { api } from "@/lib/api";
import type { AppNotification } from "@/types";

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

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadUnread = useCallback(async () => {
    try {
      const d = await api.notifications.unreadCount();
      setUnread(d.unread_count);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    return () => clearInterval(t);
  }, [loadUnread]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        setItems(await api.notifications.list());
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
  };

  const clickItem = (n: AppNotification) => {
    setOpen(false);
    if (!n.is_read) {
      setUnread((u) => Math.max(0, u - 1));
      api.notifications.markRead(n.id).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const markAll = () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    api.notifications.markAllRead().catch(() => {});
  };

  const iconFor = (type: string) =>
    type === "comment_reply" ? <MessageCircle className="w-4 h-4 text-[#FF6B35]" /> : <Heart className="w-4 h-4 text-[#FF6B35]" />;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#1B2D45]/40 hover:bg-[#1B2D45]/5 hover:text-[#1B2D45]/60 transition-all"
      >
        <Bell className="w-[18px] h-[18px]" aria-hidden />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-white flex items-center justify-center bg-[#FF6B35]"
            style={{ fontSize: "9px", fontWeight: 800 }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[440px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white z-50 flex flex-col" style={{ boxShadow: "0 12px 40px rgba(27,45,69,0.15)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] shrink-0">
            <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-[#FF6B35] hover:underline" style={{ fontSize: "12px", fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 text-[#1B2D45]/40 px-4 py-6" style={{ fontSize: "13px" }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="text-[#98A3B0] px-4 py-8 text-center" style={{ fontSize: "13px" }}>You&apos;re all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => clickItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-black/[0.04] hover:bg-[#1B2D45]/[0.02] transition-colors flex gap-3 ${n.is_read ? "" : "bg-[#FF6B35]/[0.04]"}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
                    {iconFor(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: 600 }}>{n.title}</p>
                    {n.body && <p className="text-[#1B2D45]/50 truncate" style={{ fontSize: "12px" }}>{n.body}</p>}
                    <p className="text-[#98A3B0] mt-0.5" style={{ fontSize: "11px" }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#FF6B35] shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
