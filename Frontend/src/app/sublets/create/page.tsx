"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CalendarRange, ClipboardList, Home, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { CreateSubletForm } from "@/components/sublets/CreateSubletForm";

const steps = [
  {
    icon: ClipboardList,
    title: "Basics",
    copy: "Name the sublet, set the room type, and give students the essentials first.",
  },
  {
    icon: CalendarRange,
    title: "Dates and pricing",
    copy: "Capture the exact window, move-in date, and monthly cost clearly in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Amenities and house rules",
    copy: "This is where details like laundry, utilities, wifi, pets, and smoking rules become easier to trust.",
  },
  {
    icon: Camera,
    title: "Photos and publish",
    copy: "Add photos and publish from a focused flow instead of crowding the browse page.",
  },
];

export default function CreateSubletPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1220px] px-4 md:px-6 py-8 md:py-12">
        <Link
          href="/sublets"
          className="inline-flex items-center gap-2 text-[#1B2D45]/55 hover:text-[#1B2D45] transition-colors"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sublets
        </Link>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="self-start rounded-[28px] border border-black/[0.05] bg-white p-6 md:p-8"
            style={{ boxShadow: "0 20px 60px rgba(27,45,69,0.08)" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-3 py-1.5 text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Home className="w-3.5 h-3.5" />
              Post a Sublet
            </div>

            <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "clamp(30px, 4.8vw, 52px)", fontWeight: 900, lineHeight: 1.02 }}>
              Post your sublet in its own focused flow.
            </h1>

            <p className="mt-4 max-w-[34rem] text-[#1B2D45]/58" style={{ fontSize: "15px", lineHeight: 1.75 }}>
              Browsing and posting shouldn’t compete with each other. This page gives sublets their own cleaner creation flow.
            </p>

            <div className="mt-7 space-y-2.5">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl border border-black/[0.05] bg-[#FAF8F4] p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#FF6B35]" style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.12)" }}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="text-[#1B2D45]/35" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
                          STEP {index + 1}
                        </div>
                        <div className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[#1B2D45]/55" style={{ fontSize: "12.5px", lineHeight: 1.65 }}>
                      {step.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
          >
            <CreateSubletForm selectedRange={[4, 8]} redirectAfterCreate />
          </motion.section>
        </div>
      </div>
    </main>
  );
}
