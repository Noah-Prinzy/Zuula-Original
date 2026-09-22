import { LOCALES } from "@/lib/locales"

import { PHOTOS, type Photo } from "./photos"

export type RoutePhoto = { photo: Photo; position?: string }

// One background photo per page (RouteBackdrop). The most specific prefix wins, so list
// longer paths first.
const ROUTES: [prefix: string, entry: RoutePhoto][] = [
  // Public
  ["/about", { photo: PHOTOS.ugandaHills, position: "center 60%" }],
  ["/fact-checks/", { photo: PHOTOS.kampalaSunset }],
  ["/fact-checks", { photo: PHOTOS.journalists }],
  ["/verify", { photo: PHOTOS.marketCall, position: "center 30%" }],
  ["/developers", { photo: PHOTOS.crimsonWaves }],
  ["/offline", { photo: PHOTOS.hillRoad }],
  ["/legal/privacy", { photo: PHOTOS.lakeVictoria }],
  ["/legal/terms", { photo: PHOTOS.nileBoat }],
  ["/submissions", { photo: PHOTOS.teaRoad }],
  // Auth
  [
    "/sign-in/two-factor",
    { photo: PHOTOS.phoneOnCrimson, position: "30% center" },
  ],
  ["/sign-in", { photo: PHOTOS.friendsPhone }],
  ["/sign-up/verify", { photo: PHOTOS.manTexting, position: "center 25%" }],
  ["/sign-up", { photo: PHOTOS.couplePhone }],
  ["/forgot-password", { photo: PHOTOS.kampalaStreet }],
  ["/reset-password", { photo: PHOTOS.nightRoad }],
  // Signed-in app
  ["/account/activity", { photo: PHOTOS.murchisonFalls }],
  ["/account", { photo: PHOTOS.boatsSunset }],
  ["/admin/sources", { photo: PHOTOS.classroom }],
  ["/admin", { photo: PHOTOS.workshop }],
]

const FALLBACK: RoutePhoto = { photo: PHOTOS.kampalaSkyline }

// Home: "/" in the address bar, or "/<locale>" after proxy.ts rewrites it on the server.
const HOME: RoutePhoto = { photo: PHOTOS.kampalaSkyline, position: "center 40%" }
const HOME_PATHS = new Set(["/", ...LOCALES.map((l) => `/${l.code}`)])

export function photoForPath(pathname: string): RoutePhoto | null {
  if (HOME_PATHS.has(pathname)) return HOME
  for (const [prefix, entry] of ROUTES) {
    if (
      pathname === prefix ||
      pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
    )
      return entry
  }
  return FALLBACK
}
