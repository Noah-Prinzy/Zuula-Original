import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { RiFireLine, RiThumbUpLine, RiTrophyLine } from "@remixicon/react"

import { PhotoHero } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { RotatingCard } from "@/components/home/rotating-card"
import { Emphasis } from "@/components/motion/text/emphasis"
import { KineticText } from "@/components/motion/text/kinetic-text"
import { WordRotator } from "@/components/motion/text/word-rotator"
import { SubmissionComposer } from "@/components/submission/submission-composer"
import { Badge } from "@/components/ui/badge"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { communityScore } from "@/lib/community"
import {
  latest,
  leaderboard,
  mostDebated,
  toSearchParams,
  trendingTopics,
} from "@/lib/library"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import type { FactCheckReport } from "@/lib/types/fact-check"
import { formatDate } from "@/lib/verdicts"

// Sample data is dated September 2026; anchor "this week" to the newest sample.
const NOW = new Date(SAMPLE_REPORTS[0]?.checkedAt ?? Date.now())

// Stagger index for the `enter` / `data-reveal` animations (globals.css, "Motion + sections").
const delay = (d: number) => ({ "--d": d }) as React.CSSProperties

// One slide: a single fact-check on one line, with a tag saying why it is shown.
function ReportSlide({
  report,
  tag,
  ccsTitle,
}: {
  report: FactCheckReport
  tag: string
  ccsTitle: string
}) {
  const score = communityScore(report.community)
  return (
    <div className="relative flex h-full flex-col justify-center gap-1 px-4 py-2.5 transition-colors hover:bg-muted/50 xl:flex-row xl:items-center xl:gap-3">
      <Link
        href={`/fact-checks/${report.id}`}
        className="line-clamp-1 text-sm font-medium after:absolute after:inset-0 hover:text-primary xl:min-w-0 xl:flex-1"
      >
        {report.title}
      </Link>
      <div className="flex items-center gap-2 text-xs text-muted-foreground xl:shrink-0">
        <span className="shrink-0 font-semibold text-foreground">{tag}</span>
        <VerdictBadge verdict={report.verdict} size="sm" />
        <span className="truncate">
          {report.category} ·{" "}
          <time dateTime={report.checkedAt}>
            {formatDate(report.checkedAt)}
          </time>
        </span>
        {score.ccs !== null && (
          <span
            className="ml-auto inline-flex shrink-0 items-center gap-1 tabular-nums"
            title={ccsTitle}
          >
            <RiThumbUpLine className="size-3.5" aria-hidden />
            {score.ccs}% · {score.total.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

// One section: the hero text and composer, with two short status cards right below whose
// slides rotate. FR-SEARCH-05: recent and most debated checks. FR-RATE-10: leaderboard.
// "Why Zuula" lives on /about.
export default async function HomePage() {
  const t = await getTranslations("Home")
  // Word lists are keyed objects ("0", "1", …) because next-intl messages can't be arrays.
  const words = (key: "headline.line1Words" | "headline.line2Words") =>
    Object.values(t.raw(key) as Record<string, string>)
  const carousel = {
    previous: t("carousel.previous"),
    next: t("carousel.next"),
    slide: t.raw("carousel.slide") as string,
  }

  const recent = latest(SAMPLE_REPORTS, 5)
  const debated = mostDebated(SAMPLE_REPORTS, 5)
    .filter((r) => !recent.some((x) => x.id === r.id))
    .slice(0, 3)
  const topics = trendingTopics(SAMPLE_REPORTS, 6, NOW)
  const leaders = leaderboard(SAMPLE_REPORTS, 5)

  return (
    <PhotoHero
      photo={PHOTOS.newspaperWall}
      priority
      position="center 60%"
      // In development the "Demo: view as" bar (#role-switcher) sits above the header; leave room for it.
      className="flex min-h-[calc(100svh-var(--header-h))] flex-col [html:has(#role-switcher)_&]:min-h-[calc(100svh-var(--header-h)-2.3125rem)]"
    >
      <div className="flex page-container flex-1 flex-col items-center justify-center gap-5 py-8 text-center [@media(max-height:52rem)]:py-4">
        <Badge
          variant="outline"
          className="enter border-white/40 bg-black/20 text-white backdrop-blur-sm"
        >
          {t("badge")}
        </Badge>
        <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight text-balance drop-shadow-sm [--kinetic-accent:var(--chart-1)] md:text-5xl xl:text-6xl">
          <KineticText text={t("headline.line1Before")} delay={120} />{" "}
          <WordRotator
            words={words("headline.line1Words")}
            delay={230}
            marker
            className="em-mark-solid"
          />
          {t("headline.line1After") && (
            <>
              {" "}
              <KineticText
                text={t("headline.line1After")}
                delay={120}
                offset={2}
              />
            </>
          )}
          <br />
          <KineticText
            text={t("headline.line2Before")}
            delay={120}
            offset={3}
          />{" "}
          {/* Rotates like the word above, without the highlighter stroke. */}
          <WordRotator
            words={words("headline.line2Words")}
            interval={3200}
            delay={380}
          />{" "}
          <KineticText text={t("headline.line2After")} delay={120} offset={5} />
        </h1>
        <p
          className="enter max-w-3xl text-base text-balance text-white/85 md:text-lg xl:text-xl"
          style={delay(4)}
        >
          {t.rich("subtitle", {
            scribble: (chunks) => (
              <Emphasis variant="scribble" tone="light" delay={900}>
                {chunks}
              </Emphasis>
            ),
          })}
        </p>

        <div className="enter mt-4 w-full max-w-5xl" style={delay(6)}>
          <SubmissionComposer
            variant="compact"
            className="w-full text-foreground shadow-2xl"
          />
        </div>

        {/* Status cards sit directly under the composer. */}
        <div className="grid w-full max-w-7xl gap-4 lg:grid-cols-2 [@media(max-height:52rem)]:-mt-2">
          <RotatingCard
            id="feed-title"
            eyebrow={t("feed.eyebrow")}
            title={t("feed.title")}
            live
            href="/fact-checks"
            linkLabel={t("feed.link")}
            labels={carousel}
            style={delay(8)}
          >
            {recent.map((r) => (
              <ReportSlide
                key={r.id}
                report={r}
                tag={t("feed.tagNew")}
                ccsTitle={t("feed.ccsTitle")}
              />
            ))}
            {debated.map((r) => (
              <ReportSlide
                key={r.id}
                report={r}
                tag={t("feed.tagDebated")}
                ccsTitle={t("feed.ccsTitle")}
              />
            ))}
          </RotatingCard>

          <RotatingCard
            id="community-title"
            eyebrow={t("community.eyebrow")}
            title={t("community.title")}
            href="/fact-checks"
            linkLabel={t("community.link")}
            labels={carousel}
            interval={6000}
            style={delay(9)}
          >
            <div className="flex h-full flex-col justify-center gap-1.5 px-4 py-2.5 xl:flex-row xl:items-center xl:justify-start xl:gap-3">
              <p className="shrink-0 text-xs font-semibold">
                {t("community.trending")}
              </p>
              <ul
                className="flex flex-wrap gap-1.5 overflow-hidden"
                style={{ maxHeight: "1.75rem" }}
              >
                {topics.map((topic) => (
                  <li key={topic.category}>
                    <Link
                      href={`/fact-checks?${toSearchParams({ category: topic.category })}`}
                      className="inline-flex items-center gap-1.5 border bg-card px-2 py-0.5 text-xs transition-colors hover:border-primary hover:text-primary"
                    >
                      <RiFireLine
                        className="size-3.5 text-primary"
                        aria-hidden
                      />
                      {topic.category}
                      <span className="font-mono text-muted-foreground">
                        {topic.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {leaders.map(({ report, score }, i) => (
              <div
                key={report.id}
                className="relative flex h-full flex-col justify-center gap-1 px-4 py-2.5 transition-colors hover:bg-muted/50 xl:flex-row xl:items-center xl:gap-3"
              >
                <Link
                  href={`/fact-checks/${report.id}`}
                  className="line-clamp-1 text-sm font-medium after:absolute after:inset-0 hover:text-primary xl:min-w-0 xl:flex-1"
                >
                  {report.title}
                </Link>
                <div className="flex items-center gap-2 text-xs text-muted-foreground xl:shrink-0">
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-foreground">
                    <RiTrophyLine
                      className="size-3.5 text-primary"
                      aria-hidden
                    />
                    {t("community.rank", { rank: i + 1 })}
                  </span>
                  <VerdictBadge verdict={report.verdict} size="sm" />
                  <span className="ml-auto shrink-0 tabular-nums">
                    {t("community.agree", {
                      ccs: score.ccs ?? 0,
                      total: score.total.toLocaleString(),
                    })}
                  </span>
                </div>
              </div>
            ))}
          </RotatingCard>
        </div>
      </div>
    </PhotoHero>
  )
}
