// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError, authApi, isTwoFactorChallenge } from "@/lib/api"
import { demoAuthApi, demoRoleFor } from "@/lib/demo-auth"

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // A production build with no API address: the deployed site until the API is hosted.
  vi.stubEnv("NODE_ENV", "production")
  vi.stubEnv("NEXT_PUBLIC_API_URL", "")
  vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("demo sign-in", () => {
  it("picks the role from the address", () => {
    expect(demoRoleFor("Admin@zuula.ug")).toBe("admin")
    expect(demoRoleFor("expert@x.co")).toBe("expert")
    expect(demoRoleFor("journalist@x.co")).toBe("journalist")
    expect(demoRoleFor("amina@example.com")).toBe("public")
    expect(demoRoleFor("0772123456")).toBe("public")
  })

  it("signs a public user straight in with any password, and remembers them", async () => {
    const result = await authApi.signIn({ identifier: "amina@example.com", password: "anything" })
    expect(isTwoFactorChallenge(result)).toBe(false)
    await expect(authApi.me()).resolves.toMatchObject({ email: "amina@example.com", role: "public" })

    await authApi.signOut()
    await expect(authApi.me()).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("asks experts and admins for a code, and rejects 000000", async () => {
    const challenge = await authApi.signIn({ identifier: "admin@zuula.ug", password: "x" })
    expect(challenge).toMatchObject({ challengeId: "demo-admin", maskedIdentifier: "ad•••@zuula.ug" })
    await expect(authApi.me()).resolves.toBeNull()

    const wrong = await authApi.verifyTwoFactor({ challengeId: "demo-admin", code: "000000" }).catch((e) => e)
    expect(wrong).toBeInstanceOf(ApiError)
    expect(wrong.message).toMatch(/any 6 digits/i)

    const { user } = await authApi.verifyTwoFactor({ challengeId: "demo-admin", code: "123456" })
    expect(user.role).toBe("admin")
    await expect(authApi.me()).resolves.toMatchObject({ role: "admin" })
  })

  it("signs up with the name given, after a code", async () => {
    await expect(
      authApi.signUp({ name: " Esther Namata ", identifier: "esther@example.com", password: "x".repeat(12), consent: true })
    ).resolves.toEqual({ maskedIdentifier: "es••••@example.com" })
    const { user } = await authApi.verifySignUp({ code: "654321" })
    expect(user).toMatchObject({ name: "Esther Namata", email: "esther@example.com", role: "public" })
  })

  it("won't verify a sign-up that was never started", async () => {
    await expect(authApi.verifySignUp({ code: "123456" })).rejects.toBeInstanceOf(ApiError)
  })

  it("checks reset codes the same way", async () => {
    await expect(authApi.forgotPassword({ identifier: "amina@example.com" })).resolves.toBeUndefined()
    await expect(
      authApi.resetPassword({ identifier: "amina@example.com", code: "000000", password: "x".repeat(12) })
    ).rejects.toBeInstanceOf(ApiError)
    await expect(
      authApi.resetPassword({ identifier: "amina@example.com", code: "111111", password: "x".repeat(12) })
    ).resolves.toBeUndefined()
  })

  it("signs straight in as a sample user from the Demo bar", async () => {
    expect(demoAuthApi.signInAs("expert")).toMatchObject({ name: "David Okello", role: "expert" })
    await expect(authApi.me()).resolves.toMatchObject({ role: "expert" })
  })
})
