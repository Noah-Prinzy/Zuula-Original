"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useApiErrorMessage } from "@/hooks/use-api-error-message"
import { RESEND_SECONDS } from "@/lib/auth"

// Resend link with a cooldown so codes can't be spammed (the API enforces the same 30 s).
export function ResendCode({ destination, onResend }: { destination: string; onResend: () => Promise<unknown> }) {
  const [wait, setWait] = React.useState(RESEND_SECONDS)
  const [busy, setBusy] = React.useState(false)
  const t = useTranslations("Auth.resend")
  const apiMessage = useApiErrorMessage()

  React.useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  async function resend() {
    setBusy(true)
    try {
      await onResend()
      setWait(RESEND_SECONDS)
      toast.success(t("sent"), { description: t("sentTo", { destination }) })
    } catch (e) {
      toast.error(apiMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <p className="text-sm text-muted-foreground">
      {t("prompt")}{" "}
      {wait > 0 ? (
        <span className="tabular-nums">{t("wait", { seconds: wait })}</span>
      ) : (
        <Button type="button" variant="link" className="h-auto p-0" disabled={busy} onClick={() => void resend()}>
          {t("action")}
        </Button>
      )}
    </p>
  )
}
