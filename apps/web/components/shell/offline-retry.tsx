"use client"

import { RiRefreshLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

export function OfflineRetry() {
  return (
    <Button onClick={() => window.location.reload()}>
      <RiRefreshLine aria-hidden />
      Try again
    </Button>
  )
}
