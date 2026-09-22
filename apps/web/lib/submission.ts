// zod/mini keeps the client bundle small (full zod is ~90 KB gzipped).
import * as z from "zod/mini"

import { LOCALES } from "@/lib/locales"

// FR-SUBMIT-01: input types. "article" = pasted article text with optional headline/source.
export const SUBMISSION_TYPES = ["text", "url", "media", "article"] as const
export type SubmissionType = (typeof SUBMISSION_TYPES)[number]

export const CONTENT_LANGUAGES = [
  { code: "auto", label: "Detect automatically" },
  ...LOCALES.map((l) => ({ code: l.code, label: l.label })),
] as const
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number]["code"]

// FR-SUBMIT-05: type and size limits.
export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const ACCEPTED_MEDIA = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  audio: [
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/ogg",
    "audio/x-m4a",
    "audio/aac",
  ],
  video: ["video/mp4", "video/quicktime", "video/webm", "video/3gpp"],
} as const
export const ACCEPT_ATTR = Object.values(ACCEPTED_MEDIA).flat().join(",")

export const LIMITS = {
  text: { min: 20, max: 5000 },
  article: { min: 50, max: 20000 },
  headline: { max: 200 },
} as const

export function mediaKind(file: File): keyof typeof ACCEPTED_MEDIA | null {
  for (const [kind, types] of Object.entries(ACCEPTED_MEDIA)) {
    if ((types as readonly string[]).includes(file.type))
      return kind as keyof typeof ACCEPTED_MEDIA
  }
  return null
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  const mb = bytes / (1024 * 1024)
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`
}

const httpUrl = z.string().check(
  z.trim(),
  z.refine((v) => {
    try {
      const u = new URL(v)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }, "Enter a full link starting with http:// or https://")
)

// One schema for all tabs; only the active tab's fields are validated.
export const submissionSchema = z
  .object({
    type: z.enum(SUBMISSION_TYPES),
    language: z.enum(
      CONTENT_LANGUAGES.map((l) => l.code) as [
        ContentLanguage,
        ...ContentLanguage[],
      ]
    ),
    text: z.string(),
    url: z.string(),
    headline: z.string(),
    body: z.string(),
    articleUrl: z.string(),
    file: z.custom<File | null>(
      (v) => v === null || (typeof File !== "undefined" && v instanceof File)
    ),
    captchaToken: z.nullable(z.string()),
  })
  .check(
    z.superRefine((v, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: "custom", path: [path], message })

      switch (v.type) {
        case "text": {
          const n = v.text.trim().length
          if (n < LIMITS.text.min)
            issue(
              "text",
              `Enter at least ${LIMITS.text.min} characters so we have enough to check.`
            )
          if (n > LIMITS.text.max)
            issue(
              "text",
              `Keep it under ${LIMITS.text.max} characters, or use the Article tab.`
            )
          break
        }
        case "url": {
          const r = httpUrl.safeParse(v.url)
          if (!r.success) issue("url", r.error.issues[0].message)
          break
        }
        case "media": {
          if (!v.file) issue("file", "Choose an image, audio or video file.")
          else if (!mediaKind(v.file))
            issue("file", "This file type isn't supported.")
          else if (v.file.size > MAX_FILE_BYTES)
            issue("file", "Files must be 50 MB or smaller.")
          break
        }
        case "article": {
          const n = v.body.trim().length
          if (n < LIMITS.article.min)
            issue(
              "body",
              `Paste at least ${LIMITS.article.min} characters of the article.`
            )
          if (n > LIMITS.article.max)
            issue(
              "body",
              `Articles must be under ${LIMITS.article.max.toLocaleString()} characters.`
            )
          if (v.headline.length > LIMITS.headline.max)
            issue(
              "headline",
              `Keep the headline under ${LIMITS.headline.max} characters.`
            )
          if (v.articleUrl.trim()) {
            const r = httpUrl.safeParse(v.articleUrl)
            if (!r.success) issue("articleUrl", r.error.issues[0].message)
          }
          break
        }
      }
    })
  )

export type SubmissionValues = z.infer<typeof submissionSchema>

export const EMPTY_SUBMISSION: SubmissionValues = {
  type: "text",
  language: "auto",
  text: "",
  url: "",
  headline: "",
  body: "",
  articleUrl: "",
  file: null,
  captchaToken: null,
}
