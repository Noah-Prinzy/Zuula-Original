import { describe, expect, it } from "vitest"

import { VERDICTS } from "@/lib/types/fact-check"
import { CLAIM_META, formatDate, STANCE_META, VERDICT_META } from "@/lib/verdicts"

describe("VERDICT_META (FR-DETECT-01)", () => {
  it("describes all five verdicts with a label, icon and colour tokens", () => {
    expect(Object.keys(VERDICT_META).sort()).toEqual([...VERDICTS].sort())
    for (const v of VERDICTS) {
      const meta = VERDICT_META[v]
      expect(meta.label).toBeTruthy()
      expect(meta.description).toBeTruthy()
      expect(meta.icon).toBeTruthy()
      // Colour is never the only signal, but each verdict still gets its own token.
      expect(meta.text).toBe(`text-verdict-${v}`)
    }
  })

  it("gives every verdict a distinct label", () => {
    const labels = VERDICTS.map((v) => VERDICT_META[v].label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe("claim and stance mappings", () => {
  it("map onto real verdicts", () => {
    for (const meta of [...Object.values(CLAIM_META), ...Object.values(STANCE_META)]) {
      expect(VERDICTS).toContain(meta.verdict)
    }
    expect(CLAIM_META.supported.verdict).toBe("authentic")
    expect(STANCE_META.contradicts.verdict).toBe("false")
  })
})

describe("formatDate", () => {
  it("formats ISO dates as day, short month and year", () => {
    expect(formatDate("2026-09-21T09:00:00Z")).toMatch(/^21 Sept? 2026$/)
  })
})
