import { RiThumbDownLine, RiThumbUpLine } from "@remixicon/react"

import type { CommunityScore } from "@/lib/community"
import { cn } from "@/lib/utils"

const nf = new Intl.NumberFormat("en-GB")

// FR-RATE-02 / 03: public like/dislike totals and the weighted Community Confidence Score.
export function CCSMeter({ score, className }: { score: CommunityScore; className?: string }) {
  const { ccs, accurateCount, inaccurateCount, total } = score
  const accurateShare = ccs ?? 0

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Community Confidence Score</p>
          <p className="font-heading text-3xl font-bold tabular-nums">
            {ccs === null ? "—" : `${ccs}%`}
          </p>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          {nf.format(total)} {total === 1 ? "rating" : "ratings"}
          <br />
          weighted by role
        </p>
      </div>

      <div
        className="flex h-2 w-full overflow-hidden bg-muted"
        role="img"
        aria-label={
          ccs === null
            ? "No ratings yet"
            : `${ccs}% of weighted ratings say accurate, ${100 - ccs}% say inaccurate`
        }
      >
        {ccs !== null && (
          <>
            <div className="h-full bg-verdict-authentic" style={{ width: `${accurateShare}%` }} />
            <div className="h-full bg-verdict-false" style={{ width: `${100 - accurateShare}%` }} />
          </>
        )}
      </div>

      <div className="flex justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-verdict-authentic">
          <RiThumbUpLine className="size-3.5" aria-hidden />
          {nf.format(accurateCount)} accurate
        </span>
        <span className="inline-flex items-center gap-1 text-verdict-false">
          {nf.format(inaccurateCount)} inaccurate
          <RiThumbDownLine className="size-3.5" aria-hidden />
        </span>
      </div>
    </div>
  )
}
