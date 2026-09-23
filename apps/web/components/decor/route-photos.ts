import { LOCALES } from "@/lib/locales"

import { PHOTOS, type Photo } from "./photos"

export type RoutePhoto = {
  photo: Photo
  position?: string
  /** A muted loop played over the photo where conditions allow (RouteBackdrop). The photo
   *  stays as the poster and the fallback. */
  video?: RouteVideo
}

export type RouteVideo = {
  /** Path without extension: `${src}.webm` (VP9) and `${src}.mp4` (H.264) in public/videos,
   *  made with scripts/make-video-loop.sh. */
  src: string
  credit: { label: string; url: string }
}

// Sign-in and sign-up each get a looping background clip, a pair from the newsroom: pages
// turning for returning readers, the printing press for new sign-ups. Their follow-on steps
// (two-factor, verify) and the other auth pages keep a still photo.
const SIGN_IN_VIDEO: RouteVideo = {
  src: "/videos/pages-turning",
  credit: {
    label: "Mixkit",
    url: "https://mixkit.co/free-stock-video/book-pages-turning-close-up-17386/",
  },
}
const SIGN_UP_VIDEO: RouteVideo = {
  src: "/videos/printing-press",
  credit: {
    label: "Everett Bumstead / Pexels",
    url: "https://www.pexels.com/video/industrial-printing-press-operating-in-slow-motion-29906414/",
  },
}
export const ROUTE_VIDEOS = [SIGN_IN_VIDEO.src, SIGN_UP_VIDEO.src]

// One background photo per page (RouteBackdrop). The most specific prefix wins, so list
// longer paths first.
const ROUTES: [prefix: string, entry: RoutePhoto][] = [
  // Public
  ["/about", { photo: PHOTOS.ugandaHills, position: "center 60%" }],
  ["/fact-checks/", { photo: PHOTOS.kampalaSunset }],
  ["/fact-checks", { photo: PHOTOS.monitorFrontpages, position: "center 25%" }],
  ["/verify", { photo: PHOTOS.newspapers, position: "75% 45%" }],
  ["/developers", { photo: PHOTOS.worldWire }],
  // Auth
  ["/sign-in/two-factor", { photo: PHOTOS.crimsonWaves }],
  ["/sign-in", { photo: PHOTOS.teaRoad, video: SIGN_IN_VIDEO }],
  ["/sign-up/verify", { photo: PHOTOS.lakeVictoria }],
  ["/sign-up", { photo: PHOTOS.boatsSunset, video: SIGN_UP_VIDEO }],
  ["/forgot-password", { photo: PHOTOS.kampalaStreet }],
  ["/reset-password", { photo: PHOTOS.nightRoad }],
]

// These routes are content-dense or purely utilitarian; they skip the full-page backdrop photo
// entirely (RouteBackdrop renders nothing) instead of forcing a photo onto every screen.
const NO_PHOTO_PATHS = [
  "/offline",
  "/legal/privacy",
  "/legal/terms",
  "/submissions",
  "/account",
  "/admin",
  "/review",
]

const FALLBACK: RoutePhoto = { photo: PHOTOS.kampalaSkyline }

// Home: "/" in the address bar, or "/<locale>" after proxy.ts rewrites it on the server.
const HOME: RoutePhoto = { photo: PHOTOS.newspaperWall, position: "center 60%" }
const HOME_PATHS = new Set(["/", ...LOCALES.map((l) => `/${l.code}`)])

function matches(pathname: string, prefix: string) {
  return (
    pathname === prefix ||
    pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
  )
}

export function photoForPath(pathname: string): RoutePhoto | null {
  if (HOME_PATHS.has(pathname)) return HOME
  if (NO_PHOTO_PATHS.some((prefix) => matches(pathname, prefix))) return null
  for (const [prefix, entry] of ROUTES) {
    if (matches(pathname, prefix)) return entry
  }
  return FALLBACK
}
