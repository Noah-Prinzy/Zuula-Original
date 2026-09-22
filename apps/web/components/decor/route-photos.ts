import { PHOTOS, type Photo } from "./photos"

export type RoutePhoto = { photo: Photo; position?: string }

// One background photo per page (RouteBackdrop). The most specific prefix wins, so list
// longer paths first. Home ("/") is left out: its full-screen hero brings its own photo.
const ROUTES: [prefix: string, entry: RoutePhoto][] = [
  // Public
  ["/about", { photo: PHOTOS.ugandaHills, position: "center 60%" }],
  ["/fact-checks/", { photo: PHOTOS.kampalaSunset }],
  ["/fact-checks", { photo: PHOTOS.newspapers }],
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
  ["/review", { photo: PHOTOS.journalists }],
  ["/admin/sources", { photo: PHOTOS.classroom }],
  ["/admin", { photo: PHOTOS.workshop }],
]

const FALLBACK: RoutePhoto = { photo: PHOTOS.kampalaSkyline }

export function photoForPath(pathname: string): RoutePhoto | null {
  if (pathname === "/") return null
  for (const [prefix, entry] of ROUTES) {
    if (
      pathname === prefix ||
      pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
    )
      return entry
  }
  return FALLBACK
}
