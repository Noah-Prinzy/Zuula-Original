"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import { PHOTO_QUALITY, PhotoCredit } from "./photo-hero"
import type { Photo } from "./photos"

// Crossfading full-bleed photos with a slow zoom. Holds on the first photo when the user
// prefers reduced motion or the tab is hidden.
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

  useEffect(() => {
    if (photos.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setActive((i) => (i + 1) % photos.length)
    }, interval)
    return () => window.clearInterval(id)
  }, [photos.length, interval])

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {photos.map((photo, i) => (
        <Image
          key={photo.credit.url}
          src={photo.src}
          alt=""
          fill
          priority={i === 0}
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
