// @vitest-environment jsdom
import * as React from "react"
import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithIntl } from "@/test/render"

const api = vi.hoisted(() => ({ me: vi.fn(), signOut: vi.fn() }))
vi.mock("@/lib/api", () => ({ authApi: api }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("@/i18n/actions", () => ({ setLocaleCookie: vi.fn() }))

import { resetPreviewForTests, SessionProvider, useSession } from "@/components/providers/session-provider"
import { RoleSwitcher } from "@/components/shell/role-switcher"

const MARY = { id: "u1", name: "Mary Akello", email: "mary@example.com", role: "admin" } as const

// The latest context value, for calling its actions from tests. Updated in a layout effect, in
// the same commit as the DOM: with useEffect, waitFor could see the new DOM while probe still
// held the previous render's actions (e.g. a signOut from before sign-in).
const probe = {} as { session: ReturnType<typeof useSession> }
function Probe() {
  const s = useSession()
  React.useLayoutEffect(() => {
    probe.session = s
  })
  return <p data-testid="who">{s.ready ? `${s.source ?? "none"}:${s.role ?? "-"}` : "checking"}</p>
}
const session = new Proxy({} as ReturnType<typeof useSession>, {
  get: (_, key) => probe.session[key as keyof ReturnType<typeof useSession>],
})

function renderSession() {
  return renderWithIntl(
    <SessionProvider>
      <RoleSwitcher />
      <Probe />
    </SessionProvider>
  )
}

const who = () => screen.getByTestId("who").textContent

beforeEach(() => {
  localStorage.clear()
  resetPreviewForTests()
  api.me.mockReset()
  api.signOut.mockReset()
})

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_ROLE_SWITCHER", "true"))
afterEach(() => vi.unstubAllEnvs())

describe("SessionProvider", () => {
  it("takes the user and role from the API session", async () => {
    api.me.mockResolvedValue(MARY)
    renderSession()
    expect(who()).toBe("checking")
    await waitFor(() => expect(who()).toBe("account:admin"))
    expect(session.user).toEqual({ name: "Mary Akello", email: "mary@example.com", role: "admin" })
  })

  it("ignores a stored preview role once someone is really signed in, and hides the switcher", async () => {
    localStorage.setItem("zuula.preview-role", JSON.stringify({ role: "expert" }))
    api.me.mockResolvedValue({ ...MARY, role: "public" })
    renderSession()
    await waitFor(() => expect(who()).toBe("account:public"))
    expect(screen.queryByLabelText(/preview as/i)).toBeNull()
    act(() => session.previewAs("admin"))
    expect(who()).toBe("account:public")
  })

  it("offers role previews when nobody is signed in", async () => {
    api.me.mockResolvedValue(null)
    renderSession()
    await waitFor(() => expect(who()).toBe("none:-"))

    await userEvent.selectOptions(screen.getByLabelText(/preview as/i), "expert")
    expect(who()).toBe("preview:expert")
    expect(screen.getByText(/grant no access/i)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem("zuula.preview-role")!)).toEqual({ role: "expert" })

    // Stopping a preview is local: there's no session to end.
    await act(() => session.signOut())
    expect(who()).toBe("none:-")
    expect(api.signOut).not.toHaveBeenCalled()
  })

  it("never applies previews unless NEXT_PUBLIC_ROLE_SWITCHER is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_ROLE_SWITCHER", "")
    localStorage.setItem("zuula.preview-role", JSON.stringify({ role: "admin" }))
    api.me.mockResolvedValue(null)
    renderSession()
    await waitFor(() => expect(who()).toBe("none:-"))
    expect(screen.queryByLabelText(/preview as/i)).toBeNull()
  })

  it("treats an unreachable API as signed out", async () => {
    api.me.mockRejectedValue(new Error("network"))
    renderSession()
    await waitFor(() => expect(who()).toBe("none:-"))
  })

  it("adopts a fresh sign-in and ends any preview", async () => {
    localStorage.setItem("zuula.preview-role", JSON.stringify({ role: "journalist" }))
    api.me.mockResolvedValue(null)
    renderSession()
    await waitFor(() => expect(who()).toBe("preview:journalist"))

    act(() => session.setAccount(MARY))
    expect(who()).toBe("account:admin")
    expect(JSON.parse(localStorage.getItem("zuula.preview-role")!)).toEqual({ role: null })
  })

  it("signs out with the API", async () => {
    api.me.mockResolvedValue(MARY)
    api.signOut.mockResolvedValue(undefined)
    renderSession()
    await waitFor(() => expect(who()).toBe("account:admin"))
    await act(() => session.signOut())
    expect(api.signOut).toHaveBeenCalledOnce()
    expect(who()).toBe("none:-")
  })

  it("stays signed in when the API couldn't sign out", async () => {
    api.me.mockResolvedValue(MARY)
    api.signOut.mockRejectedValue(new Error("network"))
    renderSession()
    await waitFor(() => expect(who()).toBe("account:admin"))
    await act(() => expect(session.signOut()).rejects.toThrow())
    expect(who()).toBe("account:admin")
  })
})
