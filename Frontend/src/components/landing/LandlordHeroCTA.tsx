"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

/** Read the role claim straight from the stored JWT (client-only). */
function landlordFromToken(): boolean {
  try {
    const token = localStorage.getItem("cribb_token");
    if (!token) return false;
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload?.role === "landlord";
  } catch {
    return false;
  }
}

/**
 * Secondary landing-hero CTA.
 * Logged-out visitors get "I'm a Landlord" → landlord login.
 * A signed-in landlord gets "Landlord Dashboard" → their dashboard.
 *
 * We check both the auth store AND the JWT directly so the dashboard label
 * shows for every logged-in landlord — even before `loadUser()` resolves
 * (landlord login persists the token but doesn't populate the store synchronously).
 */
export function LandlordHeroCTA() {
  const user = useAuthStore((s) => s.user);
  const [isLandlord, setIsLandlord] = useState(false);

  useEffect(() => {
    setIsLandlord(user?.role === "landlord" || landlordFromToken());
  }, [user]);

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
