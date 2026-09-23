"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

// Auth.meta key per page. endsWith() so it matches both "/sign-in" in the address bar and
// "/<locale>/sign-in" after proxy.ts rewrites it on the server; longer paths first.
const SECTIONS = [
  ["/sign-in/two-factor", "twoFactor"],
  ["/sign-up/verify", "verify"],
  ["/sign-in", "signIn"],
  ["/sign-up", "signUp"],
  ["/forgot-password", "forgot"],
  ["/reset-password", "reset"],
] as const

// The section name in the auth sheet's masthead, like a newspaper's section flag.
export function AuthSectionLabel({ className }: { className?: string }) {
  const pathname = usePathname()
  const t = useTranslations("Auth.meta")
  const key = SECTIONS.find(([path]) => pathname.endsWith(path))?.[1]
  if (!key) return null
  return <span className={className}>{t(key)}</span>
}
