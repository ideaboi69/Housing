"use client";

import { Turnstile } from "@marsidev/react-turnstile";

type Props = {
  onToken: (token: string) => void;
  onError?: () => void;
};

export function CaptchaWidget({ onToken, onError }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onToken}
      onError={onError}
      options={{ theme: "light", size: "flexible" }}
    />
  );
}
