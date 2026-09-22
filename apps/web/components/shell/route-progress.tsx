"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { ZuulaMark } from "@/components/brand/zuula-mark"
import { cn } from "@/lib/utils"

// Thin progress bar at the top of the page during navigation. The App Router has no
// navigation events, so we start on internal link clicks (or startNavigationProgress()
// before router.push) and finish when the URL changes. Navigations that take a moment also
// show the animated Zuula lens (in place of full-page loading screens), so fast ones never
// flash anything.

type State = { visible: boolean; value: number; slow: boolean }

const SLOW_AFTER_MS = 300

let state: State = { visible: false, value: 0, slow: false }
const listeners = new Set<() => void>()
let trickle: ReturnType<typeof setInterval> | null = null
let safety: ReturnType<typeof setTimeout> | null = null
let slowTimer: ReturnType<typeof setTimeout> | null = null

function emit(next: State) {
  state = next
  listeners.forEach((l) => l())
}

function clearTimers() {
  if (trickle) clearInterval(trickle)
  if (safety) clearTimeout(safety)
  if (slowTimer) clearTimeout(slowTimer)
  trickle = safety = slowTimer = null
}

export function startNavigationProgress() {
  if (state.visible && state.value < 100) return
  clearTimers()
  emit({ visible: true, value: 8, slow: false })
  trickle = setInterval(() => {
    // Ease toward 90% without reaching it until the page arrives.
    emit({ ...state, value: state.value + (90 - state.value) * 0.08 })
  }, 200)
  slowTimer = setTimeout(() => emit({ ...state, slow: true }), SLOW_AFTER_MS)
  safety = setTimeout(finishNavigationProgress, 10_000)
}

export function finishNavigationProgress() {
  if (!state.visible) return
  clearTimers()
  emit({ visible: true, value: 100, slow: false })
  setTimeout(() => emit({ visible: false, value: 0, slow: false }), 250)
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
  const { visible, value, slow } = React.useSyncExternalStore(subscribe, () => state, () => state)
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
    <>
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
      {/* The old page stays interactive underneath; the lens just says "on its way". */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center justify-center border bg-background/90 p-2.5 shadow-lg backdrop-blur-sm transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
          visible && slow ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {visible && slow && <ZuulaMark animated className="size-8 overflow-visible" />}
      </div>
    </>
  )
}
