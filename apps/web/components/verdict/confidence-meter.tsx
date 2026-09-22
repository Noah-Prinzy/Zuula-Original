import { useTranslations } from "next-intl"

import type { Verdict } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { VERDICT_META } from "@/lib/verdicts"

const SIZES = {
  sm: { box: 48, stroke: 4, text: "text-xs" },
  md: { box: 80, stroke: 6, text: "text-lg" },
  lg: { box: 112, stroke: 8, text: "text-2xl" },
} as const

export function confidenceLevel(value: number) {
  if (value >= 85) return "high"
  if (value >= 60) return "moderate"
  return "low"
}

// FR-DETECT-02: AI confidence score, 0–100%.
export function ConfidenceMeter({
  value,
  verdict,
  size = "md",
  showLabel = true,
  className,
}: {
  value: number
  verdict: Verdict
  size?: keyof typeof SIZES
  showLabel?: boolean
  className?: string
}) {
  const t = useTranslations("Verdicts.confidence")
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const { box, stroke, text } = SIZES[size]
  const r = (box - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("aria", { value: clamped })}
        className="relative shrink-0"
        style={{ width: box, height: box }}
      >
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90">
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className={cn("transition-[stroke-dashoffset] duration-700", VERDICT_META[verdict].stroke)}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-heading font-bold tabular-nums",
            text
          )}
        >
          {clamped}%
        </span>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{t(confidenceLevel(clamped))}</span>
          <span className="text-xs text-muted-foreground">{t("label")}</span>
        </div>
      )}
    </div>
  )
}
