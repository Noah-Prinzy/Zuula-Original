"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

import { setLocaleCookie } from "@/i18n/actions"
import type { LocaleCode } from "@/lib/locales"
import { ROLE_LABELS, type Role } from "@/lib/roles"

// Mock session until the auth API exists (Phase 3). Persisted per browser so the
// role simulator survives navigation and reloads.

export type SessionUser = {
  name: string
  email: string
  role: Role
}

type SessionContextValue = {
  user: SessionUser | null
  role: Role | null
  /** The UI language (NEXT_LOCALE cookie, via next-intl). */
  locale: LocaleCode
  /** True while a language switch is re-rendering the page. */
  switchingLocale: boolean
  ready: boolean
  signInAs: (role: Role) => void
  signOut: () => void
  setLocale: (locale: LocaleCode) => void
}

const MOCK_USERS: Record<Role, SessionUser> = {
  public: { name: "Amina Nakato", email: "amina@example.com", role: "public" },
  journalist: { name: "Sarah Namutebi", email: "sarah@example.com", role: "journalist" },
  expert: { name: "David Okello", email: "david@example.com", role: "expert" },
  admin: { name: "Mary Akello", email: "mary@example.com", role: "admin" },
}

type Snapshot = { role: Role | null }

const STORAGE_KEY = "zuula.mock-session"
const SERVER_SNAPSHOT: Snapshot = { role: null }

let snapshot: Snapshot | null = null
const listeners = new Set<() => void>()

function load(): Snapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Snapshot>
      return {
        role: parsed.role && parsed.role in ROLE_LABELS ? parsed.role : null,
      }
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

function update(patch: Partial<Snapshot>) {
  snapshot = { ...getSnapshot(), ...patch }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Keep the in-memory session.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const noopSubscribe = () => () => {}

const SessionContext = React.createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { role } = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT
  )
  // false during SSR and hydration, true once the stored session is readable.
  const ready = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

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

  const value = React.useMemo<SessionContextValue>(
    () => ({
      user: role ? MOCK_USERS[role] : null,
      role,
      locale,
      switchingLocale,
      ready,
      signInAs: (r) => update({ role: r }),
      signOut: () => update({ role: null }),
      setLocale,
    }),
    [role, locale, switchingLocale, ready, setLocale]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = React.useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within SessionProvider")
  return ctx
}
