import { maskIdentifier } from "@/lib/auth"
import { ApiError, type ApiSession, type TwoFactorChallenge, type UserProfile } from "@/lib/api"
import { isDemoCodeValid } from "@/lib/mock/account"
import type { Role } from "@/lib/roles"

// Demo sign-in, for builds with no apps/api to talk to (see authMode() in lib/api.ts). Same
// calls and response shapes as the real API, so the auth forms and the session provider don't
// know the difference, but nothing leaves the browser and nothing is checked:
// - any password works; the part of the address before "@" picks the role (admin@, expert@,
//   journalist@, anything else is a Public User);
// - codes are any 6 digits except "000000" (to show the error state);
// - Expert Reviewers and Admins get the two-factor step, as they do for real (FR-AUTH-05).
// The "session" is a localStorage entry. It grants nothing: there's no server to grant it.

const SESSION_KEY = "zuula.demo-session"
const PENDING_KEY = "zuula.demo-pending"
const BAD_CODE = "That code didn't work. Any 6 digits work in the demo, except 000000."

const SAMPLE_NAMES: Record<Role, string> = {
  public: "Amina Nakato",
  journalist: "Sarah Namutebi",
  expert: "David Okello",
  admin: "Mary Akello",
}

export function demoRoleFor(identifier: string): Role {
  const local = identifier.trim().toLowerCase().split("@")[0]
  if (local === "admin" || local === "expert" || local === "journalist") return local
  return "public"
}

function profile(identifier: string, role: Role, name = SAMPLE_NAMES[role]): UserProfile {
  const id = identifier.trim().toLowerCase()
  const isEmail = id.includes("@")
  return {
    id: `demo-${role}`,
    name,
    email: isEmail ? id : "",
    phone: isEmail ? undefined : id,
    role,
    twoFactorEnabled: role === "expert" || role === "admin",
  }
}

function read<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(storage: Storage, key: string, value: unknown) {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (private mode): the demo session just won't survive a reload.
  }
}

function startSession(user: UserProfile): ApiSession {
  write(localStorage, SESSION_KEY, user)
  write(sessionStorage, PENDING_KEY, null)
  return { user }
}

function checkCode(code: string) {
  if (!isDemoCodeValid(code)) throw new ApiError(400, "bad_request", BAD_CODE)
}

// A tick of latency, so buttons show their busy state as they would against the API.
const tick = () => new Promise((r) => setTimeout(r, 300))

export const demoAuthApi = {
  async signUp(body: { name: string; identifier: string }) {
    await tick()
    write(sessionStorage, PENDING_KEY, profile(body.identifier, "public", body.name.trim()))
    return { maskedIdentifier: maskIdentifier(body.identifier) }
  },

  async verifySignUp(body: { code: string }): Promise<ApiSession> {
    await tick()
    const pending = read<UserProfile>(sessionStorage, PENDING_KEY)
    if (!pending) throw new ApiError(400, "bad_request", "That code has expired. Start again to get a new one.")
    checkCode(body.code)
    return startSession(pending)
  },

  async signIn(body: { identifier: string; password: string }): Promise<ApiSession | TwoFactorChallenge> {
    await tick()
    const role = demoRoleFor(body.identifier)
    const user = profile(body.identifier, role)
    if (user.twoFactorEnabled) {
      write(sessionStorage, PENDING_KEY, user)
      return { challengeId: `demo-${role}`, maskedIdentifier: maskIdentifier(body.identifier) }
    }
    return startSession(user)
  },

  async verifyTwoFactor(body: { challengeId: string; code: string }): Promise<ApiSession> {
    await tick()
    const pending = read<UserProfile>(sessionStorage, PENDING_KEY)
    if (!pending) throw new ApiError(400, "bad_request", "That code has expired. Sign in again to get a new one.")
    checkCode(body.code)
    return startSession(pending)
  },

  async resendTwoFactor(): Promise<void> {
    await tick()
  },

  async signOut(): Promise<void> {
    write(localStorage, SESSION_KEY, null)
  },

  async forgotPassword(): Promise<void> {
    await tick()
  },

  async resetPassword(body: { code: string }): Promise<void> {
    await tick()
    checkCode(body.code)
  },

  /** The "Demo: view as" bar: sign straight in as the sample user of `role`. */
  signInAs(role: Role): UserProfile {
    return startSession(profile(`${role}@example.com`, role)).user
  },

  async me(): Promise<UserProfile | null> {
    return read<UserProfile>(localStorage, SESSION_KEY)
  },
}
