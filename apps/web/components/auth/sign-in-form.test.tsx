// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithIntl } from "@/test/render"

const api = vi.hoisted(() => ({ signIn: vi.fn() }))
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  authApi: api,
}))
const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => router }))
const session = vi.hoisted(() => ({ setAccount: vi.fn() }))
vi.mock("@/components/providers/session-provider", () => ({ useSession: () => session }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import { SignInForm } from "@/components/auth/sign-in-form"
import { ApiError } from "@/lib/api"
import { takePendingAuth } from "@/lib/auth"

async function signIn(identifier: string, next?: string) {
  const user = userEvent.setup()
  renderWithIntl(<SignInForm next={next} />)
  await user.type(screen.getByLabelText(/email or phone/i), identifier)
  await user.type(screen.getByLabelText(/^password$/i), "zuula-sample-password")
  await user.click(screen.getByRole("button", { name: /^sign in$/i }))
}

beforeEach(() => {
  sessionStorage.clear()
  api.signIn.mockReset()
  router.push.mockReset()
  session.setAccount.mockReset()
})

describe("SignInForm", () => {
  it("adopts the API's user and goes to their role's home", async () => {
    const user = { id: "u6", name: "Amina Nakato", email: "amina@example.com", role: "journalist" }
    api.signIn.mockResolvedValue({ user })
    await signIn(" amina@example.com ")

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
    expect(api.signIn).toHaveBeenCalledWith({
      identifier: "amina@example.com",
      password: "zuula-sample-password",
      remember: true,
    })
    expect(session.setAccount).toHaveBeenCalledWith(user)
  })

  it("hands a two-factor challenge to the next screen without signing in", async () => {
    api.signIn.mockResolvedValue({ challengeId: "chl_1", maskedIdentifier: "ma••@example.com" })
    await signIn("mary@example.com", "/admin/users")

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/sign-in/two-factor"))
    expect(session.setAccount).not.toHaveBeenCalled()
    expect(takePendingAuth()).toEqual({
      identifier: "mary@example.com",
      next: "/admin/users",
      challengeId: "chl_1",
      maskedIdentifier: "ma••@example.com",
    })
  })

  it("shows the API's error and stays put", async () => {
    api.signIn.mockRejectedValue(
      new ApiError(401, "unauthorized", "That email or phone number and password don't match.")
    )
    await signIn("amina@example.com")

    expect(await screen.findByText(/password don't match/i)).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })

  it("explains when the API can't be reached", async () => {
    api.signIn.mockRejectedValue(new ApiError(0, "network", "Couldn't reach the Zuula API."))
    await signIn("amina@example.com")
    expect(await screen.findByText(/check your connection/i)).toBeInTheDocument()
  })
})
