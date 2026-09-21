import Link from "next/link"
import {
  RiArrowRightLine,
  RiFireLine,
  RiGlobalLine,
  RiRobot2Line,
  RiShieldCheckLine,
  RiTrophyLine,
} from "@remixicon/react"

import { SubmissionComposer } from "@/components/submission/submission-composer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FactCheckCard } from "@/components/verdict/fact-check-card"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { latest, leaderboard, mostDebated, toSearchParams, trendingTopics } from "@/lib/library"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"

const FEATURES = [
  {
    icon: RiShieldCheckLine,
    title: "Trusted sources",
    body: "Claims are cross-referenced against Ugandan and international outlets and fact-checkers.",
  },
  {
    icon: RiRobot2Line,
    title: "AI content detection",
    body: "Flags AI-generated text, deepfake images, synthetic audio and manipulated video.",
  },
  {
    icon: RiGlobalLine,
    title: "Ugandan languages",
    body: "English, Luganda, Acholi, Runyankole and Ateso.",
  },
]

// Sample data is dated September 2026; anchor "this week" to the newest sample.
const NOW = new Date(SAMPLE_REPORTS[0]?.checkedAt ?? Date.now())
const FEED_SIZE = 6

function SectionHeading({ id, icon: Icon, title, description }: {
  id: string
  icon: typeof RiFireLine
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 id={id} className="flex items-center gap-2 font-heading text-lg font-bold">
        <Icon className="size-5 text-primary" aria-hidden />
        {title}
      </h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export default function HomePage() {
  const feed = { latest: latest(SAMPLE_REPORTS, FEED_SIZE), debated: mostDebated(SAMPLE_REPORTS, FEED_SIZE) }
  const topics = trendingTopics(SAMPLE_REPORTS, 8, NOW)
  const leaders = leaderboard(SAMPLE_REPORTS, 5)

  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="page-container flex flex-col items-center gap-5 py-16 text-center md:py-24">
          <Badge variant="outline">Uganda Fact-Guard · Victoria University CIT</Badge>
          <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight text-balance md:text-5xl xl:text-6xl">
            Check a claim before you share it
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground text-balance md:text-lg xl:text-xl">
            Paste a message, a link or upload media. Zuula tells you whether it is authentic, false
            or AI-generated — and shows you the sources.
          </p>

          <SubmissionComposer variant="compact" className="mt-4 w-full max-w-5xl" />
        </div>
      </section>

      <div className="page-container grid items-start gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        {/* FR-SEARCH-05: real-time feed of recent and most debated checks. */}
        <section aria-labelledby="feed-title" className="flex flex-col gap-4">
          <Tabs defaultValue="latest" className="gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeading
                id="feed-title"
                icon={RiShieldCheckLine}
                title="Recent fact-checks"
                description="What people in Uganda are checking right now."
              />
              <TabsList>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="debated">Most debated</TabsTrigger>
              </TabsList>
            </div>
            {(["latest", "debated"] as const).map((key) => (
              <TabsContent key={key} value={key}>
                <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {feed[key].map((r) => (
                    <li key={r.id}>
                      <FactCheckCard report={r} />
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
          <Button variant="outline" asChild className="w-fit">
            <Link href="/fact-checks">
              Browse the Library <RiArrowRightLine aria-hidden />
            </Link>
          </Button>
        </section>

        <aside className="flex flex-col gap-8">
          <section aria-labelledby="trending-title" className="flex flex-col gap-3">
            <SectionHeading id="trending-title" icon={RiFireLine} title="Trending topics" description="Most checked this week." />
            <ul className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <li key={t.category}>
                  <Link
                    href={`/fact-checks?${toSearchParams({ category: t.category })}`}
                    className="inline-flex items-center gap-1.5 border bg-card px-2.5 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {t.category}
                    <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* FR-RATE-10: most accurately rated stories. */}
          <section aria-labelledby="leaders-title" className="flex flex-col gap-3">
            <SectionHeading
              id="leaders-title"
              icon={RiTrophyLine}
              title="Community-confirmed"
              description="Verdicts the community agrees with most."
            />
            <ol className="flex flex-col divide-y border bg-card">
              {leaders.map(({ report, score }, i) => (
                <li key={report.id} className="relative flex items-start gap-3 p-3 hover:bg-muted/50">
                  <span className="w-5 shrink-0 font-heading text-lg leading-6 font-bold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/fact-checks/${report.id}`}
                      className="line-clamp-2 text-sm font-medium after:absolute after:inset-0 hover:text-primary"
                    >
                      {report.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <VerdictBadge verdict={report.verdict} size="sm" />
                      <span className="tabular-nums">
                        {score.ccs}% agree · {score.total.toLocaleString()} ratings
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <section aria-label="Why Zuula" className="border-t bg-muted/30">
        <div className="page-container grid gap-4 py-12 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-2 border bg-card p-5">
              <f.icon className="size-6 text-primary" aria-hidden />
              <h3 className="font-heading font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
