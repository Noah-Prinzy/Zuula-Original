"use client"

import { usePathname } from "next/navigation"

import { LOCALES } from "@/lib/locales"

// proxy.ts rewrites "/about" to "/<locale>/about" internally, so either form can reach us.
const ABOUT_PATHS = new Set(["/about", ...LOCALES.map((l) => `/${l.code}/about`)])

// Renders its children only on the About page. The footer's full link list only makes sense
// there; every other page keeps things to a single screen's worth of content where it can.
export function ShowOnAbout({ children }: { children: React.ReactNode }) {
  return ABOUT_PATHS.has(usePathname()) ? children : null
}
