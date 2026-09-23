import Image from "next/image"

import { cn } from "@/lib/utils"

import type { Photo } from "./photos"

// Quality 90 is allow-listed in next.config.ts (images.qualities).
export const PHOTO_QUALITY = 90

export function PhotoCredit({
  photo,
  className,
  ...props
}: { photo: Photo } & React.ComponentProps<"a">) {
  if (!photo.credit) return null
  return (
    <a
      {...props}
      href={`${photo.credit.url}?utm_source=zuula&utm_medium=referral`}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "text-[0.6875rem] text-white/70 underline-offset-2 hover:text-white hover:underline",
        className
      )}
    >
      Photo: {photo.credit.name} / Unsplash
    </a>
  )
}

// Scrim gradients. "dark" and "crimson" cover the whole photo evenly, for content that can sit
// anywhere on it. "subject" is for a photo whose subject must stay visible: it is heavy at the
// top, where the heading goes, clears across the middle band where the subject is framed, and
// darkens again at the bottom. Pair it with a layout that leaves that middle band empty.
const SCRIMS = {
  dark: "bg-linear-to-b from-black/60 via-black/40 to-black/75",
  crimson:
    "bg-linear-to-br from-primary/95 via-primary/80 to-black/70 dark:from-primary/90",
  subject:
    "bg-[linear-gradient(to_bottom,rgb(0_0_0/0.8)_0%,rgb(0_0_0/0.78)_26%,rgb(0_0_0/0.12)_38%,rgb(0_0_0/0.12)_62%,rgb(0_0_0/0.85)_100%)]",
} as const

// The same, applied from the lg breakpoint up (Tailwind needs each class spelled out in full).
const SCRIMS_LG = {
  dark: "lg:bg-linear-to-b lg:from-black/60 lg:via-black/40 lg:to-black/75",
  crimson:
    "lg:bg-linear-to-br lg:from-primary/95 lg:via-primary/80 lg:to-black/70 lg:dark:from-primary/90",
  subject:
    "lg:bg-[linear-gradient(to_bottom,rgb(0_0_0/0.8)_0%,rgb(0_0_0/0.78)_26%,rgb(0_0_0/0.12)_38%,rgb(0_0_0/0.12)_62%,rgb(0_0_0/0.85)_100%)]",
} as const

type Scrim = keyof typeof SCRIMS

// Full-bleed photographic backdrop behind light-on-dark content. The scrim keeps text readable
// over the photo, in both themes.
export function PhotoHero({
  photo,
  priority,
  position = "center",
  scrim = "dark",
  sizes = "max(100vw, 1600px)",
  className,
  mediaClassName,
  children,
}: {
  photo: Photo
  priority?: boolean
  position?: string
  /** One scrim, or one for phones/tablets and another from lg up (layouts often differ). */
  scrim?: Scrim | { base: Scrim; lg: Scrim }
  /** The photo is cropped to cover a tall section, so request more than 100vw to avoid upscaling. */
  sizes?: string
  className?: string
  /**
   * Classes for the photo layer (photo + scrim), which covers the whole section by default. Use
   * it to pin the photo to part of the section, or to swap the scrim at a breakpoint.
   */
  mediaClassName?: string
  children: React.ReactNode
}) {
  const [base, lg] = typeof scrim === "string" ? [scrim, null] : [scrim.base, scrim.lg]
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-foreground text-white dark:bg-card",
        className
      )}
    >
      <div className={cn("absolute inset-0 -z-10", mediaClassName)}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority={priority}
          quality={PHOTO_QUALITY}
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: position }}
        />
        <div aria-hidden className={cn("absolute inset-0", SCRIMS[base], lg && SCRIMS_LG[lg])} />
      </div>
      {children}
      <PhotoCredit photo={photo} className="absolute right-3 bottom-2" />
    </section>
  )
}
