"use client"

import { usePathname } from "next/navigation"

// Renders its children everywhere except the Home page, which is a single screen with no
// footer. The children stay server-rendered; only this check runs on the client.
export function HideOnHome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : children
}
