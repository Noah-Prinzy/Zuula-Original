"use client"

import { usePathname } from "next/navigation"

import { stripLocale } from "@/lib/locales"

// The page's path as the visitor sees it ("/about"), identical in server rendering and in the
// browser, so path-dependent UI (active nav items, backdrop photo) renders right the first
// time instead of being corrected after hydration.
export function usePagePath() {
  return stripLocale(usePathname())
}
