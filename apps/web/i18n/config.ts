import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "@/lib/locales"

// UI language comes from a cookie, not the URL (no /lg/... prefixes). The cookie is set by
// the setLocale server action (i18n/actions.ts) and read per request in i18n/request.ts.
export { DEFAULT_LOCALE, LOCALES, type LocaleCode }

export const LOCALE_COOKIE = "NEXT_LOCALE"

// One zone for server and client so a date renders the same on both (no hydration drift).
export const TIME_ZONE = "Africa/Kampala"

export function isLocale(value: unknown): value is LocaleCode {
  return LOCALES.some((l) => l.code === value)
}
