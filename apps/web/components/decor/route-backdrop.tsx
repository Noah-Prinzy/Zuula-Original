"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { PHOTO_QUALITY } from "./photo-hero"
import { photoForPath, ROUTE_VIDEOS } from "./route-photos"

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
      <BackdropVideos src={entry.video?.src} />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  )
}

export function useRoutePhoto() {
  return photoForPath(usePathname())
}

// Only play background video where it costs the viewer nothing they'd mind: not under
// prefers-reduced-motion, not with Data Saver on, and not on 2G/3G-class connections (common
// on Ugandan mobile data). Everyone else still gets the photo, which is also the poster.
type NetworkInformation = {
  saveData?: boolean
  effectiveType?: string
  addEventListener?: (t: "change", f: () => void) => void
  removeEventListener?: (t: "change", f: () => void) => void
}
const connection = () =>
  typeof navigator === "undefined"
    ? undefined
    : (navigator as Navigator & { connection?: NetworkInformation }).connection

function subscribe(onChange: () => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  motion.addEventListener("change", onChange)
  connection()?.addEventListener?.("change", onChange)
  return () => {
    motion.removeEventListener("change", onChange)
    connection()?.removeEventListener?.("change", onChange)
  }
}

// Whether this viewer gets background video at all (the credit line follows it too).
export function useBackdropVideoAllowed() {
  return useSyncExternalStore(subscribe, canPlayVideo, () => false)
}

function canPlayVideo() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false
  const c = connection()
  return !(c?.saveData || (c?.effectiveType && c.effectiveType !== "4g"))
}

const FADE_MS = 700

// Every background clip, so the one for the page you're heading to can be fetched ahead.
const ALL_VIDEOS = [...new Set(ROUTE_VIDEOS)]

type Layer = { src: string; playing: boolean; leaving: boolean }

// The route's clip, crossfaded: moving between sign-in and sign-up keeps the old clip on
// screen until the new one is playing, then fades the new one in over it (no flash of the
// photo in between); moving to a page without a clip fades it out. Clips are muted, looping
// and inline, so browsers allow autoplay, and greyscale, so the pair reads as one set.
// The layout that renders this persists across auth pages, so the state survives navigation.
function BackdropVideos({ src }: { src?: string }) {
  const allowed = useBackdropVideoAllowed()
  const wanted = allowed ? src : undefined
  const [layers, setLayers] = useState<Layer[]>([])
  const [seen, setSeen] = useState<string | undefined>(undefined)

  // New route clip (or none): stack it on top, or fade everything out.
  if (seen !== wanted) {
    setSeen(wanted)
    setLayers((ls) => {
      const kept = ls.filter((l) => l.src !== wanted)
      if (!wanted) return kept.map((l) => ({ ...l, leaving: true }))
      const existing = ls.find((l) => l.src === wanted)
      return [
        ...kept,
        existing
          ? { ...existing, leaving: false }
          : { src: wanted, playing: false, leaving: false },
      ]
    })
  }

  const top = layers.at(-1)
  const topReady = !!top && top.playing && !top.leaving

  // Once the top clip is showing, drop the ones underneath after the crossfade.
  useEffect(() => {
    if (!topReady || layers.length < 2) return
    const t = window.setTimeout(() => setLayers((ls) => ls.slice(-1)), FADE_MS)
    return () => window.clearTimeout(t)
  }, [topReady, layers.length])

  return (
    <>
      {layers.map((l) => {
        // Lower clips stay fully visible until they're removed: the top clip fades in over
        // them, so the photo never shows through mid-switch.
        const visible = !l.leaving && l.playing
        return (
          <video
            key={l.src}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="auto"
            onPlaying={() =>
              setLayers((ls) =>
                ls.map((x) => (x.src === l.src ? { ...x, playing: true } : x))
              )
            }
            onTransitionEnd={() => {
              if (l.leaving)
                setLayers((ls) => ls.filter((x) => x.src !== l.src))
            }}
            style={{ transitionDuration: `${FADE_MS}ms` }}
            className={cn(
              "absolute inset-0 size-full object-cover opacity-0 grayscale transition-opacity",
              visible && "opacity-100"
            )}
          >
            <VideoSources src={l.src} />
          </video>
        )
      })}
      {/* Warm the cache for the other clips once this one plays, so the switch is instant. */}
      {topReady &&
        ALL_VIDEOS.filter((v) => !layers.some((l) => l.src === v)).map((v) => (
          <video key={`preload:${v}`} muted preload="auto" className="hidden">
            <VideoSources src={v} />
          </video>
        ))}
    </>
  )
}

// VP9 WebM first (smaller, and plays in browsers without H.264), then H.264 MP4.
function VideoSources({ src }: { src: string }) {
  return (
    <>
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </>
  )
}
