import { RiThumbDownLine, RiThumbUpLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import type { CommunityScore } from "@/lib/community"
import { useFormat } from "@/lib/format"
import { cn } from "@/lib/utils"

// FR-RATE-02 / 03: public like/dislike totals and the weighted Community Confidence Score.
export function CCSMeter({ score, className }: { score: CommunityScore; className?: string }) {
  const { ccs, accurateCount, inaccurateCount, total } = score
  const accurateShare = ccs ?? 0
  const t = useTranslations("Community.ccs")
  const f = useFormat()

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{t("title")}</p>
          <p className="font-heading text-3xl font-bold tabular-nums">
            {ccs === null ? "—" : `${ccs}%`}
          </p>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          {t("ratings", { count: total })}
          <br />
          {t("weighted")}
        </p>
      </div>

      <div
        className="flex h-2 w-full overflow-hidden bg-muted"
        role="img"
        aria-label={
          ccs === null ? t("none") : t("aria", { accurate: ccs, inaccurate: 100 - ccs })
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
          {t("accurate", { count: f.number(accurateCount) })}
        </span>
        <span className="inline-flex items-center gap-1 text-verdict-false">
          {t("inaccurate", { count: f.number(inaccurateCount) })}
          <RiThumbDownLine className="size-3.5" aria-hidden />
        </span>
      </div>
    </div>
  )
}
