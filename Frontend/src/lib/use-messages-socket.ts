"use client";

import { useEffect, useRef } from "react";

export interface MessageSocketEvent {
  type: string;
  conversation_id?: number;
  scope?: string;
}

/**
 * Opens a WebSocket to the backend's `/ws?token=…` endpoint and calls `onEvent`
 * for each message pushed by the server (e.g. `{ type: "new_message", conversation_id }`).
 *
 * Auto-reconnects with backoff. The latest `onEvent` is always used (via ref), so
 * callers can pass a fresh closure each render without resetting the socket.
 */
export function useMessagesSocket(onEvent: (event: MessageSocketEvent) => void, enabled = true) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = localStorage.getItem("cribb_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = `${apiUrl.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;
    let attempts = 0;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => { attempts = 0; };

      ws.onmessage = (evt) => {
        try {
          onEventRef.current(JSON.parse(evt.data));
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (closedByUs) return;
        attempts += 1;
        const delay = Math.min(1000 * 2 ** attempts, 15000);
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws?.close(); };
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [enabled]);
}
