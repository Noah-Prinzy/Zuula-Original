"use client"

import { usePagePath } from "@/hooks/use-page-path"

// Renders its children only on the About page. The footer's full link list only makes sense
// there; every other page keeps things to a single screen's worth of content where it can.
export function ShowOnAbout({ children }: { children: React.ReactNode }) {
  return usePagePath() === "/about" ? children : null
}
