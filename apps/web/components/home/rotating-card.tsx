"use client"

import { Children, useEffect, useState } from "react"
import Link from "next/link"
import { RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine } from "@remixicon/react"

import { ScrambleText } from "@/components/motion/text/scramble-text"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

// A short, wide card whose slides rotate on their own (Home status cards). Rotation pauses while
// the pointer or keyboard focus is inside, when the tab is hidden, and under reduced motion.
export function RotatingCard({
  id,
  eyebrow,
  title,
  live,
  href,
  linkLabel,
  interval = 5000,
  className,
  style,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  live?: boolean
  href: string
  linkLabel: string
  interval?: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const slides = Children.toArray(children)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || paused || slides.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setInterval(() => {
      if (!document.hidden) api.scrollNext()
    }, interval)
    return () => window.clearInterval(timer)
  }, [api, paused, interval, slides.length])

  return (
    <section
      aria-labelledby={id}
      style={style}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false)
      }}
      className={cn(
        "enter flex min-w-0 flex-col border bg-background/95 text-left text-foreground shadow-2xl backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {live && (
            <span className="relative flex size-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
          <p className="shrink-0 font-heading text-[0.6875rem] font-semibold tracking-widest text-primary uppercase">
            <ScrambleText text={eyebrow} />
          </p>
          <h2 id={id} className="truncate font-heading text-sm font-bold">
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label="Previous"
            className="press grid size-6 place-items-center text-muted-foreground [--press-scale:0.85] hover:text-foreground"
          >
            <RiArrowLeftSLine className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center text-xs text-muted-foreground tabular-nums"
            // Announce only user-driven changes, not every automatic rotation.
            aria-live={paused ? "polite" : "off"}
          >
            {current + 1}/{slides.length}
          </span>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label="Next"
            className="press grid size-6 place-items-center text-muted-foreground [--press-scale:0.85] hover:text-foreground"
          >
            <RiArrowRightSLine className="size-4" aria-hidden />
          </button>
          <Link
            href={href}
            className="ml-2 hidden items-center gap-1 text-xs font-medium text-primary hover:underline sm:inline-flex"
          >
            {linkLabel} <RiArrowRightLine className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <Carousel setApi={setApi} opts={{ loop: true }} className="overflow-hidden">
        <CarouselContent className="ml-0">
          {slides.map((slide, i) => (
            <CarouselItem
              key={i}
              aria-label={`${i + 1} of ${slides.length}`}
              className="pl-0"
            >
              {slide}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
