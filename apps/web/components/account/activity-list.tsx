"use client"

import * as React from "react"
import Link from "next/link"
import {
  RiArticleLine,
  RiErrorWarningLine,
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiLoader4Line,
  RiRefreshLine,
  RiThumbDownFill,
  RiThumbUpFill,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import {
  relativeTime,
  SAMPLE_RATINGS,
  SAMPLE_SUBMISSIONS,
  type ActivitySubmission,
} from "@/lib/mock/account"
import { cn } from "@/lib/utils"

const TYPE = {
  text: { label: "Text", icon: RiFileTextLine },
  url: { label: "Link", icon: RiLink },
  media: { label: "Media", icon: RiImageLine },
  article: { label: "Article", icon: RiArticleLine },
}

function StatusCell({ s }: { s: ActivitySubmission }) {
  if (s.status === "complete" && s.verdict) return <VerdictBadge verdict={s.verdict} size="sm" />
  if (s.status === "processing")
    return (
      <Badge variant="secondary" className="gap-1">
        <RiLoader4Line className="motion-safe:animate-spin" aria-hidden /> Checking
      </Badge>
    )
  return (
    <Badge variant="destructive" className="gap-1">
      <RiErrorWarningLine aria-hidden /> Failed
    </Badge>
  )
}

function Submissions() {
  if (SAMPLE_SUBMISSIONS.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No submissions yet</EmptyTitle>
          <EmptyDescription>Things you check while signed in appear here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/verify">Verify a claim</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <ul className="flex flex-col divide-y border bg-card">
      {SAMPLE_SUBMISSIONS.map((s) => {
        const t = TYPE[s.type]
        return (
          <li key={s.trackingId} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <t.icon className="hidden size-5 shrink-0 text-muted-foreground md:block" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className={cn("truncate text-sm", s.type === "url" && "font-mono")}>{s.preview}</p>
              <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>{t.label}</span>
                <span className="font-mono">{s.trackingId}</span>
                <time dateTime={s.submittedAt}>{relativeTime(s.submittedAt)}</time>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusCell s={s} />
              {s.reportId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/fact-checks/${s.reportId}`}>View report</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/submissions/${s.trackingId}`}>View status</Link>
                </Button>
              )}
              {/* FR-SUBMIT-07: resubmit an updated version. */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/verify" aria-label={`Resubmit ${s.trackingId}`}>
                  <RiRefreshLine aria-hidden /> Resubmit
                </Link>
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Ratings() {
  return (
    <ul className="flex flex-col divide-y border bg-card">
      {SAMPLE_RATINGS.map((r) => {
        const accurate = r.vote === "accurate"
        const Icon = accurate ? RiThumbUpFill : RiThumbDownFill
        return (
          <li key={r.reportId} className="relative flex flex-col gap-2 p-4 hover:bg-muted/40 md:flex-row md:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Link href={`/fact-checks/${r.reportId}`} className="font-medium after:absolute after:inset-0 hover:text-primary">
                {r.title}
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <VerdictBadge verdict={r.verdict} size="sm" />
                <span className={cn("inline-flex items-center gap-1 font-medium", accurate ? "text-verdict-authentic" : "text-verdict-false")}>
                  <Icon className="size-3.5" aria-hidden />
                  You rated it {r.vote}
                </span>
                <time dateTime={r.ratedAt}>{relativeTime(r.ratedAt)}</time>
              </div>
              {r.comment && <p className="border-l-2 pl-2 text-sm text-muted-foreground italic">“{r.comment}”</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ActivityList() {
  return (
    <Tabs defaultValue="submissions" className="gap-4">
      <TabsList>
        <TabsTrigger value="submissions">Submissions ({SAMPLE_SUBMISSIONS.length})</TabsTrigger>
        <TabsTrigger value="ratings">Ratings ({SAMPLE_RATINGS.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="submissions">
        <Submissions />
      </TabsContent>
      <TabsContent value="ratings">
        <Ratings />
      </TabsContent>
    </Tabs>
  )
}
