import { communityScore } from "@/lib/community"
import type { ContentType, FactCheckReport, Verdict } from "@/lib/types/fact-check"
import { VERDICTS } from "@/lib/types/fact-check"

// Search, filter and ranking for the Library and Home feed (FR-SEARCH-01, 04, 05).
// Runs on sample data now; the same parameters become API query params in Phase 2.

export const SORTS = [
  { value: "relevance", label: "Best match" },
  { value: "newest", label: "Newest" },
  { value: "most-rated", label: "Most rated" },
] as const
export type SortValue = (typeof SORTS)[number]["value"]

export const PAGE_SIZE = 12

export type LibraryQuery = {
  q: string
  verdicts: Verdict[]
  category: string | null
  language: string | null
  type: ContentType | null
  from: string | null
  to: string | null
  sort: SortValue
  page: number
}

const CONTENT_TYPES: ContentType[] = ["text", "url", "image", "audio", "video"]

export function parseQuery(params: URLSearchParams): LibraryQuery {
  const verdicts = (params.get("verdict") ?? "")
    .split(",")
    .filter((v): v is Verdict => (VERDICTS as readonly string[]).includes(v))
  const type = params.get("type")
  const sort = params.get("sort")
  return {
    q: params.get("q")?.trim() ?? "",
    verdicts,
    category: params.get("category"),
    language: params.get("language"),
    type: CONTENT_TYPES.includes(type as ContentType) ? (type as ContentType) : null,
    from: params.get("from"),
    to: params.get("to"),
    sort: SORTS.some((s) => s.value === sort) ? (sort as SortValue) : "relevance",
    page: Math.max(1, Number(params.get("page")) || 1),
  }
}

export function toSearchParams(q: Partial<LibraryQuery>) {
  const p = new URLSearchParams()
  if (q.q) p.set("q", q.q)
  if (q.verdicts?.length) p.set("verdict", q.verdicts.join(","))
  if (q.category) p.set("category", q.category)
  if (q.language) p.set("language", q.language)
  if (q.type) p.set("type", q.type)
  if (q.from) p.set("from", q.from)
  if (q.to) p.set("to", q.to)
  if (q.sort && q.sort !== "relevance") p.set("sort", q.sort)
  if (q.page && q.page > 1) p.set("page", String(q.page))
  return p
}

export function activeFilterCount(q: LibraryQuery) {
  return (
    q.verdicts.length +
    (q.category ? 1 : 0) +
    (q.language ? 1 : 0) +
    (q.type ? 1 : 0) +
    (q.from || q.to ? 1 : 0)
  )
}

// Suspended verdicts are hidden from search until reviewed (§9.2).
export function isListed(r: FactCheckReport) {
  return communityScore(r.community).status !== "suspended"
}

function matches(r: FactCheckReport, text: string) {
  if (!text) return true
  const hay = `${r.title} ${r.summary} ${r.category} ${r.language} ${r.submittedText}`.toLowerCase()
  return text
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word))
}

function ageDays(iso: string, now: Date) {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 86_400_000)
}

// FR-SEARCH-04: rank by Community Confidence Score and recency.
function rank(r: FactCheckReport, now: Date) {
  const ccs = communityScore(r.community).ccs ?? 50
  const recency = Math.exp(-ageDays(r.checkedAt, now) / 14)
  return 0.6 * (ccs / 100) + 0.4 * recency
}

export function searchReports(all: FactCheckReport[], q: LibraryQuery, now = new Date()) {
  const results = all.filter(
    (r) =>
      isListed(r) &&
      matches(r, q.q) &&
      (q.verdicts.length === 0 || q.verdicts.includes(r.verdict)) &&
      (!q.category || r.category === q.category) &&
      (!q.language || r.language === q.language) &&
      (!q.type || r.contentType === q.type) &&
      (!q.from || r.checkedAt >= q.from) &&
      (!q.to || r.checkedAt <= q.to)
  )

  results.sort((a, b) => {
    if (q.sort === "newest") return b.checkedAt.localeCompare(a.checkedAt)
    if (q.sort === "most-rated") return communityScore(b.community).total - communityScore(a.community).total
    return rank(b, now) - rank(a, now)
  })

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(q.page, pageCount)
  return {
    total: results.length,
    page,
    pageCount,
    items: results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  }
}

// Facet values for filter menus.
export function facets(all: FactCheckReport[]) {
  const uniq = (xs: string[]) => [...new Set(xs)].sort()
  const listed = all.filter(isListed)
  return {
    categories: uniq(listed.map((r) => r.category)),
    languages: uniq(listed.map((r) => r.language)),
  }
}

// ---- Home feed ----

export function latest(all: FactCheckReport[], n: number) {
  return all
    .filter(isListed)
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
    .slice(0, n)
}

// "Most debated": many ratings and a split community (CCS near 50%).
export function mostDebated(all: FactCheckReport[], n: number) {
  const debate = (r: FactCheckReport) => {
    const s = communityScore(r.community)
    if (s.ccs === null) return 0
    return s.total * (1 - Math.abs(s.ccs - 50) / 50)
  }
  return all
    .filter(isListed)
    .sort((a, b) => debate(b) - debate(a))
    .slice(0, n)
}

// FR-RATE-10: most accurately rated stories (high CCS with enough ratings).
export function leaderboard(all: FactCheckReport[], n: number, minRatings = 25) {
  return all
    .filter(isListed)
    .map((r) => ({ report: r, score: communityScore(r.community) }))
    .filter((x) => x.score.total >= minRatings && x.score.ccs !== null)
    .sort((a, b) => (b.score.ccs ?? 0) - (a.score.ccs ?? 0) || b.score.total - a.score.total)
    .slice(0, n)
}

export function trendingTopics(all: FactCheckReport[], n: number, now = new Date(), days = 7) {
  const counts = new Map<string, number>()
  for (const r of all.filter(isListed)) {
    if (ageDays(r.checkedAt, now) <= days) counts.set(r.category, (counts.get(r.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([category, count]) => ({ category, count }))
}

const STOP_WORDS = new Set(
  "a an and are as at be by for from has have in is it its of on or that the this to was were will with".split(" ")
)

function keywords(r: FactCheckReport) {
  return new Set(
    `${r.title} ${r.summary}`
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  )
}

// FR-SEARCH-03: checks related to a report, by shared topic, overlapping wording, source
// and language. Suspended verdicts are excluded like everywhere else in search.
// Phase 1 stand-in: the spec asks for semantic similarity, which needs embeddings
// (pgvector, Phase 3) once real reports come from the API.
export function relatedReports(all: FactCheckReport[], report: FactCheckReport, n = 3) {
  const words = keywords(report)
  const domain = report.sourceUrl ? safeHost(report.sourceUrl) : null

  return all
    .filter((r) => r.id !== report.id && isListed(r))
    .map((r) => {
      const other = keywords(r)
      const shared = [...words].filter((w) => other.has(w)).length
      const overlap = shared / Math.max(1, Math.min(words.size, other.size))
      const sameTopic = r.category === report.category
      const sameSource = Boolean(domain && r.sourceUrl && safeHost(r.sourceUrl) === domain)
      const score =
        (sameTopic ? 3 : 0) +
        4 * overlap +
        (sameSource ? 1.5 : 0) +
        (r.language === report.language ? 0.5 : 0) +
        (r.verdict === report.verdict ? 0.25 : 0)
      // Language and verdict only break ties; a match needs a shared topic, source or wording.
      return { report: r, score, relevant: sameTopic || sameSource || overlap >= 0.2 }
    })
    .filter((x) => x.relevant)
    .sort((a, b) => b.score - a.score || b.report.checkedAt.localeCompare(a.report.checkedAt))
    .slice(0, n)
    .map((x) => x.report)
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
