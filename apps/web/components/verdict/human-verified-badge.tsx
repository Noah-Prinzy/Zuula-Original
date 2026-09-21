import { RiVerifiedBadgeFill } from "@remixicon/react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { HumanReview } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { formatDate, VERDICT_META } from "@/lib/verdicts"

// FR-REVIEW-04: shown when an Expert Reviewer confirmed or overrode the AI verdict.
export function HumanVerifiedBadge({
  review,
  className,
}: {
  review: HumanReview
  className?: string
}) {
  const detail =
    review.outcome === "overridden" && review.previousVerdict
      ? `Overridden from ${VERDICT_META[review.previousVerdict].label} by ${review.reviewer}`
      : `Confirmed by ${review.reviewer}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex h-6 w-fit items-center gap-1.5 border border-foreground/20 bg-muted px-2 text-xs font-medium text-foreground",
            className
          )}
        >
          <RiVerifiedBadgeFill className="size-3.5" aria-hidden />
          Human Verified
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {detail} · {formatDate(review.reviewedAt)}
      </TooltipContent>
    </Tooltip>
  )
}
