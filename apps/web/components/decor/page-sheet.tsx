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

// Solid surface for a page's body, floating over the background photo. Text on it keeps the
// theme's normal contrast; the photo shows above it and in the side margins.
export function PageSheet({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col bg-background shadow-2xl md:mx-[clamp(0.75rem,2.5vw,2.5rem)]",
        className
      )}
    >
      {children}
      <RoutePhotoCredit className="page-container pb-3 text-right text-muted-foreground hover:text-foreground" />
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
