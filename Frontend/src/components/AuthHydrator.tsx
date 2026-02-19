"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function AuthHydrator() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return null;
}
