"use client"

import { RiFacebookFill, RiGoogleFill } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

// FR-AUTH-01: social login. OAuth is wired with the auth API in Phase 3.
export function SocialButtons({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("Auth.social")

  function notYet(provider: string) {
    toast.info(t("notConnected", { provider }), { description: t("notConnectedBody") })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("divider")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="lg" disabled={disabled} onClick={() => notYet("Google")}>
          <RiGoogleFill aria-hidden /> Google
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={disabled} onClick={() => notYet("Facebook")}>
          <RiFacebookFill aria-hidden /> Facebook
        </Button>
      </div>
    </div>
  )
}
