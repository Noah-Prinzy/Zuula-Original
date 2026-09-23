// zod/mini keeps the client bundle small (full zod is ~90 KB gzipped); rules and messages
// are the same as they would be with the classic API.
import * as z from "zod/mini"

import type { Role } from "@/lib/roles"

// FR-AUTH-01 / 04 / 06. Validation shared by the auth pages. apps/api enforces its own rules
// (12-character minimum, identifier format) and hashes passwords with bcrypt; the strength
// rules beyond length only guide users here.
// Error messages are Validation.* translation keys, rendered by useValidationMessage().

export const PASSWORD_MIN = 12

const EMAIL = z.email()
// Ugandan mobile numbers: +256 7XX XXX XXX or 07XX XXX XXX.
const UG_PHONE = /^(?:\+?256|0)7\d{8}$/

export function normalisePhone(v: string) {
  return v.replace(/[\s-]/g, "")
}

export function identifierKind(v: string): "email" | "phone" | null {
  const t = v.trim()
  if (EMAIL.safeParse(t).success) return "email"
  if (UG_PHONE.test(normalisePhone(t))) return "phone"
  return null
}

export const identifier = z.string().check(
  z.trim(),
  z.minLength(1, "identifierRequired"),
  z.refine((v) => identifierKind(v) !== null, "identifierInvalid")
)

// Mask for "we sent a code to …" messages.
export function maskIdentifier(v: string) {
  const t = v.trim()
  if (identifierKind(t) === "email") {
    const [user, domain] = t.split("@")
    return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`
  }
  const digits = normalisePhone(t)
  return `${digits.slice(0, -7).replace(/\d/g, "•")}${"•".repeat(4)}${digits.slice(-3)}`
}

// Labels live in Auth.password.rules.<id> and Auth.password.strength.<score>.
export const PASSWORD_RULES = [
  { id: "length", test: (p: string) => p.length >= PASSWORD_MIN },
  { id: "case", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "number", test: (p: string) => /\d/.test(p) },
  { id: "symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export function passwordStrength(p: string) {
  const score = PASSWORD_RULES.filter((r) => r.test(p)).length as
    0 | 1 | 2 | 3 | 4
  return { score }
}

// FR-AUTH-04: 12-character minimum is required; the other rules guide towards strength.
const newPassword = z.string().check(
  z.minLength(PASSWORD_MIN, "passwordMin"),
  z.refine((p) => passwordStrength(p).score >= 3, "passwordWeak")
)

export const signInSchema = z.object({
  identifier,
  password: z.string().check(z.minLength(1, "passwordRequired")),
  remember: z.boolean(),
})

export const signUpSchema = z
  .object({
    name: z.string().check(z.trim(), z.minLength(2, "nameRequired")),
    identifier,
    password: newPassword,
    confirm: z.string(),
    consent: z.boolean().check(z.refine((v) => v, "consentRequired")),
  })
  .check(
    z.refine((v) => v.password === v.confirm, {
      path: ["confirm"],
      message: "passwordsMismatch",
    })
  )

export const forgotSchema = z.object({ identifier })

export const resetSchema = z
  .object({
    code: z.string().check(z.regex(/^\d{6}$/, "codeSixDigits")),
    password: newPassword,
    confirm: z.string(),
  })
  .check(
    z.refine((v) => v.password === v.confirm, {
      path: ["confirm"],
      message: "passwordsMismatch",
    })
  )

export const OTP_LENGTH = 6
export const RESEND_SECONDS = 30

// ---- In-progress sign-in / sign-up / reset (between the API's two steps) ----

const PENDING_KEY = "zuula.pending-auth"

// What the second screen of a flow needs from the first. Never a password or a token: the
// sign-up itself is tied to the API's HttpOnly `zuula_signup` cookie, and a two-factor
// challenge id is useless without the code sent to the user.
export type PendingAuth = {
  identifier: string
  /** Where to go afterwards (already passed through safeNext); unset: the user's role home. */
  next?: string
  name?: string
  /** As the API masked it, e.g. "am•••@example.com". */
  maskedIdentifier?: string
  /** Sign-in's two-factor challenge (FR-AUTH-05). */
  challengeId?: string
}

export function setPendingAuth(p: PendingAuth) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(p))
  } catch {
    // ignore
  }
}

export function takePendingAuth(): PendingAuth | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as PendingAuth) : null
  } catch {
    return null
  }
}

export function clearPendingAuth() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

// Only allow same-site relative redirects (prevents open redirects via ?next=). Browsers read
// "/\host" like "//host", so a backslash second character is refused too.
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}

export function homeFor(role: Role) {
  if (role === "admin") return "/admin"
  if (role === "expert") return "/review"
  return "/"
}
