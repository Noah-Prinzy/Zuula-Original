"use client"

import * as React from "react"

import { takePendingAuth } from "@/lib/auth"

const noopSubscribe = () => () => {}

// Reads the in-progress sign-in/sign-up (sessionStorage) once the browser is available.
// Returns undefined while server-rendering, null if there's nothing pending.
export function usePendingAuth() {
  const mounted = React.useSyncExternalStore(noopSubscribe, () => true, () => false)
  return React.useMemo(() => (mounted ? takePendingAuth() : undefined), [mounted])
}
