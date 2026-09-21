import { cn } from "@/lib/utils"

import styles from "./zuula-mark.module.css"

// Brand crimson is fixed across themes. Geometry matches public/brand/zuula-mark-*.svg.
export const BRAND_CRIMSON = "#C70036"

type MarkProps = { className?: string; animated?: boolean }

/** Ring lens with a crimson check — light mode. The ring and handle use currentColor. */
export function ZuulaMarkLight({ className, animated }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {animated && <circle className={styles.ping} cx="26" cy="26" r="21" stroke={BRAND_CRIMSON} strokeWidth={2} />}
      <g className={cn(animated && styles.lens)}>
        <circle cx="26" cy="26" r="17" stroke="currentColor" strokeWidth={8} />
        <path d="M40 40 55 55" stroke="currentColor" strokeWidth={10} strokeLinecap="round" />
        <path
          className={cn(animated && styles.check)}
          pathLength={1}
          d="M18.5 26.5 23.5 31.5 33.5 21.5"
          stroke={BRAND_CRIMSON}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/** Solid crimson lens with a white check — dark mode. The handle uses currentColor. */
export function ZuulaMarkDark({ className, animated }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {animated && <circle className={styles.ping} cx="26" cy="26" r="21" stroke={BRAND_CRIMSON} strokeWidth={2} />}
      <g className={cn(animated && styles.lens)}>
        <path d="M38 38 55 55" stroke="currentColor" strokeWidth={11} strokeLinecap="round" />
        <circle cx="26" cy="26" r="21" fill={BRAND_CRIMSON} />
        <path
          className={cn(animated && styles.check)}
          pathLength={1}
          d="M16.5 26.5 23 33 36 20"
          stroke="#fff"
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/** Theme-aware mark: ring lens in light mode, solid lens in dark mode. Size it via className. */
export function ZuulaMark({ className, animated }: MarkProps) {
  return (
    <>
      <ZuulaMarkLight animated={animated} className={cn("shrink-0 dark:hidden", className)} />
      <ZuulaMarkDark animated={animated} className={cn("hidden shrink-0 dark:block", className)} />
    </>
  )
}

/** Single-colour ring lens (all currentColor) for watermarks on brand-coloured surfaces. */
export function ZuulaMarkOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" className={className} aria-hidden>
      <circle cx="26" cy="26" r="17" strokeWidth={8} />
      <path d="M40 40 55 55" strokeWidth={10} strokeLinecap="round" />
      <path d="M18.5 26.5 23.5 31.5 33.5 21.5" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
