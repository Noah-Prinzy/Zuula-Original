"use client"

import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { useSession } from "@/components/providers/session-provider"
import { ReasonBadge, SlaBadge, StatCard } from "@/components/review/review-badges"
import { Button } from "@/components/ui/button"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { getSampleReport } from "@/lib/mock/fact-checks"
import {
  REASON_META,
  REVIEW_SLA_HOURS,
  SAMPLE_CASES,
  SAMPLE_DECISIONS,
  slaFor,
  type ReviewReason,
} from "@/lib/mock/review"
import { relativeTime } from "@/lib/mock/account"

export function ReviewOverview() {
  const { user } = useSession()
  const withSla = SAMPLE_CASES.map((c) => ({ ...c, sla: slaFor(c.flaggedAt) })).sort(
    (a, b) => a.sla.hoursLeft - b.sla.hoursLeft
  )
  const overdue = withSla.filter((c) => c.sla.state === "overdue").length
  const dueSoon = withSla.filter((c) => c.sla.state === "due-soon").length
  const mine = SAMPLE_DECISIONS.filter((d) => d.reviewer === user?.name)
  const avgTurnaround = mine.length
    ? mine.reduce((s, d) => s + d.turnaroundHours, 0) / mine.length
    : null
  const byReason = (Object.keys(REASON_META) as ReviewReason[]).map((r) => ({
    reason: r,
    count: SAMPLE_CASES.filter((c) => c.reason === r).length,
  }))
  const max = Math.max(1, ...byReason.map((b) => b.count))

  return (
    <div className="flex flex-col gap-8">
      <div data-reveal="stagger" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In the queue" value={SAMPLE_CASES.length} hint={`${SAMPLE_CASES.filter((c) => !c.assignee).length} unassigned`} />
        <StatCard label="Overdue" value={overdue} tone={overdue ? "danger" : "good"} hint={`Past the ${REVIEW_SLA_HOURS}-hour SLA`} />
        <StatCard label="Due in 12 hours" value={dueSoon} tone={dueSoon ? "warning" : "default"} />
        <StatCard
          label="Your average turnaround"
          value={avgTurnaround === null ? "—" : `${avgTurnaround.toFixed(1)} h`}
          tone={avgTurnaround !== null && avgTurnaround <= REVIEW_SLA_HOURS ? "good" : "default"}
          hint={`${mine.length} decisions so far`}
        />
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section data-reveal aria-labelledby="attention" className="flex flex-col gap-3 [--d:2]">
          <div className="flex items-end justify-between gap-2">
            <h2 id="attention" className="font-heading text-lg font-bold">
              Needs attention
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/review/queue">
                Full queue <RiArrowRightLine aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="flex flex-col divide-y border bg-card">
            {withSla.slice(0, 4).map((c) => {
              const report = getSampleReport(c.reportId)!
              return (
                <li key={c.id} className="relative flex flex-col gap-2 p-4 hover:bg-muted/40 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/review/cases/${c.id}`} className="font-medium after:absolute after:inset-0 hover:text-primary">
                      {report.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <VerdictBadge verdict={report.verdict} size="sm" />
                      <ReasonBadge reason={c.reason} reports={c.reports} />
                      <span className="text-xs text-muted-foreground">{c.assignee ? `Assigned to ${c.assignee === user?.name ? "you" : c.assignee}` : "Unassigned"}</span>
                    </div>
                  </div>
                  <SlaBadge flaggedAt={c.flaggedAt} />
                </li>
              )
            })}
          </ul>
        </section>

        <div className="flex flex-col gap-8">
          <section data-reveal aria-labelledby="by-reason" className="flex flex-col gap-3 [--d:3]">
            <h2 id="by-reason" className="font-heading text-lg font-bold">
              Why cases are flagged
            </h2>
            <ul className="flex flex-col gap-3 border bg-card p-4">
              {byReason.map((b) => (
                <li key={b.reason} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{REASON_META[b.reason].label}</span>
                    <span className="font-mono tabular-nums">{b.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted" aria-hidden>
                    <div className="bar-grow h-full bg-primary" style={{ width: `${(b.count / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section data-reveal aria-labelledby="recent" className="flex flex-col gap-3 [--d:4]">
            <h2 id="recent" className="font-heading text-lg font-bold">
              Your recent decisions
            </h2>
            {mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">Decisions you make appear here.</p>
            ) : (
              <ul className="flex flex-col divide-y border bg-card">
                {mine.slice(0, 3).map((d) => (
                  <li key={d.id} className="flex flex-col gap-1 p-3 text-sm">
                    <span className="line-clamp-1 font-medium">{d.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.outcome === "confirmed" ? "Confirmed" : "Overridden"} · {relativeTime(d.decidedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="link" className="h-auto w-fit p-0" asChild>
              <Link href="/review/history">All decisions</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
