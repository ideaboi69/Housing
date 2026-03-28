"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Menu, X, Settings, Bookmark, Heart, LogOut, ChevronDown,
  User, Shield, LayoutDashboard, MessageCircle, ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

const navItems = [
  { label: "Browse", path: "/browse" },
  { label: "Sublets", path: "/sublets" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Roommates", path: "/roommates" },
  { label: "The Bubble", path: "/the-bubble" },
];

/* ── Avatar helper ── */
function UserAvatar({ firstName, lastName, size = 34 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #FF6B35, #FFB627)",
        fontSize: `${size * 0.38}px`,
        fontWeight: 700,
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const isLandlord = user?.role === "landlord";
  const landlordTab = searchParams.get("tab");

  const allNavItems = isLandlord
    ? [{ label: "Dashboard", path: "/landlord" }, ...navItems]
    : navItems;

  // Poll unread message count
  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const data = isLandlord
        ? await api.messages.getLandlordUnreadCount()
        : await api.messages.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      // silently fail
    }
  }, [user, isLandlord]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Hide navbar on auth pages and admin — must be after all hooks
  const hideNavPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/landlord/login", "/landlord/signup", "/landlord/onboarding", "/writers/login", "/writers/signup", "/admin"];
  if (hideNavPaths.some((p) => pathname.startsWith(p))) {
    return null;
  }

  // Minimal navbar on landing page — just logo + auth buttons
  if (pathname === "/" && !user) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-6 h-[64px] md:h-[72px]">
          <Link href="/" className="text-[#FF6B35]" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            cribb
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/writers/login"
              className="hidden sm:inline-block px-4 py-2 rounded-xl text-[#1B2D45]/50 hover:text-[#1B2D45] hover:bg-[#1B2D45]/5 transition-all"
              style={{ fontSize: "15px", fontWeight: 500 }}
            >
              For Writers
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-[#1B2D45]/70 hover:text-[#1B2D45] hover:bg-[#1B2D45]/5 transition-all"
              style={{ fontSize: "15px", fontWeight: 600 }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
              style={{ fontSize: "15px", fontWeight: 700, boxShadow: "0 2px 12px rgba(255,107,53,0.3)" }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const dropdownLinks = isLandlord
    ? [
        { label: "Dashboard", href: "/landlord", icon: LayoutDashboard },
        { label: "Messages", href: "/landlord?tab=messages", icon: MessageCircle },
        { label: "Settings", href: "/landlord?tab=settings", icon: Settings },
      ]
    : [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Messages", href: "/messages", icon: MessageCircle },
        { label: "Saved Listings", href: "/saved", icon: Bookmark },
        { label: "Your Listings", href: "/marketplace/my", icon: ShoppingBag },
        { label: "My Group", href: "/roommates", icon: Heart },
        { label: "Settings", href: "/settings", icon: Settings },
      ];

  const isDropdownLinkActive = (href: string) => {
    if (href.startsWith("/landlord?tab=")) {
      return pathname === "/landlord" && landlordTab === href.split("tab=")[1];
    }
    return pathname === href;
  };

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
                data-tour={item.label === "The Bubble" ? "the-bubble" : item.label === "Roommates" ? "roommates" : undefined}
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
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {/* Message icon */}
              <Link
                href={isLandlord ? "/landlord?tab=messages" : "/messages"}
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  (!isLandlord && pathname === "/messages") || (isLandlord && pathname === "/landlord" && landlordTab === "messages")
                    ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "text-[#1B2D45]/40 hover:bg-[#1B2D45]/5 hover:text-[#1B2D45]/60"
                }`}
              >
                <MessageCircle className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF6B35] text-white flex items-center justify-center"
                    style={{ fontSize: "9px", fontWeight: 800 }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

            <div className="relative" ref={dropdownRef}>
              {/* Avatar trigger */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#1B2D45]/[0.04] transition-all"
              >
                <UserAvatar firstName={user.first_name} lastName={user.last_name} />
                <span
                  className="text-[#1B2D45]/80 max-w-[120px] truncate"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  {user.first_name}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#1B2D45]/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+6px)] w-[260px] bg-white rounded-2xl border border-black/[0.06] overflow-hidden"
                  style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  {/* User info header */}
                  <div className="px-4 pt-4 pb-3 border-b border-black/[0.04]">
                    <div className="flex items-center gap-3">
                      <UserAvatar firstName={user.first_name} lastName={user.last_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[#98A3B0] truncate" style={{ fontSize: "11px" }}>
                          {user.email}
                        </p>
                      </div>
                      {user.email_verified && (
                        <div className="w-5 h-5 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0" title="Email verified">
                          <Shield className="w-3 h-3 text-[#2EC4B6]" />
                        </div>
                      )}
                    </div>
                    {!isLandlord && (
                      <Link
                        href="/writers/login"
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-[#FAF8F4] border border-[#E8E4DC] text-[#1B2D45]/60 hover:border-[#FF6B35]/30 hover:text-[#FF6B35] transition-all"
                        style={{ fontSize: "11px", fontWeight: 600 }}
                      >
                        <User className="w-3 h-3" />
                        Are you a writer?
                      </Link>
                    )}
                  </div>

                  {/* Links */}
                  <div className="py-1.5">
                    {dropdownLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = isDropdownLinkActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            isActive
                              ? "bg-[#FF6B35]/5 text-[#FF6B35]"
                              : "text-[#1B2D45]/70 hover:bg-[#1B2D45]/[0.03] hover:text-[#1B2D45]"
                          }`}
                          style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500 }}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-black/[0.04] py-1.5">
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-[#E71D36]/80 hover:bg-[#E71D36]/5 transition-colors"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
        <div className="md:hidden absolute top-[56px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] shadow-lg z-40 max-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            {/* User info on mobile */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-[#FAF8F4] rounded-xl">
                <UserAvatar firstName={user.first_name} lastName={user.last_name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[#98A3B0] truncate" style={{ fontSize: "11px" }}>
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Nav links */}
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

            {/* User-specific links on mobile */}
            {user && (
              <div className="border-t border-black/5 mt-2 pt-2 space-y-1">
                {dropdownLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = isDropdownLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                        isActive
                          ? "bg-[#FF6B35]/8 text-[#FF6B35]"
                          : "text-[#1B2D45]/60 hover:bg-[#1B2D45]/5"
                      }`}
                      style={{ fontSize: "14px", fontWeight: isActive ? 700 : 500 }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Auth actions */}
            <div className="flex items-center gap-2 pt-3 pb-1 px-2 border-t border-black/5 mt-2">
              {user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E71D36]/20 text-[#E71D36]/70"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  <LogOut className="w-4 h-4" />
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
