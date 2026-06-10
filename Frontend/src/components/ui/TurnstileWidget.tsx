"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export function TurnstileWidget({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <div className="flex justify-center">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onExpire={() => onExpire?.()}
        options={{ theme: "light", size: "flexible" }}
      />
    </div>
  );
}
