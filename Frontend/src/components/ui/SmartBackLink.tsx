"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

interface SmartBackLinkProps {
  fallback: string;
  children: ReactNode;
  icon?: "arrow" | "chevron";
  iconClassName?: string;
  className?: string;
  style?: CSSProperties;
}

export function SmartBackLink({
  fallback,
  children,
  icon = "arrow",
  iconClassName = "w-4 h-4",
  className,
  style,
}: SmartBackLinkProps) {
  const router = useRouter();
  const Icon = icon === "chevron" ? ChevronLeft : ArrowLeft;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className} style={style}>
      <Icon className={iconClassName} />
      {children}
    </button>
  );
}
