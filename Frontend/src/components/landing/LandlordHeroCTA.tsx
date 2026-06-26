"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Secondary landing-hero CTA.
 * Logged-out visitors get "I'm a Landlord" → landlord login.
 * A signed-in landlord gets "Landlord Dashboard" → their dashboard.
 */
export function LandlordHeroCTA() {
  const user = useAuthStore((s) => s.user);
  const isLandlord = user?.role === "landlord";

  const href = isLandlord ? "/landlord" : "/landlord/login";
  const label = isLandlord ? "Landlord Dashboard →" : "I’m a Landlord →";

  return (
    <Link
      href={href}
      className="px-7 py-3.5 rounded-xl border-2 border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.03] transition-all inline-block text-center"
      style={{ fontSize: "16px", fontWeight: 600 }}
    >
      {label}
    </Link>
  );
}
