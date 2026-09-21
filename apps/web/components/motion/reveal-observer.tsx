"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const SELECTOR = "[data-reveal]:not([data-revealed])"

// Marks [data-reveal] elements with data-revealed once they scroll into view (see the
// "Motion + sections" block in globals.css). Mounted once in the root layout; re-scans on
// navigation and whenever new nodes are added, so client-rendered content reveals too.
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-revealed", "")

    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(SELECTOR).forEach(reveal)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          reveal(entry.target)
          io.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    )

    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el))
    scan()

    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return null
}

