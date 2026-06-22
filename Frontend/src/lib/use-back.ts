"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Navigate to the previous page.
 *
 * Uses real browser history when it exists, so "back" returns wherever the user
 * actually came from (e.g. the Properties tab, the Listings tab, a property page)
 * rather than always dumping them on the dashboard overview. On direct loads or
 * refreshes — where there is no in-app history — it falls back to a sensible
 * parent route instead.
 */
export function useBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router, fallback]);
}
