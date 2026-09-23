"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

import { setLocaleCookie } from "@/i18n/actions"
import { authApi, type UserProfile } from "@/lib/api"
import type { LocaleCode } from "@/lib/locales"
import { ROLE_LABELS, type Role } from "@/lib/roles"

// Who is using the site, from two sources in strict priority order:
//
// 1. "account" — a real session with apps/api. On load the provider asks GET /api/v1/me (the
//    HttpOnly zuula_session cookie rides along); the sign-in, sign-up and two-factor forms hand
//    over the user the API returned. Signed in, the role comes from the API and nothing else.
// 2. "preview" — only when nobody is signed in: the RoleSwitcher bar lets anyone look at the
//    role-gated screens (still on mock content) as a sample user. It is a UI preview, not
//    authentication: the API never sees it and grants nothing for it. Off unless the build sets
//    NEXT_PUBLIC_ROLE_SWITCHER="true" (local dev, demo deploys); without it every gate in the
//    app (RoleGate, the rating panel, …) depends on the real session alone.

export type SessionUser = {
  name: string
  email: string
  role: Role
}

export type SessionSource = "account" | "preview"

type SessionContextValue = {
  user: SessionUser | null
  role: Role | null
  /** Where `user` came from, or null when signed out and not previewing. */
  source: SessionSource | null
  /** Whether role previews are allowed at all (NEXT_PUBLIC_ROLE_SWITCHER="true"). */
  previewEnabled: boolean
  /** The UI language (NEXT_LOCALE cookie, via next-intl). */
  locale: LocaleCode
  /** True while a language switch is re-rendering the page. */
  switchingLocale: boolean
  /** False until the real session has been checked with the API. */
  ready: boolean
  /** Adopt the user the API just signed in (sign-in, sign-up verify, two-factor). */
  setAccount: (user: UserProfile) => void
  /** Re-read the session from the API (e.g. after a password reset revoked it). */
  refresh: () => Promise<void>
  /** Preview the UI as a sample user of `role` (null: stop previewing). Ignored when signed in. */
  previewAs: (role: Role | null) => void
  /** Ends the real session with the API, or stops previewing. Rejects if the API call fails. */
  signOut: () => Promise<void>
  setLocale: (locale: LocaleCode) => void
}

// Sample people for role previews (same names as the API's seed data).
export const PREVIEW_USERS: Record<Role, SessionUser> = {
  public: { name: "Amina Nakato", email: "amina@example.com", role: "public" },
  journalist: { name: "Sarah Namutebi", email: "sarah@example.com", role: "journalist" },
  expert: { name: "David Okello", email: "david@example.com", role: "expert" },
  admin: { name: "Mary Akello", email: "mary@example.com", role: "admin" },
}

export function previewEnabled() {
  return process.env.NEXT_PUBLIC_ROLE_SWITCHER === "true"
}

// ---- Preview role: per browser (localStorage), so it survives navigation and reloads ----

type Snapshot = { role: Role | null }

const STORAGE_KEY = "zuula.preview-role"
const SERVER_SNAPSHOT: Snapshot = { role: null }

let snapshot: Snapshot | null = null
const listeners = new Set<() => void>()

function load(): Snapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Snapshot>
      return { role: parsed.role && parsed.role in ROLE_LABELS ? parsed.role : null }
    }
  } catch {
    // Storage unavailable (private mode); fall back to defaults.
  }
  return SERVER_SNAPSHOT
}

function getSnapshot() {
  snapshot ??= load()
  return snapshot
}

function setPreviewRole(role: Role | null) {
  snapshot = { role }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Keep the in-memory preview.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Test hook: forget the cached snapshot so the next render re-reads storage.
export function resetPreviewForTests() {
  snapshot = null
}

// ---- Real session ----

type Account = { status: "checking" } | { status: "signed-out" } | { status: "signed-in"; user: UserProfile }

function toSessionUser(p: UserProfile): SessionUser {
  // A phone-only account has email "" in the contract; show the phone number instead.
  return { name: p.name, email: p.email || p.phone || "", role: p.role }
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const preview = React.useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  const [account, setAccountState] = React.useState<Account>({ status: "checking" })

  const refresh = React.useCallback(
    () =>
      authApi.me().then(
        (user) => setAccountState(user ? { status: "signed-in", user } : { status: "signed-out" }),
        // API unreachable or misconfigured: nobody can be signed in, so treat as signed out.
        () => setAccountState({ status: "signed-out" })
      ),
    []
  )

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  // Language lives in a cookie so server components render it too. Setting it and refreshing
  // re-renders the whole tree with the new messages; nothing keeps stale text.
  const locale = useLocale()
  const router = useRouter()
  const [switchingLocale, startTransition] = React.useTransition()
  const setLocale = React.useCallback(
    (l: LocaleCode) =>
      startTransition(async () => {
        await setLocaleCookie(l)
        router.refresh()
      }),
    [router]
  )

  const setAccount = React.useCallback((user: UserProfile) => {
    // A real sign-in ends any preview, so it can't resurface after signing out.
    setPreviewRole(null)
    setAccountState({ status: "signed-in", user })
  }, [])

  const signedIn = account.status === "signed-in"
  const signOut = React.useCallback(async () => {
    if (signedIn) {
      await authApi.signOut()
      setAccountState({ status: "signed-out" })
    }
    setPreviewRole(null)
  }, [signedIn])

  const allowPreview = previewEnabled()
  const value = React.useMemo<SessionContextValue>(() => {
    let user: SessionUser | null = null
    let source: SessionSource | null = null
    if (account.status === "signed-in") {
      user = toSessionUser(account.user)
      source = "account"
    } else if (account.status === "signed-out" && allowPreview && preview.role) {
      user = PREVIEW_USERS[preview.role]
      source = "preview"
    }
    return {
      user,
      role: user?.role ?? null,
      source,
      previewEnabled: allowPreview,
      locale,
      switchingLocale,
      ready: account.status !== "checking",
      setAccount,
      refresh,
      previewAs: (r) => {
        if (account.status !== "signed-in") setPreviewRole(r)
      },
      signOut,
      setLocale,
    }
  }, [account, allowPreview, preview.role, locale, switchingLocale, setAccount, refresh, signOut, setLocale])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = React.useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within SessionProvider")
  return ctx
}
