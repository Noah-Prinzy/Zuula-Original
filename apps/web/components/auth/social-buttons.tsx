"use client"

import { RiFacebookFill, RiGoogleFill } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

// FR-AUTH-01: social login. OAuth is wired with the auth API in Phase 3.
export function SocialButtons({ disabled }: { disabled?: boolean }) {
  function notYet(provider: string) {
    toast.info(`${provider} sign-in isn't connected yet`, {
      description: "It will work once the authentication API is live.",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
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
