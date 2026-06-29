"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  Bookmark,
  Calendar,
  Check,
  CheckCheck,
  Home,
  LayoutDashboard,
  MessageCircle,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { useIsMobile } from "@/hooks";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useMessagesSocket } from "@/lib/use-messages-socket";
import { MessageListSkeleton, MessageThreadSkeleton } from "@/components/ui/Skeletons";
import type {
  ConversationResponse,
  MarketplaceConversationResponse,
  MarketplaceMessageResponse,
  MessageResponse,
  SubletConversationResponse,
  SubletMessageResponse,
} from "@/types";

type InboxType = "housing" | "sublet" | "marketplace";
type InboxFilter = "all" | InboxType | "unread";

interface UnifiedConversation {
  key: string;
  type: InboxType;
  id: number;
  title: string;
  subtitle: string;
  otherName: string;
  href: string;
  lastMessage?: {
    content: string;
    sender_id: number;
    sender_type?: string;
    is_read: boolean;
    created_at: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface UnifiedMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  // Housing messages carry an explicit role (student↔landlord live in separate
  // tables whose ids can collide), so we trust this over a sender_id match.
  // Sublet/marketplace chats are student↔student, so they omit it.
  sender_type?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Whether a message was sent by the logged-in student. Housing chats can have a
// landlord whose id equals the student's, so prefer the role when present.
function isMessageFromMe(
  msg: { sender_type?: string; sender_id: number },
  currentUserId: number,
): boolean {
  if (msg.sender_type) return msg.sender_type === "student";
  return msg.sender_id === currentUserId;
}

interface ThreadDetail {
  title: string;
  subtitle: string;
  otherName: string;
  href: string;
  messages: UnifiedMessage[];
}

/* Polling re-fetches the inbox every few seconds. Without these, each poll
   replaces state with brand-new objects and forces a full re-render (the
   "random refresh" flicker). Compare a cheap signature and skip the update
   when nothing actually changed. */
function convosSignature(list: UnifiedConversation[]): string {
  return list.map((c) => `${c.key}|${c.updatedAt}|${c.unreadCount}|${c.lastMessage?.content ?? ""}`).join("§");
}

function detailSignature(d: ThreadDetail | null): string {
  if (!d) return "∅";
  const last = d.messages[d.messages.length - 1];
  return `${d.title}|${d.otherName}|${d.messages.length}|${last?.id ?? ""}|${last?.content ?? ""}`;
}

const TYPE_META: Record<InboxType, { label: string; short: string; icon: LucideIcon; tone: string; bg: string }> = {
  housing: {
    label: "Housing",
    short: "Housing",
    icon: Home,
    tone: "text-[#1B2D45]",
    bg: "bg-[#1B2D45]/[0.06]",
  },
  sublet: {
    label: "Sublet",
    short: "Sublet",
    icon: Calendar,
    tone: "text-[#2EC4B6]",
    bg: "bg-[#2EC4B6]/[0.10]",
  },
  marketplace: {
    label: "Marketplace",
    short: "Market",
    icon: ShoppingBag,
    tone: "text-[#FF6B35]",
    bg: "bg-[#FF6B35]/[0.10]",
  },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "CR";
}

// People are addressed by first name in the inbox; full name is kept for initials.
function firstName(name: string): string {
  return name.trim().split(" ")[0] || name;
}

function normalizeHousing(convo: ConversationResponse): UnifiedConversation {
  return {
    key: `housing:${convo.id}`,
    type: "housing",
    id: convo.id,
    title: convo.listing_title || `Listing #${convo.listing_id}`,
    subtitle: "Listing inquiry",
    otherName: convo.landlord_name || "Landlord",
    href: `/browse/${convo.listing_id}`,
    lastMessage: convo.last_message,
    unreadCount: convo.unread_count || 0,
    updatedAt: convo.last_message?.created_at || convo.updated_at || convo.created_at,
  };
}

function normalizeSublet(convo: SubletConversationResponse, currentUserId: number): UnifiedConversation {
  const otherName = convo.poster_id === currentUserId ? convo.inquirer_name : convo.poster_name;
  return {
    key: `sublet:${convo.id}`,
    type: "sublet",
    id: convo.id,
    title: convo.sublet_title || `Sublet #${convo.sublet_id}`,
    subtitle: "Sublet conversation",
    otherName: otherName || "Student",
    href: `/sublets/${convo.sublet_id}`,
    lastMessage: convo.last_message,
    unreadCount: convo.unread_count || 0,
    updatedAt: convo.last_message?.created_at || convo.updated_at || convo.created_at,
  };
}

function normalizeMarketplace(convo: MarketplaceConversationResponse, currentUserId: number): UnifiedConversation {
  const otherName = convo.seller_id === currentUserId ? convo.buyer_name : convo.seller_name;
  return {
    key: `marketplace:${convo.id}`,
    type: "marketplace",
    id: convo.id,
    title: convo.item_title || `Marketplace item #${convo.item_id}`,
    subtitle: "Marketplace item",
    otherName: otherName || "Student",
    href: `/marketplace/${convo.item_id}`,
    lastMessage: convo.last_message,
    unreadCount: convo.unread_count || 0,
    updatedAt: convo.last_message?.created_at || convo.updated_at || convo.created_at,
  };
}

function mapMessage(message: MessageResponse | SubletMessageResponse | MarketplaceMessageResponse): UnifiedMessage {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    sender_type: "sender_type" in message ? message.sender_type : undefined,
    content: message.content,
    is_read: message.is_read,
    created_at: message.created_at,
  };
}

function EmptyInbox({ filter }: { filter: InboxFilter }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
        <MessageCircle className="h-7 w-7 text-[#FF6B35]" />
      </div>
      <h3 className="mb-1 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
        {filter === "all" ? "No messages yet" : "Nothing here yet"}
      </h3>
      <p className="max-w-[280px] text-[#98A3B0]" style={{ fontSize: "13px", lineHeight: 1.5 }}>
        Housing, sublet, and marketplace chats will all show up here once you start messaging.
      </p>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(46,196,182,0.08),transparent_36%),linear-gradient(180deg,#FDFCFA_0%,#FAF8F4_100%)]" />
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(27,45,69,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.04] bg-white shadow-sm">
          <MessageCircle className="h-6 w-6 text-[#FF6B35]" />
        </div>
        <h3 className="mb-1 text-[#1B2D45]/70" style={{ fontSize: "16px", fontWeight: 700 }}>Select a conversation</h3>
        <p className="max-w-[300px] text-[#98A3B0]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
          Pick any housing, sublet, or marketplace chat from the left. Cribb keeps the context attached for you.
        </p>
      </div>
    </div>
  );
}

function ConversationItem({
  convo,
  isActive,
  onClick,
  onArchive,
  currentUserId,
}: {
  convo: UnifiedConversation;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
  currentUserId: number;
}) {
  const meta = TYPE_META[convo.type];
  const Icon = meta.icon;
  const isFromMe = convo.lastMessage ? isMessageFromMe(convo.lastMessage, currentUserId) : false;

  return (
    <div
      className={`group flex w-full items-stretch border-l-2 transition-all ${
        isActive
          ? "border-[#FF6B35] bg-[#FF6B35]/[0.06]"
          : "border-transparent hover:bg-[#1B2D45]/[0.02]"
      }`}
    >
      <button onClick={onClick} className="min-w-0 flex-1 px-4 py-3.5 text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, #1B2D45, #2D4A6F)", fontSize: "13px", fontWeight: 700 }}>
            {getInitials(convo.otherName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: convo.unreadCount > 0 ? 800 : 650 }}>
                {firstName(convo.otherName)}
              </p>
              {convo.lastMessage && (
                <span className="shrink-0 text-[#98A3B0]" style={{ fontSize: "10px" }}>
                  {timeAgo(convo.lastMessage.created_at)}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${meta.bg} ${meta.tone}`} style={{ fontSize: "9px", fontWeight: 800 }}>
                <Icon className="h-2.5 w-2.5" />
                {meta.short}
              </span>
              <p className="truncate text-[#98A3B0]" style={{ fontSize: "10px" }}>
                {convo.title}
              </p>
            </div>

            {convo.lastMessage && (
              <p className={`mt-1 truncate ${convo.unreadCount > 0 ? "text-[#1B2D45]" : "text-[#98A3B0]"}`} style={{ fontSize: "11px", fontWeight: convo.unreadCount > 0 ? 650 : 400 }}>
                {isFromMe && <span className="text-[#98A3B0]">You: </span>}
                {convo.lastMessage.content}
              </p>
            )}
          </div>

          {convo.unreadCount > 0 && (
            <div className="flex h-5 min-w-[20px] shrink-0 items-center justify-center self-center rounded-full bg-[#FF6B35] px-1.5 text-white" style={{ fontSize: "9px", fontWeight: 800 }}>
              {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
            </div>
          )}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
        }}
        className="flex w-11 shrink-0 items-center justify-center text-[#98A3B0] opacity-100 transition-all hover:bg-[#1B2D45]/[0.05] hover:text-[#1B2D45] md:opacity-0 md:group-hover:opacity-100"
        aria-label={`Remove conversation with ${convo.otherName} from inbox`}
        title="Remove from inbox"
      >
        <Archive className="h-4 w-4" />
      </button>
    </div>
  );
}

function MessageBubble({ message, isMe }: { message: UnifiedMessage; isMe: boolean }) {
  return (
    <div className={`mb-1 flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-3.5 py-2.5 ${
          isMe
            ? "rounded-2xl rounded-br-md bg-[#FF6B35] text-white"
            : "rounded-2xl rounded-bl-md border border-black/[0.04] bg-white text-[#1B2D45]"
        }`}
        style={{ boxShadow: isMe ? undefined : "0 1px 3px rgba(0,0,0,0.03)" }}
      >
        <p style={{ fontSize: "13px", lineHeight: 1.5, wordBreak: "break-word" }}>{message.content}</p>
        <div className={`mt-1 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className={isMe ? "text-white/50" : "text-[#98A3B0]"} style={{ fontSize: "9px" }}>
            {formatTime(message.created_at)}
          </span>
          {isMe && (message.is_read ? <CheckCheck className="h-3 w-3 text-white/50" /> : <Check className="h-3 w-3 text-white/40" />)}
        </div>
      </div>
    </div>
  );
}

function ChatThread({
  conversation,
  currentUserId,
  onBack,
  onRefreshConversations,
}: {
  conversation: UnifiedConversation;
  currentUserId: number;
  onBack: () => void;
  onRefreshConversations: () => Promise<void>;
}) {
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  // Skip re-render when a poll returns an identical thread (avoids flicker).
  const applyDetail = useCallback((next: ThreadDetail | null) => {
    setDetail((prev) => (detailSignature(prev) === detailSignature(next) ? prev : next));
  }, []);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversation = useCallback(async () => {
    try {
      if (conversation.type === "housing") {
        const data = await api.messages.getConversation(conversation.id);
        applyDetail({
          title: data.listing_title || conversation.title,
          subtitle: "Listing inquiry",
          otherName: data.landlord_name || conversation.otherName,
          href: conversation.href,
          messages: data.messages.map(mapMessage),
        });
      } else if (conversation.type === "sublet") {
        const data = await api.sublets.getConversation(conversation.id);
        const otherName = data.poster_id === currentUserId ? data.inquirer_name : data.poster_name;
        applyDetail({
          title: data.sublet_title || conversation.title,
          subtitle: "Sublet conversation",
          otherName: otherName || conversation.otherName,
          href: conversation.href,
          messages: data.messages.map(mapMessage),
        });
      } else {
        const data = await api.marketplace.getConversation(conversation.id);
        const otherName = data.seller_id === currentUserId ? data.buyer_name : data.seller_name;
        applyDetail({
          title: data.item_title || conversation.title,
          subtitle: "Marketplace item",
          otherName: otherName || conversation.otherName,
          href: conversation.href,
          messages: data.messages.map(mapMessage),
        });
      }
    } catch {
      applyDetail(null);
    } finally {
      setLoading(false);
    }
  }, [conversation, currentUserId, applyDetail]);

  useEffect(() => {
    setLoading(true);
    fetchConversation();
    // Housing threads get live WebSocket updates, so they only need a slow safety-net
    // poll. Sublet/marketplace have no WS yet, so keep their faster poll.
    const interval = setInterval(fetchConversation, conversation.type === "housing" ? 30000 : 8000);
    return () => clearInterval(interval);
  }, [fetchConversation, conversation.type]);

  // Live-update the open housing thread when the backend pushes a new message for it.
  useMessagesSocket((event) => {
    if (event.type === "new_message" && conversation.type === "housing" && event.conversation_id === conversation.id) {
      void fetchConversation();
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const content = newMsg.trim();
      if (conversation.type === "housing") {
        await api.messages.sendMessage(conversation.id, { content });
      } else if (conversation.type === "sublet") {
        await api.sublets.sendMessage(conversation.id, { content });
      } else {
        await api.marketplace.sendMessage(conversation.id, { content });
      }
      setNewMsg("");
      await fetchConversation();
      await onRefreshConversations();
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (loading) {
    return <MessageThreadSkeleton />;
  }

  if (!detail) return <EmptyThread />;

  const meta = TYPE_META[conversation.type];
  const Icon = meta.icon;
  const groupedMessages: { date: string; msgs: UnifiedMessage[] }[] = [];
  let lastDate = "";
  for (const msg of detail.messages) {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      groupedMessages.push({ date: msg.created_at, msgs: [] });
      lastDate = date;
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.04] bg-white px-4 py-3 md:px-5">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98A3B0] transition-colors hover:bg-[#1B2D45]/5 md:hidden">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, #1B2D45, #2D4A6F)", fontSize: "12px", fontWeight: 700 }}>
          {getInitials(detail.otherName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 800 }}>{firstName(detail.otherName)}</p>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 ${meta.bg} ${meta.tone}`} style={{ fontSize: "10px", fontWeight: 800 }}>
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
          </div>
          <Link href={detail.href} className="mt-0.5 block truncate text-[#98A3B0] transition-colors hover:text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 650 }}>
            {detail.title}
          </Link>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-4 py-4 md:px-5" style={{ background: "#FAF8F4" }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(46,196,182,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(250,248,244,0.6)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-55" style={{ backgroundImage: "radial-gradient(rgba(27,45,69,0.05) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-black/[0.06]" />
                <span className="shrink-0 text-[#98A3B0]" style={{ fontSize: "10px", fontWeight: 650 }}>
                  {formatDateSeparator(group.date)}
                </span>
                <div className="h-px flex-1 bg-black/[0.06]" />
              </div>
              {group.msgs.map((msg) => (
                <MessageBubble key={`${msg.conversation_id}-${msg.id}`} message={msg} isMe={isMessageFromMe(msg, currentUserId)} />
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-black/[0.04] bg-white px-4 py-3 md:px-5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Reply about this ${meta.label.toLowerCase()}...`}
            rows={1}
            className="max-h-[120px] flex-1 resize-none rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] px-3.5 py-2.5 text-[#1B2D45] placeholder:text-[#98A3B0] transition-all focus:border-[#FF6B35]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/10"
            style={{ fontSize: "13px", lineHeight: 1.5 }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => void handleSend()}
            disabled={!newMsg.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35] text-white transition-opacity disabled:opacity-40"
            style={{ boxShadow: "0 2px 8px rgba(255,107,53,0.3)" }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const isMobile = useIsMobile();

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const [housingResult, subletResult, marketplaceResult] = await Promise.allSettled([
        api.messages.getConversations(),
        api.sublets.getConversations(),
        api.marketplace.getConversations(),
      ]);

      const housing = housingResult.status === "fulfilled" ? housingResult.value.map(normalizeHousing) : [];
      const sublets = subletResult.status === "fulfilled" ? subletResult.value.map((convo) => normalizeSublet(convo, user.id)) : [];
      const marketplace = marketplaceResult.status === "fulfilled" ? marketplaceResult.value.map((convo) => normalizeMarketplace(convo, user.id)) : [];
      const merged = [...housing, ...sublets, ...marketplace].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setConversations((prev) => (convosSignature(prev) === convosSignature(merged) ? prev : merged));
      setActiveKey((current) => {
        if (current && merged.some((convo) => convo.key === current)) return current;
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const requestedType = params.get("type") as InboxType | null;
          const requestedId = Number(params.get("conversation"));
          const requested = requestedType && requestedId ? merged.find((convo) => convo.type === requestedType && convo.id === requestedId) : null;
          if (requested) return requested.key;
        }
        return merged[0]?.key ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchConversations();
    const interval = setInterval(() => void fetchConversations(), 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Refresh the inbox instantly when a new housing message arrives over the WebSocket.
  useMessagesSocket((event) => {
    if (event.type === "new_message") void fetchConversations();
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((convo) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" ? convo.unreadCount > 0 : convo.type === filter);
      const matchesSearch =
        !q ||
        convo.otherName.toLowerCase().includes(q) ||
        convo.title.toLowerCase().includes(q) ||
        convo.subtitle.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [conversations, filter, searchQuery]);

  const activeConversation = conversations.find((convo) => convo.key === activeKey) ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const totals = {
    all: conversations.length,
    housing: conversations.filter((c) => c.type === "housing").length,
    sublet: conversations.filter((c) => c.type === "sublet").length,
    marketplace: conversations.filter((c) => c.type === "marketplace").length,
    unread: totalUnread,
  };

  const showSidebar = !isMobile || !activeConversation;
  const showThread = !isMobile || !!activeConversation;

  const handleBack = () => {
    setActiveKey(null);
    void fetchConversations();
  };

  // Esc closes the open thread
  useEffect(() => {
    if (!activeKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveKey(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeKey]);

  const handleArchiveConversation = async (conversation: UnifiedConversation) => {
    const confirmed = window.confirm(
      `Remove this ${TYPE_META[conversation.type].label.toLowerCase()} conversation with ${conversation.otherName} from your inbox? The message history will be preserved.`
    );
    if (!confirmed) return;

    try {
      if (conversation.type === "housing") {
        await api.messages.deleteConversation(conversation.id);
      } else if (conversation.type === "sublet") {
        await api.sublets.deleteConversation(conversation.id);
      } else {
        await api.marketplace.deleteConversation(conversation.id);
      }

      setConversations((prev) => prev.filter((item) => item.key !== conversation.key));
      setActiveKey((current) => current === conversation.key ? null : current);
    } catch (error) {
      console.error("Failed to remove conversation from inbox:", error);
      window.alert("Could not remove this conversation from your inbox. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
            <MessageCircle className="h-7 w-7 text-[#FF6B35]" />
          </div>
          <h2 className="mb-2 text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800 }}>Sign in to view messages</h2>
          <p className="text-[#98A3B0]" style={{ fontSize: "13px" }}>Log in to see your housing, sublet, and marketplace conversations.</p>
          <Link href="/login?next=/messages" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2.5 text-white" style={{ fontSize: "13px", fontWeight: 700 }}>
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1200px] px-4 pb-8 pt-6 md:px-6">
        <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#FF6B35]/10 px-3 py-1 text-[#FF6B35]">
              <MessageCircle className="h-3.5 w-3.5" />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Unified Inbox</span>
            </div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Messages
            </h1>
            <p className="mt-1 max-w-[600px] text-[#98A3B0]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Housing, sublet, and marketplace chats now live together, with labels so every thread keeps its context.
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3.5 py-2 text-[#1B2D45]/65 transition-all hover:border-[#1B2D45]/12 hover:text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link href="/saved" className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3.5 py-2 text-[#1B2D45]/65 transition-all hover:border-[#1B2D45]/12 hover:text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Bookmark className="h-3.5 w-3.5" />
              Saved
            </Link>
            <Link href="/browse" className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-3.5 py-2 text-white transition-all hover:bg-[#e55e2e]" style={{ fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.24)" }}>
              Browse listings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Threads", value: totals.all },
            { label: "Housing", value: totals.housing },
            { label: "Sublets", value: totals.sublet },
            { label: "Unread", value: totals.unread },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/[0.04] bg-white p-4" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.04)" }}>
              <div className="text-[#5C6B7A]" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{stat.label}</div>
              <div className="mt-2 text-[#1B2D45]" style={{ fontSize: "26px", fontWeight: 900 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="flex h-[calc(100dvh-120px)] min-h-[520px] md:h-[calc(100vh-260px)] md:min-h-[620px]">
          <div className="flex w-full overflow-hidden rounded-[28px] border border-black/[0.04] bg-white shadow-[0_6px_28px_rgba(27,45,69,0.06)]">
            {showSidebar && (
              <div className={`${isMobile ? "w-full" : "w-[360px]"} flex shrink-0 flex-col border-r border-black/[0.04] bg-white`}>
                <div className="border-b border-black/[0.04] px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.3px" }}>
                      Inbox
                      {totalUnread > 0 && (
                        <span className="ml-2 rounded-full bg-[#FF6B35] px-1.5 py-0.5 align-middle text-white" style={{ fontSize: "10px", fontWeight: 800 }}>
                          {totalUnread}
                        </span>
                      )}
                    </h2>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98A3B0]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] py-2 pl-9 pr-3 text-[#1B2D45] placeholder:text-[#98A3B0] transition-all focus:border-[#FF6B35]/30 focus:outline-none"
                      style={{ fontSize: "12px" }}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-black/[0.04] bg-[#FAF8F4] p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { key: "all", label: "All", count: totals.all, icon: Sparkles, activeClass: "bg-[#1B2D45] text-white shadow-[0_8px_18px_rgba(27,45,69,0.14)]" },
                        { key: "housing", label: "Housing", count: totals.housing, icon: Home, activeClass: "bg-[#1B2D45] text-white shadow-[0_8px_18px_rgba(27,45,69,0.14)]" },
                        { key: "sublet", label: "Sublets", count: totals.sublet, icon: Calendar, activeClass: "bg-[#2EC4B6] text-white shadow-[0_8px_18px_rgba(46,196,182,0.18)]" },
                        { key: "marketplace", label: "Market", count: totals.marketplace, icon: ShoppingBag, activeClass: "bg-[#FF6B35] text-white shadow-[0_8px_18px_rgba(255,107,53,0.18)]" },
                      ] as { key: InboxFilter; label: string; count: number; icon: typeof Home; activeClass: string }[]).map((item) => {
                        const Icon = item.icon;
                        const active = filter === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setFilter(item.key)}
                            className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                              active
                                ? item.activeClass
                                : "bg-white text-[#1B2D45]/55 hover:bg-white hover:text-[#1B2D45] hover:shadow-sm"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-[#1B2D45]/35 group-hover:text-[#FF6B35]"}`} />
                              <span style={{ fontSize: "11px", fontWeight: 850 }}>{item.label}</span>
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 ${
                                active ? "bg-white/18 text-white" : "bg-[#1B2D45]/[0.05] text-[#1B2D45]/42"
                              }`}
                              style={{ fontSize: "10px", fontWeight: 900 }}
                            >
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setFilter("unread")}
                      className={`mt-1.5 flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                        filter === "unread"
                          ? "bg-[#FFB627] text-[#1B2D45] shadow-[0_8px_18px_rgba(255,182,39,0.18)]"
                          : "bg-white text-[#1B2D45]/55 hover:text-[#1B2D45] hover:shadow-sm"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle className={`h-3.5 w-3.5 ${filter === "unread" ? "text-[#1B2D45]" : "text-[#1B2D45]/35"}`} />
                        <span style={{ fontSize: "11px", fontWeight: 850 }}>Unread only</span>
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 ${
                          filter === "unread" ? "bg-white/45 text-[#1B2D45]" : "bg-[#FF6B35]/10 text-[#FF6B35]"
                        }`}
                        style={{ fontSize: "10px", fontWeight: 900 }}
                      >
                        {totals.unread}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <MessageListSkeleton count={5} />
                  ) : filtered.length === 0 ? (
                    <EmptyInbox filter={filter} />
                  ) : (
                    <div className="divide-y divide-black/[0.03]">
                      {filtered.map((convo) => (
                        <ConversationItem
                          key={convo.key}
                          convo={convo}
                          isActive={activeKey === convo.key}
                          onClick={() => setActiveKey((current) => {
                            if (current === convo.key) return null;
                            // Opening the thread marks it read server-side (ChatThread
                            // calls getConversation on mount), so clear the badge now
                            // instead of waiting for the next inbox poll.
                            if (convo.unreadCount > 0) {
                              setConversations((prev) => prev.map((c) => (
                                c.key === convo.key ? { ...c, unreadCount: 0 } : c
                              )));
                            }
                            return convo.key;
                          })}
                          onArchive={() => void handleArchiveConversation(convo)}
                          currentUserId={user.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showThread && (
              <div className="flex min-w-0 flex-1 flex-col">
                {activeConversation ? (
                  <ChatThread
                    conversation={activeConversation}
                    currentUserId={user.id}
                    onBack={handleBack}
                    onRefreshConversations={fetchConversations}
                  />
                ) : (
                  <EmptyThread />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
