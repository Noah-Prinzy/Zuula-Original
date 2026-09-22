import { describe, expect, it } from "vitest"

import {
  CONTENT_LANGUAGES,
  EMPTY_SUBMISSION,
  formatBytes,
  LIMITS,
  MAX_FILE_BYTES,
  mediaKind,
  submissionSchema,
  type SubmissionValues,
} from "@/lib/submission"

const file = (type: string, size = 1024) => {
  const f = new File(["x"], "upload", { type })
  Object.defineProperty(f, "size", { value: size })
  return f
}

const errors = (values: Partial<SubmissionValues>) => {
  const r = submissionSchema.safeParse({ ...EMPTY_SUBMISSION, ...values })
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))
}

describe("formatBytes", () => {
  it.each([
    [512, "512 B"],
    [2048, "2 KB"],
    [5 * 1024 * 1024, "5 MB"],
    [1.5 * 1024 * 1024, "1.5 MB"],
  ])("%i → %s", (n, s) => {
    expect(formatBytes(n)).toBe(s)
  })
})

describe("mediaKind (FR-SUBMIT-05)", () => {
  it("classifies accepted media and rejects the rest", () => {
    expect(mediaKind(file("image/png"))).toBe("image")
    expect(mediaKind(file("audio/ogg"))).toBe("audio")
    expect(mediaKind(file("video/mp4"))).toBe("video")
    expect(mediaKind(file("application/pdf"))).toBeNull()
  })
})

describe("content languages", () => {
  it("offers auto-detect plus the five UI languages", () => {
    expect(CONTENT_LANGUAGES.map((l) => l.code)).toEqual(["auto", "en", "lg", "ach", "nyn", "teo"])
  })
})

describe("submissionSchema", () => {
  it("text: enforces the length limits", () => {
    expect(errors({ type: "text", text: "too short" })).toHaveProperty("text")
    expect(errors({ type: "text", text: "x".repeat(LIMITS.text.max + 1) })).toHaveProperty("text")
    expect(errors({ type: "text", text: "A claim long enough to be checked by Zuula." })).toEqual({})
  })

  it("url: needs an http(s) link", () => {
    expect(errors({ type: "url", url: "ftp://example.com" })).toHaveProperty("url")
    expect(errors({ type: "url", url: "not a url" })).toHaveProperty("url")
    expect(errors({ type: "url", url: "https://example.com/story" })).toEqual({})
  })

  it("media: needs a supported file under 50 MB", () => {
    expect(errors({ type: "media", file: null })).toHaveProperty("file")
    expect(errors({ type: "media", file: file("application/pdf") })).toHaveProperty("file")
    expect(errors({ type: "media", file: file("video/mp4", MAX_FILE_BYTES + 1) })).toHaveProperty("file")
    expect(errors({ type: "media", file: file("image/jpeg") })).toEqual({})
  })

  it("article: checks body, headline and optional source link", () => {
    const body = "b".repeat(LIMITS.article.min)
    expect(errors({ type: "article", body: "short" })).toHaveProperty("body")
    expect(errors({ type: "article", body: "b".repeat(LIMITS.article.max + 1) })).toHaveProperty("body")
    expect(errors({ type: "article", body, headline: "h".repeat(LIMITS.headline.max + 1) })).toHaveProperty("headline")
    expect(errors({ type: "article", body, articleUrl: "nope" })).toHaveProperty("articleUrl")
    expect(errors({ type: "article", body, articleUrl: "https://example.com" })).toEqual({})
  })

  it("only validates the active tab", () => {
    expect(errors({ type: "url", url: "https://example.com", text: "" })).toEqual({})
  })
})
