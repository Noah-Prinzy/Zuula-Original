"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { RESEND_SECONDS } from "@/lib/auth"

// Resend link with a cooldown so codes can't be spammed.
export function ResendCode({ destination }: { destination: string }) {
  const [wait, setWait] = React.useState(RESEND_SECONDS)
  const t = useTranslations("Auth.resend")

  React.useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  return (
    <p className="text-sm text-muted-foreground">
      {t("prompt")}{" "}
      {wait > 0 ? (
        <span className="tabular-nums">{t("wait", { seconds: wait })}</span>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={() => {
            setWait(RESEND_SECONDS)
            toast.success(t("sent"), { description: t("sentTo", { destination }) })
          }}
        >
          {t("action")}
        </Button>
      )}
    </p>
  )
}
