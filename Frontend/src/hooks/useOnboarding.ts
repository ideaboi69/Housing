"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-store";

const PUBLIC_STORAGE_KEY = "cribb_onboarding_public";
const LEGACY_STORAGE_KEY = "cribb_onboarding";

interface OnboardingState {
  welcomeModalSeen: boolean;
  tipsSeen: string[];
}

function getStorageKey(userId?: number | null): string {
  return userId ? `cribb_onboarding_user_${userId}` : PUBLIC_STORAGE_KEY;
}

function getState(userId?: number | null): OnboardingState {
  if (typeof window === "undefined") return { welcomeModalSeen: false, tipsSeen: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) return JSON.parse(raw);
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) return JSON.parse(legacyRaw);
  } catch {}
  return { welcomeModalSeen: false, tipsSeen: [] };
}

function saveState(state: OnboardingState, userId?: number | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
}

export function useOnboarding() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [state, setState] = useState<OnboardingState>({ welcomeModalSeen: false, tipsSeen: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(getState(userId));
    setHydrated(true);
  }, [userId]);

  const markWelcomeSeen = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, welcomeModalSeen: true };
      saveState(next, userId);
      return next;
    });
  }, [userId]);

  const markTipSeen = useCallback((tipId: string) => {
    setState((prev) => {
      if (prev.tipsSeen.includes(tipId)) return prev;
      const next = { ...prev, tipsSeen: [...prev.tipsSeen, tipId] };
      saveState(next, userId);
      return next;
    });
  }, [userId]);

  const isTipSeen = useCallback(
    (tipId: string) => state.tipsSeen.includes(tipId),
    [state.tipsSeen]
  );

  const resetOnboarding = useCallback(() => {
    const fresh = { welcomeModalSeen: false, tipsSeen: [] };
    saveState(fresh, userId);
    setState(fresh);
  }, [userId]);

  return {
    hydrated,
    welcomeModalSeen: state.welcomeModalSeen,
    markWelcomeSeen,
    markTipSeen,
    isTipSeen,
    resetOnboarding,
  };
}
