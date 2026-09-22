import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

// Reads the NEXT_LOCALE cookie and rewrites /fact-checks to /lg/fact-checks internally
// (the address bar keeps /fact-checks). See i18n/routing.ts.
export default createMiddleware(routing)

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
