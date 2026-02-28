"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cribb_onboarding";

interface OnboardingState {
  welcomeModalSeen: boolean;
  tipsSeen: string[];
}

function getState(): OnboardingState {
  if (typeof window === "undefined") return { welcomeModalSeen: false, tipsSeen: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { welcomeModalSeen: false, tipsSeen: [] };
}

function saveState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({ welcomeModalSeen: false, tipsSeen: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(getState());
    setHydrated(true);
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, welcomeModalSeen: true };
      saveState(next);
      return next;
    });
  }, []);

  const markTipSeen = useCallback((tipId: string) => {
    setState((prev) => {
      if (prev.tipsSeen.includes(tipId)) return prev;
      const next = { ...prev, tipsSeen: [...prev.tipsSeen, tipId] };
      saveState(next);
      return next;
    });
  }, []);

  const isTipSeen = useCallback(
    (tipId: string) => state.tipsSeen.includes(tipId),
    [state.tipsSeen]
  );

  const resetOnboarding = useCallback(() => {
    const fresh = { welcomeModalSeen: false, tipsSeen: [] };
    saveState(fresh);
    setState(fresh);
  }, []);

  return {
    hydrated,
    welcomeModalSeen: state.welcomeModalSeen,
    markWelcomeSeen,
    markTipSeen,
    isTipSeen,
    resetOnboarding,
  };
}