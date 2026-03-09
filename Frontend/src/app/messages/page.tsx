"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, Send, ArrowLeft, Trash2, Check, CheckCheck,
  Home, Clock, Search, MoreHorizontal, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { MessageListSkeleton } from "@/components/ui/Skeletons";
import type { ConversationResponse, ConversationDetailResponse, MessageResponse } from "@/types";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

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
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ═══════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════ */

function EmptyInbox() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
      <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mb-4">
        <MessageCircle className="w-7 h-7 text-[#FF6B35]" />
      </div>
      <h3 className="text-[#1B2D45] mb-1" style={{ fontSize: "18px", fontWeight: 800 }}>No messages yet</h3>
      <p className="text-[#98A3B0] max-w-[260px]" style={{ fontSize: "13px", lineHeight: 1.5 }}>
        When you message a landlord about a listing, your conversations will appear here.
      </p>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-[#1B2D45]/[0.04] flex items-center justify-center mb-4">
        <MessageCircle className="w-6 h-6 text-[#98A3B0]" />
      </div>
      <h3 className="text-[#1B2D45]/60 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Select a conversation</h3>
      <p className="text-[#98A3B0]" style={{ fontSize: "13px" }}>Pick a chat from the sidebar to start messaging.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONVERSATION LIST ITEM
   ═══════════════════════════════════════════════════════ */

function ConversationItem({
  convo,
  isActive,
  onClick,
  currentUserId,
}: {
  convo: ConversationResponse;
  isActive: boolean;
  onClick: () => void;
  currentUserId: number;
}) {
  const name = convo.landlord_name || "Landlord";
  const lastMsg = convo.last_message;
  const isFromMe = lastMsg?.sender_id === currentUserId;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 transition-all text-left ${
        isActive
          ? "bg-[#FF6B35]/[0.06] border-l-2 border-[#FF6B35]"
          : "hover:bg-[#1B2D45]/[0.02] border-l-2 border-transparent"
      }`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #1B2D45, #2D4A6F)", fontSize: "13px", fontWeight: 700 }}
      >
        {getInitials(name)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[#1B2D45] truncate" style={{ fontSize: "13px", fontWeight: convo.unread_count > 0 ? 800 : 600 }}>
            {name}
          </p>
          {lastMsg && (
            <span className="text-[#98A3B0] shrink-0" style={{ fontSize: "10px" }}>
              {timeAgo(lastMsg.created_at)}
            </span>
          )}
        </div>

        {/* Listing title */}
        <div className="flex items-center gap-1 mt-0.5">
          <Home className="w-3 h-3 text-[#98A3B0] shrink-0" />
          <p className="text-[#98A3B0] truncate" style={{ fontSize: "10px" }}>
            {convo.listing_title || `Listing #${convo.listing_id}`}
          </p>
        </div>

        {/* Last message preview */}
        {lastMsg && (
          <p
            className={`truncate mt-0.5 ${convo.unread_count > 0 ? "text-[#1B2D45]" : "text-[#98A3B0]"}`}
            style={{ fontSize: "11px", fontWeight: convo.unread_count > 0 ? 600 : 400 }}
          >
            {isFromMe && <span className="text-[#98A3B0]">You: </span>}
            {lastMsg.content}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {convo.unread_count > 0 && (
        <div
          className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center text-white shrink-0 self-center"
          style={{ fontSize: "9px", fontWeight: 800 }}
        >
          {convo.unread_count > 9 ? "9+" : convo.unread_count}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   MESSAGE BUBBLE
   ═══════════════════════════════════════════════════════ */

function MessageBubble({ message, isMe }: { message: MessageResponse; isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`max-w-[75%] px-3.5 py-2.5 ${
          isMe
            ? "bg-[#FF6B35] text-white rounded-2xl rounded-br-md"
            : "bg-white border border-black/[0.04] text-[#1B2D45] rounded-2xl rounded-bl-md"
        }`}
        style={{ boxShadow: isMe ? undefined : "0 1px 3px rgba(0,0,0,0.03)" }}
      >
        <p style={{ fontSize: "13px", lineHeight: 1.5, wordBreak: "break-word" }}>{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className={isMe ? "text-white/50" : "text-[#98A3B0]"} style={{ fontSize: "9px" }}>
            {formatTime(message.created_at)}
          </span>
          {isMe && (
            message.is_read
              ? <CheckCheck className="w-3 h-3 text-white/50" />
              : <Check className="w-3 h-3 text-white/40" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHAT THREAD VIEW
   ═══════════════════════════════════════════════════════ */

function ChatThread({
  conversationId,
  currentUserId,
  onBack,
}: {
  conversationId: number;
  currentUserId: number;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversation = useCallback(async () => {
    try {
      const data = await api.messages.getConversation(conversationId);
      setDetail(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
    const interval = setInterval(fetchConversation, 8000); // poll every 8s
    return () => clearInterval(interval);
  }, [fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await api.messages.sendMessage(conversationId, { content: newMsg.trim() });
      setNewMsg("");
      await fetchConversation();
      inputRef.current?.focus();
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) return <EmptyThread />;

  const otherName = detail.landlord_name || "Landlord";

  // Group messages by date
  const groupedMessages: { date: string; msgs: MessageResponse[] }[] = [];
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-black/[0.04] bg-white shrink-0">
        <button onClick={onBack} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#98A3B0] hover:bg-[#1B2D45]/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1B2D45, #2D4A6F)", fontSize: "12px", fontWeight: 700 }}
        >
          {getInitials(otherName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>{otherName}</p>
          <div className="flex items-center gap-1">
            <Home className="w-3 h-3 text-[#98A3B0]" />
            <p className="text-[#98A3B0] truncate" style={{ fontSize: "10px" }}>
              {detail.listing_title || `Listing #${detail.listing_id}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4" style={{ background: "#FAF8F4" }}>
        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-black/[0.06]" />
              <span className="text-[#98A3B0] shrink-0" style={{ fontSize: "10px", fontWeight: 600 }}>
                {formatDateSeparator(group.date)}
              </span>
              <div className="flex-1 h-px bg-black/[0.06]" />
            </div>

            {group.msgs.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isMe={msg.sender_id === currentUserId} />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 md:px-5 py-3 border-t border-black/[0.04] bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all resize-none"
            style={{ fontSize: "13px", lineHeight: 1.5, maxHeight: "120px" }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            style={{ boxShadow: "0 2px 8px rgba(255,107,53,0.3)" }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN MESSAGES PAGE
   ═══════════════════════════════════════════════════════ */

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.messages.getConversations();
      setConversations(data);
    } catch {
      // Not logged in or error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Refresh conversation list when returning from thread
  const handleBack = () => {
    setActiveConvoId(null);
    fetchConversations();
  };

  const filtered = searchQuery
    ? conversations.filter(
        (c) =>
          (c.landlord_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.listing_title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // On mobile: show either list or thread, not both
  const showSidebar = !isMobile || !activeConvoId;
  const showThread = !isMobile || !!activeConvoId;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-[#FF6B35]" />
          </div>
          <h2 className="text-[#1B2D45] mb-2" style={{ fontSize: "20px", fontWeight: 800 }}>Sign in to view messages</h2>
          <p className="text-[#98A3B0]" style={{ fontSize: "13px" }}>Log in to see your conversations with landlords.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex bg-[#FAF8F4]">
      <div className="max-w-[1200px] w-full mx-auto flex overflow-hidden">
        {/* ─── Sidebar: conversation list ─── */}
        {showSidebar && (
          <div className={`${isMobile ? "w-full" : "w-[340px]"} bg-white border-r border-black/[0.04] flex flex-col shrink-0`}>
            {/* Sidebar header */}
            <div className="px-4 py-4 border-b border-black/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.3px" }}>
                  Messages
                  {totalUnread > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#FF6B35] text-white align-middle"
                      style={{ fontSize: "10px", fontWeight: 800 }}>
                      {totalUnread}
                    </span>
                  )}
                </h1>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A3B0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4DC] bg-[#FAF8F4] text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/30 transition-all"
                  style={{ fontSize: "12px" }}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <MessageListSkeleton count={5} />
              ) : filtered.length === 0 ? (
                <EmptyInbox />
              ) : (
                <div className="divide-y divide-black/[0.03]">
                  {filtered.map((convo) => (
                    <ConversationItem
                      key={convo.id}
                      convo={convo}
                      isActive={activeConvoId === convo.id}
                      onClick={() => setActiveConvoId(convo.id)}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Thread view ─── */}
        {showThread && (
          <div className="flex-1 flex flex-col min-w-0">
            {activeConvoId ? (
              <ChatThread
                conversationId={activeConvoId}
                currentUserId={user.id}
                onBack={handleBack}
              />
            ) : (
              <EmptyThread />
            )}
          </div>
        )}
      </div>
    </div>
  );
}