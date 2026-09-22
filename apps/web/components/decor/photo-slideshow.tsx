"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import { PHOTO_QUALITY, PhotoCredit } from "./photo-hero"
import type { Photo } from "./photos"

// Crossfading full-bleed photos with a slow zoom. Holds on the first photo when the user
// prefers reduced motion or the tab is hidden.
// Low bandwidth: only the current and next photos are mounted, and none are eager, so a
// slideshow hidden with display:none (e.g. the desktop panel on a phone) downloads nothing.
export function PhotoSlideshow({
  photos,
  interval = 6000,
  sizes = "100vw",
  className,
  creditClassName,
}: {
  photos: Photo[]
  interval?: number
  sizes?: string
  className?: string
  creditClassName?: string
}) {
  const [active, setActive] = useState(0)
  // Slides mounted so far: the current one plus the next, so it's ready before it fades in.
  const [mounted, setMounted] = useState(Math.min(2, photos.length))

  useEffect(() => {
    if (photos.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setActive((i) => {
          const next = (i + 1) % photos.length
          setMounted((m) => Math.min(photos.length, Math.max(m, next + 2)))
          return next
        })
    }, interval)
    return () => window.clearInterval(id)
  }, [photos.length, interval])

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {photos.slice(0, mounted).map((photo, i) => (
        <Image
          key={photo.credit.url}
          src={photo.src}
          alt=""
          fill
          quality={PHOTO_QUALITY}
          sizes={sizes}
          className={cn(
            "object-cover transition-[opacity,scale] ease-out motion-reduce:transition-none",
            i === active ? "scale-105 opacity-100" : "scale-100 opacity-0"
          )}
          style={{ transitionDuration: `1500ms, ${interval + 1500}ms` }}
        />
      ))}
      <PhotoCredit
        photo={photos[active]}
        tabIndex={-1}
        className={cn("absolute top-4 right-4 z-10", creditClassName)}
      />
    </div>
  )
}
