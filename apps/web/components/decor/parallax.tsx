"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

// Moves its content as the enclosing section scrolls out of view. `speed` is a fraction of the
// scroll distance: positive lags behind (background), negative runs ahead (foreground).
// `fade` dims the layer towards the end of the section. Transform/opacity only, so layout
// is untouched; disabled under prefers-reduced-motion.
export function ParallaxLayer({
  speed,
  fade = 0,
  className,
  children,
}: {
  speed: number
  fade?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const section = el?.closest("section")
    if (!el || !section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const { top, height } = section.getBoundingClientRect()
      // Distance scrolled since the section came into view (from page load for a hero at the
      // top), capped at its height.
      const docTop = top + window.scrollY
      const start = Math.max(0, docTop - window.innerHeight)
      const scrolled = Math.min(Math.max(window.scrollY - start, 0), height)
      const progress = height ? scrolled / height : 0
      el.style.transform = `translate3d(0, ${(scrolled * speed).toFixed(1)}px, 0)`
      if (fade) el.style.opacity = String(1 - progress * fade)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [speed, fade])

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  )
}
