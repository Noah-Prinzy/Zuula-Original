import Link from "next/link"
import {
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiMicLine,
  RiThumbUpLine,
  RiVideoLine,
} from "@remixicon/react"
import { useTranslations } from "next-intl"

import { CommunityBadge } from "@/components/community/community-status"
import { ConfidenceMeter } from "@/components/verdict/confidence-meter"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { useContentLabels } from "@/hooks/use-content-labels"
import { communityScore } from "@/lib/community"
import { useFormat } from "@/lib/format"
import type { ContentType, FactCheckReport } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { VERDICT_META } from "@/lib/verdicts"

const TYPE_ICON: Record<ContentType, typeof RiFileTextLine> = {
  text: RiFileTextLine,
  url: RiLink,
  image: RiImageLine,
  audio: RiMicLine,
  video: RiVideoLine,
}

// A fact-check in a list (Home feed, Library results). The whole card is one link.
// `feed`: below md it drops the box and becomes an edge-to-edge row in a divided list.
export function FactCheckCard({
  report,
  feed = false,
  className,
}: {
  report: FactCheckReport
  feed?: boolean
  className?: string
}) {
  const score = communityScore(report.community)
  const TypeIcon = TYPE_ICON[report.contentType]
  const t = useTranslations("Verdicts.card")
  const labels = useContentLabels()
  const f = useFormat()

  return (
    <article
      className={cn(
        "group press-surface relative flex h-full flex-col gap-3 border bg-card p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-foreground/30",
        feed &&
          "max-md:gap-2 max-md:border-x-0 max-md:border-t-0 max-md:bg-background max-md:py-3.5 max-md:pr-[clamp(1rem,3vw,3rem)] max-md:pl-[calc(clamp(1rem,3vw,3rem)+0.25rem)] max-md:focus-within:ring-inset max-md:hover:border-border",
        className
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", VERDICT_META[report.verdict].solid)} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <VerdictBadge verdict={report.verdict} size="sm" />
          <CommunityBadge status={score.status} />
        </div>
        <ConfidenceMeter
          value={report.confidence}
          verdict={report.verdict}
          size="sm"
          showLabel={false}
          className={cn("-mt-1 -mr-1", feed && "max-md:-my-1.5 max-md:scale-90")}
        />
      </div>

      <h3 className="font-heading leading-snug font-semibold text-balance">
        <Link
          href={`/fact-checks/${report.id}`}
          className="outline-none after:absolute after:inset-0 group-hover:text-primary"
        >
          {report.title}
        </Link>
      </h3>
      <p className="line-clamp-2 text-sm text-muted-foreground">{report.summary}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <TypeIcon className="size-3.5" aria-hidden />
          {labels.category(report.category)}
        </span>
        <span>{labels.language(report.language)}</span>
        <time dateTime={report.checkedAt}>{f.date(report.checkedAt)}</time>
        {score.ccs !== null && (
          <span className="ml-auto inline-flex items-center gap-1" title={t("ccs")}>
            <RiThumbUpLine className="size-3.5" aria-hidden />
            {score.ccs}% · {f.number(score.total)}
          </span>
        )}
      </div>
    </article>
  )
}
