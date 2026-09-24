import Link from "next/link"
import { RiArrowRightLine, RiTrophyLine } from "@remixicon/react"

import { SectionTitle } from "@/components/motion/section"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { RATING_WEIGHTS, type CommunityScore } from "@/lib/community"
import type { FactCheckReport } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/verdicts"

type Leader = { report: FactCheckReport; score: CommunityScore }

// FR-RATE-10: the leaderboard of the most accurately rated stories, ranked by leaderboard()
// in lib/library.ts. Rendered on /verify (moved off the home page at Noah's request, 24 Sep
// 2026). Rows are whole-row links (press-surface, globals.css).
export function Leaderboard({
  leaders,
  minRatings = 25,
}: {
  leaders: Leader[]
  minRatings?: number
}) {
  if (leaders.length === 0) return null

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="border-t bg-background"
    >
      <div className="mx-auto grid page-container max-w-7xl gap-8 py-12 md:py-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
        <div className="flex flex-col gap-4">
          <SectionTitle
            id="leaderboard-title"
            eyebrow="Community leaderboard"
            title="Most accurately rated"
            description="The fact-checks Uganda's readers most confidently agree with."
          />
          <p
            data-reveal
            className="max-w-md text-sm text-muted-foreground"
            style={{ "--d": 1 } as React.CSSProperties}
          >
            Ranked by the share of readers who rated the verdict accurate —
            journalists count {RATING_WEIGHTS.journalist}×, experts{" "}
            {RATING_WEIGHTS.expert}× — adjusted for how many people rated, so a
            handful of votes can&apos;t top the board. A story needs at least{" "}
            {minRatings} ratings to qualify.
          </p>
        </div>

        <Card data-reveal className="gap-0 py-0">
          <CardContent className="px-0">
            <ItemGroup className="gap-0">
              {leaders.map(({ report, score }, i) => (
                <LeaderRow
                  key={report.id}
                  rank={i + 1}
                  report={report}
                  score={score}
                />
              ))}
            </ItemGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Link
              href="/fact-checks"
              className="press inline-flex items-center gap-1 text-xs font-medium text-primary [--press-tint:transparent] hover:underline dark:text-foreground"
            >
              Browse the library{" "}
              <RiArrowRightLine className="size-3.5" aria-hidden />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

function LeaderRow({ rank, report, score }: Leader & { rank: number }) {
  const agree = score.ccs ?? 0
  return (
    <Item
      role="listitem"
      className="press-surface relative gap-x-4 gap-y-2 border-b px-4 py-3 [--surface-scale:1] last:border-b-0 hover:bg-muted/50 sm:flex-nowrap"
    >
      <ItemMedia
        className={cn(
          "w-7 justify-start font-heading text-2xl font-bold tabular-nums",
          rank === 1 ? "text-primary" : "text-muted-foreground"
        )}
      >
        <span className="sr-only">Rank </span>
        {rank}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-2 w-auto text-sm">
          <Link
            href={`/fact-checks/${report.id}`}
            className="outline-none after:absolute after:inset-0 hover:text-primary focus-visible:underline"
          >
            {report.title}
          </Link>
        </ItemTitle>
        <ItemDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <VerdictBadge verdict={report.verdict} size="sm" />
          <span>
            {report.category} ·{" "}
            <time dateTime={report.checkedAt}>
              {formatDate(report.checkedAt)}
            </time>
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="w-full flex-col items-stretch gap-1 pl-11 sm:w-36 sm:shrink-0 sm:pl-0">
        <p className="flex items-baseline justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-heading text-base font-bold tabular-nums">
            {rank === 1 && (
              <RiTrophyLine className="size-4 text-primary" aria-hidden />
            )}
            {agree}%
          </span>
          <span className="text-muted-foreground">agree</span>
        </p>
        <div
          className="flex h-1.5 w-full overflow-hidden bg-muted"
          role="img"
          aria-label={`${agree}% of weighted ratings say the verdict is accurate, ${100 - agree}% say it is not`}
        >
          <div
            className="bar-grow h-full bg-verdict-authentic"
            style={{ width: `${agree}%` }}
          />
          <div className="h-full flex-1 bg-verdict-false/70" />
        </div>
        <p className="text-right text-xs text-muted-foreground tabular-nums">
          {score.total.toLocaleString()} ratings
        </p>
      </ItemActions>
    </Item>
  )
}
