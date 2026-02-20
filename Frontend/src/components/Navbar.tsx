"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { label: "Browse", path: "/browse" },
  { label: "Sublets", path: "/sublets" },
  { label: "Roommates", path: "/roommates" },
  { label: "Demand Board", path: "/demand-board" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const isLandlord = user?.role === "landlord";

  // Add Dashboard link for landlords
  const allNavItems = isLandlord
    ? [{ label: "Dashboard", path: "/landlord" }, ...navItems]
    : navItems;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-6 h-[56px] md:h-[64px]">
        {/* Logo */}
        <Link
          href="/"
          className="text-[#FF6B35]"
          style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.04em" }}
        >
          cribb
        </Link>

        {/* Center nav – desktop */}
        <div className="hidden md:flex items-center gap-1">
          {allNavItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "text-[#1B2D45]/70 hover:text-[#1B2D45] hover:bg-[#1B2D45]/5"
                }`}
                style={{
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side – desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {!isLandlord && (
                <Link
                  href="/landlord/signup"
                  className="text-[#1B2D45]/40 hover:text-[#FF6B35] transition-colors px-2"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                >
                  Are you a landlord?
                </Link>
              )}
              <span
                className="text-[#1B2D45]/60 px-3"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                {user.first_name}
              </span>
              <button
                onClick={logout}
                className="px-5 py-2 rounded-xl border border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.03] transition-all"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 rounded-xl border border-[#1B2D45]/15 text-[#1B2D45] hover:border-[#1B2D45]/30 hover:bg-[#1B2D45]/[0.03] transition-all"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  boxShadow: "0 2px 12px rgba(255,107,53,0.35)",
                }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Hamburger – mobile */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#1B2D45]/60 hover:bg-[#1B2D45]/5 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[56px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] shadow-lg z-40">
          <div className="px-4 py-3 space-y-1">
            {allNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                      : "text-[#1B2D45]/70 hover:bg-[#1B2D45]/5"
                  }`}
                  style={{ fontSize: "15px", fontWeight: isActive ? 700 : 500 }}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center gap-2 pt-3 pb-1 px-2 border-t border-black/5 mt-2">
              {user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl border border-[#1B2D45]/15 text-[#1B2D45] text-center"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#1B2D45]/15 text-[#1B2D45] text-center"
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] text-white text-center"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
