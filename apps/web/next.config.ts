import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

// Where apps/api really lives (e.g. https://zuula-api.onrender.com), read at build time and
// never sent to the browser. When set, /api/v1/* on this site is proxied there, so the browser
// only talks to this origin and the API's SameSite=Lax session cookie is first-party even
// though the API is on another domain. Pair it with NEXT_PUBLIC_API_URL=/ (see lib/api.ts).
const apiOrigin = process.env.ZUULA_API_ORIGIN?.trim().replace(/\/+$/, "")

const nextConfig: NextConfig = {
  images: {
    // 90 keeps decorative photography crisp on high-DPI screens (components/decor).
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
    // Finer steps above 1200px so a device gets the width it needs rather than jumping to
    // 3840 (our originals top out at 3200, so larger widths would only re-send the same pixels).
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2400, 2880, 3200],
    // Photos are imported statically (content-hashed URLs), so optimised copies never go stale.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    if (!apiOrigin) return []
    // proxy.ts's matcher already skips /api, so next-intl never touches these paths.
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }]
  },
  async headers() {
    return [
      {
        // The service worker must always be re-checked, or clients keep an outdated one.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
