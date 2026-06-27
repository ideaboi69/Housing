"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const year = new Date().getFullYear();

  // Admin runs a dark shell, so the footer goes dark navy there instead of cream.
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  const linkClass = isAdmin
    ? "text-white/55 hover:text-[#FF6B35] transition-colors"
    : "text-[#1B2D45]/65 hover:text-[#FF6B35] transition-colors";

  return (
    <footer
      className={
        isAdmin
          ? "border-t border-white/[0.06] bg-[#1B2D45]"
          : "border-t border-[#1B2D45]/8 bg-[#FAF8F4]"
      }
    >
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-lg text-[#FF6b35] tracking-tight">
            cribb
          </span>
          <span className={`text-sm ${isAdmin ? "text-white/50" : "text-[#1B2D45]/50"}`}>
            © {year} · Student housing, finally done right.
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <Link href="/accessibility" className={linkClass}>
            Accessibility
          </Link>
          <a href="mailto:hello@findyourcribb.com" className={linkClass}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
