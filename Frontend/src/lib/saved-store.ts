"use client";

import { create } from "zustand";
import { api, ApiError } from "@/lib/api";

const SAVED_IDS_STORAGE_KEY = "cribb_saved_listing_ids";

function readPersistedSavedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SAVED_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    );
  } catch {
    return new Set();
  }
}

function persistSavedIds(savedIds: Set<number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_IDS_STORAGE_KEY, JSON.stringify(Array.from(savedIds)));
  } catch {
    // Ignore storage failures
  }
}

function clearPersistedSavedIds() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SAVED_IDS_STORAGE_KEY);
  } catch {
    // Ignore storage failures
  }
}

interface SavedState {
  /** Set of listing IDs the current user has saved */
  savedIds: Set<number>;
  /** Whether initial load has completed */
  isLoaded: boolean;
  /** Per-listing loading states for optimistic UI */
  togglingIds: Set<number>;

  /** Load all saved IDs from backend (call once on app mount / login) */
  loadSaved: () => Promise<void>;
  /** Toggle save state for a listing — optimistic + API call */
  toggleSave: (listingId: number) => Promise<void>;
  /** Check if a specific listing is saved */
  isSaved: (listingId: number) => boolean;
  /** Check if a specific listing toggle is in flight */
  isToggling: (listingId: number) => boolean;
  /** Clear all (call on logout) */
  clear: () => void;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  savedIds: new Set(),
  isLoaded: false,
  togglingIds: new Set(),

  loadSaved: async () => {
    const localSaved = readPersistedSavedIds();
    try {
      const saved = await api.saved.getAll();
      const merged = new Set<number>([
        ...saved.map((s) => s.listing_id),
        ...Array.from(localSaved),
      ]);
      persistSavedIds(merged);
      set({
        savedIds: merged,
        isLoaded: true,
      });
    } catch {
      // Not logged in or error — that's fine, start empty
      set({ savedIds: localSaved, isLoaded: true });
    }
  },

  toggleSave: async (listingId: number) => {
    const { savedIds, togglingIds } = get();
    if (togglingIds.has(listingId)) return; // Already in flight

    const wasSaved = savedIds.has(listingId);

    // Optimistic update — use functional set to avoid race conditions when
    // multiple listings are toggled concurrently
    set((state) => {
      const nextSaved = new Set(state.savedIds);
      if (wasSaved) nextSaved.delete(listingId); else nextSaved.add(listingId);
      const nextToggling = new Set(state.togglingIds);
      nextToggling.add(listingId);
      persistSavedIds(nextSaved);
      return { savedIds: nextSaved, togglingIds: nextToggling };
    });

    try {
      if (wasSaved) {
        await api.saved.unsave(listingId);
      } else {
        await api.saved.save(listingId);
      }
    } catch (err) {
      // Only revert on auth errors — keep optimistic state for network/backend failures
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        set((state) => {
          const revertSaved = new Set(state.savedIds);
          if (wasSaved) revertSaved.add(listingId); else revertSaved.delete(listingId);
          persistSavedIds(revertSaved);
          return { savedIds: revertSaved };
        });
        throw new Error("auth_required");
      }
      // For other errors (network, backend down), keep the optimistic state
      // so the UI still works in dev/mock mode
    } finally {
      set((state) => {
        const doneToggling = new Set(state.togglingIds);
        doneToggling.delete(listingId);
        return { togglingIds: doneToggling };
      });
    }
  },

  isSaved: (listingId: number) => get().savedIds.has(listingId),

  isToggling: (listingId: number) => get().togglingIds.has(listingId),

  clear: () => {
    clearPersistedSavedIds();
    set({ savedIds: new Set(), isLoaded: false, togglingIds: new Set() });
  },
}));
