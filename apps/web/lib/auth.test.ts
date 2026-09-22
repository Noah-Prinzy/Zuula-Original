// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"

import {
  clearPendingAuth,
  demoRoleFor,
  homeFor,
  identifierKind,
  isDemoCodeValid,
  maskIdentifier,
  needsTwoFactor,
  PASSWORD_MIN,
  passwordStrength,
  resetSchema,
  safeNext,
  setPendingAuth,
  signInSchema,
  signUpSchema,
  takePendingAuth,
} from "@/lib/auth"

describe("password rules (FR-AUTH-04)", () => {
  it("requires at least 12 characters", () => {
    expect(PASSWORD_MIN).toBe(12)
  })

  // Labels ("Weak", "Strong"…) live in the messages files; the score is the contract.
  it.each([
    ["", 0],
    ["abcdefghijkl", 1],
    ["Abcdefghijkl", 2],
    ["Abcdefghijk1", 3],
    ["Abcdefghij1!", 4],
  ])("%j scores %i", (p, score) => {
    expect(passwordStrength(p).score).toBe(score)
  })
})

describe("identifiers", () => {
  it.each([
    ["amina@example.com", "email"],
    [" 0772 123 456 ", "phone"],
    ["+256772123456", "phone"],
    ["256-772-123-456", "phone"],
    ["0612345678", null],
    ["not an id", null],
  ])("%j is %s", (v, kind) => {
    expect(identifierKind(v)).toBe(kind)
  })

  it("masks emails and phone numbers", () => {
    expect(maskIdentifier("amina@example.com")).toBe("am•••@example.com")
    expect(maskIdentifier("0772 123 456")).toBe("•••••••456")
  })
})

describe("schemas", () => {
  const strong = "Abcdefghij1!"

  it("sign-in needs a valid identifier and a password", () => {
    expect(signInSchema.safeParse({ identifier: "amina@example.com", password: "x", remember: true }).success).toBe(true)
    expect(signInSchema.safeParse({ identifier: "nope", password: "x", remember: false }).success).toBe(false)
  })

  it("sign-up accepts a strong password and rejects short or weak ones", () => {
    const signUp = (password: string, confirm = password) =>
      signUpSchema.safeParse({ name: "Amina Nakato", identifier: "amina@example.com", password, confirm, consent: true })
        .success
    expect(signUp(strong)).toBe(true)
    expect(signUp("Short1!")).toBe(false)
    expect(signUp("abcdefghijklmnop")).toBe(false)
    expect(signUp(strong, `${strong}x`)).toBe(false)
  })

  it("reset needs a 6-digit code and matching passwords", () => {
    expect(resetSchema.safeParse({ code: "123456", password: strong, confirm: strong }).success).toBe(true)
    expect(resetSchema.safeParse({ code: "12345", password: strong, confirm: strong }).success).toBe(false)
    expect(resetSchema.safeParse({ code: "123456", password: strong, confirm: "Abcdefghij1?" }).success).toBe(false)
  })
})

describe("mock auth", () => {
  it("picks a demo role from the address", () => {
    expect(demoRoleFor("Admin@zuula.ug")).toBe("admin")
    expect(demoRoleFor("expert@x")).toBe("expert")
    expect(demoRoleFor("journalist@x")).toBe("journalist")
    expect(demoRoleFor("0772123456")).toBe("public")
  })

  it("requires two-factor for experts and admins (FR-AUTH-05)", () => {
    expect(needsTwoFactor("expert")).toBe(true)
    expect(needsTwoFactor("admin")).toBe(true)
    expect(needsTwoFactor("journalist")).toBe(false)
  })

  it("accepts any six digits except 000000", () => {
    expect(isDemoCodeValid("123456")).toBe(true)
    expect(isDemoCodeValid("000000")).toBe(false)
    expect(isDemoCodeValid("12345")).toBe(false)
  })

  it("sends each role to its home", () => {
    expect(homeFor("admin")).toBe("/admin")
    expect(homeFor("expert")).toBe("/review")
    expect(homeFor("public")).toBe("/")
  })
})

describe("safeNext (open-redirect guard)", () => {
  it.each([
    ["/fact-checks?q=1", "/fact-checks?q=1"],
    ["//evil.example", "/"],
    ["https://evil.example", "/"],
    [null, "/"],
    [undefined, "/"],
  ])("%j → %j", (next, expected) => {
    expect(safeNext(next)).toBe(expected)
  })
})

describe("pending auth", () => {
  afterEach(() => sessionStorage.clear())

  it("stores, takes and clears the pending sign-in", () => {
    const pending = { role: "expert" as const, identifier: "expert@x", next: "/review" }
    setPendingAuth(pending)
    expect(takePendingAuth()).toEqual(pending)
    clearPendingAuth()
    expect(takePendingAuth()).toBeNull()
  })

  it("survives corrupt storage", () => {
    sessionStorage.setItem("zuula.pending-auth", "{nope")
    expect(takePendingAuth()).toBeNull()
  })
})
