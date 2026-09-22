// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl", () => ({ useLocale: () => "lg" }))

import { renderHook } from "@testing-library/react"

import { createFormat, DATE_PRESETS, useFormat } from "@/lib/format"
import { LOCALES } from "@/lib/locales"

// 11:05 UTC is 14:05 in Kampala (UTC+3). 21 Sept 2026 is a Monday.
const D = "2026-09-21T11:05:00Z"

describe("createFormat — dates", () => {
  it("formats English in Ugandan order and Kampala time", () => {
    const f = createFormat("en")
    expect(f.date(D)).toBe("21 Sept 2026")
    expect(f.date(D, "long")).toBe("21 September 2026")
    expect(f.dateTime(D)).toBe("21 Sept 2026, 14:05")
    expect(f.date(D, "time")).toBe("14:05")
    expect(f.date(D, "dayMonth")).toBe("21 Sept")
    expect(f.date(D, "monthYear")).toBe("September 2026")
  })

  it("uses the Kampala date near midnight UTC", () => {
    expect(createFormat("en").date("2026-09-21T22:30:00Z")).toBe("22 Sept 2026")
  })

  it.each([
    ["lg", "21 Sebuttemba 2026", "21 Seb 2026", "Bal 14:05"],
    ["nyn", "21 Okwamwenda 2026", "21 KMW 2026", "ORK 14:05"],
    ["teo", "21 Osokosokoma 2026", "21 Sok 2026", "Bar 14:05"],
  ] as const)("localises month and weekday names in %s", (locale, long, short, weekday) => {
    const f = createFormat(locale)
    expect(f.date(D, "long")).toBe(long)
    expect(f.date(D)).toBe(short)
    expect(f.date(D, { weekday: "short", hour: "2-digit", minute: "2-digit" })).toBe(weekday)
  })

  it("keeps numeric months numeric", () => {
    expect(createFormat("lg").date(D, { day: "2-digit", month: "2-digit", year: "numeric" })).toBe("21/09/2026")
  })

  it("falls back to English names for Acholi (no CLDR data)", () => {
    expect(createFormat("ach").date(D, "long")).toBe("21 September 2026")
  })

  it("accepts Date, string and timestamp input, and returns '' for invalid dates", () => {
    const f = createFormat("en")
    expect(f.date(new Date(D))).toBe(f.date(Date.parse(D)))
    expect(f.date("not a date")).toBe("")
  })

  it("has a preset for each documented format", () => {
    expect(Object.keys(DATE_PRESETS)).toEqual(["date", "long", "dateTime", "time", "dayMonth", "monthYear", "month"])
  })
})

describe("createFormat — numbers", () => {
  it.each(LOCALES.map((l) => l.code))("formats numbers the same way in %s", (locale) => {
    const f = createFormat(locale)
    expect(f.number(1234567.5)).toBe("1,234,567.5")
    expect(f.percent(0.87)).toBe("87%")
    expect(f.compact(12400)).toBe("12K")
  })
})

describe("createFormat — relative", () => {
  const f = createFormat("en")
  const now = "2026-09-21T12:00:00Z"

  it.each([
    ["2026-09-18T12:00:00Z", { count: -3, unit: "day" }],
    ["2026-09-21T09:00:00Z", { count: -3, unit: "hour" }],
    ["2026-09-21T11:59:30Z", { count: 0, unit: "minute" }],
    ["2026-10-05T12:00:00Z", { count: 2, unit: "week" }],
    ["2025-09-01T12:00:00Z", { count: -1, unit: "year" }],
  ])("%s → %o", (value, expected) => {
    expect(f.relative(value, now)).toEqual(expected)
  })
})

describe("useFormat", () => {
  it("formats in the current next-intl locale", () => {
    const { result } = renderHook(() => useFormat())
    expect(result.current.locale).toBe("lg")
    expect(result.current.date(D, "long")).toBe("21 Sebuttemba 2026")
  })
})
