import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError, apiBaseUrl, authApi, authMode, isTwoFactorChallenge } from "@/lib/api"

// Shapes below are copied from real apps/api responses (see the PR for the live run).
const PROFILE = {
  id: "u6",
  name: "Amina Nakato",
  email: "amina@example.com",
  role: "public",
  twoFactorEnabled: false,
  createdAt: "2026-05-22T00:00:00Z",
} as const

function reply(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe("apiBaseUrl", () => {
  it("uses NEXT_PUBLIC_API_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.zuula.ug/")
    expect(apiBaseUrl()).toBe("https://api.zuula.ug")
  })

  it("treats \"/\" as this site's own origin (the next.config.ts proxy)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/")
    vi.stubEnv("NODE_ENV", "production")
    expect(apiBaseUrl()).toBe("")
    fetchMock.mockResolvedValueOnce(reply(401, { error: { code: "unauthorized", message: "Sign in required." } }))
    await expect(authApi.me()).resolves.toBeNull()
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/me")
  })

  it("falls back to the local API outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")
    vi.stubEnv("NODE_ENV", "development")
    expect(apiBaseUrl()).toBe("http://localhost:8000")
  })

  it("has no API fallback in production, so auth falls back to the demo", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")
    vi.stubEnv("NODE_ENV", "production")
    expect(apiBaseUrl()).toBeNull()
    expect(authMode()).toBe("demo")
  })

  it("sends nothing when the API is forced on but has no address", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_AUTH_MODE", "api")
    await expect(authApi.me()).rejects.toMatchObject({ code: "unconfigured" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("lets NEXT_PUBLIC_AUTH_MODE force the demo even with an API address", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.zuula.ug")
    vi.stubEnv("NEXT_PUBLIC_AUTH_MODE", "demo")
    expect(authMode()).toBe("demo")
  })
})

describe("authApi", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test"))

  it("signs in with credentials included and JSON body", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { user: PROFILE }))
    const result = await authApi.signIn({ identifier: "amina@example.com", password: "pw", remember: false })

    expect(isTwoFactorChallenge(result)).toBe(false)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://api.test/api/v1/auth/sign-in")
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
    expect(JSON.parse(init!.body as string)).toEqual({
      identifier: "amina@example.com",
      password: "pw",
      remember: false,
    })
  })

  it("recognises a two-factor challenge", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { challengeId: "chl_1", maskedIdentifier: "ma••@example.com" }))
    const result = await authApi.signIn({ identifier: "mary@example.com", password: "pw" })
    expect(isTwoFactorChallenge(result)).toBe(true)
  })

  it("turns the error envelope into an ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(429, { error: { code: "rate_limited", message: "Too many sign-in attempts.", retryAfter: 60 } })
    )
    const error = await authApi.signIn({ identifier: "x@y.z", password: "pw" }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, code: "rate_limited", message: "Too many sign-in attempts.", retryAfter: 60 })
  })

  it("reports a failed fetch as a network error", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(authApi.signOut()).rejects.toMatchObject({ status: 0, code: "network" })
  })

  it("copes with an error response that isn't JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502 }))
    await expect(authApi.forgotPassword({ identifier: "x@y.z" })).rejects.toMatchObject({
      status: 502,
      code: "server_error",
    })
  })

  it("accepts empty success bodies (204 sign-out, 202 resend)", async () => {
    fetchMock.mockResolvedValueOnce(reply(204))
    await expect(authApi.signOut()).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "include" })
  })

  it("me() returns the profile, or null when signed out", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, PROFILE))
    await expect(authApi.me()).resolves.toEqual(PROFILE)
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/v1/me")

    fetchMock.mockResolvedValueOnce(reply(401, { error: { code: "unauthorized", message: "Sign in required." } }))
    await expect(authApi.me()).resolves.toBeNull()
  })

  it("me() still throws when the API is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(authApi.me()).rejects.toMatchObject({ code: "network" })
  })

  it.each([
    ["signUp", () => authApi.signUp({ name: "A B", identifier: "a@b.co", password: "x".repeat(12), consent: true }), "/api/v1/auth/sign-up"],
    ["verifySignUp", () => authApi.verifySignUp({ code: "123456" }), "/api/v1/auth/sign-up/verify"],
    ["verifyTwoFactor", () => authApi.verifyTwoFactor({ challengeId: "c", code: "123456" }), "/api/v1/auth/two-factor/verify"],
    ["resendTwoFactor", () => authApi.resendTwoFactor({ challengeId: "c" }), "/api/v1/auth/two-factor/resend"],
    ["forgotPassword", () => authApi.forgotPassword({ identifier: "a@b.co" }), "/api/v1/auth/forgot-password"],
    ["resetPassword", () => authApi.resetPassword({ identifier: "a@b.co", code: "123456", password: "x".repeat(12) }), "/api/v1/auth/reset-password"],
  ])("%s posts to the contract's path", async (_name, call, path) => {
    fetchMock.mockResolvedValueOnce(reply(200, {}))
    await call()
    expect(fetchMock.mock.calls[0][0]).toBe(`http://api.test${path}`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "include" })
  })
})
