import { describe, expect, it } from "vitest"

import { applyVote, communityScore, raterRole, RATING_WEIGHTS, statusFor } from "@/lib/community"
import { counts } from "@/test/fixtures"

const rating = (accurate: Parameters<typeof counts>[0], inaccurate: Parameters<typeof counts>[0]) => ({
  accurate: counts(accurate),
  inaccurate: counts(inaccurate),
})

describe("communityScore", () => {
  it("has no score and standard status without ratings", () => {
    const s = communityScore(rating({}, {}))
    expect(s.ccs).toBeNull()
    expect(s.total).toBe(0)
    expect(s.status).toBe("standard")
  })

  it("weights ratings by role (§9.1: public 1, journalist 2, expert 5)", () => {
    expect(RATING_WEIGHTS).toEqual({ public: 1, journalist: 2, expert: 5 })
    // 1 expert accurate (5) vs 5 public inaccurate (5) → 50%
    const s = communityScore(rating({ expert: 1 }, { public: 5 }))
    expect(s.weightedAccurate).toBe(5)
    expect(s.weightedInaccurate).toBe(5)
    expect(s.ccs).toBe(50)
    expect(s.accurateCount).toBe(1)
    expect(s.inaccurateCount).toBe(5)
    expect(s.total).toBe(6)
  })

  it("rounds the score to a whole percentage", () => {
    expect(communityScore(rating({ public: 2 }, { public: 1 })).ccs).toBe(67)
  })
})

describe("statusFor (§9.2 thresholds)", () => {
  it.each([
    [null, 500, "standard"],
    [95, 10, "verified"],
    [90, 1, "verified"],
    [89, 1, "standard"],
    [55, 51, "questioned"],
    [55, 50, "standard"],
    [30, 101, "escalated"],
    [30, 100, "standard"],
    [10, 201, "suspended"],
    [10, 150, "escalated"],
  ] as const)("ccs %s with %s ratings → %s", (ccs, total, status) => {
    expect(statusFor(ccs, total)).toBe(status)
  })
})

describe("raterRole", () => {
  it("rates admins as standard users", () => {
    expect(raterRole("admin")).toBe("public")
    expect(raterRole("expert")).toBe("expert")
  })
})

describe("applyVote", () => {
  const base = rating({ public: 3 }, { public: 1 })

  it("adds a first vote", () => {
    expect(applyVote(base, "journalist", null, "accurate").accurate.journalist).toBe(1)
  })

  it("moves a changed vote and never goes below zero", () => {
    const next = applyVote(base, "public", "inaccurate", "accurate")
    expect(next.accurate.public).toBe(4)
    expect(next.inaccurate.public).toBe(0)
    expect(applyVote(base, "expert", "inaccurate", null).inaccurate.expert).toBe(0)
  })

  it("does not mutate the input", () => {
    applyVote(base, "public", null, "accurate")
    expect(base.accurate.public).toBe(3)
  })
})
