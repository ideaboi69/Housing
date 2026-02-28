"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useOnboarding } from "@/hooks/useOnboarding";
import { WelcomeModal } from "@/components/ui/WelcomeModal";
import { GuidedTour } from "@/components/ui/GuidedTour";

export function OnboardingProvider() {
  const { user } = useAuthStore();
  const { hydrated, welcomeModalSeen, markWelcomeSeen } = useOnboarding();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Welcome modal shows for EVERYONE on first visit — logged in or not
    if (hydrated && !welcomeModalSeen) {
      const timer = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hydrated, welcomeModalSeen]);

  function handleClose() {
    setShowWelcome(false);
    markWelcomeSeen();
  }

  return (
    <>
      <AnimatePresence>
        {showWelcome && <WelcomeModal onClose={handleClose} />}
      </AnimatePresence>
      {/* Guided tour only for logged-in users, after welcome modal is done */}
      {!showWelcome && welcomeModalSeen && user && <GuidedTour />}
    </>
  );
}