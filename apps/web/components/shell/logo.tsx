import Link from "next/link"

import { cn } from "@/lib/utils"

// Brand crimson is fixed across themes (public/brand/*.svg share this geometry).
const BRAND = "#C70036"

/** Ring lens with a crimson check — light mode. */
function MarkLight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <circle cx="26" cy="26" r="17" stroke="currentColor" strokeWidth={8} />
      <path d="M40 40 55 55" stroke="currentColor" strokeWidth={10} strokeLinecap="round" />
      <path
        d="M18.5 26.5 23.5 31.5 33.5 21.5"
        stroke={BRAND}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Solid crimson lens with a white check — dark mode. */
function MarkDark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path d="M38 38 55 55" stroke="currentColor" strokeWidth={11} strokeLinecap="round" />
      <circle cx="26" cy="26" r="21" fill={BRAND} />
      <path
        d="M16.5 26.5 23 33 36 20"
        stroke="#fff"
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
      <MarkLight className="size-7 shrink-0 dark:hidden" />
      <MarkDark className="hidden size-7 shrink-0 dark:block" />
      {showWordmark && <span>ZUULA</span>}
    </Link>
  )
}
