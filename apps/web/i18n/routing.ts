import { defineRouting } from "next-intl/routing"

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "./config"

// Locale lives in the NEXT_LOCALE cookie, never in the URL. proxy.ts rewrites each request
// internally to app/[locale]/…, so pages stay static per language while links stay /fact-checks.
export const routing = defineRouting({
  locales: LOCALES.map((l) => l.code),
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
  // Must stay on: it is what makes the proxy honour the NEXT_LOCALE cookie. Without a cookie
  // it falls back to Accept-Language, which in practice means English for almost everyone.
  localeDetection: true,
  localeCookie: { name: LOCALE_COOKIE, maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
  alternateLinks: false,
})
