// SAMPLE DATA for the Review area. Replaced by the review-queue API in Phase 3.

import { getSampleReport } from "@/lib/mock/fact-checks"
import type { Verdict } from "@/lib/types/fact-check"

// FR-REVIEW-06: 48-hour turnaround.
export const REVIEW_SLA_HOURS = 48

// Fixed "now" so sample SLA timers are stable (samples are dated 21 Sep 2026).
export const REVIEW_NOW = new Date("2026-09-21T12:00:00+03:00")

// Why a verdict is in the queue.
export type ReviewReason = "community-escalation" | "suspended" | "user-reports" | "low-confidence"

// Labels and descriptions live in Review.reasons.<reason>; English copies stay for non-UI use.
export const REASON_META: Record<ReviewReason, { label: string; description: string }> = {
  "community-escalation": {
    label: "Community escalation",
    description: "Fewer than 40% of over 100 ratings agree with the verdict (§9.2).",
  },
  suspended: {
    label: "Suspended",
    description: "Fewer than 20% of over 200 ratings agree. The verdict is hidden until reviewed.",
  },
  "user-reports": { label: "User reports", description: "Readers reported a problem with this verdict." },
  "low-confidence": { label: "Low AI confidence", description: "The AI was less than 60% confident." },
}

export type ReviewCase = {
  id: string
  reportId: string
  reason: ReviewReason
  flaggedAt: string // ISO
  reports?: number
  assignee: string | null
  priority: "normal" | "high"
}

export const SAMPLE_CASES: ReviewCase[] = [
  { id: "rc-0418", reportId: "fc-2026-0152", reason: "suspended", flaggedAt: "2026-09-19T09:00:00+03:00", assignee: null, priority: "high" },
  { id: "rc-0417", reportId: "fc-2026-0155", reason: "community-escalation", flaggedAt: "2026-09-19T20:30:00+03:00", assignee: "David Okello", priority: "high" },
  { id: "rc-0416", reportId: "fc-2026-0158", reason: "low-confidence", flaggedAt: "2026-09-20T15:10:00+03:00", assignee: null, priority: "normal" },
  { id: "rc-0415", reportId: "fc-2026-0159", reason: "user-reports", flaggedAt: "2026-09-21T06:45:00+03:00", reports: 14, assignee: "Esther Atim", priority: "normal" },
  { id: "rc-0414", reportId: "fc-2026-0157", reason: "user-reports", flaggedAt: "2026-09-21T09:20:00+03:00", reports: 6, assignee: null, priority: "normal" },
]

export function getCase(id: string) {
  const c = SAMPLE_CASES.find((x) => x.id === id)
  const report = c ? getSampleReport(c.reportId) : undefined
  return c && report ? { case: c, report } : null
}

// ---- SLA ----

export type SlaState = "overdue" | "due-soon" | "on-track"

export function slaFor(flaggedAt: string, now = REVIEW_NOW) {
  const due = new Date(new Date(flaggedAt).getTime() + REVIEW_SLA_HOURS * 3_600_000)
  const hoursLeft = (due.getTime() - now.getTime()) / 3_600_000
  const state: SlaState = hoursLeft < 0 ? "overdue" : hoursLeft < 12 ? "due-soon" : "on-track"
  return { due, hoursLeft, state }
}

export function formatHours(h: number) {
  const abs = Math.abs(h)
  const text = abs < 1 ? `${Math.round(abs * 60)} min` : `${Math.floor(abs)} h ${Math.round((abs % 1) * 60)} min`
  return h < 0 ? `${text} overdue` : `${text} left`
}

// ---- Decisions (FR-REVIEW-02/03) ----

export type ReviewDecision = {
  id: string
  caseId: string
  reportId: string
  title: string
  outcome: "confirmed" | "overridden"
  from: Verdict
  to: Verdict
  justification: string
  reviewer: string
  decidedAt: string
  turnaroundHours: number
}

export const SAMPLE_DECISIONS: ReviewDecision[] = [
  {
    id: "d-0412",
    caseId: "rc-0412",
    reportId: "fc-2026-0142",
    title: "“Free unlimited internet for every Ugandan from January 2027”",
    outcome: "confirmed",
    from: "false",
    to: "false",
    justification: "Verified with the Ministry's communications office. No such programme exists.",
    reviewer: "David Okello",
    decidedAt: "2026-09-19T14:20:00+03:00",
    turnaroundHours: 6.5,
  },
  {
    id: "d-0409",
    caseId: "rc-0409",
    reportId: "fc-2026-0154",
    title: "Photo of record water levels at a lakeside landing site",
    outcome: "overridden",
    from: "false",
    to: "likely-false",
    justification:
      "The photo is genuine but from 2020, so “False” overstated it. Recycled media fits “Likely False” with a context note.",
    reviewer: "David Okello",
    decidedAt: "2026-09-17T18:05:00+03:00",
    turnaroundHours: 21,
  },
  {
    id: "d-0403",
    caseId: "rc-0403",
    reportId: "fc-2026-0151",
    title: "Cholera vaccination campaign announced for border districts",
    outcome: "confirmed",
    from: "authentic",
    to: "authentic",
    justification: "Dates and districts match the Ministry of Health announcement.",
    reviewer: "David Okello",
    decidedAt: "2026-09-14T11:40:00+03:00",
    turnaroundHours: 3.2,
  },
  {
    id: "d-0398",
    caseId: "rc-0398",
    reportId: "fc-2026-0153",
    title: "Free mobile data offer circulating on social media",
    outcome: "confirmed",
    from: "false",
    to: "false",
    justification: "Domain registered two days before the campaign and not owned by the operator.",
    reviewer: "David Okello",
    decidedAt: "2026-09-12T09:15:00+03:00",
    turnaroundHours: 30,
  },
]
