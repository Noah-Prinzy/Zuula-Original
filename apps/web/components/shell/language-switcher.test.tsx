// @vitest-environment jsdom
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { LocaleCode } from "@/lib/locales"
import { renderWithIntl } from "@/test/render"

const session = vi.hoisted(() => ({
  locale: "en" as LocaleCode,
  switchingLocale: false,
  setLocale: vi.fn(),
}))
vi.mock("@/components/providers/session-provider", () => ({ useSession: () => session }))

import { LanguageSwitcher } from "@/components/shell/language-switcher"

beforeEach(() => {
  session.locale = "en"
  session.switchingLocale = false
  session.setLocale.mockClear()
})

describe("LanguageSwitcher", () => {
  it("names the current language in its own language", () => {
    session.locale = "ach"
    renderWithIntl(<LanguageSwitcher />)
    expect(screen.getByRole("button", { name: /Lëb Acoli/ })).toBeInTheDocument()
  })

  it("lists all five languages and switches on pick", async () => {
    const user = userEvent.setup()
    renderWithIntl(<LanguageSwitcher />)
    await user.click(screen.getByRole("button", { name: /English/ }))

    const items = await screen.findAllByRole("menuitemradio")
    expect(items.map((i) => i.getAttribute("lang"))).toEqual(["en", "lg", "ach", "nyn", "teo"])
    expect(items[0]).toHaveAttribute("aria-checked", "true")

    await user.click(screen.getByRole("menuitemradio", { name: /Luganda/ }))
    expect(session.setLocale).toHaveBeenCalledWith("lg")
  })

  it("shows that a switch is in progress", () => {
    session.switchingLocale = true
    renderWithIntl(<LanguageSwitcher />)
    expect(screen.getByRole("button", { name: /English/ })).toHaveAttribute("aria-busy", "true")
  })
})
