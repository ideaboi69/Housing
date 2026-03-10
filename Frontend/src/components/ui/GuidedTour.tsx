"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, ShieldCheck, Pin, LayoutGrid, MessageCircle, Users } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuthStore } from "@/lib/auth-store";
import { usePathname } from "next/navigation";

/* ═══════════════════════════════════════════════════════
   TOUR STEPS
   ═══════════════════════════════════════════════════════ */

interface TourStep {
  selector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: "[data-tour='health-score']",
    title: "Cribb Score",
    description: "Every listing is rated 0–100 based on maintenance, landlord responsiveness, and real tenant reviews. Green = great, red = be careful.",
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "#4ADE80",
  },
  {
    selector: "[data-tour='pin-to-board']",
    title: "Pin to Board",
    description: "Pin your favourite listings and compare them side-by-side — rent, amenities, Cribb Scores, and more. No more spreadsheets.",
    icon: <Pin className="w-5 h-5" />,
    color: "#FF6B35",
  },
  {
    selector: "[data-tour='view-switcher']",
    title: "Switch Views",
    description: "Board view for visual browsing, grid for quick scanning, or map to see locations. Pick what works for you.",
    icon: <LayoutGrid className="w-5 h-5" />,
    color: "#1B2D45",
  },
  {
    selector: "[data-tour='roommates']",
    title: "Find Roommates",
    description: "Take a 2-minute lifestyle quiz, get matched with compatible UofG students, and browse groups with open spots. Your vibe, your people.",
    icon: <Users className="w-5 h-5" />,
    color: "#2EC4B6",
  },
  {
    selector: "[data-tour='the-bubble']",
    title: "The Bubble",
    description: "Your campus community hub — events, deals, food recs, and discussions from real UofG students.",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "#6C5CE7",
  },
];

const PAD = 10;
const CARD_W = 320;
const CARD_GAP = 16;

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export function GuidedTour() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { hydrated, isTipSeen, markTipSeen } = useOnboarding();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const rafRef = useRef<number>(0);

  const tourSeen = isTipSeen("guided-tour");
  const shouldStart = hydrated && !!user && !tourSeen && pathname === "/browse";

  // Start tour
  useEffect(() => {
    if (!shouldStart) return;
    const timer = setTimeout(() => {
      setActive(true);
      document.body.style.overflow = "hidden";
    }, 1500);
    return () => clearTimeout(timer);
  }, [shouldStart]);

  // Measure target element
  const measure = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(TOUR_STEPS[step]?.selector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width,
        h: r.height,
      });
      // Scroll element into view
      const viewTop = r.top;
      const viewBottom = r.bottom;
      if (viewTop < 80 || viewBottom > window.innerHeight - 80) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Re-measure after scroll
        setTimeout(() => {
          const r2 = el.getBoundingClientRect();
          setRect({
            x: r2.left + window.scrollX,
            y: r2.top + window.scrollY,
            w: r2.width,
            h: r2.height,
          });
        }, 400);
      }
    }
  }, [active, step]);

  useEffect(() => {
    measure();
  }, [measure]);

  // Continuously track position (handles any layout shifts)
  useEffect(() => {
    if (!active) return;
    let running = true;
    function tick() {
      if (!running) return;
      const el = document.querySelector(TOUR_STEPS[step]?.selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({
          x: r.left + window.scrollX,
          y: r.top + window.scrollY,
          w: r.width,
          h: r.height,
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, step]);

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handleClose() {
    setActive(false);
    document.body.style.overflow = "";
    markTipSeen("guided-tour");
  }

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // Spotlight position (viewport-relative for fixed positioning)
  const el = document.querySelector(TOUR_STEPS[step]?.selector);
  const viewRect = el ? el.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };

  const sx = viewRect.left - PAD;
  const sy = viewRect.top - PAD;
  const sw = viewRect.width + PAD * 2;
  const sh = viewRect.height + PAD * 2;

  // Card position: try right of spotlight, then below, then left
  let cardTop = sy + sh / 2 - 100; // vertically center with spotlight
  let cardLeft = sx + sw + CARD_GAP;

  // If card goes off-screen right
  if (cardLeft + CARD_W > window.innerWidth - 20) {
    // Try left
    cardLeft = sx - CARD_W - CARD_GAP;
  }
  // If card goes off-screen left too, put below
  if (cardLeft < 20) {
    cardLeft = sx + sw / 2 - CARD_W / 2;
    cardTop = sy + sh + CARD_GAP;
  }
  // Clamp
  cardTop = Math.max(20, Math.min(cardTop, window.innerHeight - 260));
  cardLeft = Math.max(20, Math.min(cardLeft, window.innerWidth - CARD_W - 20));

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[500]">
          {/* SVG overlay with mask cutout */}
          <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <defs>
              <mask id="tour-mask">
                {/* White = visible (dark overlay shows), Black = hidden (spotlight hole) */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={sx}
                  y={sy}
                  width={sw}
                  height={sh}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0" y="0"
              width="100%" height="100%"
              fill="rgba(0,0,0,0.6)"
              mask="url(#tour-mask)"
            />
          </svg>

          {/* Clickable backdrop (closes tour) */}
          <div className="fixed inset-0" style={{ pointerEvents: "auto" }} onClick={handleClose} />

          {/* Spotlight glow border */}
          <motion.div
            className="fixed pointer-events-none"
            style={{
              top: sy,
              left: sx,
              width: sw,
              height: sh,
              borderRadius: 12,
              border: `2px solid ${currentStep.color}`,
              boxShadow: `0 0 24px ${currentStep.color}50, inset 0 0 24px ${currentStep.color}10`,
            }}
            key={`glow-${step}`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          />

          {/* Explanation card */}
          <motion.div
            className="fixed"
            style={{ top: cardTop, left: cardLeft, width: CARD_W, pointerEvents: "auto", zIndex: 510 }}
            key={`card-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div
              className="bg-white rounded-2xl p-5 relative"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.1)" }}
            >
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/[0.05] flex items-center justify-center text-[#1B2D45]/30 hover:text-[#1B2D45]/60 hover:bg-black/[0.1] transition-all"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${currentStep.color}18`, color: currentStep.color }}
              >
                {currentStep.icon}
              </div>

              {/* Text */}
              <h3 className="text-[#1B2D45] mt-3" style={{ fontSize: "17px", fontWeight: 800 }}>
                {currentStep.title}
              </h3>
              <p className="text-[#1B2D45]/50 mt-1.5" style={{ fontSize: "13px", lineHeight: 1.65 }}>
                {currentStep.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-5">
                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="transition-all duration-300"
                      style={{
                        width: i === step ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === step ? currentStep.color : "rgba(27,45,69,0.1)",
                      }}
                    />
                  ))}
                </div>

                {/* Next */}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
                  style={{
                    background: currentStep.color,
                    fontSize: "13px",
                    fontWeight: 700,
                    boxShadow: `0 4px 16px ${currentStep.color}35`,
                  }}
                >
                  {isLast ? "Got it!" : "Next"}
                  {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Skip */}
              <button
                onClick={handleClose}
                className="w-full text-center mt-3 text-[#1B2D45]/20 hover:text-[#1B2D45]/40 transition-all"
                style={{ fontSize: "11px", fontWeight: 500 }}
              >
                Skip tour
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}