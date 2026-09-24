import { describe, expect, it } from "vitest"

import { stripLocale } from "./locales"

// Server rendering sees proxy.ts's "/<locale>/..." paths; the browser sees "/...".
describe("stripLocale", () => {
  it("drops a leading locale segment", () => {
    expect(stripLocale("/en/about")).toBe("/about")
    expect(stripLocale("/ach/fact-checks/fc-1")).toBe("/fact-checks/fc-1")
    expect(stripLocale("/lg")).toBe("/")
  })

  it("leaves visitor paths and look-alikes alone", () => {
    expect(stripLocale("/")).toBe("/")
    expect(stripLocale("/about")).toBe("/about")
    expect(stripLocale("/english/news")).toBe("/english/news")
    expect(stripLocale("/fact-checks/en")).toBe("/fact-checks/en")
  })
})
