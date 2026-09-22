import { describe, expect, it } from "vitest"

import {
  activeFilterCount,
  facets,
  isListed,
  latest,
  leaderboard,
  mostDebated,
  PAGE_SIZE,
  parseQuery,
  searchReports,
  toSearchParams,
  trendingTopics,
  type LibraryQuery,
} from "@/lib/library"
import { makeReport } from "@/test/fixtures"

const NOW = new Date("2026-09-21T12:00:00Z")
const query = (q: Partial<LibraryQuery> = {}): LibraryQuery => ({ ...parseQuery(new URLSearchParams()), ...q })

// 250 ratings at 5% → suspended (§9.2), so hidden from search.
const suspended = makeReport({ id: "sus", title: "Suspended", accurate: 12, inaccurate: 238 })

describe("parseQuery / toSearchParams", () => {
  it("defaults to an empty relevance query on page 1", () => {
    expect(parseQuery(new URLSearchParams())).toEqual({
      q: "",
      verdicts: [],
      category: null,
      language: null,
      type: null,
      from: null,
      to: null,
      sort: "relevance",
      page: 1,
    })
  })

  it("drops unknown verdicts, types, sorts and bad pages", () => {
    const q = parseQuery(new URLSearchParams("verdict=false,nope&type=pdf&sort=random&page=-3&q=%20salt%20"))
    expect(q.verdicts).toEqual(["false"])
    expect(q.type).toBeNull()
    expect(q.sort).toBe("relevance")
    expect(q.page).toBe(1)
    expect(q.q).toBe("salt")
  })

  it("round-trips a full query and omits defaults", () => {
    const q = query({
      q: "fuel",
      verdicts: ["false", "ai-generated"],
      category: "Economy",
      language: "Luganda",
      type: "video",
      from: "2026-09-01",
      to: "2026-09-21",
      sort: "newest",
      page: 2,
    })
    expect(parseQuery(toSearchParams(q))).toEqual(q)
    expect(toSearchParams(query()).toString()).toBe("")
  })
})

describe("activeFilterCount", () => {
  it("counts each verdict and one per other filter; a date range counts once", () => {
    expect(activeFilterCount(query())).toBe(0)
    expect(
      activeFilterCount(
        query({ verdicts: ["false", "authentic"], category: "Health", type: "text", from: "a", to: "b" })
      )
    ).toBe(5)
  })
})

describe("searchReports", () => {
  const reports = [
    makeReport({
      id: "a",
      title: "Boiled banana cures malaria",
      verdict: "false",
      category: "Health",
      checkedAt: "2026-09-20T00:00:00Z",
      accurate: 10,
    }),
    makeReport({
      id: "b",
      title: "New 50,000 shilling note",
      verdict: "ai-generated",
      category: "Economy",
      language: "Luganda",
      contentType: "video",
      checkedAt: "2026-09-18T00:00:00Z",
      accurate: 40,
      inaccurate: 2,
    }),
    makeReport({
      id: "c",
      title: "Schools close early",
      verdict: "likely-false",
      category: "Education",
      checkedAt: "2026-09-10T00:00:00Z",
      accurate: 1,
      inaccurate: 1,
    }),
    suspended,
  ]
  const ids = (q: Partial<LibraryQuery>) => searchReports(reports, query(q), NOW).items.map((r) => r.id)

  it("hides suspended verdicts", () => {
    expect(isListed(suspended)).toBe(false)
    expect(ids({})).not.toContain("sus")
  })

  it("matches every search word, case-insensitively", () => {
    expect(ids({ q: "BANANA malaria" })).toEqual(["a"])
    expect(ids({ q: "banana shilling" })).toEqual([])
  })

  it("filters by verdict, category, language, type and date range", () => {
    expect(ids({ verdicts: ["false", "likely-false"] }).sort()).toEqual(["a", "c"])
    expect(ids({ category: "Economy" })).toEqual(["b"])
    expect(ids({ language: "Luganda" })).toEqual(["b"])
    expect(ids({ type: "video" })).toEqual(["b"])
    expect(ids({ from: "2026-09-15", to: "2026-09-19" })).toEqual(["b"])
  })

  it("sorts by newest and by number of ratings", () => {
    expect(ids({ sort: "newest" })).toEqual(["a", "b", "c"])
    expect(ids({ sort: "most-rated" })).toEqual(["b", "a", "c"])
  })

  it("ranks by community score and recency by default", () => {
    // "c" is older and split 50/50, so it ranks last.
    expect(ids({}).at(-1)).toBe("c")
  })

  it("paginates and clamps the page", () => {
    const many = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => makeReport({ id: `m${i}` }))
    const page2 = searchReports(many, query({ page: 2 }), NOW)
    expect(page2).toMatchObject({ total: PAGE_SIZE + 3, page: 2, pageCount: 2 })
    expect(page2.items).toHaveLength(3)
    expect(searchReports(many, query({ page: 9 }), NOW).page).toBe(2)
    expect(searchReports([], query(), NOW)).toMatchObject({ total: 0, page: 1, pageCount: 1 })
  })
})

describe("home feed helpers", () => {
  const reports = [
    makeReport({ id: "old", checkedAt: "2026-09-01T00:00:00Z", category: "Health", accurate: 30 }),
    makeReport({ id: "new", checkedAt: "2026-09-20T00:00:00Z", category: "Health", accurate: 60, inaccurate: 60 }),
    makeReport({ id: "mid", checkedAt: "2026-09-19T00:00:00Z", category: "Politics", accurate: 26 }),
    suspended,
  ]

  it("latest returns the newest listed reports", () => {
    expect(latest(reports, 2).map((r) => r.id)).toEqual(["new", "mid"])
  })

  it("mostDebated favours many ratings with a split community", () => {
    expect(mostDebated(reports, 1)[0].id).toBe("new")
  })

  it("leaderboard needs enough ratings and ranks by score, then by volume", () => {
    expect(leaderboard(reports, 5).map((x) => x.report.id)).toEqual(["old", "mid", "new"])
    expect(leaderboard(reports, 5, 100).map((x) => x.report.id)).toEqual(["new"])
  })

  it("trendingTopics counts categories checked in the last week", () => {
    expect(trendingTopics(reports, 5, NOW)).toEqual([
      { category: "Health", count: 1 },
      { category: "Politics", count: 1 },
    ])
  })

  it("facets lists sorted unique categories and languages", () => {
    expect(facets(reports)).toEqual({ categories: ["Health", "Politics"], languages: ["English"] })
  })
})
