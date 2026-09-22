import { describe, expect, it } from "vitest"

import { expectedTime, normaliseTrackingId, pipelineFor, TRACKING_ID_PATTERN } from "@/lib/analysis"
import { hasAnyRole, ROLE_LABELS, ROLES } from "@/lib/roles"
import { cn, initials } from "@/lib/utils"

describe("pipelineFor (FR-SUBMIT-06)", () => {
  it("starts with Received and ends with the report", () => {
    for (const type of ["text", "url", "article", "media"] as const) {
      const steps = pipelineFor(type)
      expect(steps[0].id).toBe("received")
      expect(steps.at(-1)?.id).toBe("report")
      for (const s of steps) expect(s.label).toBeTruthy()
    }
  })

  it("fetches links and scans media", () => {
    expect(pipelineFor("url").map((s) => s.id)).toContain("fetch")
    expect(pipelineFor("media").map((s) => s.id)).toEqual(expect.arrayContaining(["scan", "media", "transcribe"]))
    expect(pipelineFor("text").map((s) => s.id)).not.toContain("scan")
  })
})

describe("expectedTime (FR-DETECT-07)", () => {
  it("is about 10 s for text and up to a minute for media", () => {
    expect(expectedTime("text")).toBe("about 10 seconds")
    expect(expectedTime("media")).toBe("up to a minute")
  })
})

describe("tracking ids", () => {
  it("normalises user input to the canonical format", () => {
    const id = normaliseTrackingId("  zl-ab3d -k7 ")
    expect(id).toBe("ZL-AB3D-K7")
    expect(TRACKING_ID_PATTERN.test(id)).toBe(true)
  })

  it("rejects 0 and 1, which are easily confused with O and I", () => {
    expect(TRACKING_ID_PATTERN.test("ZL-AB10-K7")).toBe(false)
  })
})

describe("roles", () => {
  it("labels every role", () => {
    expect(Object.keys(ROLE_LABELS)).toEqual([...ROLES])
  })

  it("allows everyone when no roles are required", () => {
    expect(hasAnyRole(null)).toBe(true)
    expect(hasAnyRole(null, [])).toBe(true)
    expect(hasAnyRole(null, ["admin"])).toBe(false)
    expect(hasAnyRole("expert", ["expert", "admin"])).toBe(true)
    expect(hasAnyRole("public", ["expert"])).toBe(false)
  })
})

describe("utils", () => {
  it("cn merges conflicting Tailwind classes", () => {
    expect(cn("px-2 text-sm", false && "hidden", "px-4")).toBe("text-sm px-4")
  })

  it("initials takes the first letters of up to two names", () => {
    expect(initials("amina nakato")).toBe("AN")
    expect(initials("Mary Akello Okot")).toBe("MA")
  })
})
