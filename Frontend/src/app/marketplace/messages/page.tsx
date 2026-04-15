"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type {
  MarketplaceConversationDetailResponse,
  MarketplaceConversationResponse,
  MarketplaceMessageResponse,
} from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
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

function EmptyInbox() {
  return (
    <div className="rounded-[28px] border border-black/[0.04] bg-white p-10 text-center" style={{ boxShadow: "0 8px 32px rgba(27,45,69,0.06)" }}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
        <ShoppingBag className="h-6 w-6 text-[#FF6B35]" />
      </div>
      <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>No marketplace messages yet</h2>
      <p className="mx-auto mt-2 max-w-[320px] text-[#98A3B0]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
        When you message a seller about an item, the conversation will appear here.
      </p>
      <Link href="/marketplace" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2.5 text-white" style={{ fontSize: "13px", fontWeight: 700 }}>
        Browse Marketplace
      </Link>
    </div>
  );
}

export default function MarketplaceMessagesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<MarketplaceConversationResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MarketplaceConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [composer, setComposer] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user?.role === "landlord") {
      router.replace("/marketplace");
    }
  }, [router, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const requestedId = Number(new URLSearchParams(window.location.search).get("conversation"));
    if (requestedId) setSelectedId(requestedId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const data = await api.marketplace.getConversations();
        if (cancelled) return;
        setConversations(data);
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    const conversationId = selectedId;

    let cancelled = false;

    async function loadDetail() {
      setThreadLoading(true);
      try {
        const data = await api.marketplace.getConversation(conversationId);
        if (!cancelled) {
          setDetail(data);
          setConversations((current) =>
            current.map((convo) =>
              convo.id === conversationId ? { ...convo, unread_count: 0 } : convo
            )
          );
        }
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const handleSend = async () => {
    if (!selectedId || !composer.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await api.marketplace.sendMessage(selectedId, { content: composer.trim() });
      setDetail((current) => current ? { ...current, messages: [...current.messages, message] } : current);
      setConversations((current) =>
        current.map((convo) =>
          convo.id === selectedId
            ? {
                ...convo,
                last_message: message,
                updated_at: message.created_at,
              }
            : convo
        )
      );
      setComposer("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="mx-auto flex min-h-[70vh] max-w-[720px] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
            <MessageCircle className="h-6 w-6 text-[#FF6B35]" />
          </div>
          <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900 }}>Sign in to view marketplace messages</h1>
          <p className="mt-2 max-w-[360px] text-[#98A3B0]" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            Your seller conversations live here once you start messaging people in Marketplace.
          </p>
          <Link href="/login?next=/marketplace/messages" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2.5 text-white" style={{ fontSize: "13px", fontWeight: 700 }}>
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-6 md:py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-[#98A3B0] hover:text-[#1B2D45] transition-colors" style={{ fontSize: "12px", fontWeight: 700 }}>
              <ArrowLeft className="h-4 w-4" /> Back to Marketplace
            </Link>
            <h1 className="mt-3 text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900 }}>Marketplace Messages</h1>
            <p className="mt-1 text-[#98A3B0]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Keep buyer and seller conversations in one place while you browse items.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5">
            <div className="h-[720px] rounded-[28px] bg-white animate-pulse" />
            <div className="h-[720px] rounded-[28px] bg-white animate-pulse" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyInbox />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5 items-start">
            <div className="overflow-hidden rounded-[28px] border border-black/[0.04] bg-white" style={{ boxShadow: "0 8px 32px rgba(27,45,69,0.06)" }}>
              <div className="border-b border-black/[0.04] px-5 py-4">
                <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Conversations</div>
                <div className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px" }}>{conversations.length} active thread{conversations.length === 1 ? "" : "s"}</div>
              </div>
              <div className="max-h-[640px] overflow-y-auto">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === selectedId;
                  const otherParty = conversation.seller_id === user.id ? conversation.buyer_name : conversation.seller_name;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      className={`w-full border-l-2 px-5 py-4 text-left transition-colors ${isActive ? "border-[#FF6B35] bg-[#FF6B35]/[0.05]" : "border-transparent hover:bg-[#1B2D45]/[0.02]"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: isActive ? 800 : 700 }}>{otherParty}</div>
                          <div className="mt-0.5 truncate text-[#98A3B0]" style={{ fontSize: "11px" }}>{conversation.item_title}</div>
                          {conversation.last_message && (
                            <div className="mt-2 truncate text-[#5C6B7A]" style={{ fontSize: "11px" }}>
                              {conversation.last_message.sender_id === user.id ? "You: " : ""}
                              {conversation.last_message.content}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[#98A3B0]" style={{ fontSize: "10px" }}>
                            {conversation.last_message ? timeAgo(conversation.last_message.created_at) : timeAgo(conversation.updated_at)}
                          </div>
                          {conversation.unread_count > 0 && (
                            <div className="mt-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6B35] px-1.5 text-white" style={{ fontSize: "9px", fontWeight: 800 }}>
                              {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-black/[0.04] bg-white" style={{ boxShadow: "0 8px 32px rgba(27,45,69,0.06)" }}>
              {threadLoading || !detail ? (
                <div className="flex h-[720px] items-center justify-center text-[#98A3B0]" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Loading conversation…
                </div>
              ) : (
                <>
                  <div className="border-b border-black/[0.04] px-5 py-4">
                    <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>{selectedConversation?.item_title ?? detail.item_title}</div>
                    <div className="mt-1 text-[#98A3B0]" style={{ fontSize: "12px" }}>
                      Talking with {detail.seller_id === user.id ? detail.buyer_name : detail.seller_name}
                    </div>
                  </div>

                  <div className="flex h-[640px] flex-col">
                    <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(27,45,69,0.06),transparent_36%),linear-gradient(180deg,#FDFCFA_0%,#FAF8F4_100%)] px-5 py-5">
                      <div className="space-y-3">
                        {detail.messages.map((message: MarketplaceMessageResponse) => {
                          const isMe = message.sender_id === user.id;
                          return (
                            <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${isMe ? "rounded-br-md bg-[#FF6B35] text-white" : "rounded-bl-md border border-black/[0.04] bg-white text-[#1B2D45]"}`}>
                                <div style={{ fontSize: "13px", lineHeight: 1.55 }}>{message.content}</div>
                                <div className={`mt-1 ${isMe ? "text-white/55" : "text-[#98A3B0]"}`} style={{ fontSize: "10px" }}>
                                  {formatTime(message.created_at)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    <div className="border-t border-black/[0.04] px-5 py-4">
                      {error && (
                        <div className="mb-3 rounded-2xl bg-[#E71D36]/5 px-3 py-2 text-[#E71D36]" style={{ fontSize: "12px", fontWeight: 600 }}>
                          {error}
                        </div>
                      )}
                      <div className="flex items-end gap-3">
                        <textarea
                          value={composer}
                          onChange={(event) => setComposer(event.target.value)}
                          placeholder="Reply about pickup, condition, or timing…"
                          rows={2}
                          className="min-h-[56px] flex-1 resize-none rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3 text-[#1B2D45] placeholder:text-[#98A3B0] focus:outline-none focus:border-[#FF6B35]/35 focus:ring-2 focus:ring-[#FF6B35]/10"
                          style={{ fontSize: "13px", lineHeight: 1.5 }}
                        />
                        <button
                          onClick={handleSend}
                          disabled={sending || !composer.trim()}
                          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#FF6B35] px-5 text-white disabled:opacity-50"
                          style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 6px 20px rgba(255,107,53,0.22)" }}
                        >
                          <Send className="h-4 w-4" />
                          {sending ? "Sending" : "Send"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
