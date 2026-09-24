"use client"

import { useEffect } from "react"

// Whether "back" would stay on this site: true once this tab has shown more than one of our
// pages. Module state, so it survives moving between layouts (app, public, auth); the app bars
// that offer "back" call useTrackInAppHistory, and fall back to a parent page otherwise, so
// back never takes someone out to the site they came from.
let lastPath: string | null = null
let navigations = 0

export function useTrackInAppHistory(pathname: string) {
  useEffect(() => {
    if (lastPath !== null && lastPath !== pathname) navigations++
    lastPath = pathname
  }, [pathname])
}

export function canGoBackInApp() {
  return navigations > 0
}
