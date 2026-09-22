import { describe, expect, it } from "vitest"

import en from "@/messages/en.json"
import { APP_NAV, isActivePath, isInSection, PUBLIC_NAV, ROUTE_KEYS, ROUTE_TITLES } from "@/lib/navigation"

describe("navigation data", () => {
  it("links every nav item to a translation key that exists in English", () => {
    const items = en.Nav.items as Record<string, string>
    const groups = en.Nav.groups as Record<string, string>
    for (const item of [...PUBLIC_NAV, ...APP_NAV.flatMap((g) => g.items)]) expect(items[item.key]).toBeTruthy()
    for (const group of APP_NAV) expect(groups[group.key]).toBeTruthy()
  })

  it("has a breadcrumb title and key for every app route", () => {
    for (const href of [...APP_NAV.map((g) => g.href), ...APP_NAV.flatMap((g) => g.items.map((i) => i.href))]) {
      expect(ROUTE_TITLES[href]).toBeTruthy()
      expect(ROUTE_KEYS[href]).toMatch(/^(items|groups)\./)
    }
    // Section roots are labelled with the section, not the page.
    expect(ROUTE_TITLES["/admin"]).toBe("Admin")
  })
})

describe("isActivePath", () => {
  it.each([
    ["/", "/", true],
    ["/verify", "/", false],
    ["/admin", "/admin", true],
    // Section roots match exactly, so "Overview" is not lit on every admin page.
    ["/admin/users", "/admin", false],
    ["/admin/users", "/admin/users", true],
    ["/account/profile/edit", "/account/profile", true],
    ["/account/profiles", "/account/profile", false],
    // Case pages have no nav item and highlight the queue.
    ["/review/cases/c-1", "/review/queue", true],
    ["/review/cases/c-1", "/review", false],
  ])("%s with %s → %s", (pathname, href, expected) => {
    expect(isActivePath(pathname, href)).toBe(expected)
  })
})

describe("isInSection", () => {
  it("matches the section and anything under it", () => {
    expect(isInSection("/admin", "/admin")).toBe(true)
    expect(isInSection("/admin/users", "/admin")).toBe(true)
    expect(isInSection("/administer", "/admin")).toBe(false)
  })
})
