"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, BarChart3, Heart, ArrowRight, ArrowLeft, Sparkles, MessageCircle, ShoppingBag } from "lucide-react";

interface WelcomeModalProps {
  onClose: () => void;
}

const slides = [
  {
    icon: <ShieldCheck className="w-7 h-7" />,
    iconBg: "from-[#4ADE80]/15 to-[#2EC4B6]/15",
    iconColor: "#4ADE80",
    title: "Every listing has a Health Score",
    description:
      "We rate every listing on maintenance, responsiveness, and tenant satisfaction so you know exactly what you're getting — before you sign.",
    visual: (
      <div className="flex items-center justify-center gap-3 mt-5">
        {[
          { score: 95, label: "College Ave", color: "#4ADE80" },
          { score: 72, label: "Gordon St", color: "#FFB627" },
          { score: 41, label: "Edinburgh", color: "#E71D36" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-black/[0.04] p-3 text-center w-[90px]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div className="relative w-10 h-10 mx-auto">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1B2D45" strokeOpacity="0.04" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${item.score} 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "9px", fontWeight: 800, color: item.color }}>{item.score}</span>
            </div>
            <div className="text-[#1B2D45]/40 mt-1.5" style={{ fontSize: "9px", fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <BarChart3 className="w-7 h-7" />,
    iconBg: "from-[#FF6B35]/15 to-[#FFB627]/15",
    iconColor: "#FF6B35",
    title: "Pin, compare, decide",
    description:
      "Pin your favourite listings to the board and compare them side-by-side — rent, amenities, health scores, everything. No more spreadsheets.",
    visual: (
      <div className="mt-5 bg-white rounded-xl border border-black/[0.04] p-3 max-w-[260px] mx-auto" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-[#FF6B35]/10 flex items-center justify-center"><Sparkles className="w-3 h-3 text-[#FF6B35]" /></div>
          <span className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>Compare Board</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {["Rent", "Score", "Distance"].map((label) => (
            <div key={label} className="text-center">
              <div className="text-[#1B2D45]/25 mb-1" style={{ fontSize: "8px", fontWeight: 600 }}>{label}</div>
              {[1, 2, 3].map((row) => (
                <div key={row} className={`h-4 rounded mb-0.5 ${row === 1 ? "bg-[#4ADE80]/15" : "bg-[#FAF8F4]"}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <Heart className="w-7 h-7" />,
    iconBg: "from-[#FF6B35]/15 to-[#E71D36]/15",
    iconColor: "#FF6B35",
    title: "Find your perfect roommate",
    description:
      "Take a 2-minute lifestyle quiz and get matched with UofG students who actually live like you. Anonymous until it's mutual.",
    visual: (
      <div className="mt-5 flex items-center justify-center gap-3">
        <div className="bg-white rounded-xl border border-black/[0.04] p-3 w-[110px]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center mx-auto">
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>Y</span>
          </div>
          <div className="text-center mt-2">
            <div className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>You</div>
            <div className="flex flex-wrap gap-0.5 justify-center mt-1">
              {["🌙", "🧹", "🚭"].map((e) => (
                <span key={e} className="px-1.5 py-0.5 rounded bg-[#FAF8F4]" style={{ fontSize: "9px" }}>{e}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="px-2 py-1 rounded-full bg-[#4ADE80] text-white" style={{ fontSize: "10px", fontWeight: 700 }}>94%</div>
          <div className="w-8 border-t border-dashed border-[#4ADE80]/40" />
        </div>
        <div className="bg-white rounded-xl border border-[#4ADE80]/20 p-3 w-[110px]" style={{ boxShadow: "0 2px 8px rgba(74,222,128,0.08)" }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2EC4B6]/20 to-[#4ADE80]/20 flex items-center justify-center mx-auto">
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#2EC4B6" }}>A</span>
          </div>
          <div className="text-center mt-2">
            <div className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>Alex T.</div>
            <div className="flex flex-wrap gap-0.5 justify-center mt-1">
              {["🌙", "✨", "🚭"].map((e) => (
                <span key={e} className="px-1.5 py-0.5 rounded bg-[#4ADE80]/[0.06]" style={{ fontSize: "9px" }}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <MessageCircle className="w-7 h-7" />,
    iconBg: "from-[#6C5CE7]/15 to-[#2EC4B6]/15",
    iconColor: "#6C5CE7",
    title: "Your campus community",
    description:
      "The Bubble is your campus hub — events, deals, food recs, and discussions from UofG students. Plus buy & sell textbooks, furniture, and more in the Marketplace.",
    visual: (
      <div className="mt-5 flex items-center justify-center gap-3">
        {/* The Bubble preview */}
        <div className="bg-white rounded-xl border border-black/[0.04] p-3 w-[140px]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ fontSize: "12px" }}>💬</span>
            <span className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>The Bubble</span>
          </div>
          <div className="space-y-1.5">
            {[
              { emoji: "🎉", text: "Spring concert lineup...", cat: "#6C5CE7" },
              { emoji: "🍕", text: "Best late-night eats...", cat: "#E84393" },
              { emoji: "🏪", text: "20% off at...", cat: "#2EC4B6" },
            ].map((post) => (
              <div key={post.text} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#FAF8F4]">
                <span style={{ fontSize: "10px" }}>{post.emoji}</span>
                <span className="text-[#1B2D45]/50 truncate" style={{ fontSize: "8px" }}>{post.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Marketplace preview */}
        <div className="bg-white rounded-xl border border-black/[0.04] p-3 w-[140px]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBag className="w-3 h-3 text-[#2EC4B6]" />
            <span className="text-[#1B2D45]" style={{ fontSize: "10px", fontWeight: 700 }}>Marketplace</span>
          </div>
          <div className="space-y-1.5">
            {[
              { emoji: "📚", text: "Organic Chem textbook", price: "$25" },
              { emoji: "🪑", text: "IKEA desk + chair", price: "$60" },
              { emoji: "🖥️", text: "Dell monitor 24\"", price: "$80" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#FAF8F4]">
                <span style={{ fontSize: "10px" }}>{item.emoji}</span>
                <span className="text-[#1B2D45]/50 truncate flex-1" style={{ fontSize: "8px" }}>{item.text}</span>
                <span className="text-[#2EC4B6] shrink-0" style={{ fontSize: "8px", fontWeight: 700 }}>{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-[420px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Skip button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center text-[#1B2D45]/30 hover:text-[#1B2D45]/60 hover:bg-black/[0.08] transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Top badge */}
        <div className="pt-6 px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B35]/[0.06]">
            <Sparkles className="w-3 h-3 text-[#FF6B35]" />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#FF6B35" }}>Welcome to cribb</span>
          </div>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="px-6 pt-5 pb-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.iconBg} flex items-center justify-center mx-auto`} style={{ color: slide.iconColor }}>
              {slide.icon}
            </div>

            <h2 className="text-[#1B2D45] text-center mt-4" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.01em" }}>
              {slide.title}
            </h2>

            <p className="text-[#1B2D45]/45 text-center mt-2 max-w-[340px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.65 }}>
              {slide.description}
            </p>

            {/* Visual */}
            {slide.visual}
          </motion.div>
        </AnimatePresence>

        {/* Footer: dots + navigation */}
        <div className="px-6 pb-6 pt-2">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="transition-all"
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === current ? "#FF6B35" : "rgba(27,45,69,0.08)",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {current > 0 && (
              <button
                onClick={() => setCurrent((p) => p - 1)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/[0.06] text-[#1B2D45]/50 hover:text-[#1B2D45] hover:border-black/10 transition-all"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setCurrent((p) => p + 1);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
            >
              {isLast ? (
                <>Start Exploring <Sparkles className="w-3.5 h-3.5" /></>
              ) : (
                <>Next <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}