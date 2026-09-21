import Image from "next/image"

import { SplitText } from "@/components/motion/split-text"
import { cn } from "@/lib/utils"

import { ParallaxLayer } from "./parallax"
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
  parallax,
  className,
  children,
}: {
  photo: Photo
  priority?: boolean
  position?: string
  scrim?: "dark" | "crimson"
  /** The photo is cropped to cover a tall section, so request more than 100vw to avoid upscaling. */
  sizes?: string
  /** On scroll, the photo drifts slower than the page and the content floats up over it. */
  parallax?: boolean
  className?: string
  children: React.ReactNode
}) {
  const image = (
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
  )

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-foreground text-white dark:bg-card",
        className
      )}
    >
      {parallax ? (
        <ParallaxLayer speed={0.4} className="absolute inset-0 -z-20">
          {image}
        </ParallaxLayer>
      ) : (
        image
      )}
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
      {parallax ? (
        // Fills the section so absolutely positioned children (e.g. a scroll cue) keep their place.
        <ParallaxLayer
          speed={-0.12}
          fade={0.5}
          className="flex flex-1 flex-col justify-center"
        >
          {children}
        </ParallaxLayer>
      ) : (
        children
      )}
      <PhotoCredit photo={photo} className="absolute right-3 bottom-2" />
    </section>
  )
}

// Page-title banner: a shorter PhotoHero used in place of PageHeader on public pages.
export function PhotoBanner({
  photo,
  title,
  description,
  position,
  eyebrow,
}: {
  photo: Photo
  title: string
  description?: string
  position?: string
  eyebrow?: string
}) {
  return (
    <PhotoHero photo={photo} priority position={position} className="border-b">
      <div className="flex min-h-56 page-container flex-col justify-end gap-2 py-10 md:min-h-72 md:py-14">
        {eyebrow && (
          <p className="enter font-heading text-xs font-semibold tracking-widest text-white/75 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance drop-shadow-sm md:text-4xl xl:text-5xl">
          <SplitText text={title} delay={eyebrow ? 90 : 0} />
        </h1>
        {description && (
          <p className="enter max-w-2xl text-base text-balance text-white/85 [--d:3] md:text-lg">
            {description}
          </p>
        )}
      </div>
    </PhotoHero>
  )
}
