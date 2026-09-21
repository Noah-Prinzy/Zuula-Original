// SAMPLE DATA for the Account pages. Replaced by the users/notifications/API-keys endpoints
// in Phase 3.

import type { SubmissionType } from "@/lib/submission"
import type { Verdict } from "@/lib/types/fact-check"

// ---- Notifications (FR-NOTIFY) ----

export type NotificationKind = "verdict-ready" | "topic-alert" | "review-outcome" | "broadcast" | "accreditation"

export type AppNotification = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  href?: string
  createdAt: string // ISO
  read: boolean
}

export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    kind: "verdict-ready",
    title: "Your submission was checked",
    body: "“Free unlimited internet for every Ugandan from January 2027” — False.",
    href: "/fact-checks/fc-2026-0142",
    createdAt: "2026-09-21T10:42:00+03:00",
    read: false,
  },
  {
    id: "n2",
    kind: "broadcast",
    title: "Emergency alert: health misinformation",
    body: "A false malaria cure is spreading on WhatsApp in central Uganda.",
    href: "/fact-checks/fc-2026-0161",
    createdAt: "2026-09-21T08:15:00+03:00",
    read: false,
  },
  {
    id: "n3",
    kind: "topic-alert",
    title: "New fact-check in Education",
    body: "“All schools to close for the rest of the term next week” — Likely False.",
    href: "/fact-checks/fc-2026-0159",
    createdAt: "2026-09-20T17:03:00+03:00",
    read: false,
  },
  {
    id: "n4",
    kind: "review-outcome",
    title: "A verdict you rated was reviewed",
    body: "An Expert Reviewer confirmed the original verdict.",
    href: "/fact-checks/fc-2026-0142",
    createdAt: "2026-09-19T12:30:00+03:00",
    read: true,
  },
  {
    id: "n5",
    kind: "topic-alert",
    title: "New fact-check in Economy",
    body: "Video of a “new 50,000 shilling note” — AI-Generated.",
    href: "/fact-checks/fc-2026-0160",
    createdAt: "2026-09-18T09:10:00+03:00",
    read: true,
  },
  {
    id: "n6",
    kind: "accreditation",
    title: "Accreditation reminder",
    body: "Verified Journalists get 2× rating weight. Apply from your account.",
    href: "/account/verification",
    createdAt: "2026-09-15T14:00:00+03:00",
    read: true,
  },
]

// ---- Activity (FR-SUBMIT-07, FR-NOTIFY-03) ----

export type SubmissionStatus = "processing" | "complete" | "failed"

export type ActivitySubmission = {
  trackingId: string
  type: SubmissionType
  preview: string
  submittedAt: string
  status: SubmissionStatus
  verdict?: Verdict
  reportId?: string
}

export const SAMPLE_SUBMISSIONS: ActivitySubmission[] = [
  {
    trackingId: "ZL-7K3P-Q9",
    type: "text",
    preview: "BREAKING: The Ministry of ICT has announced that every Ugandan will get free unlimited internet…",
    submittedAt: "2026-09-21T10:41:00+03:00",
    status: "complete",
    verdict: "false",
    reportId: "fc-2026-0142",
  },
  {
    trackingId: "ZL-2M8D-R4",
    type: "media",
    preview: "expressway-flood.jpg",
    submittedAt: "2026-09-20T07:55:00+03:00",
    status: "complete",
    verdict: "ai-generated",
    reportId: "fc-2026-0157",
  },
  {
    trackingId: "ZL-FA7L-D2",
    type: "url",
    preview: "https://example.com/fail-demo",
    submittedAt: "2026-09-19T16:20:00+03:00",
    status: "failed",
  },
]

export type ActivityRating = {
  reportId: string
  title: string
  verdict: Verdict
  vote: "accurate" | "inaccurate"
  comment?: string
  ratedAt: string
}

export const SAMPLE_RATINGS: ActivityRating[] = [
  {
    reportId: "fc-2026-0161",
    title: "“Boiled banana leaves cure malaria in three days”",
    verdict: "false",
    vote: "accurate",
    comment: "My clinic sees patients who tried this first. Please share the correct advice.",
    ratedAt: "2026-09-21T09:02:00+03:00",
  },
  {
    reportId: "fc-2026-0159",
    title: "“All schools to close for the rest of the term next week”",
    verdict: "likely-false",
    vote: "inaccurate",
    ratedAt: "2026-09-20T18:40:00+03:00",
  },
  {
    reportId: "fc-2026-0156",
    title: "New national examination timetable published",
    verdict: "authentic",
    vote: "accurate",
    ratedAt: "2026-09-19T11:15:00+03:00",
  },
]

// ---- Security ----

export type DeviceSession = {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

export const SAMPLE_SESSIONS: DeviceSession[] = [
  { id: "d1", device: "Chrome on Windows", location: "Kampala, Uganda", lastActive: "Active now", current: true },
  { id: "d2", device: "Zuula app on Android", location: "Entebbe, Uganda", lastActive: "2 hours ago", current: false },
  { id: "d3", device: "Safari on iPhone", location: "Jinja, Uganda", lastActive: "5 days ago", current: false },
]

// ---- API keys (FR-API-02) ----

export const API_RATE_LIMIT = 100 // requests per hour

export type ApiScope = "submit" | "read"

export type ApiKey = {
  id: string
  name: string
  prefix: string
  scopes: ApiScope[]
  createdAt: string
  lastUsedAt: string | null
}

export const SAMPLE_API_KEYS: ApiKey[] = [
  {
    id: "k1",
    name: "Newsroom CMS",
    prefix: "zl_live_4f7a",
    scopes: ["submit", "read"],
    createdAt: "2026-08-02",
    lastUsedAt: "2026-09-21T10:05:00+03:00",
  },
  {
    id: "k2",
    name: "Research notebook",
    prefix: "zl_live_b91c",
    scopes: ["read"],
    createdAt: "2026-09-10",
    lastUsedAt: null,
  },
]

export const SAMPLE_API_USAGE = { usedThisHour: 37, last24h: 412 }

// ---- Formatting ----

export function relativeTime(iso: string, now = new Date("2026-09-21T12:00:00+03:00")) {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}
