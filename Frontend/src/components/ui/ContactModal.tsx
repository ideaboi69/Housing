"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, LifeBuoy, PenLine, Handshake, Rocket, Mail } from "lucide-react";

/* The five @findyourcribb.com inboxes, each routed to the right team. */
const CONTACTS = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Questions about finding housing or using cribb.",
    email: "hello@findyourcribb.com",
    color: "#FF6B35",
  },
  {
    icon: LifeBuoy,
    title: "Site support",
    desc: "Something broken or not working right? Tell us.",
    email: "support@findyourcribb.com",
    color: "#2EC4B6",
  },
  {
    icon: PenLine,
    title: "Write for cribb",
    desc: "Interested in writing for The Bubble or creating with us.",
    email: "inquiries@findyourcribb.com",
    color: "#FFB627",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    desc: "Clubs and off-campus housing groups.",
    email: "partnerships@findyourcribb.com",
    color: "#4ADE80",
  },
  {
    icon: Rocket,
    title: "Founders",
    desc: "Investors and potential business partners.",
    email: "founders@findyourcribb.com",
    color: "#6C5CE7",
  },
];

export function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white w-full sm:max-w-[460px] rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-hidden flex flex-col"
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
              <div>
                <h3 className="text-[#1B2D45]" style={{ fontSize: "17px", fontWeight: 800 }}>Get in touch</h3>
                <p className="text-[#1B2D45]/50 mt-0.5" style={{ fontSize: "12px" }}>
                  Pick the right inbox and we&apos;ll get back to you.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-[#1B2D45]/50" />
              </button>
            </div>

            {/* Contact routes */}
            <div className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] sm:pb-5 space-y-2">
              {CONTACTS.map((c) => {
                const Icon = c.icon;
                return (
                  <a
                    key={c.email}
                    href={`mailto:${c.email}`}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[#1B2D45]/[0.06] hover:border-[#FF6B35]/25 hover:bg-[#FF6B35]/[0.02] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}14` }}>
                      <Icon className="w-4 h-4" style={{ color: c.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{c.title}</p>
                      <p className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "12px", lineHeight: 1.45 }}>{c.desc}</p>
                      <p className="text-[#FF6B35] mt-1 flex items-center gap-1 truncate" style={{ fontSize: "12px", fontWeight: 600 }}>
                        <Mail className="w-3 h-3 shrink-0" /> {c.email}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
