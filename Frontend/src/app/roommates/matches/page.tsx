"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowLeft, Users, MessageCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useEffect } from "react";

export default function MyMatchesPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F4" }}>
      <div className="max-w-[700px] mx-auto px-4 md:px-6 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-white border border-black/[0.06] flex items-center justify-center text-[#1B2D45]/40 hover:text-[#FF6B35] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[#1B2D45]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em" }}>
              My Matches
            </h1>
            <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "13px" }}>
              Roommate matches and connections
            </p>
          </div>
        </div>

        {/* Empty / Coming Soon state */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}
        >
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FFB627]/10 flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7 text-[#FF6B35]" />
            </div>
            <h3 className="text-[#1B2D45] mt-5" style={{ fontSize: "20px", fontWeight: 800 }}>
              No matches yet
            </h3>
            <p className="text-[#1B2D45]/40 mt-2 max-w-[380px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.7 }}>
              Take the lifestyle quiz on the Roommates page and start expressing interest in compatible students. When it&apos;s mutual, your matches will appear here.
            </p>

            {/* How matching works */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-[420px] mx-auto">
              {[
                { icon: <Users className="w-4 h-4" />, label: "Take the quiz", desc: "2 min, 8 questions" },
                { icon: <Heart className="w-4 h-4" />, label: "Express interest", desc: "Swipe or tap" },
                { icon: <MessageCircle className="w-4 h-4" />, label: "Match & chat", desc: "When it's mutual" },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(255,107,53,0.08)", color: "#FF6B35" }}>
                    {step.icon}
                  </div>
                  <div className="text-[#1B2D45] mt-2" style={{ fontSize: "11px", fontWeight: 700 }}>{step.label}</div>
                  <div className="text-[#1B2D45]/30" style={{ fontSize: "10px" }}>{step.desc}</div>
                </div>
              ))}
            </div>

            <Link
              href="/roommates"
              className="inline-block mt-8 px-6 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(255,107,53,0.25)" }}
            >
              Find Roommates →
            </Link>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-[#2EC4B6]">
              <Shield className="w-3 h-3" />
              <span style={{ fontSize: "10px", fontWeight: 500 }}>Anonymous until mutual match · Messaging unlocks after</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}