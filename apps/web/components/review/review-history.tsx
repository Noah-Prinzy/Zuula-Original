"use client"

import * as React from "react"
import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { SAMPLE_DECISIONS, REVIEW_SLA_HOURS } from "@/lib/mock/review"
import { cn } from "@/lib/utils"

type Filter = "all" | "confirmed" | "overridden"

// FR-REVIEW-03: the reviewer's own logged decisions.
export function ReviewHistory() {
  const [filter, setFilter] = React.useState<Filter>("all")
  const shown = filter === "all" ? SAMPLE_DECISIONS : SAMPLE_DECISIONS.filter((d) => d.outcome === filter)
  const count = (f: Filter) => (f === "all" ? SAMPLE_DECISIONS.length : SAMPLE_DECISIONS.filter((d) => d.outcome === f).length)

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
        aria-label="Filter decisions"
        className="w-fit"
      >
        {(["all", "confirmed", "overridden"] as const).map((f) => (
          <ToggleGroupItem key={f} value={f} className="capitalize">
            {f} ({count(f)})
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {shown.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No decisions</EmptyTitle>
            <EmptyDescription>Nothing matches this filter.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul data-reveal="stagger" className="flex flex-col divide-y border bg-card">
          {shown.map((d) => {
            const late = d.turnaroundHours > REVIEW_SLA_HOURS
            return (
              <li key={d.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/fact-checks/${d.reportId}`} className="font-medium hover:text-primary">
                    {d.title}
                  </Link>
                  <Badge variant={d.outcome === "overridden" ? "default" : "secondary"}>
                    {d.outcome === "overridden" ? "Overridden" : "Confirmed"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <VerdictBadge verdict={d.from} size="sm" />
                  {d.outcome === "overridden" && (
                    <>
                      <RiArrowRightLine className="size-3.5" aria-label="changed to" />
                      <VerdictBadge verdict={d.to} size="sm" />
                    </>
                  )}
                  <span className="font-mono">{d.caseId}</span>
                  <time dateTime={d.decidedAt}>
                    {new Date(d.decidedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                  <span className={cn(late && "text-verdict-false")}>
                    Turnaround {d.turnaroundHours} h{late && " (over SLA)"}
                  </span>
                </div>
                <p className="border-l-2 pl-3 text-sm text-muted-foreground">{d.justification}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
