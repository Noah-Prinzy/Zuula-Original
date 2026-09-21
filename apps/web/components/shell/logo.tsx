import Link from "next/link"
import { RiShieldCheckFill } from "@remixicon/react"

import { cn } from "@/lib/utils"

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <Link
      href="/"
      aria-label="Zuula home"
      className={cn("flex items-center gap-2 font-heading text-base font-bold tracking-wide", className)}
    >
      <span className="flex size-7 shrink-0 items-center justify-center bg-primary text-primary-foreground">
        <RiShieldCheckFill className="size-4" aria-hidden />
      </span>
      {showWordmark && <span>ZUULA</span>}
    </Link>
  )
}
