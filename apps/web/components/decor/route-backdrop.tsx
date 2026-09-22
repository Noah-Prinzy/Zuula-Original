"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

import { PHOTO_QUALITY } from "./photo-hero"
import { photoForPath } from "./route-photos"

// The page's single background photo, pinned behind everything. A 60% black scrim keeps
// white text on it at WCAG AA for every photo in the set (checked over 99% of each image),
// in both themes; body copy sits on a solid PageSheet instead.
// `sizes` covers a 3:2 photo stretched to fill a portrait viewport, so phones aren't served
// an image narrower than they display (no upscaling blur).
export function RouteBackdrop() {
  const pathname = usePathname()
  const entry = photoForPath(pathname)
  if (!entry) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-foreground dark:bg-card"
    >
      <Image
        key={entry.photo.src.src}
        src={entry.photo.src}
        alt=""
        fill
        preload
        quality={PHOTO_QUALITY}
        sizes="max(100vw, 150vh)"
        className="object-cover"
        style={{ objectPosition: entry.position ?? "center" }}
      />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  )
}

export function useRoutePhoto() {
  return photoForPath(usePathname())
}
