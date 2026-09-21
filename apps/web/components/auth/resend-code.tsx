"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { RESEND_SECONDS } from "@/lib/auth"

// Resend link with a cooldown so codes can't be spammed.
export function ResendCode({ destination }: { destination: string }) {
  const [wait, setWait] = React.useState(RESEND_SECONDS)

  React.useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  return (
    <p className="text-sm text-muted-foreground">
      Didn&apos;t get it?{" "}
      {wait > 0 ? (
        <span className="tabular-nums">Resend in {wait}s</span>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={() => {
            setWait(RESEND_SECONDS)
            toast.success("New code sent", { description: `Sent to ${destination}` })
          }}
        >
          Resend code
        </Button>
      )}
    </p>
  )
}
