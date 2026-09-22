import { beforeEach, describe, expect, it, vi } from "vitest"

// Stand-ins for the Next.js request APIs: the test sets the cookie jar per case.
const jar = new Map<string, string>()
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
  }),
}))
vi.mock("next-intl/server", () => ({ getRequestConfig: (fn: unknown) => fn }))

vi.mock("../messages/en.json", () => ({
  default: { Common: { save: "Save", cancel: "Cancel" }, Nav: { home: "Home" } },
}))
vi.mock("../messages/lg.json", () => ({ default: { Common: { save: "Tereka" } } }))

import { setLocaleCookie } from "./actions"
import { isLocale, LOCALE_COOKIE, TIME_ZONE } from "./config"
import { deepMerge } from "./merge"
import getConfig from "./request"

type Config = { locale: string; messages: Record<string, unknown>; timeZone: string; getMessageFallback: (info: { namespace?: string; key: string }) => string }
const load = () => (getConfig as unknown as () => Promise<Config>)()

beforeEach(() => jar.clear())

describe("deepMerge", () => {
  it("overrides leaves and keeps keys missing from the override", () => {
    expect(deepMerge({ a: { b: "1", c: "2" }, d: "3" }, { a: { b: "x" } })).toEqual({ a: { b: "x", c: "2" }, d: "3" })
  })

  it("does not mutate the base", () => {
    const base = { a: { b: "1" } }
    deepMerge(base, { a: { b: "2" } })
    expect(base.a.b).toBe("1")
  })
})

describe("isLocale", () => {
  it("accepts only the five app languages", () => {
    for (const l of ["en", "lg", "ach", "nyn", "teo"]) expect(isLocale(l)).toBe(true)
    for (const l of ["fr", "", undefined, null, 1]) expect(isLocale(l)).toBe(false)
  })
})

describe("request config", () => {
  it("defaults to English without a cookie, in Kampala time", async () => {
    const c = await load()
    expect(c.locale).toBe("en")
    expect(c.timeZone).toBe(TIME_ZONE)
    expect(c.messages).toEqual({ Common: { save: "Save", cancel: "Cancel" }, Nav: { home: "Home" } })
  })

  it("ignores an unknown cookie value", async () => {
    jar.set(LOCALE_COOKIE, "fr")
    expect((await load()).locale).toBe("en")
  })

  it("uses the cookie's language and falls back to English per key", async () => {
    jar.set(LOCALE_COOKIE, "lg")
    const c = await load()
    expect(c.locale).toBe("lg")
    expect(c.messages).toEqual({ Common: { save: "Tereka", cancel: "Cancel" }, Nav: { home: "Home" } })
  })

  it("warns about a missing message instead of throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const c = (await load()) as Config & { onError: (e: Error) => void }
    c.onError(new Error("MISSING_MESSAGE: Nav.missing"))
    expect(warn).toHaveBeenCalledWith("[i18n] MISSING_MESSAGE: Nav.missing")
  })

  it("shows the key path when a message is missing everywhere", async () => {
    const c = await load()
    expect(c.getMessageFallback({ namespace: "Nav", key: "missing" })).toBe("Nav.missing")
    expect(c.getMessageFallback({ key: "orphan" })).toBe("orphan")
  })
})

describe("setLocaleCookie", () => {
  it("stores a valid language and ignores anything else", async () => {
    await setLocaleCookie("teo")
    expect(jar.get(LOCALE_COOKIE)).toBe("teo")
    await setLocaleCookie("xx")
    expect(jar.get(LOCALE_COOKIE)).toBe("teo")
  })
})
