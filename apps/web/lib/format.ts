import { useMemo } from "react"
import { useLocale } from "next-intl"

import { TIME_ZONE } from "@/i18n/config"
import type { LocaleCode } from "@/lib/locales"

// Locale-aware dates and numbers that render identically on the server and in the browser.
//
// Browsers ship no date data for Luganda, Runyankore or Ateso (Node does), so formatting with
// those locales directly would print "Sebuttemba" on the server and "September" in the browser
// and break hydration. Instead everything is formatted with en-UG (day-month order, Ugandan
// grouping) and the month and weekday names are swapped for the table below, taken from CLDR.
// Acholi has no CLDR data yet and stays in English until names are supplied.
//
// Use useFormat() in components (server or client), getFormat() in async server components
// (lib/format.server.ts), or createFormat(locale) anywhere else.

const BASE = "en-UG"

type Names = { monthLong: string[]; monthShort: string[]; weekdayLong: string[]; weekdayShort: string[] }

// Index 0 = January / Sunday.
const NAMES: Partial<Record<LocaleCode, Names>> = {
  lg: {
    monthLong: ["Janwaliyo", "Febwaliyo", "Marisi", "Apuli", "Maayi", "Juuni", "Julaayi", "Agusito", "Sebuttemba", "Okitobba", "Novemba", "Desemba"],
    monthShort: ["Jan", "Feb", "Mar", "Apu", "Maa", "Juu", "Jul", "Agu", "Seb", "Oki", "Nov", "Des"],
    weekdayLong: ["Sabbiiti", "Balaza", "Lwakubiri", "Lwakusatu", "Lwakuna", "Lwakutaano", "Lwamukaaga"],
    weekdayShort: ["Sab", "Bal", "Lw2", "Lw3", "Lw4", "Lw5", "Lw6"],
  },
  nyn: {
    monthLong: ["Okwokubanza", "Okwakabiri", "Okwakashatu", "Okwakana", "Okwakataana", "Okwamukaaga", "Okwamushanju", "Okwamunaana", "Okwamwenda", "Okwaikumi", "Okwaikumi na kumwe", "Okwaikumi na ibiri"],
    monthShort: ["KBZ", "KBR", "KST", "KKN", "KTN", "KMK", "KMS", "KMN", "KMW", "KKM", "KNK", "KNB"],
    weekdayLong: ["Sande", "Orwokubanza", "Orwakabiri", "Orwakashatu", "Orwakana", "Orwakataano", "Orwamukaaga"],
    weekdayShort: ["SAN", "ORK", "OKB", "OKS", "OKN", "OKT", "OMK"],
  },
  teo: {
    monthLong: ["Orara", "Omuk", "Okwamg’", "Odung’el", "Omaruk", "Omodok’king’ol", "Ojola", "Opedel", "Osokosokoma", "Otibar", "Olabor", "Opoo"],
    monthShort: ["Rar", "Muk", "Kwa", "Dun", "Mar", "Mod", "Jol", "Ped", "Sok", "Tib", "Lab", "Poo"],
    weekdayLong: ["Nakaejuma", "Nakaebarasa", "Nakaare", "Nakauni", "Nakaung’on", "Nakakany", "Nakasabiti"],
    weekdayShort: ["Jum", "Bar", "Aar", "Uni", "Ung", "Kan", "Sab"],
  },
}

export type DateInput = Date | string | number

/** Ready-made date formats, so the app formats the same kind of date the same way everywhere. */
export const DATE_PRESETS = {
  /** 21 Sept 2026 */
  date: { dateStyle: "medium" },
  /** 21 September 2026 */
  long: { dateStyle: "long" },
  /** 21 Sept 2026, 14:05 */
  dateTime: { dateStyle: "medium", timeStyle: "short" },
  /** 14:05 */
  time: { timeStyle: "short" },
  /** 21 Sept */
  dayMonth: { day: "numeric", month: "short" },
  /** September 2026 */
  monthYear: { month: "long", year: "numeric" },
  /** Sept */
  month: { month: "short" },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type DatePreset = keyof typeof DATE_PRESETS

const toDate = (v: DateInput) => (v instanceof Date ? v : new Date(v))

// Month (0-11) and weekday (0-6) of a date as seen in Kampala.
function calendarParts(d: Date) {
  const parts = new Intl.DateTimeFormat(BASE, { timeZone: TIME_ZONE, month: "numeric", weekday: "short" })
    .formatToParts(d)
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.find((p) => p.type === "weekday")?.value.slice(0, 3) ?? ""
  )
  return { month, weekday }
}

export function createFormat(locale: LocaleCode) {
  const names = NAMES[locale]

  function date(value: DateInput, format: DatePreset | Intl.DateTimeFormatOptions = "date") {
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return ""
    const options = typeof format === "string" ? DATE_PRESETS[format] : format
    const fmt = new Intl.DateTimeFormat(BASE, { timeZone: TIME_ZONE, ...options })
    if (!names) return fmt.format(d)

    const english = new Intl.DateTimeFormat(BASE, { timeZone: TIME_ZONE, month: "long", weekday: "long" })
      .formatToParts(d)
    const longMonth = english.find((p) => p.type === "month")?.value
    const longWeekday = english.find((p) => p.type === "weekday")?.value
    const { month, weekday } = calendarParts(d)

    return fmt
      .formatToParts(d)
      .map((p) => {
        if (p.type === "month" && !/^\d+$/.test(p.value))
          return p.value === longMonth ? names.monthLong[month] : names.monthShort[month]
        if (p.type === "weekday")
          return p.value === longWeekday ? names.weekdayLong[weekday] : names.weekdayShort[weekday]
        return p.value
      })
      .join("")
  }

  return {
    locale,
    date,
    dateTime: (value: DateInput) => date(value, "dateTime"),
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(BASE, options).format(value),
    /** 0.87 → "87%" */
    percent: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(BASE, { style: "percent", maximumFractionDigits: 0, ...options }).format(value),
    /** 12400 → "12K" */
    compact: (value: number) => new Intl.NumberFormat(BASE, { notation: "compact" }).format(value),
    /**
     * The largest whole unit between `value` and `now`, for a translated message such as
     * t("Common.ago", { count, unit }). Browsers can't phrase relative time in Ugandan
     * languages, so the wording belongs in the messages files.
     */
    relative(value: DateInput, now: DateInput = Date.now()) {
      const seconds = Math.round((toDate(value).getTime() - toDate(now).getTime()) / 1000)
      const units = [
        ["year", 31536000],
        ["month", 2592000],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
      ] as const
      for (const [unit, size] of units)
        if (Math.abs(seconds) >= size) return { count: Math.trunc(seconds / size), unit }
      return { count: 0, unit: "minute" as const }
    },
  }
}

export type Format = ReturnType<typeof createFormat>

/** Formatter for the current UI language, in server or client components. */
export function useFormat(): Format {
  const locale = useLocale()
  return useMemo(() => createFormat(locale), [locale])
}
