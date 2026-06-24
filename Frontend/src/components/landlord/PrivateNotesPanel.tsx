"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { loadNote, saveNote } from "@/lib/landlord-notes";

/**
 * A private notepad scoped to one landlord↔student conversation. Debounced autosave,
 * no Save button. Strictly private to the landlord.
 *
 * Source of truth is the backend (landlord-only endpoint); localStorage is an instant
 * cache + offline fallback so a note is never lost even if the network hiccups.
 */
export function PrivateNotesPanel({ conversationId, studentName }: { conversationId: number; studentName?: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edited = useRef(false);

  // On conversation change: show cached value instantly, then reconcile with the server.
  useEffect(() => {
    edited.current = false;
    setText(loadNote(conversationId));
    setStatus("idle");
    let cancelled = false;
    api.messages
      .getConversationNotes(conversationId)
      .then((res) => {
        if (cancelled || edited.current) return; // don't clobber in-progress typing
        setText(res.notes);
        saveNote(conversationId, res.notes); // keep cache in sync
      })
      .catch(() => { /* offline / endpoint unavailable — keep the cached value */ });
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleChange = (value: string) => {
    edited.current = true;
    setText(value);
    setStatus("saving");
    saveNote(conversationId, value); // instant local safety net
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Cached locally regardless, so surface "Saved" even if the sync request fails.
      api.messages
        .saveConversationNotes(conversationId, value)
        .then(() => setStatus("saved"))
        .catch(() => setStatus("saved"));
    }, 500);
  };

  return (
    <div className="border-b border-[#E8D9A8] bg-[#FFFBEB] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#A66A00]">
          <Lock className="h-3 w-3" />
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Private notes — only you can see this
          </span>
        </div>
        <span className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 500 }}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Jot down anything about ${studentName ?? "this applicant"} — move-in timing, who's co-signing, follow-ups… (never shown to them)`}
        rows={3}
        className="w-full resize-none rounded-lg border border-[#E8D9A8] bg-white px-3 py-2 text-[#1B2D45] placeholder:text-[#1B2D45]/30 focus:border-[#FFB627]/60 focus:outline-none"
        style={{ fontSize: "13px", lineHeight: 1.5 }}
      />
    </div>
  );
}
