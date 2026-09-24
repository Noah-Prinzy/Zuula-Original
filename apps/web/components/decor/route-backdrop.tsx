"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import { PHOTO_QUALITY } from "./photo-hero"
import { photoForPath, ROUTE_VIDEOS } from "./route-photos"
import { usePagePath } from "@/hooks/use-page-path"

// The page's single background photo, pinned behind everything. A 60% black scrim keeps
// white text on it at WCAG AA for every photo in the set (checked over 99% of each image),
// in both themes; body copy sits on a solid PageSheet instead.
// `sizes` covers a 3:2 photo stretched to fill a portrait viewport. On phones it asks for
// ~60% of that: behind the scrim, on 2–3x screens, that is still 1.2+ device pixels per CSS
// pixel, at well under half the bytes on mobile data.
// `className` re-positions it (e.g. inside the auth layout's media panel instead of the whole
// viewport); `scrimClassName` swaps the scrim where no text sits on the photo.
export function RouteBackdrop({
  className,
  scrimClassName = "bg-black/60",
}: {
  className?: string
  scrimClassName?: string
}) {
  const pathname = usePagePath()
  const entry = photoForPath(pathname)
  const allowed = useBackdropVideoAllowed()
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  )
  // Hydrating this late, the CSS fallback below has already faded the photo in: keep it.
  const [stalled, setStalled] = useState<string | undefined>(() =>
    typeof window !== "undefined" && performance.now() > STALL_MS
      ? entry?.video?.src
      : undefined
  )
  if (!entry || entry.ownHero) return null

  // Where a clip plays, the photo stays hidden: showing it first, then fading an unrelated
  // clip in over it, reads as a flash. It's still the fallback: shown for reduced motion
  // (in CSS), once we know the clip won't play here (Data Saver, slow connection), and if
  // the clip fails to start. Until hydration decides, a CSS animation shows it after
  // STALL_MS anyway, so a slow-loading page never sits on a bare background.
  const video = entry.video?.src
  const showPhoto = !video || (hydrated && (!allowed || stalled === video))

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 bg-foreground dark:bg-card",
        className
      )}
    >
      <Image
        key={entry.photo.src.src}
        src={entry.photo.src}
        alt=""
        fill
        preload
        quality={PHOTO_QUALITY}
        sizes="(max-width: 767px) max(60vw, 90vh), max(100vw, 150vh)"
        style={{
          objectPosition: entry.position ?? "center",
          transitionDuration: `${FADE_MS}ms`,
          animation:
            video && !hydrated
              ? `zuula-show ${FADE_MS}ms ${STALL_MS}ms forwards`
              : undefined,
        }}
        className={cn(
          "object-cover transition-opacity motion-reduce:opacity-100",
          !showPhoto && "opacity-0"
        )}
      />
      <BackdropVideos src={video} onStall={setStalled} />
      <div className={cn("absolute inset-0", scrimClassName)} />
    </div>
  )
}

export function useRoutePhoto() {
  return photoForPath(usePagePath())
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

const noSubscribe = () => () => {}

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
// A clip that hasn't started playing by now (failed, or autoplay blocked) shows the photo.
const STALL_MS = 4000

// Every background clip, so the one for the page you're heading to can be fetched ahead.
const ALL_VIDEOS = [...new Set(ROUTE_VIDEOS)]

type Layer = { src: string; playing: boolean; leaving: boolean }

// The route's clip, crossfaded: moving between sign-in and sign-up keeps the old clip on
// screen until the new one is playing, then fades the new one in over it (no flash of the
// photo in between); moving to a page without a clip fades it out. Clips are muted, looping
// and inline, so browsers allow autoplay, and greyscale, so the pair reads as one set.
// The layout that renders this persists across auth pages, so the state survives navigation.
function BackdropVideos({
  src,
  onStall,
}: {
  src?: string
  onStall: (src: string) => void
}) {
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

  useEffect(() => {
    if (!wanted || topReady) return
    const t = window.setTimeout(() => onStall(wanted), STALL_MS)
    return () => window.clearTimeout(t)
  }, [wanted, topReady, onStall])

  // Clips underneath are dropped when the top clip's fade-in finishes (transitionend, below);
  // this timer is only a fallback in case that event never fires.
  useEffect(() => {
    if (!topReady || layers.length < 2) return
    const t = window.setTimeout(
      () => setLayers((ls) => ls.slice(-1)),
      FADE_MS * 2
    )
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
              // The top clip is fully in: the ones underneath can go.
              else if (l.playing)
                setLayers((ls) =>
                  ls.at(-1)?.src === l.src ? ls.slice(-1) : ls
                )
            }}
            style={{ transitionDuration: `${FADE_MS}ms` }}
            className={cn(
              "absolute inset-0 size-full object-cover opacity-0 grayscale transition-opacity",
              visible && "opacity-100"
            )}
          >
            <VideoSources src={l.src} onError={() => onStall(l.src)} />
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

// VP9 WebM first (smaller, and plays in browsers without H.264), then H.264 MP4. A failed
// source reports on the <source>, not the <video>; the last one failing means none played.
function VideoSources({ src, onError }: { src: string; onError?: () => void }) {
  return (
    <>
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" onError={onError} />
    </>
  )
}
