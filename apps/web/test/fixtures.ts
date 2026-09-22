import type { FactCheckReport, RatingCounts } from "@/lib/types/fact-check"

const counts = (c: Partial<RatingCounts> = {}): RatingCounts => ({ public: 0, journalist: 0, expert: 0, ...c })

/** A minimal fact-check report; override only what a test cares about. */
export function makeReport(overrides: Partial<FactCheckReport> & { accurate?: number; inaccurate?: number } = {}): FactCheckReport {
  const { accurate = 0, inaccurate = 0, ...rest } = overrides
  return {
    id: "r",
    trackingId: "ZL-AAAA-22",
    title: "A claim",
    contentType: "text",
    language: "English",
    submittedText: "Some submitted text",
    verdict: "false",
    confidence: 80,
    summary: "Summary",
    whatIsFalse: [],
    whatIsTrue: [],
    claims: [],
    citations: [],
    aiSignals: [],
    annotations: [],
    community: { accurate: counts({ public: accurate }), inaccurate: counts({ public: inaccurate }), comments: [] },
    category: "Health",
    checkedAt: "2026-09-20T10:00:00Z",
    processingSeconds: 5,
    ...rest,
  } as FactCheckReport
}

export { counts }
