// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Slider } from "@/components/ui/slider"

// The focusable element is each thumb (role="slider"), so it must carry the accessible name
// given to the root; otherwise screen readers announce an unnamed slider (WCAG 4.1.2).
describe("Slider", () => {
  it("names each thumb with the root's aria-label", () => {
    render(<Slider aria-label="Community Verified at or above" value={[40]} />)
    expect(screen.getByRole("slider", { name: "Community Verified at or above" })).toBeInTheDocument()
  })

  it("names each thumb with the root's aria-labelledby", () => {
    render(
      <>
        <span id="range-label">Price range</span>
        <Slider aria-labelledby="range-label" value={[10, 90]} />
      </>
    )
    expect(screen.getAllByRole("slider", { name: "Price range" })).toHaveLength(2)
  })
})
