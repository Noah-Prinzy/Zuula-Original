import { describe, expect, it } from "vitest"

import { isLink } from "./use-submission-form"

// The Home composer has one box for text and links; a lone link is submitted as a link.
describe("isLink", () => {
  it("accepts a lone http(s) link, ignoring surrounding whitespace", () => {
    expect(isLink("https://example.com/story")).toBe(true)
    expect(isLink("  http://monitor.co.ug/news?id=1 \n")).toBe(true)
  })

  it("rejects text that merely contains a link", () => {
    expect(isLink("Read this https://example.com/story")).toBe(false)
    expect(isLink("https://example.com and more")).toBe(false)
  })

  it("rejects other schemes and bare domains", () => {
    expect(isLink("ftp://example.com")).toBe(false)
    expect(isLink("example.com")).toBe(false)
    expect(isLink("")).toBe(false)
  })
})
