import Link from "next/link"

import { ZuulaMark } from "@/components/brand/zuula-mark"
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
      className={cn("press flex items-center gap-2 font-heading [--press-tint:transparent] text-base font-bold tracking-wide", className)}
    >
      <ZuulaMark className="size-7" />
      {showWordmark && <span>ZUULA</span>}
    </Link>
  )
}
