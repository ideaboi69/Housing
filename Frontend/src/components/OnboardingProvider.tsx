"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useOnboarding } from "@/hooks/useOnboarding";
import { WelcomeModal } from "@/components/ui/WelcomeModal";
import { GuidedTour } from "@/components/ui/GuidedTour";

export function OnboardingProvider() {
  const { user } = useAuthStore();
  const { hydrated, welcomeModalSeen, markWelcomeSeen } = useOnboarding();
  const pathname = usePathname();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Public visitors get the welcome modal on the landing page only.
    // Logged-in users get the guided tour instead.
    if (hydrated && !user && !welcomeModalSeen && pathname === "/") {
      const timer = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(timer);
    }
    if (user || pathname !== "/") {
      setShowWelcome(false);
    }
  }, [hydrated, pathname, user, welcomeModalSeen]);

  function handleClose() {
    setShowWelcome(false);
    markWelcomeSeen();
  }

  return (
    <>
      <AnimatePresence>
        {showWelcome && <WelcomeModal onClose={handleClose} />}
      </AnimatePresence>
      {/* Guided tour only for logged-in users, once per account */}
      {!showWelcome && user && <GuidedTour />}
    </>
  );
}
