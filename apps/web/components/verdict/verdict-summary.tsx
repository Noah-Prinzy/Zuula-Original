import {
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiMicLine,
  RiTimeLine,
  RiTranslate2,
  RiVideoLine,
} from "@remixicon/react"

import { ConfidenceMeter } from "@/components/verdict/confidence-meter"
import { HumanVerifiedBadge } from "@/components/verdict/human-verified-badge"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import type { ContentType, FactCheckReport } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { formatDate, VERDICT_META } from "@/lib/verdicts"

const CONTENT_TYPE = {
  text: { label: "Text", icon: RiFileTextLine },
  url: { label: "Article link", icon: RiLink },
  image: { label: "Image", icon: RiImageLine },
  audio: { label: "Audio", icon: RiMicLine },
  video: { label: "Video", icon: RiVideoLine },
} satisfies Record<ContentType, unknown>

// Top of the Report page: verdict, confidence, headline and metadata.
export function VerdictSummary({
  report,
  className,
}: {
  report: FactCheckReport
  className?: string
}) {
  const meta = VERDICT_META[report.verdict]
  const type = CONTENT_TYPE[report.contentType]

  return (
    <section
      aria-labelledby="verdict-title"
      className={cn("relative flex flex-col gap-5 border bg-card p-5 md:flex-row md:p-6", className)}
    >
      <span className={cn("absolute inset-x-0 top-0 h-1", meta.solid)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={report.verdict} size="lg" />
          {report.humanReview && <HumanVerifiedBadge review={report.humanReview} />}
        </div>
        <h1 id="verdict-title" className="font-heading text-2xl font-bold tracking-tight text-balance md:text-3xl">
          {report.title}
        </h1>
        <p className="text-base text-muted-foreground">{report.summary}</p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Content type</dt>
            <type.icon className="size-3.5" aria-hidden />
            <dd>{type.label}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Language</dt>
            <RiTranslate2 className="size-3.5" aria-hidden />
            <dd>{report.language}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Checked</dt>
            <RiTimeLine className="size-3.5" aria-hidden />
            <dd>
              Checked <time dateTime={report.checkedAt}>{formatDate(report.checkedAt)}</time> in{" "}
              {report.processingSeconds.toFixed(1)}s
            </dd>
          </div>
          <div>
            <dt className="sr-only">Category</dt>
            <dd>{report.category}</dd>
          </div>
          <div>
            <dt className="inline">Tracking ID </dt>
            <dd className="inline font-mono">{report.trackingId}</dd>
          </div>
        </dl>
      </div>
      <div className="flex shrink-0 items-center md:border-l md:pl-6">
        <ConfidenceMeter value={report.confidence} verdict={report.verdict} size="lg" />
      </div>
    </section>
  )
}
