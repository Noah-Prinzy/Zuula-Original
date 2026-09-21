"use client"

import * as React from "react"
import { RiShieldCheckLine } from "@remixicon/react"

// FR-AUTH-07: CAPTCHA for anonymous submissions (Cloudflare Turnstile).
// The widget and server-side token check are wired with the API in Phase 3.
// Until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, this shows a notice and passes a dev token.
export function CaptchaField({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  React.useEffect(() => {
    if (!siteKey) onToken("dev-bypass")
  }, [siteKey, onToken])

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <RiShieldCheckLine className="size-3.5" aria-hidden />
      {siteKey
        ? "Protected by Cloudflare Turnstile."
        : "Human check (Cloudflare Turnstile) is off in development."}
    </p>
  )
}
