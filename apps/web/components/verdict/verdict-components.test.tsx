// @vitest-environment jsdom
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { AISignalsList } from "@/components/verdict/ai-signals-list"
import { CitationCard } from "@/components/verdict/citation-card"
import { ClaimHighlighter } from "@/components/verdict/claim-highlighter"
import { confidenceLevel, ConfidenceMeter } from "@/components/verdict/confidence-meter"
import { ExpertAnnotation } from "@/components/verdict/expert-annotation"
import { FactCheckCard } from "@/components/verdict/fact-check-card"
import { HumanVerifiedBadge } from "@/components/verdict/human-verified-badge"
import { VerdictSummary } from "@/components/verdict/verdict-summary"
import { WhatIsTrueCard } from "@/components/verdict/what-is-true-card"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import type { Citation, FlaggedClaim } from "@/lib/types/fact-check"
import { renderWithIntl } from "@/test/render"

const report = SAMPLE_REPORTS.find((r) => r.claims.length > 0 && r.citations.length > 0)!
const withReview = SAMPLE_REPORTS.find((r) => r.humanReview)
const withAnnotation = SAMPLE_REPORTS.find((r) => r.annotations.length > 0)
const withSignals = SAMPLE_REPORTS.find((r) => r.aiSignals.length > 0)

describe("FactCheckCard", () => {
  it.each(SAMPLE_REPORTS.slice(0, 6))("links $id to its report with its title and verdict", (r) => {
    const { container } = renderWithIntl(<FactCheckCard report={r} />)
    const link = screen.getByRole("link", { name: new RegExp(r.title.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })
    expect(link).toHaveAttribute("href", `/fact-checks/${r.id}`)
    expect(container.querySelector(`[data-verdict='${r.verdict}']`)).not.toBeNull()
  })
})

describe("VerdictSummary", () => {
  it("shows the verdict, confidence and summary", () => {
    const { container } = renderWithIntl(<VerdictSummary report={report} />)
    expect(container.querySelector(`[data-verdict='${report.verdict}']`)).not.toBeNull()
    expect(screen.getAllByText(new RegExp(`${report.confidence}%`)).length).toBeGreaterThan(0)
    expect(screen.getByText(report.summary)).toBeInTheDocument()
  })

  it.each(SAMPLE_REPORTS.map((r) => [r.contentType, r] as const).filter(([t], i, a) => a.findIndex(([u]) => u === t) === i))(
    "renders a %s report",
    (_type, r) => {
      renderWithIntl(<VerdictSummary report={r} />)
      expect(screen.getByText(r.summary)).toBeInTheDocument()
    }
  )
})

describe("ConfidenceMeter", () => {
  it.each([
    [95, "high"],
    [85, "high"],
    [70, "moderate"],
    [59, "low"],
  ] as const)("%i%% is %s confidence", (value, level) => {
    expect(confidenceLevel(value)).toBe(level)
  })

  it.each(["sm", "md", "lg"] as const)("renders the %s size with its value", (size) => {
    renderWithIntl(<ConfidenceMeter value={72} verdict="likely-false" size={size} showLabel />)
    expect(screen.getAllByText(/72/).length).toBeGreaterThan(0)
  })
})

describe("ClaimHighlighter (FR-DETECT-05)", () => {
  const text = "Salt water cures malaria. The ministry said so. Vaccines are safe."
  const citations: Citation[] = [
    { id: "c1", sourceName: "Ministry of Health", title: "Malaria facts", url: "https://health.go.ug/malaria", publishedAt: "2026-09-01", stance: "contradicts" } as Citation,
  ]
  const claims: FlaggedClaim[] = [
    { id: "k1", start: 0, end: 25, assessment: "false", reason: "No evidence salt water cures malaria.", citationIds: ["c1"] },
    // Overlaps the first claim: skipped rather than breaking the text.
    { id: "k2", start: 10, end: 30, assessment: "misleading", reason: "Overlap", citationIds: [] },
    // Out of range: ignored.
    { id: "k3", start: 50, end: 500, assessment: "unsupported", reason: "Bad offsets", citationIds: [] },
  ]

  it("keeps the full text and marks only valid, non-overlapping claims", () => {
    const { container } = renderWithIntl(<ClaimHighlighter text={text} claims={claims} citations={citations} />)
    expect(container.textContent).toContain("The ministry said so.")
    const marks = screen.getAllByRole("button")
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent("Salt water cures malaria.")
  })

  it("opens the reason and sources from the keyboard", async () => {
    const user = userEvent.setup()
    renderWithIntl(<ClaimHighlighter text={text} claims={claims} citations={citations} />)
    screen.getByRole("button").focus()
    await user.keyboard("{Enter}")
    expect(await screen.findByText("No evidence salt water cures malaria.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Ministry of Health/ })).toHaveAttribute("href", "https://health.go.ug/malaria")
  })

  it("renders plain text when there are no claims", () => {
    renderWithIntl(<ClaimHighlighter text={text} claims={[]} citations={[]} />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.getByText(text)).toBeInTheDocument()
  })
})

describe("CitationCard", () => {
  it.each(report.citations.slice(0, 3))("links to $sourceName in a new tab", (c) => {
    renderWithIntl(<CitationCard citation={c} index={1} />)
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === c.url)!
    expect(link).toHaveAttribute("target", "_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
    expect(screen.getByText(c.sourceName, { exact: false })).toBeInTheDocument()
  })
})

describe("WhatIsTrueCard (FR-EXPLAIN-07)", () => {
  it("lists what is false and what is true", () => {
    renderWithIntl(<WhatIsTrueCard whatIsFalse={["Claim A is wrong"]} whatIsTrue={["Fact B is right", "Fact C too"]} />)
    expect(screen.getByText("Claim A is wrong")).toBeInTheDocument()
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      expect.arrayContaining(["Claim A is wrong", "Fact B is right", "Fact C too"])
    )
  })

  it("copes with an empty side", () => {
    renderWithIntl(<WhatIsTrueCard whatIsFalse={[]} whatIsTrue={["Only truth"]} />)
    expect(screen.getByText("Only truth")).toBeInTheDocument()
  })
})

describe("AI signals, expert notes and human review", () => {
  it.runIf(withSignals)("lists every AI signal", () => {
    renderWithIntl(<AISignalsList signals={withSignals!.aiSignals} />)
    for (const s of withSignals!.aiSignals) expect(screen.getAllByText(s.label, { exact: false }).length).toBeGreaterThan(0)
  })

  it.runIf(withAnnotation)("shows an expert annotation with its author", () => {
    const a = withAnnotation!.annotations[0]
    renderWithIntl(<ExpertAnnotation annotation={a} />)
    expect(screen.getByText(a.author, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(a.body, { exact: false })).toBeInTheDocument()
  })

  it.runIf(withReview)("shows who verified the report on focus", async () => {
    const user = userEvent.setup()
    const { container } = renderWithIntl(<HumanVerifiedBadge review={withReview!.humanReview!} />)
    await user.tab()
    expect(within(container).getByText(/./)).toHaveFocus()
    expect((await screen.findAllByText(new RegExp(withReview!.humanReview!.reviewer))).length).toBeGreaterThan(0)
  })

  it("names the previous verdict when a reviewer overrides it", async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <HumanVerifiedBadge
        review={{ outcome: "overridden", previousVerdict: "authentic", reviewer: "Dr. Achan", reviewedAt: "2026-09-20", justification: "" }}
      />
    )
    await user.tab()
    expect((await screen.findAllByText(/Dr\. Achan/)).length).toBeGreaterThan(0)
  })
})
