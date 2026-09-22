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

// Full-bleed photographic backdrop behind light-on-dark content. The scrim keeps text readable
// over any part of the photo, in both themes.
export function PhotoHero({
  photo,
  priority,
  position = "center",
  scrim = "dark",
  sizes = "max(100vw, 1600px)",
  className,
  children,
}: {
  photo: Photo
  priority?: boolean
  position?: string
  scrim?: "dark" | "crimson"
  /** The photo is cropped to cover a tall section, so request more than 100vw to avoid upscaling. */
  sizes?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-foreground text-white dark:bg-card",
        className
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        quality={PHOTO_QUALITY}
        sizes={sizes}
        className="-z-20 object-cover"
        style={{ objectPosition: position }}
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10",
          scrim === "dark" &&
            "bg-linear-to-b from-black/60 via-black/40 to-black/75",
          scrim === "crimson" &&
            "bg-linear-to-br from-primary/95 via-primary/80 to-black/70 dark:from-primary/90"
        )}
      />
      {children}
      <PhotoCredit photo={photo} className="absolute right-3 bottom-2" />
    </section>
  )
}
