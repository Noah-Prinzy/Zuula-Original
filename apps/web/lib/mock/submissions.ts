// Mock submission store until the submissions API exists (Phase 2/3).
// Kept in sessionStorage so the Status page can read what was just submitted.

import type { SubmissionType } from "@/lib/submission"

export type StoredSubmission = {
  trackingId: string
  type: SubmissionType
  language: string
  preview: string
  fileName?: string
  submittedAt: string
}

const KEY = "zuula.submissions"

// FR-SUBMIT-06: tracking ID, e.g. ZL-7K3P-Q9 (no ambiguous 0/O/1/I).
export function newTrackingId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const pick = (n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => alphabet[x % alphabet.length]).join("")
  return `ZL-${pick(4)}-${pick(2)}`
}

export function saveSubmission(s: StoredSubmission) {
  try {
    const all = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as StoredSubmission[]
    sessionStorage.setItem(KEY, JSON.stringify([s, ...all].slice(0, 20)))
  } catch {
    // Storage unavailable; the Status page falls back to the tracking ID alone.
  }
}

export function getSubmission(trackingId: string): StoredSubmission | null {
  try {
    const all = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as StoredSubmission[]
    return all.find((s) => s.trackingId === trackingId) ?? null
  } catch {
    return null
  }
}
