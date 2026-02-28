"use client";

import { create } from "zustand";
import { api, ApiError } from "@/lib/api";

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
    try {
      const saved = await api.saved.getAll();
      set({
        savedIds: new Set(saved.map((s) => s.listing_id)),
        isLoaded: true,
      });
    } catch {
      // Not logged in or error — that's fine, start empty
      set({ savedIds: new Set(), isLoaded: true });
    }
  },

  toggleSave: async (listingId: number) => {
    const { savedIds, togglingIds } = get();
    if (togglingIds.has(listingId)) return; // Already in flight

    const wasSaved = savedIds.has(listingId);

    // Optimistic update
    const nextSaved = new Set(savedIds);
    const nextToggling = new Set(togglingIds);
    nextToggling.add(listingId);

    if (wasSaved) {
      nextSaved.delete(listingId);
    } else {
      nextSaved.add(listingId);
    }
    set({ savedIds: nextSaved, togglingIds: nextToggling });

    try {
      if (wasSaved) {
        await api.saved.unsave(listingId);
      } else {
        await api.saved.save(listingId);
      }
    } catch (err) {
      // Only revert on auth errors — keep optimistic state for network/backend failures
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        const revertSaved = new Set(get().savedIds);
        if (wasSaved) {
          revertSaved.add(listingId);
        } else {
          revertSaved.delete(listingId);
        }
        set({ savedIds: revertSaved });
        throw new Error("auth_required");
      }
      // For other errors (network, backend down), keep the optimistic state
      // so the UI still works in dev/mock mode
    } finally {
      const doneToggling = new Set(get().togglingIds);
      doneToggling.delete(listingId);
      set({ togglingIds: doneToggling });
    }
  },

  isSaved: (listingId: number) => get().savedIds.has(listingId),

  isToggling: (listingId: number) => get().togglingIds.has(listingId),

  clear: () => set({ savedIds: new Set(), isLoaded: false, togglingIds: new Set() }),
}));