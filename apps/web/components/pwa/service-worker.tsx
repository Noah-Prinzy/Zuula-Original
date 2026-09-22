"use client"

import { useEffect } from "react"

// Registers public/sw.js in production builds only: in development it would cache
// un-hashed chunks and fight hot reloading.
export function ServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return
    const register = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error) => console.warn("[sw] registration failed", error))
    // Don't compete with the first page load for bandwidth.
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])

  return null
}
