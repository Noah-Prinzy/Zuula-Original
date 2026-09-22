/* Zuula service worker: app-shell precache, offline fallback and recently viewed reports.
 *
 * - /_next/static/* and brand assets: cache-first (content-hashed, immutable).
 * - /_next/image: stale-while-revalidate, capped, so photos come back instantly offline.
 * - Public page navigations: network-first; the last good copy is served offline.
 *   Fact-check reports (/fact-checks/<id>) also go into a capped "reports" cache that the
 *   /offline page lists. Signed-in pages (account, review, admin) are never cached.
 * Bump VERSION to drop the shell and static caches on the next deploy.
 */
const VERSION = "v1"
const SHELL = `zuula-shell-${VERSION}`
const STATIC = `zuula-static-${VERSION}`
const PAGES = "zuula-pages"
const IMAGES = "zuula-images"
const REPORTS = "zuula-reports"

const OFFLINE_URL = "/offline"
const SHELL_URLS = ["/", OFFLINE_URL, "/fact-checks", "/manifest.webmanifest", "/brand/zuula-mark.svg", "/apple-icon.png"]
const MAX_PAGES = 40
const MAX_REPORTS = 30
const MAX_IMAGES = 80

// Pages safe to keep on a shared phone: public content only.
const PUBLIC_PAGE = /^\/($|fact-checks|verify|about|developers|legal|submissions)/
const REPORT_PAGE = /^\/fact-checks\/[^/]+\/?$/

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, STATIC, PAGES, IMAGES, REPORTS])
      for (const key of await caches.keys()) {
        if (key.startsWith("zuula-") && !keep.has(key)) await caches.delete(key)
      }
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(cacheFirst(request, STATIC))
  } else if (url.pathname === "/_next/image") {
    event.respondWith(staleWhileRevalidate(event, request, IMAGES, MAX_IMAGES))
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url))
  }
})

// Cache each shell page plus the scripts and styles it references, so /offline can render
// (and hydrate) without a network.
async function precacheShell() {
  const cache = await caches.open(SHELL)
  const staticCache = await caches.open(STATIC)
  await Promise.all(
    SHELL_URLS.map(async (path) => {
      try {
        const res = await fetch(path, { cache: "reload" })
        if (!res.ok) return
        await cache.put(path, res.clone())
        if (!(res.headers.get("content-type") || "").includes("text/html")) return
        const html = await res.text()
        const assets = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])
        await Promise.all(
          [...assets].map((asset) =>
            staticCache.add(asset).catch(() => {
              /* A missing chunk shouldn't fail the whole install. */
            })
          )
        )
      } catch {
        /* Offline during install: try again on the next registration. */
      }
    })
  )
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) (await caches.open(cacheName)).put(request, res.clone())
  return res
}

async function staleWhileRevalidate(event, request, cacheName, max) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        await cache.put(request, res.clone())
        await trim(cache, max)
      }
      return res
    })
    .catch(() => undefined)
  if (cached) {
    event.waitUntil(network)
    return cached
  }
  return (await network) || Response.error()
}

async function networkFirstPage(request, url) {
  const cacheable = PUBLIC_PAGE.test(url.pathname)
  try {
    const res = await fetch(request)
    if (cacheable && res.ok && res.type === "basic") {
      const stamped = await stamp(res.clone())
      const pages = await caches.open(PAGES)
      await pages.put(request, stamped.clone())
      await trim(pages, MAX_PAGES)
      if (REPORT_PAGE.test(url.pathname)) {
        const reports = await caches.open(REPORTS)
        // Re-insert so the most recently viewed report is last (trim drops the oldest).
        await reports.delete(request, { ignoreSearch: true })
        await reports.put(url.pathname, stamped)
        await trim(reports, MAX_REPORTS)
      }
    }
    return res
  } catch {
    const cached =
      (await caches.match(request, { ignoreSearch: true })) ||
      (REPORT_PAGE.test(url.pathname) && (await caches.match(url.pathname)))
    return cached || (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

// Record when a page was saved so the offline list can say "saved 2 hours ago".
async function stamp(res) {
  const headers = new Headers(res.headers)
  headers.set("x-zuula-saved-at", new Date().toISOString())
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers })
}

async function trim(cache, max) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}
