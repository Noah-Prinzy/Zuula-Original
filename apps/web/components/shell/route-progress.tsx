"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"

// Thin progress bar at the top of the page during navigation. The App Router has no
// navigation events, so we start on internal link clicks (or startNavigationProgress()
// before router.push) and finish when the URL changes.

type State = { visible: boolean; value: number }

let state: State = { visible: false, value: 0 }
const listeners = new Set<() => void>()
let trickle: ReturnType<typeof setInterval> | null = null
let safety: ReturnType<typeof setTimeout> | null = null

function emit(next: State) {
  state = next
  listeners.forEach((l) => l())
}

function clearTimers() {
  if (trickle) clearInterval(trickle)
  if (safety) clearTimeout(safety)
  trickle = safety = null
}

export function startNavigationProgress() {
  if (state.visible && state.value < 100) return
  clearTimers()
  emit({ visible: true, value: 8 })
  trickle = setInterval(() => {
    // Ease toward 90% without reaching it until the page arrives.
    emit({ visible: true, value: state.value + (90 - state.value) * 0.08 })
  }, 200)
  safety = setTimeout(finishNavigationProgress, 10_000)
}

export function finishNavigationProgress() {
  if (!state.visible) return
  clearTimers()
  emit({ visible: true, value: 100 })
  setTimeout(() => emit({ visible: false, value: 0 }), 250)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function isInternalNavigation(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  const a = (e.target as Element | null)?.closest?.("a")
  if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return false
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  // Same page (or only a #hash change) doesn't navigate.
  return url.pathname + url.search !== window.location.pathname + window.location.search
}

export function RouteProgress() {
  const { visible, value } = React.useSyncExternalStore(subscribe, () => state, () => state)
  const pathname = usePathname()
  const search = useSearchParams()

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (isInternalNavigation(e)) startNavigationProgress()
    }
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", startNavigationProgress)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", startNavigationProgress)
    }
  }, [])

  // The URL changed: the new page has rendered.
  React.useEffect(() => {
    finishNavigationProgress()
  }, [pathname, search])

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--primary)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
