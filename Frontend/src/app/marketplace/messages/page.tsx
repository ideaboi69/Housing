"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplaceMessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conversation = params.get("conversation");
    router.replace(`/messages?type=marketplace${conversation ? `&conversation=${conversation}` : ""}`);
  }, [router]);

  return null;
}
