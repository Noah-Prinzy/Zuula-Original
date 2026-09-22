"use client"

import "./globals.css"

import en from "@/messages/en.json"

// Replaces the root layout when it fails, so no providers (i18n, theme) are available.
// Text comes straight from the English messages; styles are inlined as a fallback in case
// the stylesheet is what failed.
const t = en.Errors

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          color: "#0B0F11",
          fontFamily: "Georgia, serif",
        }}
      >
        <main role="alert" style={{ maxWidth: "36rem", padding: "2rem 1rem" }}>
          <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden>
            <path
              d="M38 38 55 55"
              stroke="#0B0F11"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <circle cx="26" cy="26" r="21" fill="#C70036" />
            <path
              d="M16.5 26.5 23 33 36 20"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "1.875rem",
              margin: "1.25rem 0 0.75rem",
            }}
          >
            {t.globalTitle}
          </h1>
          <p
            style={{ color: "#4b5563", lineHeight: 1.6, margin: "0 0 1.5rem" }}
          >
            {t.globalDescription}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#C70036",
              color: "#FFFFFF",
              border: 0,
              padding: "0.625rem 1rem",
              font: "600 0.875rem system-ui, sans-serif",
              cursor: "pointer",
            }}
          >
            {t.retry}
          </button>
          {error.digest && (
            <p
              style={{
                font: "0.75rem ui-monospace, monospace",
                color: "#6b7280",
                marginTop: "1.5rem",
              }}
            >
              {t.reference.replace("{digest}", error.digest)}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
