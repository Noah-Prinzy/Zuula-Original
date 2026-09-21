import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, TIME_ZONE } from "./config"
import { deepMerge, type Messages } from "./merge"

export default getRequestConfig(async () => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(value) ? value : DEFAULT_LOCALE

  // Translations are drafts: any key missing from the active language falls back to English.
  const english = (await import("../messages/en.json")).default as Messages
  const messages =
    locale === DEFAULT_LOCALE
      ? english
      : deepMerge(english, (await import(`../messages/${locale}.json`)).default as Messages)

  return {
    locale,
    messages,
    timeZone: TIME_ZONE,
    // A key missing from English too: log it and show the key path rather than crash.
    onError(error) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] ${error.message}`)
    },
    getMessageFallback: ({ namespace, key }) => (namespace ? `${namespace}.${key}` : key),
  }
})
