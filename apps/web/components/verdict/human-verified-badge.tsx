import { RiVerifiedBadgeFill } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { HumanReview } from "@/lib/types/fact-check"
import { useFormat } from "@/lib/format"
import { cn } from "@/lib/utils"

// FR-REVIEW-04: shown when an Expert Reviewer confirmed or overrode the AI verdict.
export function HumanVerifiedBadge({
  review,
  className,
}: {
  review: HumanReview
  className?: string
}) {
  const t = useTranslations("Verdicts")
  const f = useFormat()
  const detail =
    review.outcome === "overridden" && review.previousVerdict
      ? t("human.overridden", { verdict: t(`labels.${review.previousVerdict}`), reviewer: review.reviewer })
      : t("human.confirmed", { reviewer: review.reviewer })

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
          {t("human.badge")}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {detail} · {f.date(review.reviewedAt)}
      </TooltipContent>
    </Tooltip>
  )
}
