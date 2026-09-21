import type { SubmissionType } from "@/lib/submission"

// Pipeline stages shown on the Status page (FR-SUBMIT-06, FR-DETECT-07).
// The real stages and timings come from the AI engine's progress events in Phase 4.

export type StepId =
  | "received"
  | "scan"
  | "fetch"
  | "transcribe"
  | "media"
  | "language"
  | "claims"
  | "sources"
  | "ai"
  | "report"

export type StepDef = { id: StepId; label: string; detail: string; seconds: number }

const STEPS: Record<StepId, Omit<StepDef, "id">> = {
  received: { label: "Received", detail: "Your submission is queued.", seconds: 0.6 },
  scan: { label: "Scanning file", detail: "Checking the file type and scanning for malware.", seconds: 1.5 },
  fetch: { label: "Fetching the article", detail: "Downloading the page and extracting its text.", seconds: 1.8 },
  transcribe: { label: "Transcribing", detail: "Converting speech to text.", seconds: 2.5 },
  media: { label: "Analysing media", detail: "Checking for deepfakes, edits and metadata tampering.", seconds: 3 },
  language: { label: "Detecting language", detail: "Identifying the language and any code-switching.", seconds: 0.8 },
  claims: { label: "Finding claims", detail: "Pulling out the statements that can be checked.", seconds: 1.5 },
  sources: { label: "Checking sources", detail: "Cross-referencing trusted Ugandan and international sources.", seconds: 2.5 },
  ai: { label: "AI-content detection", detail: "Looking for signs the content was machine-generated.", seconds: 1.2 },
  report: { label: "Writing the report", detail: "Preparing the verdict, explanation and citations.", seconds: 1.2 },
}

const PIPELINES: Record<SubmissionType, StepId[]> = {
  text: ["received", "language", "claims", "sources", "ai", "report"],
  url: ["received", "fetch", "language", "claims", "sources", "ai", "report"],
  article: ["received", "language", "claims", "sources", "ai", "report"],
  media: ["received", "scan", "media", "transcribe", "claims", "sources", "report"],
}

export function pipelineFor(type: SubmissionType): StepDef[] {
  return PIPELINES[type].map((id) => ({ id, ...STEPS[id] }))
}

// FR-DETECT-07: 10 s for text, 60 s for media.
export function expectedTime(type: SubmissionType) {
  return type === "media" ? "up to a minute" : "about 10 seconds"
}

export const TRACKING_ID_PATTERN = /^ZL-[A-Z2-9]{4}-[A-Z2-9]{2}$/

export function normaliseTrackingId(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "")
}
