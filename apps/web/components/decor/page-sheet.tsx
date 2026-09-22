"use client"

import { KineticText } from "@/components/motion/text/kinetic-text"
import { cn } from "@/lib/utils"

import { PhotoCredit } from "./photo-hero"
import { useRoutePhoto } from "./route-backdrop"

// Page title set straight on the route's background photo (RouteBackdrop), in white.
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 page-container flex-col justify-end gap-2 py-10 text-white md:min-h-64 md:py-14",
        className
      )}
    >
      {eyebrow && (
        <p className="enter font-heading text-xs font-semibold tracking-widest text-white/80 uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance drop-shadow-sm [--kinetic-accent:var(--chart-1)] md:text-4xl xl:text-5xl">
        <KineticText text={title} delay={eyebrow ? 90 : 0} />
      </h1>
      {description && (
        <p className="enter max-w-2xl text-base text-balance text-white/85 [--d:3] md:text-lg">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

// Full-width surface for a page's body. Rather than a floating card cut off from the photo
// above it, the top fades from the photo into the theme background over ~10rem; past that the
// background is fully solid, so text and every real page element keep the theme's normal WCAG
// contrast, whatever the page's length. No shadow, no inset margins: it reads as a
// continuation of the hero, not a box sitting on top of it.
//
// A second, empty spacer below the content fades back out to the fixed backdrop, so the
// (also translucent) SiteFooter blends with the photo instead of butting into another solid
// block. It holds no content on purpose — content only ever sits on the fully solid section.
export function PageSheet({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("relative flex flex-col", className)}>
      <div className="flex flex-1 flex-col bg-[linear-gradient(to_bottom,transparent_0%,var(--background)_10rem,var(--background)_100%)]">
        {children}
        <RoutePhotoCredit className="page-container pb-3 text-right text-muted-foreground hover:text-foreground" />
      </div>
      <div
        aria-hidden
        className="h-32 bg-[linear-gradient(to_bottom,var(--background)_0%,transparent_100%)]"
      />
    </div>
  )
}

// Credit line for the current route's background photo.
export function RoutePhotoCredit({
  className,
  ...props
}: React.ComponentProps<"a">) {
  const entry = useRoutePhoto()
  if (!entry) return null
  return <PhotoCredit photo={entry.photo} className={className} {...props} />
}
