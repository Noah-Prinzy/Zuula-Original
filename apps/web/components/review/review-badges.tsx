import {
  RiAlarmWarningLine,
  RiFlagLine,
  RiGroupLine,
  RiPauseCircleLine,
  RiQuestionLine,
  RiTimeLine,
} from "@remixicon/react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatHours, REASON_META, slaFor, type ReviewReason } from "@/lib/mock/review"
import { cn } from "@/lib/utils"

const SLA_STYLE = {
  overdue: { className: "border-verdict-false/40 bg-verdict-false/10 text-verdict-false", icon: RiAlarmWarningLine, label: "Overdue" },
  "due-soon": { className: "border-verdict-likely-false/40 bg-verdict-likely-false/10 text-verdict-likely-false", icon: RiTimeLine, label: "Due soon" },
  "on-track": { className: "text-muted-foreground", icon: RiTimeLine, label: "On track" },
}

// FR-REVIEW-06: time left on the 48-hour review SLA.
export function SlaBadge({ flaggedAt, className }: { flaggedAt: string; className?: string }) {
  const sla = slaFor(flaggedAt)
  const s = SLA_STYLE[sla.state]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn("inline-flex h-5 w-fit items-center gap-1 border px-1.5 text-xs whitespace-nowrap tabular-nums", s.className, className)}
        >
          <s.icon className="size-3" aria-hidden />
          {formatHours(sla.hoursLeft)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {s.label} · due {sla.due.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
      </TooltipContent>
    </Tooltip>
  )
}

const REASON_ICON: Record<ReviewReason, typeof RiFlagLine> = {
  "community-escalation": RiGroupLine,
  suspended: RiPauseCircleLine,
  "user-reports": RiFlagLine,
  "low-confidence": RiQuestionLine,
}

export function ReasonBadge({ reason, reports, className }: { reason: ReviewReason; reports?: number; className?: string }) {
  const Icon = REASON_ICON[reason]
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground", className)}>
      <Icon className="size-3.5" aria-hidden />
      {REASON_META[reason].label}
      {reports ? ` (${reports})` : ""}
    </span>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string | number
  hint?: string
  tone?: "default" | "danger" | "warning" | "good"
}) {
  return (
    <div className="hover-lift flex flex-col gap-1 border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-heading text-3xl font-bold tabular-nums",
          tone === "danger" && "text-verdict-false",
          tone === "warning" && "text-verdict-likely-false",
          tone === "good" && "text-verdict-authentic"
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}
