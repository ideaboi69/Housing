"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function MyRoommateGroupPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.replace("/login?next=/roommates/my-group");
      return;
    }

    if (user.role !== "student") {
      router.replace("/");
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function resolveGroup() {
      try {
        const group = await api.roommates.getMyGroup();
        if (cancelled) return;

        const destination = group.owner_id === currentUser.id
          ? `/roommates/groups/${group.id}/manage`
          : `/roommates/groups/${group.id}`;

        router.replace(destination);
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 404) {
          router.replace("/roommates");
          return;
        }

        router.replace("/dashboard");
      }
    }

    void resolveGroup();

    return () => {
      cancelled = true;
    };
  }, [isLoading, router, token, user]);

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto flex max-w-[780px] flex-col items-center justify-center px-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]">
          <Users className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.04em" }}>
          Opening your group
        </h1>
        <p className="mt-2 max-w-[360px] text-[#98A3B0]" style={{ fontSize: "14px", lineHeight: 1.6 }}>
          We&apos;re finding your active roommate group and taking you to the right page.
        </p>
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-[#FF6B35]" />
      </div>
    </div>
  );
}
