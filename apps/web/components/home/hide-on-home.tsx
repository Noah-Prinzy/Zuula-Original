"use client"

import { usePathname } from "next/navigation"

import { LOCALES } from "@/lib/locales"

// proxy.ts rewrites "/" to "/<locale>" internally, so either form can reach us.
const HOME_PATHS = new Set(["/", ...LOCALES.map((l) => `/${l.code}`)])

// Renders its children everywhere except the Home page, which is a single screen with no
// footer. The children stay server-rendered; only this check runs on the client.
export function HideOnHome({ children }: { children: React.ReactNode }) {
  return HOME_PATHS.has(usePathname()) ? null : children
}
