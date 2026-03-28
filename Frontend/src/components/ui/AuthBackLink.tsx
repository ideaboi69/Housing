"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthBackLink({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[#1B2D45]/48 hover:text-[#1B2D45]/72 transition-colors"
      style={{ fontSize: "13px", fontWeight: 700 }}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
