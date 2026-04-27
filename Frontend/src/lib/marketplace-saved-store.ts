"use client";

import { create } from "zustand";

const STORAGE_KEY = "cribb_marketplace_saved_item_ids";

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getScopeKey(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("cribb_token");
  if (!token) return null;
  const payload = decodeTokenPayload(token);
  const role = typeof payload?.role === "string" ? payload.role : "user";
  const id = payload?.user_id ?? payload?.id ?? payload?.sub;
  return id != null ? `${role}:${String(id)}` : role;
}

function readPersistedSavedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  const scopeKey = getScopeKey();
  if (!scopeKey) return new Set();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const values = parsed?.[scopeKey];
    if (!Array.isArray(values)) return new Set();
    return new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    );
  } catch {
    return new Set();
  }
}

function persistSavedIds(savedIds: Set<number>) {
  if (typeof window === "undefined") return;
  const scopeKey = getScopeKey();
  if (!scopeKey) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    parsed[scopeKey] = Array.from(savedIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage failures
  }
}

interface MarketplaceSavedState {
  savedIds: Set<number>;
  isLoaded: boolean;
  togglingIds: Set<number>;
  loadSaved: () => Promise<void>;
  toggleSave: (itemId: number) => Promise<void>;
  isSaved: (itemId: number) => boolean;
  isToggling: (itemId: number) => boolean;
  clear: () => void;
}

export const useMarketplaceSavedStore = create<MarketplaceSavedState>((set, get) => ({
  savedIds: new Set(),
  isLoaded: false,
  togglingIds: new Set(),

  loadSaved: async () => {
    set({
      savedIds: readPersistedSavedIds(),
      isLoaded: true,
    });
  },

  toggleSave: async (itemId: number) => {
    const scopeKey = getScopeKey();
    if (!scopeKey) {
      throw new Error("auth_required");
    }

    const { savedIds, togglingIds } = get();
    if (togglingIds.has(itemId)) return;

    const wasSaved = savedIds.has(itemId);

    set((state) => {
      const nextSaved = new Set(state.savedIds);
      if (wasSaved) nextSaved.delete(itemId);
      else nextSaved.add(itemId);

      const nextToggling = new Set(state.togglingIds);
      nextToggling.add(itemId);
      persistSavedIds(nextSaved);

      return {
        savedIds: nextSaved,
        togglingIds: nextToggling,
      };
    });

    set((state) => {
      const nextToggling = new Set(state.togglingIds);
      nextToggling.delete(itemId);
      return { togglingIds: nextToggling };
    });
  },

  isSaved: (itemId: number) => get().savedIds.has(itemId),

  isToggling: (itemId: number) => get().togglingIds.has(itemId),

  clear: () => {
    set({ savedIds: new Set(), isLoaded: false, togglingIds: new Set() });
  },
}));
