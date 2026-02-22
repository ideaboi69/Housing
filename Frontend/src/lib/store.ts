"use client";

import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import type { WriterResponse } from "@/types";

interface WriterAuthState {
  writer: WriterResponse | null;
  writerToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadWriter: () => void;
  clearError: () => void;
}

export const useWriterStore = create<WriterAuthState>((set) => ({
  writer: null,
  writerToken: typeof window !== "undefined" ? localStorage.getItem("cribb_writer_token") : null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.writers.login({ username: email, password });
      localStorage.setItem("cribb_writer_token", res.access_token);
      localStorage.setItem("cribb_writer", JSON.stringify(res.writer));
      set({ writer: res.writer, writerToken: res.access_token, isLoading: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Login failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("cribb_writer_token");
    localStorage.removeItem("cribb_writer");
    set({ writer: null, writerToken: null });
  },

  loadWriter: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("cribb_writer_token");
    const writerStr = localStorage.getItem("cribb_writer");
    if (token && writerStr) {
      try {
        const writer = JSON.parse(writerStr) as WriterResponse;
        set({ writer, writerToken: token });
      } catch {
        localStorage.removeItem("cribb_writer_token");
        localStorage.removeItem("cribb_writer");
      }
    }
  },

  clearError: () => set({ error: null }),
}));