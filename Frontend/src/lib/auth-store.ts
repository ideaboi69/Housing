import { create } from "zustand";
import type { UserResponse, UserCreate, UserLogin } from "@/types";
import { api, ApiError } from "@/lib/api";

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<unknown>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("cribb_token") : null,
  isLoading: false,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login(data);
      localStorage.setItem("cribb_token", res.access_token);
      set({ user: res.user, token: res.access_token, isLoading: false });
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
      // New backend: returns { message, user_id } if email verification is required
      // Old backend: returns { access_token, token_type, user }
      if ("access_token" in res) {
        localStorage.setItem("cribb_token", res.access_token);
        set({ user: (res as { access_token: string; user: UserResponse }).user, token: res.access_token, isLoading: false });
      } else {
        // Email verification required — no token yet
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
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem("cribb_token");
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await api.auth.getMe();
      set({ user, token, isLoading: false });
    } catch {
      // Token is invalid/expired — clear it
      localStorage.removeItem("cribb_token");
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
