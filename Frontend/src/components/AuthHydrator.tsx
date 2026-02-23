"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useSavedStore } from "@/lib/saved-store";

export function AuthHydrator() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const token = useAuthStore((s) => s.token);
  const loadSaved = useSavedStore((s) => s.loadSaved);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Load saved listings whenever we have a token
  useEffect(() => {
    if (token) {
      loadSaved();
    }
  }, [token, loadSaved]);

  return null;
}