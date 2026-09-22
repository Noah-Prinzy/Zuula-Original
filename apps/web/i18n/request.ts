import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, TIME_ZONE } from "./config"
import { deepMerge, type Messages } from "./merge"
import type en from "../messages/en.json"

export default getRequestConfig(async () => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(value) ? value : DEFAULT_LOCALE

  // Translations are drafts: any key missing from the active language falls back to English.
  // `Messages` is a loose shape for merging and doesn't structurally overlap the exact JSON
  // type global.d.ts augments next-intl with, so cast through `unknown` at both ends.
  const english = (await import("../messages/en.json")).default as unknown as Messages
  const messages =
    locale === DEFAULT_LOCALE
      ? english
      : deepMerge(english, (await import(`../messages/${locale}.json`)).default as unknown as Messages)

  return {
    locale,
    // deepMerge guarantees every English key is present, so this matches global.d.ts's type.
    messages: messages as unknown as typeof en,
    timeZone: TIME_ZONE,
    // A key missing from English too: log it and show the key path rather than crash.
    onError(error) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] ${error.message}`)
    },
    getMessageFallback: ({ namespace, key }) => (namespace ? `${namespace}.${key}` : key),
  }
})
