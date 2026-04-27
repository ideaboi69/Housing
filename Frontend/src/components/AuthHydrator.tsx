"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useMarketplaceSavedStore } from "@/lib/marketplace-saved-store";
import { useSavedStore } from "@/lib/saved-store";
import { useWriterStore } from "@/lib/store";

export function AuthHydrator() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const token = useAuthStore((s) => s.token);
  const loadSaved = useSavedStore((s) => s.loadSaved);
  const loadMarketplaceSaved = useMarketplaceSavedStore((s) => s.loadSaved);
  const loadWriter = useWriterStore((s) => s.loadWriter);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadWriter();
  }, [loadWriter]);

  // Load saved listings whenever we have a token
  useEffect(() => {
    if (token) {
      loadSaved();
      loadMarketplaceSaved();
    }
  }, [token, loadSaved, loadMarketplaceSaved]);

  return null;
}
