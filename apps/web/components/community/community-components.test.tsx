// @vitest-environment jsdom
import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CCSMeter } from "@/components/community/ccs-meter"
import { CommunityBadge, CommunityStatusBanner } from "@/components/community/community-status"
import { RatingComments } from "@/components/community/rating-comments"
import { communityScore, type CommunityStatus } from "@/lib/community"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import { counts } from "@/test/fixtures"
import { renderWithIntl } from "@/test/render"

const score = (accurate: number, inaccurate: number) =>
  communityScore({ accurate: counts({ public: accurate }), inaccurate: counts({ public: inaccurate }) })

describe("CCSMeter (FR-RATE-02/03)", () => {
  it("shows the score, totals and an accessible bar", () => {
    renderWithIntl(<CCSMeter score={score(3, 1)} />)
    expect(screen.getByText("75%")).toBeInTheDocument()
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/75%/)
  })

  it("shows a dash with no ratings", () => {
    renderWithIntl(<CCSMeter score={score(0, 0)} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("formats large totals", () => {
    renderWithIntl(<CCSMeter score={score(12000, 400)} />)
    expect(screen.getAllByText(/12,400/).length).toBeGreaterThan(0)
  })
})

describe("community status (§9.2)", () => {
  it("shows no badge for the standard status", () => {
    const { container } = renderWithIntl(<CommunityBadge status="standard" />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(["verified", "questioned", "escalated", "suspended"] as CommunityStatus[])("labels %s", (status) => {
    const { container } = renderWithIntl(<CommunityBadge status={status} />)
    expect(container.textContent).not.toBe("")
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("shows no banner for the standard status", () => {
    const { container } = renderWithIntl(<CommunityStatusBanner status="standard" />)
    expect(container).toBeEmptyDOMElement()
  })

  it("announces a verified report politely", () => {
    renderWithIntl(<CommunityStatusBanner status="verified" />)
    expect(screen.getByRole("status")).not.toBeEmptyDOMElement()
  })

  it.each(["questioned", "escalated", "suspended"] as CommunityStatus[])("raises an alert for %s reports", (status) => {
    renderWithIntl(<CommunityStatusBanner status={status} />)
    expect(screen.getByRole("alert")).not.toBeEmptyDOMElement()
  })
})

describe("RatingComments", () => {
  const comments = SAMPLE_REPORTS.flatMap((r) => r.community.comments).slice(0, 4)

  it("lists reasons with their authors", () => {
    renderWithIntl(<RatingComments comments={comments} />)
    for (const c of comments) expect(screen.getAllByText(c.author, { exact: false }).length).toBeGreaterThan(0)
  })

  it("handles no comments", () => {
    const { container } = renderWithIntl(<RatingComments comments={[]} />)
    expect(container).toBeInTheDocument()
  })
})
