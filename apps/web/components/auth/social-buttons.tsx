"use client"

import { RiFacebookFill, RiGoogleFill } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// FR-AUTH-01: social login. OAuth is wired with the auth API in Phase 3.
// Phones put these first (the forms order them with max-md:-order-1): one tap beats typing an
// address and password on a phone keyboard. The divider then sits below them and leads into
// the form, instead of above them after it.
export function SocialButtons({ disabled, className }: { disabled?: boolean; className?: string }) {
  const t = useTranslations("Auth.social")

  function notYet(provider: string) {
    toast.info(t("notConnected", { provider }), { description: t("notConnectedBody") })
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3 text-xs text-muted-foreground max-md:order-last">
        <span className="h-px flex-1 bg-border" />
        <span className="max-md:hidden">{t("divider")}</span>
        <span className="md:hidden">{t("dividerEmail")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="lg" disabled={disabled} onClick={() => notYet("Google")} className="max-md:h-12">
          <RiGoogleFill aria-hidden /> Google
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={disabled} onClick={() => notYet("Facebook")} className="max-md:h-12">
          <RiFacebookFill aria-hidden /> Facebook
        </Button>
      </div>
    </div>
  )
}
