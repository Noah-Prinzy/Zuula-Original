import { RiExternalLinkLine, RiShieldCheckFill } from "@remixicon/react"

import type { Citation } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { formatDate, STANCE_META, VERDICT_META } from "@/lib/verdicts"

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

// FR-EXPLAIN-02 / 03: source name, article title, publication date and direct URL.
export function CitationCard({
  citation,
  index,
  className,
}: {
  citation: Citation
  index?: number
  className?: string
}) {
  const stance = STANCE_META[citation.stance]
  const tone = VERDICT_META[stance.verdict]

  return (
    <article className={cn("flex gap-3 border bg-card p-3", className)}>
      <div
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center bg-muted font-heading text-sm font-bold"
      >
        {index ?? citation.sourceName.charAt(0)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold">{citation.sourceName}</span>
          {citation.trusted && (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
              <RiShieldCheckFill className="size-3 text-primary" aria-hidden />
              Trusted source
            </span>
          )}
          <span className="text-muted-foreground">
            <time dateTime={citation.publishedAt}>{formatDate(citation.publishedAt)}</time>
          </span>
          <span className={cn("ml-auto border px-1.5 font-medium", tone.text, tone.bg, tone.border)}>
            {stance.label}
          </span>
        </div>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-start gap-1 text-sm font-medium hover:text-primary"
        >
          <span className="line-clamp-2">{citation.title}</span>
          <RiExternalLinkLine className="mt-0.5 size-3.5 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        {citation.excerpt && (
          <p className="line-clamp-2 text-xs text-muted-foreground">“{citation.excerpt}”</p>
        )}
        <span className="truncate font-mono text-[11px] text-muted-foreground">
          {hostname(citation.url)}
        </span>
      </div>
    </article>
  )
}
