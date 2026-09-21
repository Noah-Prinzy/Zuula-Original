import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { RiArrowLeftLine, RiFlaskLine } from "@remixicon/react"

import { CommunityStatusBanner } from "@/components/community/community-status"
import { RatingComments } from "@/components/community/rating-comments"
import { RatingPanel } from "@/components/community/rating-panel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AISignalsList } from "@/components/verdict/ai-signals-list"
import { CitationCard } from "@/components/verdict/citation-card"
import { ClaimHighlighter } from "@/components/verdict/claim-highlighter"
import { ExpertAnnotation } from "@/components/verdict/expert-annotation"
import { VerdictSummary } from "@/components/verdict/verdict-summary"
import { WhatIsTrueCard } from "@/components/verdict/what-is-true-card"
import { communityScore } from "@/lib/community"
import { getSampleReport, SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import { VERDICT_META } from "@/lib/verdicts"

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return SAMPLE_REPORTS.map((r) => ({ id: r.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = getSampleReport((await params).id)
  if (!report) return { title: "Report" }
  return {
    title: `${VERDICT_META[report.verdict].label}: ${report.title}`,
    description: report.summary,
  }
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="font-heading text-lg font-bold">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export default async function ReportPage({ params }: Props) {
  const report = getSampleReport((await params).id)
  if (!report) notFound()
  const community = communityScore(report.community)

  return (
    <div className="page-container flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/fact-checks">
            <RiArrowLeftLine aria-hidden /> Library
          </Link>
        </Button>
      </div>

      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertTitle>Sample report</AlertTitle>
        <AlertDescription>
          This report uses fictional data to preview the design. Real reports arrive with the AI
          engine.
        </AlertDescription>
      </Alert>

      <VerdictSummary report={report} />
      <CommunityStatusBanner status={community.status} />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        {/* Two columns of sections on very wide screens so lines stay readable. */}
        <div className="grid items-start gap-8 2xl:grid-cols-2">
          <Section
            id="submitted"
            title="What was checked"
            description={
              report.claims.length > 0
                ? "Highlighted claims were assessed individually. Select one to see why."
                : undefined
            }
          >
            <div className="border bg-card p-4">
              <ClaimHighlighter
                text={report.submittedText}
                claims={report.claims}
                citations={report.citations}
              />
            </div>
          </Section>

          <Section id="findings" title="Findings">
            <WhatIsTrueCard whatIsFalse={report.whatIsFalse} whatIsTrue={report.whatIsTrue} />
          </Section>

          {report.aiSignals.length > 0 && (
            <Section
              id="ai-signals"
              title="AI detection signals"
              description="The checks we ran for AI-generated or manipulated content."
            >
              <AISignalsList signals={report.aiSignals} />
            </Section>
          )}

          <Section
            id="comments"
            title="Community comments"
            description="Reasons people gave with their ratings."
          >
            <RatingComments comments={report.community.comments} />
          </Section>

          {report.annotations.length > 0 && (
            <Section id="expert-notes" title="Expert notes">
              <div className="flex flex-col gap-3">
                {report.annotations.map((a) => (
                  <ExpertAnnotation key={a.id} annotation={a} />
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          <Section id="rating" title="Community rating">
            <RatingPanel initial={report.community} />
          </Section>

          <Section
            id="sources"
            title="Sources"
            description={`${report.citations.length} sources cross-referenced`}
          >
            <div className="flex flex-col gap-2">
              {report.citations.map((c, i) => (
                <CitationCard key={c.id} citation={c} index={i + 1} />
              ))}
            </div>
          </Section>
        </aside>
      </div>
    </div>
  )
}
