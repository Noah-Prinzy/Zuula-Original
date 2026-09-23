"use client"

import { RiExternalLinkLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Citation, FlaggedClaim } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { CLAIM_META, VERDICT_META } from "@/lib/verdicts"

type Segment = { text: string; claim?: FlaggedClaim; index?: number }

function segment(text: string, claims: FlaggedClaim[]): Segment[] {
  const sorted = [...claims]
    .filter((c) => c.start >= 0 && c.end <= text.length && c.start < c.end)
    .sort((a, b) => a.start - b.start)

  const out: Segment[] = []
  let cursor = 0
  sorted.forEach((claim, i) => {
    if (claim.start < cursor) return // skip overlaps
    if (claim.start > cursor) out.push({ text: text.slice(cursor, claim.start) })
    out.push({ text: text.slice(claim.start, claim.end), claim, index: i + 1 })
    cursor = claim.end
  })
  if (cursor < text.length) out.push({ text: text.slice(cursor) })
  return out
}

// FR-DETECT-05 / FR-EXPLAIN-04: highlights problematic sentences in the submitted text.
// Uses a popover (not hover) so it works on touch and keyboard.
export function ClaimHighlighter({
  text,
  claims,
  citations,
  className,
}: {
  text: string
  claims: FlaggedClaim[]
  citations: Citation[]
  className?: string
}) {
  const t = useTranslations("Verdicts")
  const byId = new Map(citations.map((c) => [c.id, c]))

  return (
    <p className={cn("leading-8 whitespace-pre-line", className)}>
      {segment(text, claims).map((seg, i) => {
        if (!seg.claim) return <span key={i}>{seg.text}</span>

        const claim = seg.claim
        const meta = CLAIM_META[claim.assessment]
        const tone = VERDICT_META[meta.verdict]
        const assessment = t(`claims.${claim.assessment}`)
        const sources = claim.citationIds.map((id) => byId.get(id)).filter(Boolean) as Citation[]

        return (
          <Popover key={claim.id}>
            <PopoverTrigger asChild>
              {/* A span, not a button: buttons can't wrap across lines like inline text. */}
              <span
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.currentTarget.click()
                  }
                }}
                className={cn(
                  "press-tint cursor-pointer px-0.5 box-decoration-clone underline decoration-2 underline-offset-4 transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  tone.bg,
                  tone.decoration
                )}
              >
                {seg.text}
                <sup className={cn("ml-0.5 font-mono text-[10px] font-bold", tone.text)}>
                  {seg.index}
                </sup>
                <span className="sr-only">
                  {t("claim.srLabel", { index: seg.index ?? 0, assessment })}
                </span>
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="flex flex-col gap-2">
                <span className={cn("text-xs font-semibold tracking-wide uppercase", tone.text)}>
                  {t("claim.heading", { index: seg.index ?? 0, assessment })}
                </span>
                <p className="text-sm">{claim.reason}</p>
                {sources.length > 0 && (
                  <ul className="flex flex-col gap-1 border-t pt-2">
                    {sources.map((s) => (
                      <li key={s.id}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RiExternalLinkLine className="mt-0.5 size-3 shrink-0" aria-hidden />
                          <span>
                            <span className="font-medium text-foreground">{s.sourceName}</span> —{" "}
                            {s.title}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )
      })}
    </p>
  )
}
