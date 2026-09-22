// @vitest-environment jsdom
import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { VERDICTS } from "@/lib/types/fact-check"
import { VERDICT_META } from "@/lib/verdicts"
import { renderWithIntl } from "@/test/render"

describe("VerdictBadge", () => {
  it.each(VERDICTS)("shows the %s label, icon and colour", (verdict) => {
    const { container } = renderWithIntl(<VerdictBadge verdict={verdict} />)
    const badge = container.querySelector(`[data-verdict='${verdict}']`)!
    expect(badge).toHaveTextContent(VERDICT_META[verdict].label)
    expect(badge).toHaveClass(VERDICT_META[verdict].text)
    // Colour is never the only signal: the icon is there, and decorative.
    expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("sizes and accepts extra classes", () => {
    renderWithIntl(<VerdictBadge verdict="false" size="lg" className="ml-2" />)
    const badge = screen.getByText(VERDICT_META.false.label)
    expect(badge).toHaveClass("h-8", "ml-2")
  })

  it("defaults to the medium size", () => {
    renderWithIntl(<VerdictBadge verdict="authentic" />)
    expect(screen.getByText(VERDICT_META.authentic.label)).toHaveClass("h-6")
  })
})
