import { LOCALES } from "@/lib/locales"

import { PHOTOS, type Photo } from "./photos"

export type RoutePhoto = { photo: Photo; position?: string }

// One background photo per page (RouteBackdrop). The most specific prefix wins, so list
// longer paths first.
const ROUTES: [prefix: string, entry: RoutePhoto][] = [
  // Public
  ["/about", { photo: PHOTOS.ugandaHills, position: "center 60%" }],
  ["/fact-checks/", { photo: PHOTOS.kampalaSunset }],
  ["/fact-checks", { photo: PHOTOS.newspaperBundle }],
  ["/verify", { photo: PHOTOS.newspaperArchive, position: "center 30%" }],
  ["/developers", { photo: PHOTOS.worldWire }],
  // Auth
  ["/sign-in/two-factor", { photo: PHOTOS.crimsonWaves }],
  ["/sign-in", { photo: PHOTOS.teaRoad }],
  ["/sign-up/verify", { photo: PHOTOS.lakeVictoria }],
  ["/sign-up", { photo: PHOTOS.boatsSunset }],
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
  "/account/activity",
  "/account",
  "/admin/sources",
  "/admin",
]

const FALLBACK: RoutePhoto = { photo: PHOTOS.kampalaSkyline }

// Home: "/" in the address bar, or "/<locale>" after proxy.ts rewrites it on the server.
const HOME: RoutePhoto = { photo: PHOTOS.newspapers, position: "75% 45%" }
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
