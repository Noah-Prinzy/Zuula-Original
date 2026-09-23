// @vitest-environment jsdom
import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Leaderboard } from "@/components/home/leaderboard"
import { leaderboard } from "@/lib/library"
import { makeReport } from "@/test/fixtures"
import { renderWithIntl } from "@/test/render"

const reports = [
  makeReport({ id: "few", title: "Few but unanimous", accurate: 26 }),
  makeReport({
    id: "many",
    title: "Many and near-unanimous",
    accurate: 420,
    inaccurate: 4,
  }),
  makeReport({ id: "thin", title: "Too few ratings", accurate: 10 }),
]

describe("Leaderboard", () => {
  it("lists qualifying stories in rank order, each linking to its report", () => {
    renderWithIntl(<Leaderboard leaders={leaderboard(reports, 5)} />)
    const region = screen.getByRole("region", { name: "Most accurately rated" })
    const rows = within(region).getAllByRole("listitem")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent("Rank 1")
    expect(within(rows[0]).getByRole("link")).toHaveAttribute(
      "href",
      "/fact-checks/many"
    )
    expect(rows[0]).toHaveTextContent("99%")
    expect(rows[0]).toHaveTextContent("424 ratings")
    expect(within(rows[1]).getByRole("link")).toHaveAttribute(
      "href",
      "/fact-checks/few"
    )
    expect(screen.queryByText("Too few ratings")).not.toBeInTheDocument()
  })

  it("renders nothing when no story qualifies", () => {
    const { container } = renderWithIntl(<Leaderboard leaders={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
