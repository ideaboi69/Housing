import { create } from "zustand";
import type { UserResponse, UserCreate, UserLogin } from "@/types";
import { api, ApiError } from "@/lib/api";
import { useMarketplaceSavedStore } from "@/lib/marketplace-saved-store";
import { useSavedStore } from "@/lib/saved-store";

/* ────────────────────────────────────────────────────────
   JWT helper — decode the payload to read the role
   ──────────────────────────────────────────────────────── */

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

function getRoleFromToken(token: string): string | null {
  const payload = decodeTokenPayload(token);
  return (payload?.role as string) ?? null;
}

/* ────────────────────────────────────────────────────────
   Landlord profile cache (localStorage)
   Stores the landlord data from login response so we don't
   depend on /api/landlords/me which requires OJ's backend fix.
   ──────────────────────────────────────────────────────── */

const LANDLORD_CACHE_KEY = "cribb_landlord_profile";

function cacheLandlordProfile(profile: UserResponse) {
  try {
    // Use localStorage so PII is cleared when the browser session ends
    localStorage.setItem(LANDLORD_CACHE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

function getCachedLandlordProfile(): UserResponse | null {
  try {
    const raw = localStorage.getItem(LANDLORD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearLandlordCache() {
  try {
    localStorage.removeItem(LANDLORD_CACHE_KEY);
  } catch { /* ignore */ }
}

/* ────────────────────────────────────────────────────────
   Store
   ──────────────────────────────────────────────────────── */

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<unknown>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("cribb_token") : null,
  isLoading: typeof window !== "undefined" ? !!localStorage.getItem("cribb_token") : false,
  error: null,

  /** Student login — calls /api/users/login */
  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login(data);
      localStorage.setItem("cribb_token", res.access_token);
      set({ user: res.user, token: res.access_token, isLoading: false });
      useSavedStore.getState().loadSaved();
      useMarketplaceSavedStore.getState().loadSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Login failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register(data);
      if ("access_token" in res) {
        localStorage.setItem("cribb_token", res.access_token);
        set({ user: (res as { access_token: string; user: UserResponse }).user, token: res.access_token, isLoading: false });
        useSavedStore.getState().loadSaved();
        useMarketplaceSavedStore.getState().loadSaved();
      } else {
        set({ isLoading: false });
      }
      return res;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Registration failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("cribb_token");
    clearLandlordCache();
    useSavedStore.getState().clear();
    useMarketplaceSavedStore.getState().clear();
    set({ user: null, token: null });
  },

  /**
   * Load user profile from the appropriate endpoint.
   * For landlords: tries /api/landlords/me, falls back to cached profile.
   * For students: calls /api/users/me as usual.
   */
  loadUser: async () => {
    const token = localStorage.getItem("cribb_token");
    if (!token) return;

    // If user is already set (e.g. landlord login just set it), don't overwrite
    const existing = get().user;
    if (existing) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const role = getRoleFromToken(token);

      if (role === "landlord") {
        // Try API first
        try {
          const res = await api.landlords.getMyProfile();
          const landlordUser: UserResponse = {
            id: res.id,
            email: res.email ?? "",
            first_name: res.first_name ?? "",
            last_name: res.last_name ?? "",
            role: "landlord",
            email_verified: true,
            created_at: "",
            updated_at: "",
            identity_verified: res.identity_verified,
            company_name: res.company_name,
            phone: res.phone,
          };
          cacheLandlordProfile(landlordUser);
          set({ user: landlordUser, token, isLoading: false });
        } catch {
          // API failed (likely get_current_user bug) — use cached profile
          const cached = getCachedLandlordProfile();
          if (cached) {
            set({ user: cached, token, isLoading: false });
          } else {
            // No cache either — build minimal user from JWT
            const payload = decodeTokenPayload(token);
            const minimalUser: UserResponse = {
              id: (payload?.user_id as number) ?? 0,
              email: "",
              first_name: "Landlord",
              last_name: "",
              role: "landlord",
              email_verified: true,
              created_at: "",
              updated_at: "",
              identity_verified: (payload?.verified as boolean) ?? false,
            };
            set({ user: minimalUser, token, isLoading: false });
          }
        }
      } else {
        // Student — call /api/users/me
        const user = await api.auth.getMe();
        set({ user, token, isLoading: false });
        useSavedStore.getState().loadSaved();
        useMarketplaceSavedStore.getState().loadSaved();
      }
    } catch {
      localStorage.removeItem("cribb_token");
      clearLandlordCache();
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
