// @vitest-environment jsdom
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { SessionUser } from "@/components/providers/session-provider"
import type { Role } from "@/lib/roles"
import { renderWithIntl } from "@/test/render"

const state = vi.hoisted(() => ({ path: "/", user: null as SessionUser | null, role: null as Role | null }))
const signOut = vi.hoisted(() => vi.fn(async () => {}))
vi.mock("@/hooks/use-page-path", () => ({ usePagePath: () => state.path }))
vi.mock("@/components/pwa/use-online", () => ({ useOnline: () => true }))
vi.mock("@/components/account/notifications-store", () => ({ useNotifications: () => ({ items: [], unread: 2 }) }))
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "system", setTheme: vi.fn() }) }))
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    user: state.user,
    role: state.role,
    locale: "en",
    switchingLocale: false,
    setLocale: vi.fn(),
    signOut,
  }),
}))

import { BottomNav } from "@/components/shell/bottom-nav"

// The sheet (vaul) captures the pointer on press; jsdom has no pointer capture.
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}

beforeEach(() => {
  state.path = "/"
  state.user = null
  state.role = null
})

describe("BottomNav", () => {
  it("has Home, Library, Verify and Saved tabs, marking the current one", () => {
    state.path = "/fact-checks"
    renderWithIntl(<BottomNav />)
    const nav = screen.getByRole("navigation", { name: "Quick links" })
    expect(nav).toBeVisible()
    for (const name of ["Home", "Library", "Verify", "Saved"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument()
    }
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
  })

  it("counts a submission's status page as part of Verify", () => {
    state.path = "/submissions/ZL-1234-AB"
    renderWithIntl(<BottomNav />)
    expect(screen.getByRole("link", { name: "Verify" })).toHaveAttribute("aria-current", "page")
  })

  it("steps aside on a report, which has its own action bar", () => {
    state.path = "/fact-checks/fc-2026-0142"
    renderWithIntl(<BottomNav />)
    expect(screen.queryByRole("navigation", { name: "Quick links" })).not.toBeInTheDocument()
  })

  it("opens the account sheet with sign-in links and settings when signed out", async () => {
    const user = userEvent.setup()
    renderWithIntl(<BottomNav />)
    await user.click(screen.getByRole("button", { name: "Account" }))
    const sheet = await screen.findByRole("dialog", { name: "Account and settings" })
    expect(sheet).toHaveTextContent("Welcome to Zuula")
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/sign-in")
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /Dark/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sign Out" })).not.toBeInTheDocument()
  })

  it("lists workspaces for the role, the unread count and sign-out when signed in", async () => {
    state.user = { id: "u1", name: "Nakato Sarah", email: "nakato@example.com", role: "admin" } as SessionUser
    state.role = "admin"
    const user = userEvent.setup()
    renderWithIntl(<BottomNav />)
    await user.click(screen.getByRole("button", { name: "Account (2)" }))
    await screen.findByRole("dialog")
    expect(screen.getByRole("link", { name: /Nakato Sarah/ })).toHaveAttribute("href", "/account")
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/review")
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin")
    expect(screen.getByRole("link", { name: /Notifications/ })).toHaveTextContent("2")
    await user.click(screen.getByRole("button", { name: "Sign Out" }))
    expect(signOut).toHaveBeenCalled()
  })
})
