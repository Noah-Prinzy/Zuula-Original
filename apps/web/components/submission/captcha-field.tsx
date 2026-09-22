"use client"

import * as React from "react"
import { RiShieldCheckLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

// FR-AUTH-07: CAPTCHA for anonymous submissions (Cloudflare Turnstile).
// The widget and server-side token check are wired with the API in Phase 3.
// Until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, this shows a notice and passes a dev token.
export function CaptchaField({ onToken }: { onToken: (token: string | null) => void }) {
  const t = useTranslations("Submit.captcha")
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  React.useEffect(() => {
    if (!siteKey) onToken("dev-bypass")
  }, [siteKey, onToken])

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <RiShieldCheckLine className="size-3.5" aria-hidden />
      {siteKey ? t("on") : t("off")}
    </p>
  )
}
