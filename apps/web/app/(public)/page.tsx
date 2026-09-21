import Link from "next/link"
import {
  RiArrowDownLine,
  RiArrowRightLine,
  RiFireLine,
  RiGlobalLine,
  RiRobot2Line,
  RiShieldCheckLine,
  RiTrophyLine,
} from "@remixicon/react"

import Image from "next/image"

import { PHOTO_QUALITY, PhotoCredit, PhotoHero } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { ScreenSection, SectionTitle, SnapPage } from "@/components/motion/section"
import { SplitText } from "@/components/motion/split-text"
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

// Stagger index for the `enter` / `data-reveal` animations (globals.css, "Motion + sections").
const delay = (d: number) => ({ "--d": d }) as React.CSSProperties

// Each band fills the viewport (ScreenSection), so the next one never peeks in from below.
export default function HomePage() {
  const feed = { latest: latest(SAMPLE_REPORTS, FEED_SIZE), debated: mostDebated(SAMPLE_REPORTS, FEED_SIZE) }
  const topics = trendingTopics(SAMPLE_REPORTS, 8, NOW)
  const leaders = leaderboard(SAMPLE_REPORTS, 5)

  return (
    <SnapPage>
      <PhotoHero
        photo={PHOTOS.kampalaSkyline}
        priority
        position="center 40%"
        className="section-screen border-b"
      >
        <div className="page-container flex flex-col items-center gap-5 py-16 text-center md:py-20">
          <Badge
            variant="outline"
            className="enter border-white/40 bg-black/20 text-white backdrop-blur-sm"
          >
            Uganda Fact-Guard · Victoria University CIT
          </Badge>
          <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight text-balance drop-shadow-sm md:text-5xl xl:text-6xl">
            <SplitText text="Check a claim before you share it" delay={120} />
          </h1>
          <p
            className="enter max-w-3xl text-base text-balance text-white/85 md:text-lg xl:text-xl"
            style={delay(4)}
          >
            Paste a message, a link or upload media. Zuula tells you whether it is authentic, false
            or AI-generated — and shows you the sources.
          </p>

          <div className="enter mt-4 w-full max-w-5xl" style={delay(6)}>
            <SubmissionComposer variant="compact" className="w-full text-foreground shadow-2xl" />
          </div>
        </div>
        <a
          href="#feed"
          aria-label="Scroll to recent fact-checks"
          className="scroll-cue absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-white/70 hover:text-white md:block"
        >
          <RiArrowDownLine className="size-6" aria-hidden />
        </a>
      </PhotoHero>

      {/* FR-SEARCH-05: real-time feed of recent and most debated checks. */}
      <ScreenSection id="feed" aria-labelledby="feed-title" className="page-container gap-8 py-16">
        <Tabs defaultValue="latest" className="gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              id="feed-title"
              eyebrow="Live feed"
              title="Recent fact-checks"
              description="What people in Uganda are checking right now."
            />
            <TabsList data-reveal style={delay(2)}>
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="debated">Most debated</TabsTrigger>
            </TabsList>
          </div>
          {(["latest", "debated"] as const).map((key) => (
            <TabsContent key={key} value={key}>
              <ul data-reveal="stagger" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {feed[key].map((r) => (
                  <li key={r.id} className="hover-lift">
                    <FactCheckCard report={r} />
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
        <div data-reveal>
          <Button variant="outline" asChild className="w-fit">
            <Link href="/fact-checks">
              Browse the Library <RiArrowRightLine aria-hidden />
            </Link>
          </Button>
        </div>
      </ScreenSection>

      <ScreenSection aria-label="Community" className="border-t bg-muted/40">
        <div className="page-container grid items-start gap-12 py-16 lg:grid-cols-2 xl:gap-20">
          <div className="flex flex-col gap-8">
            <SectionTitle
              id="trending-title"
              eyebrow="Trending"
              title="What Uganda is checking"
              description="The most checked topics this week."
            />
            <ul data-reveal="stagger" aria-labelledby="trending-title" className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <li key={t.category}>
                  <Link
                    href={`/fact-checks?${toSearchParams({ category: t.category })}`}
                    className="inline-flex items-center gap-2 border bg-card px-3.5 py-2 transition-colors hover:border-primary hover:text-primary"
                  >
                    <RiFireLine className="size-4 text-primary" aria-hidden />
                    {t.category}
                    <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* FR-RATE-10: most accurately rated stories. */}
          <div className="flex flex-col gap-8">
            <SectionTitle
              id="leaders-title"
              eyebrow="Community-confirmed"
              title="Verdicts people agree with"
              description="Ranked by how strongly the community backs the verdict."
            />
            <ol
              data-reveal="stagger"
              aria-labelledby="leaders-title"
              className="flex flex-col divide-y border bg-card"
            >
              {leaders.map(({ report, score }, i) => (
                <li
                  key={report.id}
                  className="relative flex items-start gap-3 p-4 transition-colors hover:bg-muted/50"
                >
                  <span className="w-6 shrink-0 font-heading text-xl leading-6 font-bold text-primary tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
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
                  <RiTrophyLine className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </ScreenSection>

      <ScreenSection aria-labelledby="why-title" className="isolate overflow-hidden border-t bg-primary">
        <Image
          src={PHOTOS.crimsonTexture.src}
          alt=""
          fill
          quality={PHOTO_QUALITY}
          sizes="100vw"
          className="-z-10 object-cover opacity-90"
        />
        <div className="page-container flex flex-col gap-12 py-16 text-primary-foreground">
          <div data-reveal className="flex max-w-3xl flex-col gap-3">
            <p className="font-heading text-xs font-semibold tracking-widest uppercase opacity-80">
              Why Zuula
            </p>
            <h2
              id="why-title"
              className="font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl"
            >
              <SplitText text="Built for the way news travels in Uganda." />
            </h2>
          </div>
          <div data-reveal="stagger" className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="hover-lift flex flex-col gap-3 border bg-card/95 p-6 text-card-foreground shadow-lg backdrop-blur-sm"
              >
                <f.icon className="size-7 text-primary" aria-hidden />
                <h3 className="font-heading text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <div data-reveal className="flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/verify">
                Check a claim <RiArrowRightLine aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link href="/about">How Zuula works</Link>
            </Button>
          </div>
        </div>
        <PhotoCredit photo={PHOTOS.crimsonTexture} className="absolute right-3 bottom-2" />
      </ScreenSection>
    </SnapPage>
  )
}
